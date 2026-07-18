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
  { name: "JE VIS", subtitle: "Vivo" },
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

  // Mark the single "current" week = highest-index unlocked, non-completed.
  const current = [...weeks].reverse().find((w) => w.status === "active");
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

export const dayLabels = Array.from({ length: 20 }, (_, i) => `Día ${i + 1}`);
