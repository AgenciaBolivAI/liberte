import { useEffect, type ReactNode } from "react";
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
  const { loading, user, approved } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic) {
      navigate({ to: "/liberte-log-in-983749824923465723", replace: true });
    }
  }, [loading, user, isPublic, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1b3a]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user && !isPublic) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1b3a]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // Logged in but not yet approved by an admin: content stays locked.
  if (user && !isPublic && !approved) {
    return <PendingApproval />;
  }

  return <>{children}</>;
}
