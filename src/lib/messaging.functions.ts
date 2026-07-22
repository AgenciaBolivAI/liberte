import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireApprovedStudent } from "@/lib/approval";

// Teacher <-> student direct messaging. RLS enforces "a staff member must be in
// the thread" and "read only your own threads"; these fns add validation,
// read-receipts, thread listing, and signed attachment downloads.

type Ctx = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { from: (t: string) => any };
  userId: string;
};

const MAX_BODY = 5000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuid = (v: unknown, field: string): string => {
  const s = String(v ?? "");
  if (!UUID.test(s)) throw new Error(`${field} inválido`);
  return s;
};

type MessageRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  attachment_path: string | null;
  attachment_name: string | null;
  created_at: string;
  read_at: string | null;
};

/** Send a message (optionally with an already-uploaded attachment path). */
export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as {
      recipientId?: string;
      body?: string;
      attachmentPath?: string;
      attachmentName?: string;
    };
    const recipientId = uuid(d?.recipientId, "recipientId");
    const body = String(d?.body ?? "").slice(0, MAX_BODY).trim();
    const attachmentPath = d?.attachmentPath ? String(d.attachmentPath).slice(0, 500) : null;
    if (!body && !attachmentPath) throw new Error("El mensaje está vacío");
    return {
      recipientId,
      body,
      attachmentPath,
      attachmentName: d?.attachmentName ? String(d.attachmentName).slice(0, 200) : null,
    };
  })
  .handler(async ({ data, context }) => {
    // An attachment must live under the sender's own {uid}/ folder (matches the
    // storage upload RLS). Rejecting anything else stops a crafted path from
    // pointing at another user's file.
    if (data.attachmentPath && !data.attachmentPath.startsWith(`${context.userId}/`)) {
      throw new Error("attachmentPath inválido");
    }
    const { error } = await (context as Ctx).supabase.from("messages").insert({
      sender_id: context.userId,
      recipient_id: data.recipientId,
      body: data.body,
      attachment_path: data.attachmentPath,
      attachment_name: data.attachmentName,
    });
    // RLS rejects a student messaging a non-staff recipient.
    if (error) throw new Error(error.message);

    // Best-effort Telegram ping to the recipient if they've linked it.
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: rp } = await supabaseAdmin
        .from("profiles")
        .select("telegram_chat_id")
        .eq("id", data.recipientId)
        .maybeSingle();
      const chat = (rp as { telegram_chat_id: string | null } | null)?.telegram_chat_id;
      if (chat) {
        const { sendTelegram } = await import("@/lib/telegram");
        await sendTelegram(chat, "💬 Tienes un mensaje nuevo en Liberté. Ábrelo en la plataforma.");
      }
    } catch {
      /* notifications are best-effort */
    }
    return { ok: true };
  });

/** All messages between me and one other person (oldest→newest); also marks the
 *  other person's messages to me as read. */
export const getThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ({ otherUserId: uuid((input as { otherUserId?: string })?.otherUserId, "otherUserId") }))
  .handler(async ({ data, context }) => {
    const me = context.userId;
    const other = data.otherUserId;
    const supabase = (context as Ctx).supabase;
    const { data: rows, error } = await supabase
      .from("messages")
      .select("id, sender_id, recipient_id, body, attachment_path, attachment_name, created_at, read_at")
      .or(`and(sender_id.eq.${me},recipient_id.eq.${other}),and(sender_id.eq.${other},recipient_id.eq.${me})`)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    // Read receipts for the messages they sent me.
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", me)
      .eq("sender_id", other)
      .is("read_at", null);
    return { messages: (rows ?? []) as MessageRow[] };
  });

/** Staff directory (admins + coaches) so a student can start a conversation.
 *  Students can't read other profiles via RLS, so names come from the service
 *  role. Returns everyone except the caller. */
export const getStaffContacts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Don't let unapproved signups enumerate the staff directory (ids + emails).
    await requireApprovedStudent(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "coach"]);
    if (error) throw new Error(error.message);
    const ids = [...new Set((roles ?? []).map((r) => r.user_id as string))].filter(
      (id) => id !== context.userId,
    );
    if (!ids.length) return [];
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ids);
    const names = new Map(
      (profs ?? []).map((p) => [p.id as string, (p.full_name || p.email || "Equipo Liberté") as string]),
    );
    const roleOf = new Map((roles ?? []).map((r) => [r.user_id as string, r.role as string]));
    return ids.map((id) => ({ id, name: names.get(id) ?? "Equipo Liberté", role: roleOf.get(id) ?? "admin" }));
  });

/** Thread list for the current user: other participant, last message, unread. */
export const getConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const me = context.userId;
    // Surface query errors to the caller — silently returning [] would render
    // as a fake "no messages yet" empty state and hide real failures.
    const { data: rows, error } = await (context as Ctx).supabase
      .from("messages")
      .select("sender_id, recipient_id, body, attachment_name, created_at, read_at")
      .or(`sender_id.eq.${me},recipient_id.eq.${me}`)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    type Thread = { otherId: string; last: MessageRow; unread: number };
    const threads = new Map<string, Thread>();
    for (const m of (rows ?? []) as MessageRow[]) {
      const other = m.sender_id === me ? m.recipient_id : m.sender_id;
      if (!threads.has(other)) threads.set(other, { otherId: other, last: m, unread: 0 });
      if (m.recipient_id === me && !m.read_at) threads.get(other)!.unread += 1;
    }
    const ids = [...threads.keys()];
    const names: Record<string, string> = {};
    if (ids.length) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: profs } = await supabaseAdmin.from("profiles").select("id, full_name, email").in("id", ids);
      for (const p of (profs ?? []) as { id: string; full_name: string | null; email: string | null }[]) {
        names[p.id] = p.full_name || p.email || "Usuario";
      }
    }
    return [...threads.values()]
      .map((t) => ({
        otherId: t.otherId,
        name: names[t.otherId] ?? "Usuario",
        lastBody: t.last.body || (t.last.attachment_name ? `📎 ${t.last.attachment_name}` : ""),
        lastAt: t.last.created_at,
        unread: t.unread,
      }))
      .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
  });

/** A short-lived signed download URL for an attachment — participants only. */
export const getAttachmentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ({ messageId: uuid((input as { messageId?: string })?.messageId, "messageId") }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: msg } = await supabaseAdmin
      .from("messages")
      .select("sender_id, recipient_id, attachment_path, attachment_name")
      .eq("id", data.messageId)
      .maybeSingle();
    if (!msg?.attachment_path) throw new Error("Adjunto no encontrado");
    if (msg.sender_id !== context.userId && msg.recipient_id !== context.userId) {
      throw new Response("Forbidden", { status: 403 });
    }
    // Defense in depth: the path must belong to the sender's folder, so even a
    // pre-existing crafted row can't sign a URL outside its owner's files.
    if (!msg.attachment_path.startsWith(`${msg.sender_id}/`)) {
      throw new Response("Forbidden", { status: 403 });
    }
    const { data: signed, error } = await supabaseAdmin.storage
      .from("message-attachments")
      .createSignedUrl(msg.attachment_path, 300);
    if (error || !signed) throw new Error(error?.message ?? "No se pudo firmar el adjunto");
    return { url: signed.signedUrl, name: msg.attachment_name as string | null };
  });
