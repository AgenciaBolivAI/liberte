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

/** Escape LIKE/ILIKE wildcards so a value matches LITERALLY. Without this a
 *  crafted email like "%@empresa.com" (or a real "_" in an address) pattern-
 *  matches other accounts through PostgREST's `ilike`. */
const escapeLike = (s: string) => s.replace(/([\\%_])/g, "\\$1");
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
          .ilike("email", escapeLike(profile.email.toLowerCase()));
      } catch {
        // non-fatal
      }
    }
    return { ok: true };
  });

/* ---------------- View-as-student (read-only impersonation) ---------------- */

export type StudentSnapshot = {
  profile: { id: string; full_name: string; email: string | null } | null;
  dayStates: { day_id: number; done_lessons: string[]; current_lesson: string | null; stars: number }[];
  completedDays: number[];
  completions: { day_id: number; completed_at: string }[];
  defiDays: number[];
  stars: number;
  createdAt: string | null;
};

/** Roster for the "view as" picker. */
export const getStudentRoster = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name");
    return (data ?? []) as { id: string; full_name: string; email: string | null }[];
  });

/** Everything needed to render the app exactly as one student sees it.
 *  Read-only: the UI never writes while impersonating. */
export const getStudentSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { userId?: string };
    if (!d?.userId) throw new Error("userId required");
    return { userId: String(d.userId) };
  })
  .handler(async ({ data, context }): Promise<StudentSnapshot> => {
    await requireAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [profile, dayStates, completions, defis, stars] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, email, created_at").eq("id", data.userId).maybeSingle(),
      supabaseAdmin.from("day_state").select("day_id, done_lessons, current_lesson, stars").eq("user_id", data.userId),
      supabaseAdmin.from("day_completions").select("day_id, completed_at").eq("user_id", data.userId).order("completed_at", { ascending: true }),
      supabaseAdmin.from("defi_results").select("day_id").eq("user_id", data.userId),
      supabaseAdmin.from("star_awards").select("amount").eq("user_id", data.userId),
    ]);
    const completionRows = ((completions.data ?? []) as { day_id: number; completed_at: string }[]).map((r) => ({
      day_id: Number(r.day_id),
      completed_at: String(r.completed_at ?? ""),
    }));
    return {
      profile: (profile.data ?? null) as StudentSnapshot["profile"],
      dayStates: ((dayStates.data ?? []) as unknown[]).map((r) => {
        const row = r as { day_id: number; done_lessons: unknown; current_lesson: string | null; stars: number };
        return {
          day_id: Number(row.day_id),
          done_lessons: Array.isArray(row.done_lessons) ? (row.done_lessons as string[]) : [],
          current_lesson: row.current_lesson,
          stars: Number(row.stars ?? 0),
        };
      }),
      completedDays: completionRows.map((r) => r.day_id),
      completions: completionRows,
      defiDays: (defis.data ?? []).map((r) => Number(r.day_id)),
      stars: (stars.data ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0),
      createdAt: (profile.data as { created_at?: string } | null)?.created_at ?? null,
    };
  });

/* ---------------- Staff roles (coach assignment) ---------------- */

export type StaffMember = {
  id: string;
  full_name: string;
  email: string | null;
  roles: string[];
};

/** Everyone holding a staff role (coach/admin), for the role manager UI. */
export const getStaffList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roleRows, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["coach", "admin"]);
    if (error) throw new Error(error.message);
    const ids = [...new Set((roleRows ?? []).map((r) => r.user_id as string))];
    if (!ids.length) return [] as StaffMember[];
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ids);
    const nameOf = new Map(
      (profs ?? []).map((p) => [p.id as string, (p.full_name || p.email || "Usuario") as string]),
    );
    const emailOf = new Map(
      (profs ?? []).map((p) => [p.id as string, (p.email ?? null) as string | null]),
    );
    const byUser = new Map<string, string[]>();
    for (const r of roleRows ?? []) {
      const list = byUser.get(r.user_id as string) ?? [];
      list.push(r.role as string);
      byUser.set(r.user_id as string, list);
    }
    return ids.map((id) => ({
      id,
      full_name: nameOf.get(id) ?? "Usuario",
      email: emailOf.get(id) ?? null,
      roles: byUser.get(id) ?? [],
    })) as StaffMember[];
  });

/** Grant or revoke the coach (teacher) role for an account, looked up by
 *  email. Writes go through the service role; the caller must be an admin.
 *  The admin role itself is intentionally NOT manageable here — it stays a
 *  migration/console operation. */
export const setCoachRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { email?: string; userId?: string; assign?: boolean };
    // Prefer a stable user id (used by "revoke", where the account's email may be
    // null). Fall back to an email for the "grant by typing an address" flow.
    const userId = d?.userId ? String(d.userId) : "";
    if (userId && !UUID_RE.test(userId)) throw new Error("userId inválido");
    const email = String(d?.email ?? "").trim().toLowerCase();
    if (!userId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email inválido");
    return { userId, email, assign: d?.assign !== false };
  })
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Look up by id when provided (exact), else by email matched LITERALLY
    // (escaped) so a wildcard pattern can't resolve to the wrong account.
    const q = supabaseAdmin.from("profiles").select("id, full_name, email");
    const { data: profile, error: lookupError } = await (data.userId
      ? q.eq("id", data.userId)
      : q.ilike("email", escapeLike(data.email))
    ).maybeSingle();
    if (lookupError) throw new Error(lookupError.message);
    if (!profile) throw new Error("No hay ninguna cuenta registrada con esos datos");
    const userId = profile.id as string;
    if (data.assign) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "coach" }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "coach");
      if (error) throw new Error(error.message);
    }
    return { ok: true, name: (profile.full_name || profile.email) as string };
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

    // PostgREST caps responses at 1000 rows by default; star_awards and
    // activity_results outgrow that quickly. Order newest-first and raise the
    // ceiling so the windows we actually chart stay complete.
    const MAX_ROWS = 100_000;
    const filtered = <
      T extends {
        gte: (col: string, v: string) => T;
        order: (col: string, opts: { ascending: boolean }) => T;
        limit: (n: number) => T;
      },
    >(
      q: T,
      col: string,
    ): T => {
      const scoped = prevSinceIso ? q.gte(col, prevSinceIso) : q;
      return scoped.order(col, { ascending: false }).limit(MAX_ROWS);
    };

    const [profiles, leads, completions, activities, defis, weeklies, stars, tutor] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id, full_name, email, created_at, approved_at")
          .limit(100_000),
        supabaseAdmin.from("leads").select("email, status, created_at").limit(100_000),
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
