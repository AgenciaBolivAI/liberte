import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PendingApproval } from "@/components/PendingApproval";
import { isRecovering } from "@/lib/recovery";

const PUBLIC_PATHS = [
  "/",
  "/liberte-log-in-983749824923465723",
  "/liberte-frances-98273425-plataforma-834823",
  "/reset-password",
];

const RESET_PATH = "/reset-password";

export function AuthGate({ children }: { children: ReactNode }) {
  const { loading, user, approved , denied } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  // Did this session ever have a signed-in user? If so, a momentary `!user` is
  // treated as a transient auth blip rather than a reason to tear the app down.
  const hadUserRef = useRef(false);
  if (user) hadUserRef.current = true;

  // A password-recovery link does NOT land on /reset-password: Supabase drops
  // our redirect and drops her on the site root, already signed in, with the
  // token in the hash. Without this she simply lands INSIDE the platform, is
  // never offered the new-password form, and her password stays unchanged —
  // so the next login fails and she has to request another link, forever.
  // Re-read on every auth/route change: the flag is set either before
  // hydration (src/client.tsx) or by the PASSWORD_RECOVERY event, and we do
  // not control which of the two wins.
  // `recovering` exists only to TRIGGER re-renders; the sessionStorage flag is
  // the single source of truth and is re-read at every decision point. Trusting
  // the state variable here is a real trap: when the reset page releases
  // recovery (dead link) and the visitor clicks "Aller à la connexion", both
  // effects below re-run on the same commit with the OLD `recovering === true`,
  // and she is bounced straight back to the form she is trying to leave. Caught
  // by the "dead recovery link does not trap her" e2e.
  const [recovering, setRecovering] = useState(false);
  useEffect(() => {
    setRecovering(isRecovering());
  }, [loading, user, pathname]);

  useEffect(() => {
    if (!isRecovering()) return;
    if (pathname !== RESET_PATH) {
      navigate({ to: RESET_PATH, replace: true });
    }
  }, [recovering, pathname, navigate]);

  useEffect(() => {
    if (loading) return;
    // Never bounce a recovering visitor to the login page: she HAS a session,
    // she just hasn't chosen her password yet.
    if (recovering) return;
    if (!user && !isPublic) {
      navigate({ to: "/liberte-log-in-983749824923465723", replace: true });
    }
  }, [loading, user, isPublic, navigate, recovering]);

  // TRIED AND REVERTED: skipping this spinner for public paths (`loading &&
  // !isPublic`) so the landing paints before auth resolves. It broke hydration
  // on the login page — the form was interactive before React attached, a click
  // did a native submit, and sign-in died silently. Worth revisiting only with
  // that hydration path fixed first; the landing was made fast by other means.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1b3a]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // Recovering, but not on the form yet → hold a spinner rather than flash the
  // platform she is about to be pulled off. This is the frame the client saw as
  // "te hace entrar directo a la plataforma".
  // `recovering &&` first so this is false on the server and on the first
  // client render (no hydration mismatch); isRecovering() then makes sure a
  // just-released flag stops holding the spinner up.
  if (recovering && isRecovering() && pathname !== RESET_PATH) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1b3a]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // Never signed in on this page load → show the spinner while we redirect.
  // But if the student WAS signed in (e.g. a token-refresh hiccup on tab
  // return), keep the page mounted: unmounting here destroyed the whole lesson
  // subtree and everything the student had done in it. A genuine sign-out still
  // navigates away via the effect above, which unmounts the route normally.
  if (!user && !isPublic && !hadUserRef.current) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1b3a]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // Logged in but not yet approved by an admin: content stays locked.
  if (user && !isPublic && !approved) {
    return <PendingApproval denied={denied} />;
  }

  return <>{children}</>;
}
