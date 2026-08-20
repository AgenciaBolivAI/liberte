import { createFileRoute, Link, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import parisBg from "@/assets/paris-map-bg.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/liberte-profesor-panel-9382745-admin")({
  head: () => ({ meta: [{ title: "Panel Profesor — Liberté" }] }),
  component: TeacherPanelLayout,
});

const TABS = [
  { to: "/liberte-profesor-panel-9382745-admin" as const, label: "Analítica", exact: true },
  { to: "/liberte-profesor-panel-9382745-admin/alumnos" as const, label: "Alumnos" },
  { to: "/liberte-profesor-panel-9382745-admin/interesados" as const, label: "Interesados" },
  { to: "/liberte-profesor-panel-9382745-admin/contenido" as const, label: "Contenido" },
  { to: "/liberte-profesor-panel-9382745-admin/accesos" as const, label: "Accesos" },
  { to: "/liberte-profesor-panel-9382745-admin/equipo" as const, label: "Equipo" },
];

function TeacherPanelLayout() {
  const { loading: authLoading, user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      if (!user) {
        setChecking(false);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
      setChecking(false);
    })();
  }, [authLoading, user]);

  if (authLoading || checking) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue" />
      </div>
    );
  }

  if (!user) return <Navigate to="/liberte-log-in-983749824923465723" />;

  if (!isAdmin) {
    return (
      <div
        className="relative min-h-screen bg-cover bg-center md:bg-fixed"
        style={{
          backgroundImage: `linear-gradient(180deg, oklch(0.42 0.075 265 / 0.78) 0%, oklch(0.32 0.08 265 / 0.90) 100%), url(${parisBg})`,
        }}
      >
        <TopNav />
        <main className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-card">
            <h1 className="font-display text-2xl font-extrabold text-navy">Acceso restringido</h1>
            <p className="mt-2 text-muted-foreground">Esta página solo está disponible para el equipo de Liberté.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen bg-cover bg-center md:bg-fixed"
      style={{
        backgroundImage: `linear-gradient(180deg, oklch(0.42 0.075 265 / 0.78) 0%, oklch(0.32 0.08 265 / 0.90) 100%), url(${parisBg})`,
      }}
    >
      <TopNav />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-white">Panel del profesor</h1>
            <p className="text-white/80">Visión general de todos los alumnos inscritos.</p>
          </div>
        </div>

        <TabNav />

        <Outlet />
      </main>
    </div>
  );
}

function TabNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {TABS.map((t) => {
        const isActive = t.exact
          ? pathname.replace(/\/$/, "") === t.to
          : pathname.startsWith(t.to);
        return (
          <Link
            key={t.to}
            to={t.to}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              isActive
                ? "bg-white text-navy shadow-soft"
                : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
