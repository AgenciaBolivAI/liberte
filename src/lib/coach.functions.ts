import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Coach: get a student's roster row + created_at + unlocked weeks. */
export const getStudentProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { userId?: string };
    if (!d?.userId) throw new Error("userId required");
    return { userId: String(d.userId) };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [isCoach, isAdmin] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "coach" }),
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    ]);
    if (!isCoach.data && !isAdmin.data) throw new Response("Forbidden", { status: 403 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, email, created_at")
      .eq("id", data.userId)
      .maybeSingle();

    const { data: unlocks } = await supabase
      .from("week_unlocks")
      .select("week_number, unlocked_at")
      .eq("user_id", data.userId);

    return { profile, unlocks: unlocks ?? [] };
  });

/** Coach: unlock a specific week for a student. */
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
    const { supabase, userId } = context;
    const [isCoach, isAdmin] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "coach" }),
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    ]);
    if (!isCoach.data && !isAdmin.data) throw new Response("Forbidden", { status: 403 });

    const { error } = await supabase.from("week_unlocks").upsert({
      user_id: data.userId,
      week_number: data.weekNumber,
      unlocked_by: userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Coach: revoke an unlock. */
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
    const { supabase, userId } = context;
    const [isCoach, isAdmin] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "coach" }),
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    ]);
    if (!isCoach.data && !isAdmin.data) throw new Response("Forbidden", { status: 403 });

    const { error } = await supabase
      .from("week_unlocks")
      .delete()
      .eq("user_id", data.userId)
      .eq("week_number", data.weekNumber);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
