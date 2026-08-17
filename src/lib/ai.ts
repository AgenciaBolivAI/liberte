// Shared OpenAI client for all server functions. This file is imported from
// *.functions.ts modules that also ship to the client bundle, so the API key
// must only ever be read inside functions that run on the server.

export const OPENAI_BASE = "https://api.openai.com/v1";

// Cheapest tier that supports response_format json_object with standard
// params. If upgrading to the gpt-5 family, note those models require
// max_completion_tokens (not max_tokens) and lock temperature.
export const CHAT_MODEL = "gpt-4o-mini";
/**
 * Speech-to-text for GRADED oral answers — deliberately not the mini tier.
 *
 * Three students in the August 2026 survey independently reported the same
 * failure: "pone que dije algo que no se parece nada a lo que dije". The mini
 * transcriber is cheap but weak on beginner Hispanophone French, and because
 * the corrector grades the TRANSCRIPT, a mis-hearing becomes a bad mark for an
 * answer the student actually got right — which is also the real cause behind
 * "la calificación de producción oral es muy baja". Accuracy here is worth
 * more than the token saving.
 *
 * Overridable without a deploy (OPENAI_STT_MODEL) so the model can be changed
 * or rolled back from the environment if a better one ships.
 */
export const STT_MODEL = process.env.OPENAI_STT_MODEL || "gpt-4o-transcribe";
// Natural French speech for the conversation tutor. The browser's built-in
// speechSynthesis is robotic, which is actively harmful when students are
// modelling their pronunciation on it.
export const TTS_MODEL = "gpt-4o-mini-tts";
export const TTS_VOICE = "shimmer";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// Hard ceiling on generated tokens so a single request can never run away and
// bill unbounded output. All tutor/grading JSON responses fit well under this.
export const MAX_OUTPUT_TOKENS = 1500;
// Reject oversized audio before we decode it in memory (base64 chars). ~8 MB
// of base64 ≈ 6 MB of audio, far more than any legitimate 30s clip.
export const MAX_AUDIO_B64 = 8_000_000;

export function requireOpenAIKey(): string {
  const k = process.env.OPENAI_API_KEY;
  if (!k) {
    throw new Error(
      "OPENAI_API_KEY missing — configura la clave de OpenAI en el entorno del servidor.",
    );
  }
  return k;
}

/**
 * Every OpenAI call gets a hard deadline.
 *
 * WHY: `fetch` has NO default timeout. A stalled upstream request never
 * settles, so the awaiting UI waits forever — that is why a student's writing
 * exercise sat on "Corrigiendo… \u2728" indefinitely instead of failing and
 * letting them continue. A rejected promise is always recoverable; a hung one
 * is not.
 */
const TIMEOUT_MS = { chat: 60_000, tts: 30_000, stt: 45_000 } as const;

function deadline(kind: keyof typeof TIMEOUT_MS): AbortSignal {
  return AbortSignal.timeout(TIMEOUT_MS[kind]);
}

/** Turn an abort into a clear, catchable error the callers can surface. */
function asTimeout(e: unknown, kind: string): never {
  const name = (e as { name?: string })?.name;
  if (name === "TimeoutError" || name === "AbortError") {
    throw new Error(`${kind} tardó demasiado (timeout). Inténtalo de nuevo.`);
  }
  throw e as Error;
}

/**
 * Read a 0-10 grade out of whatever the model actually emitted.
 *
 * WHY: `json_object` mode is not a strict schema, so a grade comes back as a
 * number *most* of the time and as `"8"`, `"8/10"` or `"8,5"` the rest of the
 * time. Both graders used to accept only a real number and silently fell back to
 * a harsh default — `Number(parsed.nota ?? 0)` scored a good answer **0**, and
 * the défi dropped to a mechanical criteria fraction. That is the single biggest
 * reason for the client's "la calificación en general es muy baja".
 *
 * Returns null only when there is genuinely no number to read.
 */
export function parseScore10(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return clamp10(raw);
  if (typeof raw === "string") {
    // "8", "8.5", "8,5", "8/10", "nota: 8" → 8. Take the first number present.
    const m = raw.replace(",", ".").match(/-?\d+(\.\d+)?/);
    if (m) {
      const n = Number(m[0]);
      if (Number.isFinite(n)) return clamp10(n > 10 && n <= 100 ? n / 10 : n);
    }
  }
  return null;
}

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, Number(n.toFixed(1))));
}

export async function callChat(
  system: string,
  userOrMessages: string | { role: "user" | "assistant"; content: string }[],
  opts?: { model?: string; temperature?: number },
): Promise<Record<string, unknown>> {
  const messages: ChatMessage[] = [
    { role: "system", content: system },
    ...(typeof userOrMessages === "string"
      ? [{ role: "user" as const, content: userOrMessages }]
      : userOrMessages),
  ];
  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireOpenAIKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts?.model ?? CHAT_MODEL,
      messages,
      response_format: { type: "json_object" },
      max_tokens: MAX_OUTPUT_TOKENS,
      // Grading was left at the API default (1.0), so the SAME recording scored
      // 5 on one attempt and 8 on the next; students only ever report the low
      // tail. Graders pass a low temperature for repeatable marks; the
      // conversational tutor keeps its default by not passing one.
      ...(typeof opts?.temperature === "number" ? { temperature: opts.temperature } : {}),
    }),
    signal: deadline("chat"),
  }).catch((e) => asTimeout(e, "La corrección"));
  if (!res.ok) {
    const b = await res.text().catch(() => "");
    throw new Error(`AI ${res.status}: ${b.slice(0, 200)}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** French text → spoken MP3, returned base64 so it can cross the server-fn
 *  boundary as JSON. Instructions keep the pace slow enough for A1 learners. */
export async function speakFrenchBase64(text: string): Promise<string> {
  const res = await fetch(`${OPENAI_BASE}/audio/speech`, {
    method: "POST",
    signal: deadline("tts"),
    headers: {
      Authorization: `Bearer ${requireOpenAIKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TTS_MODEL,
      voice: TTS_VOICE,
      input: text.slice(0, 800),
      response_format: "mp3",
      instructions:
        "Speak in clear, natural French with a warm, encouraging tone. Slightly slower than native pace, articulating each word so a beginner learner can follow.",
    }),
  });
  if (!res.ok) {
    const b = await res.text().catch(() => "");
    throw new Error(`TTS ${res.status}: ${b.slice(0, 200)}`);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < buf.length; i += CHUNK) {
    bin += String.fromCharCode(...buf.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

export async function transcribeFr(audioBase64: string, mimeType: string): Promise<string> {
  const key = requireOpenAIKey();
  // Reject oversized payloads BEFORE decoding — a huge base64 string would
  // otherwise materialize hundreds of MB in memory per concurrent request.
  if (audioBase64.length > MAX_AUDIO_B64) {
    throw new Error("Audio demasiado largo.");
  }
  const bin = atob(audioBase64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const ext = mimeType.includes("mp4")
    ? "mp4"
    : mimeType.includes("mpeg") || mimeType.includes("mp3")
      ? "mp3"
      : mimeType.includes("wav")
        ? "wav"
        : "webm";
  // Near-empty audio makes transcription models hallucinate, often in an
  // unrelated language (Cyrillic is a common failure). Refuse it outright.
  if (bytes.length < 4000) return "";
  const blob = new Blob([bytes], { type: mimeType });
  const fd = new FormData();
  fd.append("model", STT_MODEL);
  fd.append("file", blob, `audio.${ext}`);
  fd.append("language", "fr");
  // NOTE: deliberately no `prompt` bias. Verified against the API: with a
  // prompt, near-silent audio makes the model echo the prompt back as if the
  // student had said it — a fabricated transcript, worse than no transcript.
  // With language alone, silence correctly yields "".
  const res = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: fd,
    signal: deadline("stt"),
  }).catch((e) => asTimeout(e, "La transcripción"));
  if (!res.ok) {
    const b = await res.text().catch(() => "");
    throw new Error(`STT ${res.status}: ${b.slice(0, 200)}`);
  }
  const json = (await res.json()) as { text?: string };
  const text = (json.text ?? "").trim();
  // Guard against hallucinated output in a non-Latin script (the model
  // inventing Cyrillic/CJK text from noise) — treat it as "nothing heard".
  if (text && /[Ѐ-ӿ一-鿿؀-ۿ]/.test(text)) return "";
  return text;
}
