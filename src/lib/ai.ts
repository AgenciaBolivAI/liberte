// Shared OpenAI client for all server functions. This file is imported from
// *.functions.ts modules that also ship to the client bundle, so the API key
// must only ever be read inside functions that run on the server.

export const OPENAI_BASE = "https://api.openai.com/v1";

// Cheapest tier that supports response_format json_object with standard
// params. If upgrading to the gpt-5 family, note those models require
// max_completion_tokens (not max_tokens) and lock temperature.
export const CHAT_MODEL = "gpt-4o-mini";
export const STT_MODEL = "gpt-4o-mini-transcribe";

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
  const blob = new Blob([bytes], { type: mimeType });
  const fd = new FormData();
  fd.append("model", STT_MODEL);
  fd.append("file", blob, `audio.${ext}`);
  fd.append("language", "fr");
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
  return (json.text ?? "").trim();
}
