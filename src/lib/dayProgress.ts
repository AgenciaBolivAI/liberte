/**
 * Pure decision logic for per-day lesson progress (hydrate ↔ autosave).
 *
 * This lives outside the React component so the dangerous interleavings can be
 * unit-tested deterministically (see scripts/test-all.mjs "day progress state
 * machine"). The rules encoded here are the ones that were violated in
 * production and cost students their progress:
 *
 *  1. A FAILED read must never count as "hydrated" — otherwise the autosave
 *     treats an empty screen as the truth and overwrites the saved row.
 *  2. Never downgrade: an empty local state must not overwrite a remote row we
 *     know (or don't yet know) to be non-empty.
 *  3. The hydration key must include the user AND the day, so a stale key from
 *     another day can't certify the current one.
 */

export type DoneMap = Record<string, boolean>;

/** Identity of a hydration pass. Stored in a ref once a read SUCCEEDS. */
export function dayStateKey(
  ownerId: string | undefined,
  dayId: string,
  hasSnapshot: boolean,
): string {
  return `${ownerId ?? "anon"}:${dayId}:${hasSnapshot ? "snap" : "nosnap"}`;
}

/** Has THIS user+day completed a successful hydration? The trailing ":" stops
 *  day "1" from matching day "10". */
export function isHydratedFor(
  hydratedKey: string,
  userId: string | undefined,
  dayId: string,
): boolean {
  if (!userId) return false;
  return hydratedKey.startsWith(`${userId}:${dayId}:`);
}

/** Remote row shape as stored in `day_state`. */
export type RemoteDayState = {
  done_lessons: string[] | null;
  current_lesson: string | null;
  stars: number | null;
} | null;

/** Turn a remote row into the component's `done` map. */
export function toDoneMap(doneLessons: readonly string[] | null | undefined): DoneMap {
  const map: DoneMap = {};
  for (const k of doneLessons ?? []) map[k] = true;
  return map;
}

/** Ordered list of completed lesson keys, for persisting. */
export function doneKeys(done: DoneMap): string[] {
  return Object.keys(done).filter((k) => done[k]);
}

/**
 * Should we write this state to the DB?
 *
 * `remoteDoneCount` is what the last SUCCESSFUL read saw (null = we never read
 * it successfully). Writing an empty state is only safe when we positively know
 * the remote row is also empty — otherwise a transient blank screen would erase
 * real progress.
 */
export function shouldPersistDay(args: {
  hydratedKey: string;
  userId: string | undefined;
  dayId: string;
  readOnly: boolean;
  localDoneCount: number;
  remoteDoneCount: number | null;
}): boolean {
  const { hydratedKey, userId, dayId, readOnly, localDoneCount, remoteDoneCount } = args;
  if (!userId || readOnly) return false;
  if (!isHydratedFor(hydratedKey, userId, dayId)) return false;
  // We must have positively READ this day at least once. After a successful
  // hydration this is always a number (0 for a brand-new day), so `null` here
  // means the in-memory state does not correspond to a read of THIS day — e.g.
  // a fast day A→B→A navigation, where the state was cleared for B while an old
  // certificate for A was still in place. Persisting then would write B's blank
  // state over A's saved row.
  if (remoteDoneCount === null) return false;
  // No-downgrade rule.
  if (localDoneCount === 0 && remoteDoneCount !== 0) return false;
  return true;
}

/**
 * Merge a successful read into local state. Local wins where it is AHEAD (the
 * student may have completed a lesson while the read was in flight), so a slow
 * response can never roll progress backwards.
 */
export function mergeHydrated(local: DoneMap, remote: RemoteDayState): DoneMap {
  const merged: DoneMap = { ...toDoneMap(remote?.done_lessons) };
  for (const k of doneKeys(local)) merged[k] = true;
  return merged;
}

/**
 * Which lesson should become active after a successful hydration?
 * Priority: an explicit cross-day click > the saved resume point.
 *
 * Returns NULL when there is nothing to restore, meaning "leave the student
 * where they are". Falling back to `order[0]` here is a bug: hydration resolves
 * asynchronously, so a student who already tapped lesson 2 would be yanked back
 * to "Gym cérébral" — and that clobbered position then got autosaved.
 */
export function resolveLesson(args: {
  pending: string | null;
  saved: string | null | undefined;
  order: readonly string[];
}): string | null {
  const { pending, saved, order } = args;
  if (pending && order.includes(pending)) return pending;
  if (saved && order.includes(saved)) return saved;
  return null;
}
