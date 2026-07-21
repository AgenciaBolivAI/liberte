import { createFileRoute } from "@tanstack/react-router";

// Telegram calls this on every bot update. We only care about "/start <code>":
// it links the Telegram chat to the Liberté account that generated <code>.
// Protected by the secret Telegram sends back in the X-Telegram-Bot-Api-Secret-
// Token header (set when the webhook is registered).

export const Route = createFileRoute("/api/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Fail CLOSED: with no configured secret the webhook is disabled, so an
        // attacker can't drive account-link mutations with a forged chat_id.
        const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
        if (!secret || request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
          return new Response("forbidden", { status: 403 });
        }

        let update: {
          message?: { chat?: { id?: number | string; username?: string }; text?: string };
        };
        try {
          update = (await request.json()) as typeof update;
        } catch {
          return Response.json({ ok: true });
        }

        const chatId = update?.message?.chat?.id;
        const text = update?.message?.text ?? "";
        if (chatId === undefined || chatId === null) return Response.json({ ok: true });
        const chat = String(chatId);

        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) return Response.json({ ok: true });
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
        const { sendTelegram } = await import("@/lib/telegram");

        const match = text.match(/^\/start\s+([a-f0-9]{16,40})/i);
        if (match) {
          const code = match[1];
          const { data: prof } = await supabase
            .from("profiles")
            .select("id")
            .eq("telegram_link_code", code)
            .maybeSingle();
          if (prof) {
            await supabase
              .from("profiles")
              .update({
                telegram_chat_id: chat,
                telegram_username: update.message?.chat?.username ?? null,
                telegram_linked_at: new Date().toISOString(),
                telegram_link_code: null,
              })
              .eq("id", (prof as { id: string }).id);
            await sendTelegram(
              chat,
              "✅ ¡Listo! Tu cuenta de Liberté quedó vinculada. Te avisaré de tus clases en vivo y novedades. 🐦",
            );
          } else {
            await sendTelegram(
              chat,
              "Ese enlace ya no es válido. Genera uno nuevo desde «Conectar Telegram» en tu perfil de Liberté.",
            );
          }
        } else if (text.startsWith("/start")) {
          await sendTelegram(
            chat,
            "¡Hola! Para vincular tu cuenta, abre tu perfil en Liberté y pulsa «Conectar Telegram».",
          );
        }

        return Response.json({ ok: true });
      },
    },
  },
});
