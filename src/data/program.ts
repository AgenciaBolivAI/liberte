export type WeekStatus = "completed" | "active" | "locked-time" | "vacation" | "locked-future";

export type Week = {
  monthIndex: number; // 1-6
  monthName: string;
  weekIndexInMonth: number; // 1-4
  globalIndex: number; // 1-24
  unlockDay: number; // days after enrollment
  status: WeekStatus;
  isCurrent: boolean; // the single "in progress" week (glow + palpitate)
  daysUntilUnlock: number; // 0 if already unlocked
};

export type RestWeek = {
  afterMonth: number; // 1..5
  unlockDay: number; // day it becomes "active"
  active: boolean;
  daysUntilUnlock: number;
};

const monthThemes = [
  { name: "J'OSE", subtitle: "Me atrevo" },
  { name: "JE COMPRENDS", subtitle: "Comprendo" },
  { name: "JE CRÉE", subtitle: "Creo" },
  { name: "JE PARLE", subtitle: "Hablo" },
  { name: "JE VOYAGE", subtitle: "Viajo" },
  { name: "JE SUIS LIBRE", subtitle: "Soy libre" },
];

/**
 * Compute the program state for a given enrollment date.
 * Unlock cadence: week 1 = day 0, then every 7 days. Between each month there's a
 * 7-day rest week. So month M week W unlocks at day ((M-1)*35 + (W-1)*7).
 * The rest week between month M and M+1 becomes active on day M*35 - 7 and stays
 * active for 7 days.
 *
 * @param enrolledAt ISO date string when the student joined.
 * @param overrides  Week numbers manually unlocked by a coach.
 * @param completed  Week numbers already fully completed by the student.
 */
export function getWeeks(
  enrolledAt?: string | Date | null,
  overrides: number[] = [],
  completed: number[] = [],
): { weeks: Week[]; vacations: RestWeek[]; monthThemes: typeof monthThemes; currentDay: number } {
  const base = enrolledAt ? new Date(enrolledAt).getTime() : Date.now();
  const now = Date.now();
  const currentDay = Math.max(0, Math.floor((now - base) / 86_400_000));
  const overrideSet = new Set(overrides);
  const completedSet = new Set(completed);

  const weeks: Week[] = [];
  let globalIdx = 0;
  for (let m = 1; m <= 6; m++) {
    for (let w = 1; w <= 4; w++) {
      globalIdx++;
      const unlockDay = (m - 1) * 35 + (w - 1) * 7;
      const isOverridden = overrideSet.has(globalIdx);
      const unlocked = isOverridden || currentDay >= unlockDay;
      let status: WeekStatus;
      if (completedSet.has(globalIdx)) status = "completed";
      else if (unlocked) {
        // "active" = the most recent unlocked non-completed week
        status = "active";
      } else status = "locked-time";
      weeks.push({
        monthIndex: m,
        monthName: monthThemes[m - 1].name,
        weekIndexInMonth: w,
        globalIndex: globalIdx,
        unlockDay,
        status,
        isCurrent: false,
        daysUntilUnlock: Math.max(0, unlockDay - currentDay),
      });
    }
  }

  // The "current" week is the FIRST unlocked week the student hasn't finished
  // — i.e. where they should be working now. Taking the highest-index one
  // instead pointed at week 24 for anyone with more weeks unlocked than
  // completed (a student who fell behind, or a coach/admin with everything
  // unlocked), showing "Mois 6 · EN COURS" to someone on week 1.
  const current =
    weeks.find((w) => w.status === "active") ??
    [...weeks].reverse().find((w) => w.status === "completed");
  if (current) current.isCurrent = true;

  const vacations: RestWeek[] = [];
  for (let m = 1; m <= 5; m++) {
    const unlockDay = m * 35 - 7; // day the rest week starts
    const active = currentDay >= unlockDay && currentDay < unlockDay + 7;
    vacations.push({
      afterMonth: m,
      unlockDay,
      active,
      daysUntilUnlock: Math.max(0, unlockDay - currentDay),
    });
  }

  return { weeks, vacations, monthThemes, currentDay };
}

export const dayLabels = Array.from({ length: 40 }, (_, i) => `Día ${i + 1}`);

/**
 * Group tutor lesson days into `<optgroup>`-friendly buckets for the month→day
 * scene picker. The program is 5 days/week, 4 weeks/month, so a day maps to
 * `week = ceil(day/5)`, `monthIndex = ceil(week/4)`. Each bucket is labeled with
 * its month theme and the week within that month, e.g. "Mes 1 · J'OSE — Semaine 1".
 * With only weeks 1-2 of content today this yields two groups under month 1, and
 * it generalizes automatically as more days are added.
 */
export function tutorDayGroups(maxDay = 40): { label: string; days: number[] }[] {
  const groups: { label: string; days: number[] }[] = [];
  const byKey = new Map<string, { label: string; days: number[] }>();
  for (let day = 1; day <= maxDay; day++) {
    const week = Math.ceil(day / 5);
    const monthIndex = Math.ceil(week / 4);
    const weekInMonth = ((week - 1) % 4) + 1;
    const theme = monthThemes[monthIndex - 1] ?? monthThemes[monthThemes.length - 1];
    const key = `${monthIndex}-${weekInMonth}`;
    let group = byKey.get(key);
    if (!group) {
      group = { label: `Mes ${monthIndex} · ${theme.name} — Semaine ${weekInMonth}`, days: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    group.days.push(day);
  }
  return groups;
}
