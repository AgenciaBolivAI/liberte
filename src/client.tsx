import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";

// Custom client entry (auto-detected by the TanStack Start plugin — unlike
// src/server.ts, which is explicitly configured in vite.config.ts, the client
// entry is picked up purely by its src/client.tsx location). Body mirrors the
// plugin's default entry, plus the stale-chunk recovery below.

// STALE-CHUNK RECOVERY: every deploy renames the hashed /assets chunks, so a
// tab opened before the deploy 404s when it lazy-loads a route → the student
// sees the error boundary mid-lesson ("Cette page n'a pas pu se charger") and
// reports "lost progress" / "can't open the challenge". Vite dispatches
// `vite:preloadError` for the failed dynamic import itself in production
// builds (verified in the installed Vite: the preload helper wraps the route
// import), so one hard reload picks up the new HTML + chunk names invisibly.
// Guard: at most one auto-reload per minute (sessionStorage), so a genuinely
// broken deploy degrades to the error boundary instead of a reload loop.
// NOTE: do NOT call e.preventDefault() — that would make the failed import
// resolve as undefined and crash the router in a stranger way.
window.addEventListener("vite:preloadError", (e) => {
  const KEY = "liberte-chunk-reload-at";
  let last = 0;
  try {
    last = Number(sessionStorage.getItem(KEY) ?? 0);
  } catch {
    /* storage unavailable (rare in-app browsers) — still reload once */
  }
  console.error("[chunk] preload failed — reloading for the new build", (e as { payload?: unknown }).payload);
  if (Date.now() - last < 60_000) return; // let the error boundary show instead of looping
  try {
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
  window.location.reload();
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
  );
});
