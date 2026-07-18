// Admins bypass the progressive locks so the teacher can review any lesson.
// That bypass is invisible by default, which makes locking look broken when an
// admin tests the app. This exposes it and adds two preview modes:
//
//   teacher  — default: everything unlocked (reviewing content)
//   student  — locks active, using the admin's own progress
//   as-user  — locks active, using a specific student's real progress
//
// "as-user" is strictly READ-ONLY: the app never writes while impersonating.
//
// State lives in a module-level store (not per-hook useState) so the banner and
// the page it controls stay in sync — same-tab localStorage writes emit no
// event, so component-local state would silently diverge.

import { useCallback, useSyncExternalStore } from "react";
import { useAuth } from "@/lib/auth-context";

const MODE_KEY = "liberte:preview-mode";
const USER_KEY = "liberte:preview-user";
const NAME_KEY = "liberte:preview-name";

export type PreviewMode = "teacher" | "student" | "as-user";
type PreviewState = { mode: PreviewMode; userId: string | null; name: string | null };

const DEFAULT: PreviewState = { mode: "teacher", userId: null, name: null };

function readStored(): PreviewState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const m = window.localStorage.getItem(MODE_KEY);
    const mode: PreviewMode = m === "student" || m === "as-user" ? m : "teacher";
    return {
      mode,
      userId: mode === "as-user" ? window.localStorage.getItem(USER_KEY) : null,
      name: mode === "as-user" ? window.localStorage.getItem(NAME_KEY) : null,
    };
  } catch {
    return DEFAULT;
  }
}

let state: PreviewState = DEFAULT;
let initialized = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  state = readStored();
}

function subscribe(listener: () => void) {
  ensureInit();
  listeners.add(listener);
  // Keep other tabs in sync too.
  const onStorage = (e: StorageEvent) => {
    if (e.key === MODE_KEY || e.key === USER_KEY || e.key === NAME_KEY) {
      state = readStored();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): PreviewState {
  ensureInit();
  return state;
}
// SSR always renders the default (teacher) — hydration corrects it immediately.
const getServerSnapshot = (): PreviewState => DEFAULT;

function persist(next: PreviewState) {
  state = next;
  try {
    window.localStorage.setItem(MODE_KEY, next.mode);
    if (next.mode === "as-user" && next.userId) {
      window.localStorage.setItem(USER_KEY, next.userId);
      window.localStorage.setItem(NAME_KEY, next.name ?? "");
    } else {
      window.localStorage.removeItem(USER_KEY);
      window.localStorage.removeItem(NAME_KEY);
    }
  } catch {
    /* private mode — in-memory only */
  }
  emit();
}

export function useAdminPreview() {
  const { isAdmin } = useAuth();
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setMode = useCallback((mode: PreviewMode) => {
    persist(mode === "as-user" ? { ...state, mode } : { mode, userId: null, name: null });
  }, []);

  const viewAsStudent = useCallback((userId: string, name: string) => {
    persist({ mode: "as-user", userId, name });
  }, []);

  const impersonating = isAdmin && snap.mode === "as-user" && Boolean(snap.userId);

  return {
    isAdmin,
    mode: isAdmin ? snap.mode : ("student" as PreviewMode),
    // Locks are bypassed only in teacher mode.
    bypassLocks: isAdmin && snap.mode === "teacher",
    viewAsUserId: impersonating ? snap.userId : null,
    viewAsName: impersonating ? snap.name : null,
    // Any write to progress must be suppressed while impersonating.
    readOnly: impersonating,
    setMode,
    viewAsStudent,
  };
}
