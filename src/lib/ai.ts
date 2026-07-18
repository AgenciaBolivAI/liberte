// Shared OpenAI client for all server functions. This file is imported from
// *.functions.ts modules that also ship to the client bundle, so the API key
// must only ever be read inside functions that run on the server.

export const OPENAI_BASE = "https://api.openai.com/v1";

// Cheapest tier that supports response_format json_object with standard
// params. If upgrading to the gpt-5 family, note those models require
// max_completion_tokens (not max_tokens) and lock temperature.
export const CHAT_MODEL = "gpt-4o-mini";
export const STT_MODEL = "gpt-4o-mini-transcribe";
// Natural French speech for the conversation tutor. The browser's built-in
// speechSynthesis is robotic, which is actively harmful when students are
// modelling their pronunciation on it.
export const TTS_MODEL = "gpt-4o-mini-tts";
export const TTS_VOICE = "shimmer";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export function requireOpenAIKey(): string {
  const k = process.env.OPENAI_API_KEY;
  if (!k) {
    throw new Error(
      "OPENAI_API_KEY missing — configura la clave de OpenAI en el entorno del servidor.",
    );
  }
  return k;
}

export async function callChat(
  system: string,
  userOrMessages: string | { role: "user" | "assistant"; content: string }[],
  opts?: { model?: string },
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
    }),
  });
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
  });
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
