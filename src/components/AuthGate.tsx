import { useEffect, useRef, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PendingApproval } from "@/components/PendingApproval";

const PUBLIC_PATHS = [
  "/",
  "/liberte-log-in-983749824923465723",
  "/liberte-frances-98273425-plataforma-834823",
  "/reset-password",
];

export function AuthGate({ children }: { children: ReactNode }) {
  const { loading, user, approved , denied } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  // Did this session ever have a signed-in user? If so, a momentary `!user` is
  // treated as a transient auth blip rather than a reason to tear the app down.
  const hadUserRef = useRef(false);
  if (user) hadUserRef.current = true;

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic) {
      navigate({ to: "/liberte-log-in-983749824923465723", replace: true });
    }
  }, [loading, user, isPublic, navigate]);

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
