// Server-only Telegram Bot API wrapper. The bot token lives ONLY in the
// TELEGRAM_BOT_TOKEN env var — never in the repo. Import this from server code
// (server fns / API routes) exclusively.

const TG_API = "https://api.telegram.org";

function botToken(): string {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  if (!t) throw new Error("TELEGRAM_BOT_TOKEN no está configurado");
  return t;
}

export async function tg<T = unknown>(method: string, body?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${TG_API}/bot${botToken()}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const json = (await res.json()) as { ok: boolean; result?: T; description?: string };
  if (!json.ok) throw new Error(`Telegram ${method}: ${json.description ?? res.status}`);
  return json.result as T;
}

/** Best-effort send — a notification failure must never break the caller. */
export async function sendTelegram(chatId: string, text: string): Promise<boolean> {
  try {
    await tg("sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
    return true;
  } catch {
    return false;
  }
}

let cachedUsername: string | null = null;

/** The bot's @username, needed for the `t.me/<username>?start=<code>` deep link. */
export async function botUsername(): Promise<string> {
  if (cachedUsername) return cachedUsername;
  const me = await tg<{ username: string }>("getMe");
  cachedUsername = me.username;
  return cachedUsername;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
