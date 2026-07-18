import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = {
  supabase: {
    rpc: (
      fn: "has_role",
      args: { _user_id: string; _role: "admin" | "coach" | "student" },
    ) => PromiseLike<{ data: unknown }>;
  };
  userId: string;
};

async function requireAdmin(context: Ctx): Promise<void> {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Response("Forbidden", { status: 403 });
}

/* ---------------- Approval queue ---------------- */

export type PendingStudent = {
  id: string;
  full_name: string;
  email: string | null;
  nationality: string | null;
  created_at: string;
};

export const getPendingStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, nationality, created_at")
      .is("approved_at", null)
      .order("created_at", { ascending: false });
    // Pre-migration (column missing) → empty queue instead of a crash.
    if (error) return [] as PendingStudent[];
    return (data ?? []) as PendingStudent[];
  });

export const approveStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { userId?: string };
    if (!d?.userId) throw new Error("userId required");
    return { userId: String(d.userId) };
  })
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .update({ approved_at: new Date().toISOString(), approved_by: context.userId })
      .eq("id", data.userId)
      .select("email")
      .maybeSingle();
    if (error) throw new Error(error.message);
    // Best-effort: mark the matching lead as converted.
    if (profile?.email) {
      try {
        await supabaseAdmin
          .from("leads")
          .update({ status: "approved" })
          .ilike("email", profile.email.toLowerCase());
      } catch {
        // non-fatal
      }
    }
    return { ok: true };
  });

/* ---------------- Live analytics ---------------- */

export type Range = "today" | "7d" | "30d" | "all";
export type Delta = { value: number; prev: number };

export type AdminAnalytics = {
  range: Range;
  kpis: {
    newStudents: Delta;
    newLeads: Delta;
    activeStudents: Delta;
    daysCompleted: Delta;
    starsAwarded: Delta;
    avgDefiScore: Delta;
    tutorMessages: Delta;
    pendingApprovals: number;
    leadConversionPct: number;
  };
  growthSeries: { date: string; leads: number; signups: number }[];
  activitySeries: { date: string; completions: number; activities: number; defis: number }[];
  starsByReason: { reason: string; total: number }[];
  topStudents: { id: string; name: string; stars: number; days: number }[];
  recentActivity: {
    type: "lead" | "signup" | "day" | "defi" | "week" | "stars";
    who: string;
    detail: string;
    at: string;
  }[];
};

const DAY_MS = 86_400_000;
const WINDOW_MS: Record<Exclude<Range, "all">, number> = {
  today: DAY_MS,
  "7d": 7 * DAY_MS,
  "30d": 30 * DAY_MS,
};

export const getAdminAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { range?: string };
    const range: Range =
      d?.range === "today" || d?.range === "7d" || d?.range === "30d" ? d.range : "all";
    return { range };
  })
  .handler(async ({ data, context }): Promise<AdminAnalytics> => {
    await requireAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const now = Date.now();
    const windowMs = data.range === "all" ? null : WINDOW_MS[data.range];
    const since = windowMs ? now - windowMs : null;
    const prevSince = windowMs ? now - 2 * windowMs : null;
    const prevSinceIso = prevSince ? new Date(prevSince).toISOString() : null;

    const filtered = <T extends { gte: (col: string, v: string) => T }>(q: T, col: string): T =>
      prevSinceIso ? q.gte(col, prevSinceIso) : q;

    const [profiles, leads, completions, activities, defis, weeklies, stars, tutor] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id, full_name, email, created_at, approved_at"),
        supabaseAdmin.from("leads").select("email, status, created_at"),
        filtered(
          supabaseAdmin.from("day_completions").select("user_id, day_id, completed_at"),
          "completed_at",
        ),
        filtered(
          supabaseAdmin.from("activity_results").select("user_id, score, created_at"),
          "created_at",
        ),
        filtered(
          supabaseAdmin.from("defi_results").select("user_id, score_10, created_at"),
          "created_at",
        ),
        filtered(
          supabaseAdmin.from("weekly_evaluations").select("user_id, week_number, created_at"),
          "created_at",
        ),
        filtered(
          supabaseAdmin.from("star_awards").select("user_id, amount, reason, created_at"),
          "created_at",
        ),
        supabaseAdmin
          .from("tutor_usage")
          .select("user_id, usage_date, message_count")
          .then(
            (r) => r,
            () => ({ data: [], error: null }),
          ),
      ]);

    const profileRows = profiles.data ?? [];
    const leadRows = leads.data ?? [];
    const completionRows = completions.data ?? [];
    const activityRows = activities.data ?? [];
    const defiRows = defis.data ?? [];
    const weeklyRows = weeklies.data ?? [];
    const starRows = stars.data ?? [];
    const tutorRows = (tutor.data ?? []) as {
      user_id: string;
      usage_date: string;
      message_count: number;
    }[];

    const inWindow = (ts: string | null | undefined) =>
      Boolean(ts) && (since === null || new Date(ts as string).getTime() >= since);
    const inPrev = (ts: string | null | undefined) => {
      if (!ts || since === null || prevSince === null) return false;
      const t = new Date(ts).getTime();
      return t >= prevSince && t < since;
    };

    const nameOf = new Map<string, string>();
    profileRows.forEach((p) => nameOf.set(p.id, p.full_name || p.email || "Alumno"));

    const delta = (rows: { at: string | null | undefined }[]): Delta => ({
      value: rows.filter((r) => inWindow(r.at)).length,
      prev: rows.filter((r) => inPrev(r.at)).length,
    });

    // KPIs -------------------------------------------------------------
    const newStudents = delta(profileRows.map((p) => ({ at: p.created_at })));
    const newLeads = delta(leadRows.map((l) => ({ at: l.created_at })));
    const daysCompleted = delta(completionRows.map((c) => ({ at: c.completed_at })));

    const activeSet = new Set<string>();
    const activePrevSet = new Set<string>();
    const mark = (uid: string, at: string | null | undefined) => {
      if (inWindow(at)) activeSet.add(uid);
      else if (inPrev(at)) activePrevSet.add(uid);
    };
    completionRows.forEach((r) => mark(r.user_id, r.completed_at));
    activityRows.forEach((r) => mark(r.user_id, r.created_at));
    defiRows.forEach((r) => mark(r.user_id, r.created_at));
    weeklyRows.forEach((r) => mark(r.user_id, r.created_at));
    starRows.forEach((r) => mark(r.user_id, r.created_at));

    const starsInWindow = starRows.filter((r) => inWindow(r.created_at));
    const starsAwarded: Delta = {
      value: starsInWindow.reduce((s, r) => s + (r.amount ?? 0), 0),
      prev: starRows.filter((r) => inPrev(r.created_at)).reduce((s, r) => s + (r.amount ?? 0), 0),
    };

    const avgOf = (rows: { score_10: number | null }[]) =>
      rows.length
        ? Number(
            (rows.reduce((s, r) => s + Number(r.score_10 ?? 0), 0) / rows.length).toFixed(1),
          )
        : 0;
    const avgDefiScore: Delta = {
      value: avgOf(defiRows.filter((r) => inWindow(r.created_at))),
      prev: avgOf(defiRows.filter((r) => inPrev(r.created_at))),
    };

    // tutor_usage is bucketed by date, not timestamp.
    const dateInWindow = (d0: string) => inWindow(`${d0}T12:00:00Z`);
    const dateInPrev = (d0: string) => inPrev(`${d0}T12:00:00Z`);
    const tutorMessages: Delta = {
      value: tutorRows.filter((r) => dateInWindow(r.usage_date)).reduce((s, r) => s + r.message_count, 0),
      prev: tutorRows.filter((r) => dateInPrev(r.usage_date)).reduce((s, r) => s + r.message_count, 0),
    };

    const pendingApprovals = profileRows.filter(
      (p) => "approved_at" in p && p.approved_at === null,
    ).length;

    const profileEmails = new Set(
      profileRows.map((p) => (p.email ?? "").toLowerCase()).filter(Boolean),
    );
    const convertedLeads = leadRows.filter((l) =>
      profileEmails.has((l.email ?? "").toLowerCase()),
    ).length;
    const leadConversionPct = leadRows.length
      ? Math.round((convertedLeads / leadRows.length) * 100)
      : 0;

    // Series -----------------------------------------------------------
    const seriesDays = data.range === "today" ? 2 : data.range === "7d" ? 7 : data.range === "30d" ? 30 : 90;
    const dayKey = (ts: string) => new Date(ts).toISOString().slice(0, 10);
    const buckets: string[] = Array.from({ length: seriesDays }, (_, i) =>
      new Date(now - (seriesDays - 1 - i) * DAY_MS).toISOString().slice(0, 10),
    );
    const bucketIdx = new Map(buckets.map((b, i) => [b, i]));

    const growthSeries = buckets.map((date) => ({ date, leads: 0, signups: 0 }));
    leadRows.forEach((l) => {
      const i = bucketIdx.get(dayKey(l.created_at));
      if (i !== undefined) growthSeries[i].leads += 1;
    });
    profileRows.forEach((p) => {
      const i = bucketIdx.get(dayKey(p.created_at));
      if (i !== undefined) growthSeries[i].signups += 1;
    });

    const activitySeries = buckets.map((date) => ({
      date,
      completions: 0,
      activities: 0,
      defis: 0,
    }));
    completionRows.forEach((c) => {
      const i = bucketIdx.get(dayKey(c.completed_at));
      if (i !== undefined) activitySeries[i].completions += 1;
    });
    activityRows.forEach((a) => {
      const i = bucketIdx.get(dayKey(a.created_at));
      if (i !== undefined) activitySeries[i].activities += 1;
    });
    defiRows.forEach((d0) => {
      const i = bucketIdx.get(dayKey(d0.created_at));
      if (i !== undefined) activitySeries[i].defis += 1;
    });

    // Stars by reason --------------------------------------------------
    const reasonTotals = new Map<string, number>();
    starsInWindow.forEach((r) => {
      reasonTotals.set(r.reason, (reasonTotals.get(r.reason) ?? 0) + (r.amount ?? 0));
    });
    const starsByReason = Array.from(reasonTotals.entries())
      .map(([reason, total]) => ({ reason, total }))
      .sort((a, b) => b.total - a.total);

    // Top students -----------------------------------------------------
    const starByUser = new Map<string, number>();
    starsInWindow.forEach((r) => {
      starByUser.set(r.user_id, (starByUser.get(r.user_id) ?? 0) + (r.amount ?? 0));
    });
    const daysByUser = new Map<string, number>();
    completionRows
      .filter((c) => inWindow(c.completed_at))
      .forEach((c) => daysByUser.set(c.user_id, (daysByUser.get(c.user_id) ?? 0) + 1));
    const topStudents = Array.from(starByUser.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, starsN]) => ({
        id,
        name: nameOf.get(id) ?? "Alumno",
        stars: starsN,
        days: daysByUser.get(id) ?? 0,
      }));

    // Recent activity feed ---------------------------------------------
    type Feed = AdminAnalytics["recentActivity"][number];
    const feed: Feed[] = [];
    leadRows.forEach((l) =>
      feed.push({ type: "lead", who: l.email ?? "lead", detail: "Nuevo lead", at: l.created_at }),
    );
    profileRows.forEach((p) =>
      feed.push({
        type: "signup",
        who: p.full_name || p.email || "Alumno",
        detail: "Cuenta creada",
        at: p.created_at,
      }),
    );
    completionRows.forEach((c) =>
      feed.push({
        type: "day",
        who: nameOf.get(c.user_id) ?? "Alumno",
        detail: `Día ${c.day_id} completado`,
        at: c.completed_at,
      }),
    );
    defiRows.forEach((d0) =>
      feed.push({
        type: "defi",
        who: nameOf.get(d0.user_id) ?? "Alumno",
        detail: `Défi · ${Number(d0.score_10 ?? 0).toFixed(1)}/10`,
        at: d0.created_at,
      }),
    );
    weeklyRows.forEach((w) =>
      feed.push({
        type: "week",
        who: nameOf.get(w.user_id) ?? "Alumno",
        detail: `Défi semanal S${w.week_number}`,
        at: w.created_at,
      }),
    );
    const recentActivity = feed
      .filter((f) => inWindow(f.at))
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 20);

    return {
      range: data.range,
      kpis: {
        newStudents,
        newLeads,
        activeStudents: { value: activeSet.size, prev: activePrevSet.size },
        daysCompleted,
        starsAwarded,
        avgDefiScore,
        tutorMessages,
        pendingApprovals,
        leadConversionPct,
      },
      growthSeries,
      activitySeries,
      starsByReason,
      topStudents,
      recentActivity,
    };
  });
