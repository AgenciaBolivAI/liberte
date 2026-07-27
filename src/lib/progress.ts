import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const TOTAL_DAYS = 120; // 24 weeks × 5 days
export const TOTAL_WEEKS = 24;
export const DAYS_PER_WEEK = 5;

type DayCompletion = { day_id: number; week_number: number; completed_at: string };

// When `targetUserId` is passed (an admin previewing "view as student"), the
// browser client can't read another user's rows under RLS, so we pull the data
// through the service-role snapshot server fn instead. Strictly read-only.

export function useStars(targetUserId?: string | null) {
  const { user } = useAuth();
  const [stars, setStars] = useState(0);
  const [loading, setLoading] = useState(true);
  const reqRef = useRef(0);

  const refresh = useCallback(async () => {
    // Only the latest call may commit — a slow snapshot for a previously-viewed
    // student can't overwrite the current one.
    const req = ++reqRef.current;
    const alive = () => reqRef.current === req;
    if (targetUserId) {
      try {
        const { getStudentSnapshot } = await import("@/lib/admin.functions");
        const snap = await getStudentSnapshot({ data: { userId: targetUserId } });
        if (!alive()) return;
        setStars(snap.stars);
      } catch {
        if (alive()) setStars(0);
      }
      if (alive()) setLoading(false);
      return;
    }
    if (!user) {
      setStars(0);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("star_awards")
      .select("amount")
      .eq("user_id", user.id);
    if (!alive()) return;
    // Keep the last known total if the fetch failed, rather than showing 0.
    if (error) console.error("[star_awards] fetch failed", error.message);
    else setStars((data ?? []).reduce((s, r) => s + (r.amount ?? 0), 0));
    setLoading(false);
    // Stable id, not the `user` object (new identity on every tab return).
  }, [user?.id, targetUserId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { stars, loading, refresh };
}

export function useDayCompletions(targetUserId?: string | null) {
  const { user } = useAuth();
  const [rows, setRows] = useState<DayCompletion[]>([]);
  const [defiDays, setDefiDays] = useState<number[]>([]);
  const [defiDates, setDefiDates] = useState<string[]>([]);
  const [enrolledAt, setEnrolledAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const reqRef = useRef(0);

  const refresh = useCallback(async () => {
    const req = ++reqRef.current;
    const alive = () => reqRef.current === req;
    if (targetUserId) {
      try {
        const { getStudentSnapshot } = await import("@/lib/admin.functions");
        const snap = await getStudentSnapshot({ data: { userId: targetUserId } });
        if (!alive()) return;
        setRows(
          snap.completions.map((c) => ({
            day_id: c.day_id,
            week_number: Math.ceil(c.day_id / DAYS_PER_WEEK),
            completed_at: c.completed_at,
          })),
        );
        setDefiDays(snap.defiDays);
        setEnrolledAt(snap.createdAt);
      } catch {
        if (alive()) {
          setRows([]);
          setDefiDays([]);
          setEnrolledAt(null);
        }
      }
      if (alive()) setLoading(false);
      return;
    }
    if (!user) {
      setRows([]);
      setDefiDays([]);
      setEnrolledAt(null);
      setLoading(false);
      return;
    }
    const [dc, dr] = await Promise.all([
      supabase
        .from("day_completions")
        .select("day_id, week_number, completed_at")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: true }),
      supabase.from("defi_results").select("day_id, created_at").eq("user_id", user.id),
    ]);
    if (!alive()) return;
    // KEEP the previous data when a fetch fails. Blanking it made the dashboard
    // read 0 and, on the day page, made `doneDays` empty — which flipped days
    // back to "locked" and unmounted the lesson the student was working on.
    if (!dc.error) setRows((dc.data as DayCompletion[]) ?? []);
    else console.error("[day_completions] fetch failed", dc.error.message);
    if (!dr.error) {
      setDefiDays(Array.from(new Set((dr.data ?? []).map((r) => Number(r.day_id)))));
      setDefiDates((dr.data ?? []).map((r) => String(r.created_at ?? "")).filter(Boolean));
    } else console.error("[defi_results] fetch failed", dr.error.message);
    setEnrolledAt(user.created_at ?? null);
    setLoading(false);
    // Depend on the stable id/created_at, NOT the `user` object: supabase hands
    // us a brand-new User object on every tab return, which re-ran this fetch
    // constantly (and, before the guard above, could blank real data).
  }, [user?.id, user?.created_at, targetUserId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // A day counts as done if the student marked it complete OR submitted its
  // défi — the same OR-rule the unlock logic uses (see src/lib/unlock.ts). The
  // dashboard used to count `day_completions` only, so a student who had done
  // real work could still read 0/120.
  const days = Array.from(new Set([...rows.map((r) => r.day_id), ...defiDays])).sort((a, b) => a - b);
  const doneSet = new Set(days);
  // A week is complete only when ALL of its days are done — not `floor(total/5)`,
  // which credited a whole week for any 5 days finished anywhere in the program.
  const weeksCompleted = Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).filter((w) =>
    Array.from({ length: DAYS_PER_WEEK }, (_, d) => (w - 1) * DAYS_PER_WEEK + d + 1).every((dayId) =>
      doneSet.has(dayId),
    ),
  ).length;
  const percent = Math.round((days.length / TOTAL_DAYS) * 100);
  // Streak counts BOTH activity kinds — a défi-only day is real work and must
  // not break the chain (it used to look at day_completions dates only).
  const streak = computeStreak([...rows.map((r) => r.completed_at), ...defiDates]);

  return { rows, days, defiDays, enrolledAt, weeksCompleted, percent, streak, loading, refresh };
}

/** Local calendar day (YYYY-MM-DD) — must match the local midnight used below,
 *  otherwise students east/west of UTC get wrong streaks. */
function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function computeStreak(dates: string[]): number {
  const valid = dates.filter((d) => d && !Number.isNaN(new Date(d).getTime()));
  if (valid.length === 0) return 0;
  const uniq = Array.from(
    new Set(valid.map((d) => localDayKey(new Date(d)))),
  ).sort();
  let streak = 1;
  let best = 1;
  for (let i = 1; i < uniq.length; i++) {
    const prev = new Date(uniq[i - 1]).getTime();
    const cur = new Date(uniq[i]).getTime();
    if ((cur - prev) / 86_400_000 === 1) {
      streak += 1;
      best = Math.max(best, streak);
    } else {
      streak = 1;
    }
  }
  // If the most recent completion is not today or yesterday, current streak = 0
  const last = new Date(uniq[uniq.length - 1]).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = (today.getTime() - last) / 86_400_000;
  return diffDays <= 1 ? streak : 0;
}

export async function markDayCompleted(userId: string, dayId: number, weekNumber = 1) {
  const { error } = await supabase
    .from("day_completions")
    .insert({ user_id: userId, day_id: dayId, week_number: weekNumber });
  if (error && !/duplicate|unique/i.test(error.message)) throw error;
}
