import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Coach: unlock/lock a student's weeks. Grants are written to `content_access`
// (a per-user week "open" override) — the SAME system the day route, the tutor
// and the défi enforce server-side, and the dashboard reads. The older
// `week_unlocks` table was only reflected on the dashboard, never enforced, so a
// coach's grant opened the tile but the day itself stayed locked. Using
// content_access makes the grant actually take effect end-to-end.

// Caller must be coach or admin. Uses the RLS-confined client (checks the
// caller's own roles) exactly like the original handlers did.
type Ctx = { supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: string }) => Promise<{ data: unknown }> }; userId: string };
async function assertCoachOrAdmin(context: unknown): Promise<string> {
  const { supabase, userId } = context as Ctx;
  const [isCoach, isAdmin] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "coach" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
  ]);
  if (!isCoach.data && !isAdmin.data) throw new Response("Forbidden", { status: 403 });
  return userId;
}

/** Coach: a student's roster row + created_at + the weeks currently unlocked
 *  for them (per-user "open" overrides in content_access). */
export const getStudentProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { userId?: string };
    if (!d?.userId) throw new Error("userId required");
    return { userId: String(d.userId) };
  })
  .handler(async ({ data, context }) => {
    await assertCoachOrAdmin(context);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profile }, { data: rows }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, email, created_at").eq("id", data.userId).maybeSingle(),
      supabaseAdmin
        .from("content_access")
        .select("target_id, updated_at")
        .eq("scope", "user")
        .eq("user_id", data.userId)
        .eq("target_type", "week")
        .eq("access", "open"),
    ]);

    const unlocks = ((rows ?? []) as { target_id: number; updated_at: string }[]).map((r) => ({
      week_number: r.target_id,
      unlocked_at: r.updated_at,
    }));
    return { profile, unlocks };
  });

/** Coach: unlock a specific week for a student (per-user content_access "open"). */
export const unlockWeek = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { userId?: string; weekNumber?: number };
    if (!d?.userId) throw new Error("userId required");
    const wn = Number(d?.weekNumber);
    if (!wn || wn < 1 || wn > 24) throw new Error("weekNumber 1..24 required");
    return { userId: String(d.userId), weekNumber: wn };
  })
  .handler(async ({ data, context }) => {
    const userId = await assertCoachOrAdmin(context);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // The user unique index is partial (WHERE scope='user'), which upsert can't
    // target cleanly — so delete any existing override for this week, then insert.
    await supabaseAdmin
      .from("content_access")
      .delete()
      .eq("scope", "user")
      .eq("user_id", data.userId)
      .eq("target_type", "week")
      .eq("target_id", data.weekNumber);
    const { error } = await supabaseAdmin.from("content_access").insert({
      scope: "user",
      user_id: data.userId,
      target_type: "week",
      target_id: data.weekNumber,
      access: "open",
      set_by: userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Coach: revoke an unlock (remove the per-user "open" override → back to the
 *  default time/sequential schedule). */
export const lockWeek = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { userId?: string; weekNumber?: number };
    if (!d?.userId) throw new Error("userId required");
    const wn = Number(d?.weekNumber);
    if (!wn) throw new Error("weekNumber required");
    return { userId: String(d.userId), weekNumber: wn };
  })
  .handler(async ({ data, context }) => {
    await assertCoachOrAdmin(context);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("content_access")
      .delete()
      .eq("scope", "user")
      .eq("user_id", data.userId)
      .eq("target_type", "week")
      .eq("target_id", data.weekNumber)
      .eq("access", "open");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
