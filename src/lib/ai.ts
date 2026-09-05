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
/** Words in a text — the ambiguity only exists for very short inputs. */
function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Longest input we bother language-checking. A real sentence gives the model
 *  more than enough French to lock onto; an isolated token does not. */
const AMBIGUOUS_MAX_WORDS = 3;

/** Measured repair: adding French context in front of the word made every
 *  known-bad item come back French, 24/24 across three runs
 *  (scripts/probe-tts-strategies.mjs). Only used when the bare audio actually
 *  came out wrong, so students never hear this on a word that was already fine. */
function withFrenchContext(text: string): string {
  return `En français : ${text}`;
}

async function synthesizeFr(text: string): Promise<Uint8Array> {
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
      // The language is NOT negotiable and must be stated first. OpenAI TTS
      // infers the language from the input text, so an isolated token spelled
      // like an English word was read in English — measured, not guessed:
      // « annuler » came back as "annually", « reporter » as "Reporter" and
      // « la date » as "La datte". This instruction helps but is NOT reliable
      // on its own (the failing set changed between runs), which is why short
      // texts are verified below.
      instructions:
        "The text is always FRENCH. Read it aloud in French, with French phonetics, never English and never Spanish — even for a single isolated word, and even when the word is spelled exactly like an English word (annuler, reporter, la date, agenda, client, message, important, double, table, menu, orange). Use a warm, encouraging tone, slightly slower than native pace, articulating each word so a beginner learner can follow.",
    }),
  });
  if (!res.ok) {
    const b = await res.text().catch(() => "");
    throw new Error(`TTS ${res.status}: ${b.slice(0, 200)}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

/**
 * What language does this audio actually sound like?
 *
 * whisper-1 + verbose_json is the only transcription endpoint that reports a
 * DETECTED language, and no language hint is sent — that is the whole point.
 * Returns null when the check itself could not run: a failed check must never
 * cost the student their audio.
 */
async function detectSpokenLanguage(
  bytes: Uint8Array,
  mimeType = "audio/mpeg",
  filename = "clip.mp3",
): Promise<string | null> {
  try {
    const form = new FormData();
    form.append("file", new Blob([bytes as BlobPart], { type: mimeType }), filename);
    form.append("model", "whisper-1");
    form.append("response_format", "verbose_json");
    const res = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
      method: "POST",
      signal: deadline("stt"),
      headers: { Authorization: `Bearer ${requireOpenAIKey()}` },
      body: form,
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { language?: string };
    return typeof j.language === "string" ? j.language.toLowerCase() : null;
  } catch {
    return null;
  }
}

function toBase64(buf: Uint8Array): string {
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < buf.length; i += CHUNK) {
    bin += String.fromCharCode(...buf.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

/**
 * French audio that is verified to actually SOUND French.
 *
 * A client reported a day-22 vocabulary word being read in English. The cause
 * is that TTS infers language from the input, and « annuler », « reporter »,
 * « noter » are spelled like English words, so they were read as "annually",
 * "Reporter", "No tea". A learner then practises the wrong pronunciation —
 * which is the opposite of what this product is for.
 *
 * Prompt instructions alone did not fix it (non-deterministic between runs), so
 * short texts are synthesized, listened back to, and re-synthesized with French
 * context if they came out in the wrong language. The result is cached by the
 * caller under the original text, so a repair costs one extra check ONCE per
 * phrase, and students never hear the carrier on a word that was already right.
 */
export async function speakFrenchBase64(text: string): Promise<string> {
  const audio = await synthesizeFr(text);
  if (wordCount(text) > AMBIGUOUS_MAX_WORDS) return toBase64(audio);

  const lang = await detectSpokenLanguage(audio);
  // null = the check could not run; French = nothing to repair.
  if (lang === null || lang.startsWith("fr")) return toBase64(audio);

  console.warn(`[tts] "${text}" came out as ${lang} — re-synthesizing with French context`);
  try {
    return toBase64(await synthesizeFr(withFrenchContext(text)));
  } catch {
    // Wrong-language audio still beats no audio at all.
    return toBase64(audio);
  }
}


/* ---------------- is this transcript even French? ---------------- */

/**
 * Letters French orthography simply never uses. Spanish á í ó ú ñ ¿ ¡ and
 * Portuguese ã õ are conclusive: a transcript containing one is not French,
 * whatever language the model was told to use.
 */
const NON_FRENCH_LETTERS = /[ãõñáíóúÁÍÓÚÃÕÑ¿¡]/;

/**
 * Letters Spanish and Portuguese do NOT have, so one of these is real
 * evidence of French. `é è à ç` are deliberately absent: Spanish "sé/qué"
 * and Portuguese "está/você" carry them too, and treating them as proof let
 * « No sé qué decir, la verdad no entiendo nada » through as a French answer.
 */
const FRENCH_ONLY_LETTERS = /[êëîïûùÿœæ]/i;

/**
 * Elision — j', l', d', qu', n', m', s', c', t' — is a French fingerprint.
 * Neither Spanish nor Portuguese elides with an apostrophe like this.
 */
const FRENCH_ELISION = /\b[jlndmstc]'|\bqu'/i;

/**
 * Everyday French words that are NOT also everyday Spanish or Portuguese
 * words. "la", "no", "que", "un", "a", "en" and friends are excluded
 * precisely because they are shared and would vouch for a Spanish transcript.
 */
const FRENCH_WORDS =
  /\b(je|il|elle|nous|vous|ils|elles|les|des|une|du|au|aux|est|sont|avec|dans|pour|qui|quoi|ne|pas|très|oui|bien|fois|semaine|jour|heure|heures|bonjour|merci|madame|monsieur|voudrais|prendre|aller|faire|suis|avez|allez|comment|pourquoi|beaucoup|aujourd)\b/i;

/**
 * A transcript that is confidently NOT French.
 *
 * A student said « Je m'entraîne trois fois par semaine » and the platform
 * transcribed « Não vamos não. » — Portuguese — then graded that 0.0/10
 * against the expected phrase. `language: "fr"` was already being sent; the
 * model hallucinated anyway on a quiet recording, and nothing downstream ever
 * asked whether the words it produced were French. Grading a hallucination is
 * worse than admitting we did not hear the student.
 *
 * Exported so it can be tested exhaustively without spending an API call.
 */
export function isDefinitelyNotFrench(text: string): boolean {
  const s = text.trim();
  if (!s) return false; // empty is "nothing heard", handled separately
  if (NON_FRENCH_LETTERS.test(s)) return true;
  return false;
}

/** Does the text carry positive evidence of being French? */
export function looksFrench(text: string): boolean {
  const s = text.trim();
  if (!s) return false;
  return FRENCH_ONLY_LETTERS.test(s) || FRENCH_ELISION.test(s) || FRENCH_WORDS.test(s);
}

/** Why a transcript was thrown away, so the UI can say something true. */
export type TranscribeResult = { text: string; reason?: "silent" | "not-french" };

/** Back-compatible string form for callers that only need the words. */
export async function transcribeFr(audioBase64: string, mimeType: string): Promise<string> {
  return (await transcribeFrDetailed(audioBase64, mimeType)).text;
}

export async function transcribeFrDetailed(
  audioBase64: string,
  mimeType: string,
): Promise<TranscribeResult> {
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
  if (bytes.length < 4000) return { text: "", reason: "silent" };
  const filename = `audio.${ext}`;

  // Transcribe and identify the spoken language AT THE SAME TIME.
  //
  // This is a platform for learning French: an answer in Spanish, Portuguese or
  // English is not a valid answer, it is the student avoiding the practice. So
  // the language is checked on EVERY graded answer, not only when the
  // transcript happens to look suspicious — the earlier version let a
  // Spanish-sounding answer through whenever the model forced it into
  // French-looking words.
  //
  // The two calls run in parallel, so being strict costs no extra wall-clock:
  //   - STT_MODEL with language=fr gives the best transcript of French speech
  //   - whisper-1 verbose_json is the only endpoint that REPORTS the language,
  //     and is asked with no hint at all, so it can disagree.
  const transcribeText = async (): Promise<string> => {
    const fd = new FormData();
    fd.append("model", STT_MODEL);
    fd.append("file", new Blob([bytes as BlobPart], { type: mimeType }), filename);
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
    return ((await res.json()) as { text?: string }).text?.trim() ?? "";
  };

  const [text, spoken] = await Promise.all([
    transcribeText(),
    detectSpokenLanguage(bytes, mimeType, filename),
  ]);

  if (!text) return { text: "", reason: "silent" };

  // The rule, applied first and without exception: if it was not spoken in
  // French, the platform did not understand it. `spoken === null` only means
  // the detector itself failed — fall through to the spelling guards rather
  // than punish the student for our outage.
  if (spoken !== null && !spoken.startsWith("fr")) {
    console.warn(`[stt] answer spoken in ${spoken}, not accepted: "${text.slice(0, 60)}"`);
    return { text: "", reason: "not-french" };
  }

  // Belt and braces on the transcript itself, for when the detector is wrong or
  // unavailable. Non-Latin script = invented from noise; the letters below do
  // not exist in French at all.
  if (/[Ѐ-ӿ一-鿿؀-ۿ]/.test(text)) return { text: "", reason: "not-french" };
  if (isDefinitelyNotFrench(text)) {
    console.warn(`[stt] discarding non-French transcript: "${text.slice(0, 60)}"`);
    return { text: "", reason: "not-french" };
  }
  // Detector unavailable AND nothing positively French about the words: do not
  // hand a guess to the grader.
  if (spoken === null && !looksFrench(text)) {
    console.warn(`[stt] no French evidence and no detector, discarding: "${text.slice(0, 60)}"`);
    return { text: "", reason: "not-french" };
  }
  return { text };
}
