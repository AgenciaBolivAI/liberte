import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Account linking. Writes to the telegram_* profile columns go through the
// service role (they're excluded from the authenticated column-UPDATE grant),
// so a student can't set their own chat_id — only the verified webhook can.

type Ctx = {
  supabase: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    from: (t: string) => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rpc: any;
  };
  userId: string;
};

async function requireStaff(context: Ctx): Promise<void> {
  const [coach, admin] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "coach" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
  ]);
  if (!coach.data && !admin.data) throw new Response("Forbidden", { status: 403 });
}

function randomCode(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

/** Generate a one-time code and return the deep link the student taps to link. */
export const startTelegramLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = randomCode();
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ telegram_link_code: code })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    const { botUsername } = await import("@/lib/telegram");
    const username = await botUsername();
    return { deepLink: `https://t.me/${username}?start=${code}`, botUsername: username };
  });

/** Is the current user's Telegram linked? */
export const getTelegramStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await (context as Ctx).supabase
      .from("profiles")
      .select("telegram_chat_id, telegram_username")
      .eq("id", context.userId)
      .maybeSingle();
    return {
      linked: Boolean(data?.telegram_chat_id),
      username: (data?.telegram_username as string | null) ?? null,
    };
  });

/** Staff only: broadcast an announcement to every Telegram-linked student. */
export const broadcastTelegram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const text = String((input as { text?: string })?.text ?? "").trim().slice(0, 3000);
    if (!text) throw new Error("El mensaje está vacío");
    return { text };
  })
  .handler(async ({ data, context }) => {
    await requireStaff(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("profiles")
      .select("telegram_chat_id")
      .not("telegram_chat_id", "is", null);
    const chats = ((rows ?? []) as { telegram_chat_id: string | null }[])
      .map((r) => r.telegram_chat_id)
      .filter((c): c is string => Boolean(c));
    const { sendTelegram, escapeHtml } = await import("@/lib/telegram");
    let sent = 0;
    for (const chat of chats) {
      if (await sendTelegram(chat, `📣 <b>Liberté</b>\n${escapeHtml(data.text)}`)) sent += 1;
    }
    return { sent, total: chats.length };
  });

/** Disconnect Telegram. */
export const unlinkTelegram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("profiles")
      .update({
        telegram_chat_id: null,
        telegram_username: null,
        telegram_link_code: null,
        telegram_linked_at: null,
      })
      .eq("id", context.userId);
    return { ok: true };
  });
