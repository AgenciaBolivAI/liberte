/**
 * Password-recovery mode.
 *
 * Supabase REWRITES the redirect on recovery links. We ask for
 * `<origin>/reset-password`; the link that actually reaches the student points
 * at the project's Site URL instead, because /reset-password is not in the
 * project's Redirect-URL allowlist. Measured against the live project:
 *
 *   requested : https://…/reset-password
 *   delivered : https://libertebeta-alpha.vercel.app/#access_token=…&type=recovery
 *
 * `detectSessionInUrl` is on by default, so supabase-js swallows that hash on
 * load and the student is simply SIGNED IN on the platform. She never sees the
 * "choose a new password" form, so her password is never actually changed —
 * which is why the next login failed again and she had to repeat the whole
 * reset dance every single time. Reported verbatim by the client: «te hace
 * entrar "directo" a la plataforma, no permite se ponga una nueva contraseña …
 * siempre hay que hacer el mismo proceso para poder entrar».
 *
 * The allowlist can only be changed from the Supabase dashboard, so the app
 * has to cope on its own: detect the recovery landing wherever it happens and
 * take her to the form. TWO independent detectors, because supabase-js eats
 * the hash the moment the client is constructed and we may not win that race:
 *
 *   1. `recoveryFromUrl()` — read the URL before anything touches supabase.
 *   2. the PASSWORD_RECOVERY auth event — fires even once the hash is gone.
 *
 * Both set the same sessionStorage flag, so whichever wins, the flag is set.
 * sessionStorage (not a module variable) because the landing may navigate
 * before React has mounted, and (not localStorage) because the flag must die
 * with the tab — a stale flag would trap her on the form forever.
 */

export const RECOVERY_KEY = "liberte:password-recovery";

/**
 * Does this URL carry a Supabase password-recovery token?
 *
 * Checks the fragment AND the query string: the implicit flow delivers
 * `#access_token=…&type=recovery` (what this project actually sends today) and
 * the PKCE flow delivers `?code=…&type=recovery`. Accepting both means a
 * future flip of the project's flow can't silently resurrect this bug.
 */
export function recoveryFromUrl(hash: string, search = ""): boolean {
  for (const raw of [hash, search]) {
    if (!raw) continue;
    const params = new URLSearchParams(raw.replace(/^[#?]/, ""));
    if (params.get("type") === "recovery") return true;
  }
  return false;
}

/** Storage helpers — every access guarded: in-app browsers can throw here. */
export function markRecovery(): void {
  try {
    sessionStorage.setItem(RECOVERY_KEY, "1");
  } catch {
    /* storage unavailable — the PASSWORD_RECOVERY listener is the fallback */
  }
}

export function isRecovering(): boolean {
  try {
    return sessionStorage.getItem(RECOVERY_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearRecovery(): void {
  try {
    sessionStorage.removeItem(RECOVERY_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Run this BEFORE anything touches the supabase client (it is called from
 * src/client.tsx, above hydration). Reading `window.location` here is the only
 * chance to see the token: supabase-js strips the hash on construction.
 */
export function captureRecoveryFromUrl(): void {
  if (typeof window === "undefined") return;
  if (recoveryFromUrl(window.location.hash, window.location.search)) markRecovery();
}
