import { sendTelegram, escapeHtml } from "@/lib/telegram";

/**
 * Message every Telegram-linked student about live classes starting within the
 * next `windowMinutes`, once per (event, student). Called by the cron endpoint.
 * Runs with the service role (no user session).
 */
export async function sendEventReminders(windowMinutes = 45): Promise<{ events: number; sent: number }> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase no configurado");
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const now = Date.now();
  const fromIso = new Date(now).toISOString();
  const toIso = new Date(now + windowMinutes * 60_000).toISOString();

  const { data: events } = await supabase
    .from("calendar_events")
    .select("id, title, start_utc, zoom_url")
    .gte("start_utc", fromIso)
    .lte("start_utc", toIso);
  if (!events?.length) return { events: 0, sent: 0 };

  const { data: linked } = await supabase
    .from("profiles")
    .select("id, telegram_chat_id")
    .not("telegram_chat_id", "is", null);
  const students = ((linked ?? []) as { id: string; telegram_chat_id: string | null }[]).filter(
    (s): s is { id: string; telegram_chat_id: string } => Boolean(s.telegram_chat_id),
  );
  if (!students.length) return { events: events.length, sent: 0 };

  let sent = 0;
  for (const ev of events as { id: string; title: string; start_utc: string; zoom_url: string | null }[]) {
    const { data: already } = await supabase.from("telegram_reminders").select("user_id").eq("event_id", ev.id);
    const done = new Set(((already ?? []) as { user_id: string }[]).map((r) => r.user_id));
    const mins = Math.max(0, Math.round((new Date(ev.start_utc).getTime() - now) / 60_000));
    for (const s of students) {
      if (done.has(s.id)) continue;
      const text =
        `🔔 <b>${escapeHtml(ev.title)}</b> empieza en ~${mins} min.` +
        (ev.zoom_url ? `\n👉 ${ev.zoom_url}` : "");
      // Claim FIRST (PK insert) so two concurrent runs can't both send; the
      // loser's insert conflicts and is skipped. Undo the claim if the send
      // fails, so a later run can retry.
      const { error: claimErr } = await supabase
        .from("telegram_reminders")
        .insert({ event_id: ev.id, user_id: s.id });
      if (claimErr) continue;
      const ok = await sendTelegram(s.telegram_chat_id, text);
      if (ok) sent += 1;
      else await supabase.from("telegram_reminders").delete().match({ event_id: ev.id, user_id: s.id });
    }
  }
  return { events: events.length, sent };
}
