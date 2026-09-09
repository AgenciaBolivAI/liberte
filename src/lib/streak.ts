/**
 * Daily-streak arithmetic. Pure, dependency-free ON PURPOSE: it used to live
 * inside progress.ts, which pulls in the TanStack server entry through
 * admin.functions.ts and therefore cannot be bundled for a plain-node test. The
 * bug below shipped precisely because nothing could execute this code.
 */

/** Local calendar day (YYYY-MM-DD) for an instant. */
export function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Parse a local day key back to LOCAL midnight.
 *
 * `new Date("2026-09-08")` is UTC midnight — a DIFFERENT instant from the local
 * midnight `setHours(0,0,0,0)` produces. Mixing the two made the current streak
 * read 0 for every student WEST of UTC: in UTC-4 a lesson finished yesterday
 * measured 28h ago, 28/24 = 1.17 > 1, so "Série 0 jours · Commence
 * aujourd'hui !". Most of this school is in UTC-4/-5.
 */
export function fromDayKey(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

/**
 * Consecutive days ending today or yesterday. `dates` are ISO instants of every
 * completion (day_completions AND défi submissions — a défi-only day is real
 * work and must not break the chain).
 *
 * `now` is injectable so tests can pin a moment instead of racing midnight.
 */
export function computeStreak(dates: string[], now: Date = new Date()): number {
  const valid = dates.filter((d) => d && !Number.isNaN(new Date(d).getTime()));
  if (valid.length === 0) return 0;
  const uniq = Array.from(new Set(valid.map((d) => localDayKey(new Date(d))))).sort();

  let streak = 1;
  for (let i = 1; i < uniq.length; i++) {
    const gap = (fromDayKey(uniq[i]) - fromDayKey(uniq[i - 1])) / 86_400_000;
    streak = gap === 1 ? streak + 1 : 1;
  }

  // Not today or yesterday → the chain is broken.
  const last = fromDayKey(uniq[uniq.length - 1]);
  const today = fromDayKey(localDayKey(now));
  const diffDays = (today - last) / 86_400_000;
  return diffDays <= 1 ? streak : 0;
}
