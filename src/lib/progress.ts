import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const TOTAL_DAYS = 120; // 24 weeks × 5 days
export const TOTAL_WEEKS = 24;
export const DAYS_PER_WEEK = 5;

type DayCompletion = { day_id: number; week_number: number; completed_at: string };

export function useStars() {
  const { user } = useAuth();
  const [stars, setStars] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setStars(0);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("star_awards")
      .select("amount")
      .eq("user_id", user.id);
    setStars((data ?? []).reduce((s, r) => s + (r.amount ?? 0), 0));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { stars, loading, refresh };
}

export function useDayCompletions() {
  const { user } = useAuth();
  const [rows, setRows] = useState<DayCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("day_completions")
      .select("day_id, week_number, completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: true });
    setRows((data as DayCompletion[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const days = rows.map((r) => r.day_id);
  const weeksCompleted = Math.floor(days.length / DAYS_PER_WEEK);
  const percent = Math.round((days.length / TOTAL_DAYS) * 100);
  const streak = computeStreak(rows.map((r) => r.completed_at));

  return { rows, days, weeksCompleted, percent, streak, loading, refresh };
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
  if (dates.length === 0) return 0;
  const uniq = Array.from(
    new Set(dates.map((d) => localDayKey(new Date(d)))),
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
