// Progressive unlock rules — pure functions so they can be unit-tested
// without a browser. Used by the day route, the tutor scene picker, and
// mirrored server-side in tutor.functions.ts.
//
// A "done day" means the student either marked the day complete
// (day_completions) or submitted its défi (defi_results).

export const LESSON_DAYS = 10;

/**
 * Launch setting: weeks 1-2 (days 1-10) are open to every student from day
 * one — no time gate, no coach grant, no "finish the previous day first".
 * Only these two weeks have content today, and the cohort was migrated
 * mid-programme, so gating them would lock existing students out of work
 * they had already reached.
 *
 * Lesson-by-lesson progression and the watch-the-video gate INSIDE each day
 * still apply. To re-enable day-by-day gating later, lower this to 0.
 */
export const OPEN_THROUGH_DAY = 10;

/**
 * Product decision (client request): within any day a student can reach, ALL
 * lessons are freely navigable and the video does NOT have to be watched to the
 * end to advance. Gating lives at the WEEK level (time-based, on the dashboard),
 * not lesson-by-lesson. These two flags make that explicit and reversible — set
 * them back to `true` to restore sequential lesson gating / the watch-the-video
 * gate. Turning them on also requires re-checking the sidebar lock rendering,
 * which historically only applied to the active day.
 */
export const SEQUENTIAL_LESSON_GATE = false;
export const REQUIRE_VIDEO_WATCHED = false;

/** An admin content-access override value. */
export type AccessValue = "open" | "locked";

/** A single override row, scoped either globally or to one student. Mirrors the
 *  `content_access` table; readers filter to (global + the current user). */
export type AccessOverride = {
  scope: "global" | "user";
  target_type: "day" | "week";
  target_id: number;
  access: AccessValue;
};

/** The week (1-based) that contains a lesson day — 5 days per week, matching
 *  DAYS_META and the dashboard's week→day mapping. */
export function weekOfDay(dayId: number): number {
  return Math.ceil(dayId / 5);
}

/**
 * The winning admin override for a day, from overrides already scoped to a
 * single student (global rows + that user's rows). Most specific wins:
 *   per-user day → per-user week → global day → global week.
 * Returns undefined when no admin set anything, so the default rules apply.
 */
export function effectiveOverride(
  dayId: number,
  rows: readonly AccessOverride[],
): AccessValue | undefined {
  const wk = weekOfDay(dayId);
  const at = (scope: "global" | "user", type: "day" | "week", id: number) =>
    rows.find((r) => r.scope === scope && r.target_type === type && r.target_id === id)?.access;
  return (
    at("user", "day", dayId) ??
    at("user", "week", wk) ??
    at("global", "day", dayId) ??
    at("global", "week", wk)
  );
}

/** Day N opens when day N-1 is done. Day 1 (and the first day of the
 *  viewed week, which is itself time-gated on the dashboard) is always open.
 *  An admin `override` (open/locked) takes precedence over EVERYTHING except a
 *  real admin viewer — including the launch open-window — so a locked day is
 *  genuinely locked even within weeks 1-2. */
export function isDayUnlocked(
  dayId: number,
  doneDays: ReadonlySet<number>,
  opts: { isAdmin?: boolean; firstDayOfWeek?: number; override?: AccessValue } = {},
): boolean {
  if (opts.isAdmin) return true;
  if (opts.override === "locked") return false;
  if (opts.override === "open") return true;
  if (dayId <= OPEN_THROUGH_DAY) return true;
  if (dayId <= 1) return true;
  if (opts.firstDayOfWeek !== undefined && dayId === opts.firstDayOfWeek) return true;
  if (doneDays.has(dayId)) return true;
  return doneDays.has(dayId - 1);
}

/** Lesson at index N in the day opens when lesson N-1 is completed — unless the
 *  whole day is in the launch open-window (`allOpen`), in which case every
 *  lesson is freely navigable, consistent with weeks 1-2 being fully open. */
export function isLessonUnlocked(
  index: number,
  doneLessons: Readonly<Record<string, boolean>>,
  order: readonly string[],
  opts: { isAdmin?: boolean; allOpen?: boolean } = {},
): boolean {
  if (opts.isAdmin || opts.allOpen) return true;
  if (index <= 0) return true;
  const prev = order[index - 1];
  return prev !== undefined && Boolean(doneLessons[prev]);
}

/** Tutor scenes are strictly sequential — no first-day-of-week exception,
 *  because the tutor has no week-level time gate to sit behind. */
export function isSceneUnlocked(
  dayId: number,
  doneDays: ReadonlySet<number>,
  opts: { isAdmin?: boolean; override?: AccessValue } = {},
): boolean {
  if (opts.isAdmin) return true;
  if (opts.override === "locked") return false;
  if (opts.override === "open") return true;
  if (dayId <= OPEN_THROUGH_DAY) return true;
  if (dayId <= 1) return true;
  return doneDays.has(dayId - 1);
}

/** Furthest scene the student has actually reached (first not-yet-done day). */
export function furthestUnlockedDay(doneDays: ReadonlySet<number>): number {
  let d = 1;
  while (d < LESSON_DAYS && doneDays.has(d)) d += 1;
  return d;
}
