import { toast } from "sonner";

/**
 * Run a Supabase write and surface failures.
 *
 * WHY THIS EXISTS — the bug it prevents:
 * supabase-js v2 query builders are THENABLES, not Promises: the HTTP request is
 * only issued inside `.then()`. So `void supabase.from(t).upsert(...)` builds a
 * query and **never sends it** — no row, no error, no console warning. That single
 * pattern silently lost 100% of lesson progress (`day_state` had 0 rows in
 * production for the entire life of the app) and every weekly-test autosave.
 *
 * Route ALL persistence through here so a write is (a) actually executed, and
 * (b) never fails invisibly. Never write `void supabase...` again.
 */

/** Any awaited supabase query resolves to an object carrying a nullable error. */
type WriteResult = { error: { message: string } | null };

// Failed autosaves can repeat every few hundred ms; don't machine-gun the user.
const TOAST_COOLDOWN_MS = 15_000;
let lastToastAt = 0;

function notify(message: string) {
  const now = Date.now();
  if (now - lastToastAt < TOAST_COOLDOWN_MS) return;
  lastToastAt = now;
  toast.error(message);
}

/**
 * Execute a write, log any failure, and (optionally) tell the user.
 * Returns true only when the write genuinely succeeded.
 *
 * @param label   short tag for logs, e.g. "day_state".
 * @param run     thunk building the query — awaited here, so it always executes.
 * @param opts.silent  don't toast (for best-effort cleanup writes).
 * @param opts.message user-facing text; defaults to a progress-save message.
 */
export async function persist(
  label: string,
  run: () => PromiseLike<WriteResult>,
  opts: { silent?: boolean; message?: string } = {},
): Promise<boolean> {
  try {
    const { error } = await run();
    if (error) {
      console.error(`[persist:${label}]`, error.message);
      if (!opts.silent) notify(opts.message ?? "Impossible d’enregistrer ta progression. Vérifie ta connexion.");
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[persist:${label}]`, e);
    if (!opts.silent) notify(opts.message ?? "Impossible d’enregistrer ta progression. Vérifie ta connexion.");
    return false;
  }
}
