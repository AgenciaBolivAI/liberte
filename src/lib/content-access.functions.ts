import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { effectiveOverride } from "@/lib/unlock";
import type { AccessOverride, AccessValue } from "@/lib/unlock";

// Admin/coach control over which DAYS and WEEKS are enabled, globally or per
// student. Writes go through the service-role client after a staff role check;
// students only ever read (global + their own) via RLS.

type Ctx = {
  supabase: {
    rpc: (
      fn: "has_role",
      args: { _user_id: string; _role: "admin" | "coach" | "student" },
    ) => PromiseLike<{ data: unknown }>;
    from: (table: string) => {
      select: (cols: string) => { or: (f: string) => PromiseLike<{ data: unknown; error: unknown }> };
    };
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

type AccessRow = {
  scope: "global" | "user";
  user_id: string | null;
  target_type: "day" | "week";
  target_id: number;
  access: AccessValue;
};

/**
 * Server-side helper: the overrides that apply to one student (global rows +
 * that student's rows), shaped for `effectiveOverride`. Used by the day route,
 * tutor, and défi/week gates for real enforcement. Returns [] if the table
 * doesn't exist yet (pre-migration) so nothing crashes.
 */
export async function loadUserOverrides(
  supabase: { from: (t: string) => any },
  userId: string,
): Promise<AccessOverride[]> {
  const { data, error } = await supabase
    .from("content_access")
    .select("scope, user_id, target_type, target_id, access")
    .or(`scope.eq.global,user_id.eq.${userId}`);
  if (error) return [];
  return ((data ?? []) as AccessRow[]).map((r) => ({
    scope: r.scope,
    target_type: r.target_type,
    target_id: r.target_id,
    access: r.access,
  }));
}

type EnforceCtx = {
  supabase: {
    from: (t: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
    rpc: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  };
  userId: string;
};

async function isAdminUser(context: EnforceCtx): Promise<boolean> {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  return Boolean(data);
}

/** Throw if the student may not act on this DAY (admin lock wins; admins pass).
 *  A locked WEEK also locks its days via `effectiveOverride`. Only blocks on an
 *  explicit 'locked' override — the default open-window is unchanged. */
export async function assertDayNotLocked(context: EnforceCtx, dayId: number): Promise<void> {
  const overrides = await loadUserOverrides(context.supabase, context.userId);
  if (effectiveOverride(dayId, overrides) !== "locked") return;
  if (await isAdminUser(context)) return;
  throw new Error(`El Día ${dayId} está bloqueado por tu profesor. 🔒`);
}

/** Throw if the student may not act on this WEEK (admin lock wins; admins pass). */
export async function assertWeekNotLocked(context: EnforceCtx, weekNumber: number): Promise<void> {
  const overrides = await loadUserOverrides(context.supabase, context.userId);
  const at = (scope: "global" | "user") =>
    overrides.find((r) => r.scope === scope && r.target_type === "week" && r.target_id === weekNumber)
      ?.access;
  if ((at("user") ?? at("global")) !== "locked") return;
  if (await isAdminUser(context)) return;
  throw new Error(`La Semana ${weekNumber} está bloqueada por tu profesor. 🔒`);
}

/** Admin panel: read the global switchboard + (optionally) one student's rows. */
export const getContentAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = (input ?? {}) as { userId?: string };
    return { userId: d?.userId ? String(d.userId) : null };
  })
  .handler(async ({ data, context }) => {
    await requireStaff(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("content_access")
      .select("scope, user_id, target_type, target_id, access");
    if (error) {
      const msg = (error as { message?: string }).message ?? "";
      const tableMissing = /content_access/.test(msg) && /(does not exist|relation|schema cache)/i.test(msg);
      return { global: [] as AccessRow[], user: [] as AccessRow[], tableMissing };
    }
    const all = (rows ?? []) as AccessRow[];
    return {
      global: all.filter((r) => r.scope === "global"),
      user: data.userId ? all.filter((r) => r.scope === "user" && r.user_id === data.userId) : [],
      tableMissing: false,
    };
  });

/**
 * Admin panel: set (or clear) a day/week override. `access: "default"` removes
 * the row so the target reverts to the default rules. We delete-then-insert
 * because the table has two partial unique indexes (global vs user), which a
 * single upsert onConflict can't target cleanly.
 */
export const setContentAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as {
      scope?: string;
      userId?: string | null;
      targetType?: string;
      targetId?: number;
      access?: string;
    };
    const scope: "global" | "user" = d?.scope === "user" ? "user" : "global";
    const targetType: "day" | "week" = d?.targetType === "week" ? "week" : "day";
    const targetId = Number(d?.targetId);
    const maxId = targetType === "week" ? 24 : 120;
    if (!Number.isInteger(targetId) || targetId < 1 || targetId > maxId) {
      throw new Error(`targetId 1..${maxId} required`);
    }
    const access = d?.access;
    if (access !== "open" && access !== "locked" && access !== "default") {
      throw new Error("access must be open | locked | default");
    }
    const userId = scope === "user" ? String(d?.userId ?? "") : null;
    if (scope === "user" && !userId) throw new Error("userId required for user scope");
    return { scope, userId, targetType, targetId, access };
  })
  .handler(async ({ data, context }) => {
    await requireStaff(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Remove any existing row for this exact (scope, user, target).
    let del = supabaseAdmin
      .from("content_access")
      .delete()
      .eq("scope", data.scope)
      .eq("target_type", data.targetType)
      .eq("target_id", data.targetId);
    del =
      data.scope === "user" ? del.eq("user_id", data.userId as string) : del.is("user_id", null);
    const { error: delErr } = await del;
    if (delErr) throw new Error(delErr.message);

    if (data.access === "default") return { ok: true, access: "default" as const };

    const { error } = await supabaseAdmin.from("content_access").insert({
      scope: data.scope,
      user_id: data.scope === "user" ? data.userId : null,
      target_type: data.targetType,
      target_id: data.targetId,
      access: data.access,
      set_by: context.userId,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true, access: data.access };
  });
