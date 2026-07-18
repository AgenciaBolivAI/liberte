import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Calendar, GraduationCap, Home, LogOut, MessageCircle, Radio, Sparkles, Star, User } from "lucide-react";
import logo from "@/assets/liberte-logo.png.asset.json";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useStars } from "@/lib/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const HOME_PATH = "/liberte-plataforma-834798234728482934254-student";

const nav = [
  { to: HOME_PATH, label: "Accueil", icon: Home },
  { to: "/calendar", label: "Calendrier", icon: Calendar },
  { to: "/clasesenvivo", label: "En direct", icon: Radio },
  { to: "/conversation", label: "Tutor IA", icon: MessageCircle },
  { to: "/progress", label: "Mon progrès", icon: Sparkles },
  { to: "/profile", label: "Mon profil", icon: User },
];


export function TopNav({ stars: starsProp }: { stars?: number } = {}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { avatarUrl, fullName, user, isAdmin } = useAuth();
  const { stars: liveStars } = useStars();
  const stars = starsProp ?? liveStars;
  const initial = (fullName || user?.email || "?").charAt(0).toUpperCase();

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      toast.success("Sesión cerrada");
      navigate({ to: "/liberte-log-in-983749824923465723", replace: true });
    } catch {
      toast.error("No se pudo cerrar la sesión");
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy/90 backdrop-blur-xl" style={{ backgroundColor: "color-mix(in oklab, var(--navy) 92%, transparent)" }}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to={HOME_PATH} className="flex items-center gap-3">
          <img src={logo.url} alt="Liberté Instituto de Francés" className="h-10 w-auto brightness-0 invert" />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => {
            const active = path === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-blue text-white shadow-soft"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white">
            <Star className="h-4 w-4 fill-gold text-gold" />
            <span>{stars}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Menú de cuenta"
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/25 bg-gradient-blue text-sm font-bold text-white shadow-soft focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initial}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">
                {fullName || user?.email || "Mi cuenta"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                <User className="mr-2 h-4 w-4" />
                Mi perfil
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate({ to: "/liberte-profesor-panel-9382745-admin" })}>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Panel del profesor
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Mobile nav */}
      <nav className="flex items-center justify-around border-t border-white/10 px-2 py-2 md:hidden">
        {nav.map((n) => {
          const active = path === n.to;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[11px] ${
                active ? "text-blue" : "text-white/70"
              }`}
            >
              <n.icon className="h-5 w-5" />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
