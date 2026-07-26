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

/* ============================================================================
   COACH ANALYTICS — per-student, per-week performance in ONE call.
   Replaces "download a PDF to see how a student is doing": the coach monitors
   every week directly in the dashboard. Weeks with no data come back as
   `status: "pending"` so the grid always shows the whole programme.
   ============================================================================ */

export type WeekAnalytics = {
  week: number;
  month: number;
  /** Days of this week the student finished (day_completions ∪ defi_results). */
  daysDone: number;
  daysTotal: number;
  /** Mean défi score for the week's days, /10. Null when none submitted. */
  defiAvg: number | null;
  /** Weekly test result, /10, plus its per-block breakdown (CO/CE/PE/PO…). */
  weeklyScore: number | null;
  testScores: Record<string, number> | null;
  /** Activity-game accuracy across the week's days. */
  hits: number;
  misses: number;
  accuracy: number | null;
  stars: number;
  /** Accumulated visible time inside this week's days (day_state.seconds_spent). */
  secondsSpent: number;
  /** Most recent activity anywhere in this week (ISO) — spot stalled students. */
  lastActivityAt: string | null;
  status: "pending" | "in_progress" | "evaluated" | "complete";
  /** Weak points the AI flagged in this week's défis (deduped, max 5). */
  weakPoints: string[];
};

const DAYS_PER_WEEK = 5;

/** `test_scores` is free-form jsonb; keep only its numeric entries so the result
 *  stays JSON-serializable across the server-function boundary. */
function toScoreMap(v: unknown): Record<string, number> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const out: Record<string, number> = {};
  for (const [k, raw] of Object.entries(v as Record<string, unknown>)) {
    const n = Number(raw);
    if (Number.isFinite(n)) out[k] = n;
  }
  return Object.keys(out).length ? out : null;
}

/** Rich per-week analytics for one student. Coach/admin only. */
export const getStudentAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { userId?: string; weeks?: number };
    if (!d?.userId) throw new Error("userId required");
    const weeks = Number(d?.weeks);
    return { userId: String(d.userId), weeks: Number.isFinite(weeks) && weeks > 0 ? Math.min(weeks, 24) : 8 };
  })
  .handler(async ({ data, context }) => {
    await assertCoachOrAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = data.userId;

    const [profile, completions, defis, weekly, activities, stars, tutor, dayState] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, email, created_at, approved_at").eq("id", uid).maybeSingle(),
      supabaseAdmin.from("day_completions").select("day_id, completed_at").eq("user_id", uid),
      supabaseAdmin.from("defi_results").select("day_id, score_10, hits, misses, weak_points, created_at").eq("user_id", uid),
      supabaseAdmin.from("weekly_evaluations").select("week_number, weekly_score, test_score, test_scores, ai_report, pdf_generated, created_at").eq("user_id", uid),
      supabaseAdmin.from("activity_results").select("day_id, aciertos, errores, competence, punto_debil, created_at").eq("user_id", uid),
      supabaseAdmin.from("star_awards").select("amount, source_key, created_at").eq("user_id", uid),
      supabaseAdmin.from("tutor_usage").select("usage_date, message_count").eq("user_id", uid),
      supabaseAdmin.from("day_state").select("day_id, seconds_spent").eq("user_id", uid),
    ]);

    // The star triggers write exactly three key shapes (see the migrations):
    //   "day_complete:N"  +2   ·  "defi:N"  +2  ·  "weekly:N"  +3
    const dayOfStar = (key: string | null): number | null => {
      const m = /^(?:day_complete|defi):(\d+)$/.exec(key ?? "");
      return m ? Number(m[1]) : null;
    };
    const weekOfStar = (key: string | null): number | null => {
      const m = /^weekly:(\d+)$/.exec(key ?? "");
      return m ? Number(m[1]) : null;
    };
    const latest = (a: string | null, b: string | null) =>
      !a ? b : !b ? a : new Date(a) > new Date(b) ? a : b;

    const weeks: WeekAnalytics[] = [];
    for (let w = 1; w <= data.weeks; w++) {
      const dayIds = Array.from({ length: DAYS_PER_WEEK }, (_, i) => (w - 1) * DAYS_PER_WEEK + i + 1);
      const inWeek = (d: number) => dayIds.includes(Number(d));

      const wDefis = (defis.data ?? []).filter((r) => inWeek(r.day_id as number));
      const wActs = (activities.data ?? []).filter((r) => inWeek(r.day_id as number));
      const wComp = (completions.data ?? []).filter((r) => inWeek(r.day_id as number));
      const wSeconds = (dayState.data ?? [])
        .filter((r) => inWeek(r.day_id as number))
        .reduce((s, r) => s + (Number(r.seconds_spent) || 0), 0);
      const wEval = (weekly.data ?? []).find((r) => Number(r.week_number) === w) ?? null;
      const wStars = (stars.data ?? []).filter((r) => {
        const key = r.source_key as string | null;
        const d = dayOfStar(key);
        if (d !== null) return inWeek(d);
        // Exact match: `includes("week:1")` also matched "week:12".."week:19",
        // and never matched the real "weekly:N" key at all — so the +3 weekly
        // stars landed in no week and the column never summed to the total.
        return weekOfStar(key) === w;
      });

      const doneDays = new Set<number>([
        ...wComp.map((r) => Number(r.day_id)),
        ...wDefis.map((r) => Number(r.day_id)),
      ]);
      // `activity_results.aciertos`/`errores` are jsonb ARRAYS (the praised
      // phrases / the corrections), not counts — `Number([...])` is NaN, which
      // poisoned the whole sum and made accuracy show "—" for every active
      // student. Count their length; `defi_results.hits/misses` are real ints.
      const countOf = (v: unknown) => (Array.isArray(v) ? v.length : Number(v) || 0);
      const hits = wActs.reduce((s, r) => s + countOf(r.aciertos), 0)
        + wDefis.reduce((s, r) => s + (Number(r.hits) || 0), 0);
      const misses = wActs.reduce((s, r) => s + countOf(r.errores), 0)
        + wDefis.reduce((s, r) => s + (Number(r.misses) || 0), 0);
      const defiScores = wDefis.map((r) => Number(r.score_10)).filter((n) => Number.isFinite(n));

      let lastActivityAt: string | null = null;
      for (const r of [...wDefis, ...wActs, ...wComp]) {
        lastActivityAt = latest(lastActivityAt, (r as { created_at?: string; completed_at?: string }).created_at
          ?? (r as { completed_at?: string }).completed_at ?? null);
      }
      if (wEval) lastActivityAt = latest(lastActivityAt, wEval.created_at as string);

      const weakPoints = Array.from(
        new Set(
          wDefis.flatMap((r) => (Array.isArray(r.weak_points) ? (r.weak_points as string[]) : []))
            .concat(wActs.map((r) => String(r.punto_debil ?? "")).filter(Boolean)),
        ),
      ).slice(0, 5);

      const status: WeekAnalytics["status"] =
        doneDays.size === 0 && !wEval ? "pending"
        : wEval && doneDays.size >= DAYS_PER_WEEK ? "complete"
        : wEval ? "evaluated"
        : "in_progress";

      weeks.push({
        week: w,
        month: Math.ceil(w / 4),
        daysDone: doneDays.size,
        daysTotal: DAYS_PER_WEEK,
        defiAvg: defiScores.length ? Number((defiScores.reduce((a, b) => a + b, 0) / defiScores.length).toFixed(1)) : null,
        weeklyScore: wEval ? Number(wEval.weekly_score) : null,
        testScores: toScoreMap(wEval?.test_scores),
        hits,
        misses,
        accuracy: hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : null,
        stars: wStars.reduce((s, r) => s + Number(r.amount ?? 0), 0),
        secondsSpent: wSeconds,
        lastActivityAt,
        status,
        weakPoints,
      });
    }

    const totalStars = (stars.data ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0);
    const allDone = new Set<number>([
      ...(completions.data ?? []).map((r) => Number(r.day_id)),
      ...(defis.data ?? []).map((r) => Number(r.day_id)),
    ]);
    const lastSeen = weeks.reduce<string | null>((acc, w) => latest(acc, w.lastActivityAt), null);

    return {
      profile: profile.data ?? null,
      weeks,
      totals: {
        daysDone: allDone.size,
        stars: totalStars,
        /** Total visible time on the platform, in seconds (client: "time spent"). */
        secondsSpent: (dayState.data ?? []).reduce((s, r) => s + (Number(r.seconds_spent) || 0), 0),
        weeklyTestsTaken: (weekly.data ?? []).length,
        tutorMessages: (tutor.data ?? []).reduce((s, r) => s + Number(r.message_count ?? 0), 0),
        lastSeen,
        /** Days since the student last did anything — the "stalled" alert. */
        daysSinceLastSeen: lastSeen
          ? Math.floor((Date.now() - new Date(lastSeen).getTime()) / 86_400_000)
          : null,
      },
    };
  });

/* ============================================================================
   Score override + teacher assignment + notifications (teacher suite).
   ============================================================================ */

/** Coach/admin: manually adjust an AI-graded score (the automatic grading ran
 *  too strict; see the lenient-rubric prompts). Audited via overridden_by/at. */
export const overrideScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { userId?: string; kind?: string; targetId?: number; score?: number };
    if (!d?.userId) throw new Error("userId required");
    const kind = d.kind === "weekly" ? "weekly" : d.kind === "defi" ? "defi" : null;
    if (!kind) throw new Error("kind must be 'defi' or 'weekly'");
    const targetId = Number(d.targetId);
    if (!Number.isInteger(targetId) || targetId < 1) throw new Error("targetId required");
    const score = Number(d.score);
    if (!Number.isFinite(score) || score < 0 || score > 10) throw new Error("score must be 0-10");
    return { userId: String(d.userId), kind, targetId, score: Math.round(score * 10) / 10 };
  })
  .handler(async ({ data, context }) => {
    const graderId = await assertCoachOrAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const stamp = { overridden_by: graderId, overridden_at: new Date().toISOString() };
    const { error } =
      data.kind === "weekly"
        ? await supabaseAdmin
            .from("weekly_evaluations")
            .update({ weekly_score: data.score, ...stamp })
            .eq("user_id", data.userId)
            .eq("week_number", data.targetId)
        : await supabaseAdmin
            .from("defi_results")
            .update({ score_10: data.score, ...stamp })
            .eq("user_id", data.userId)
            .eq("day_id", data.targetId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin/coach: assign (or clear) a student's teacher — weekly reports and
 *  activity notifications route to this coach (admins always see everything). */
export const setAssignedCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { userId?: string; coachId?: string | null };
    if (!d?.userId) throw new Error("userId required");
    return { userId: String(d.userId), coachId: d.coachId ? String(d.coachId) : null };
  })
  .handler(async ({ data, context }) => {
    await assertCoachOrAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.coachId) {
      // The assignee must actually hold a staff role.
      const { data: role } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("user_id", data.coachId)
        .in("role", ["coach", "admin"])
        .limit(1);
      if (!role?.length) throw new Error("La persona asignada debe tener rol de coach o admin");
    }
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ assigned_coach: data.coachId })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
