import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/TopNav";
import parisBg from "@/assets/paris-map-bg.jpg";
import { Star, Flame, Trophy, Calendar } from "lucide-react";
import { useStars, useDayCompletions, TOTAL_DAYS, TOTAL_WEEKS } from "@/lib/progress";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Mi progreso — Liberté" }] }),
  component: ProgressPage,
});

function ProgressPage() {
  const { stars } = useStars();
  const { days, weeksCompleted, percent, streak } = useDayCompletions();

  const stats = [
    {
      icon: Star,
      label: "Estrellas",
      value: String(stars),
      sub: stars === 0 ? "Empieza a completar lecciones" : "¡Sigue así!",
    },
    {
      icon: Flame,
      label: "Racha",
      value: `${streak} día${streak === 1 ? "" : "s"}`,
      sub: streak === 0 ? "¡Empieza hoy!" : "Días consecutivos",
    },
    {
      icon: Calendar,
      label: "Días completados",
      value: `${days.length} / ${TOTAL_DAYS}`,
      sub: `Mes ${Math.min(6, Math.floor(days.length / 20) + 1)} · en curso`,
    },
    {
      icon: Trophy,
      label: "Semanas terminadas",
      value: `${weeksCompleted} / ${TOTAL_WEEKS}`,
      sub: weeksCompleted === 0 ? "En camino" : "¡Bravo !",
    },
  ];

  const rewards: Array<[string, string]> = [
    ["Completar el Défi de un día", "+2 ⭐"],
    ["Marcar el día como terminado", "+2 ⭐ bonus"],
    ["Completar una semana entera (5 días)", "= 20 ⭐ acumuladas"],
    ["Completar el défi de la semana (final)", "+3 ⭐"],
    ["Al final del mes se genera el ranking mensual con las estrellas", "🏆"],
  ];

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `linear-gradient(180deg, oklch(0.42 0.075 265 / 0.78) 0%, oklch(0.32 0.08 265 / 0.90) 100%), url(${parisBg})`,
      }}
    >
      <TopNav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl">⭐ Mi progreso</h1>
        <p className="mt-1 text-sm text-white/80 sm:text-base">Mira lo lejos que has llegado.</p>

        {/* Real progress bar */}
        <div className="mt-6 rounded-3xl border border-white/25 bg-white/10 p-5 text-white shadow-card backdrop-blur-2xl sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[10px] tracking-widest text-sky uppercase">Progrès global</p>
            <p className="font-display text-lg font-extrabold">{percent}%</p>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-gradient-to-r from-sky to-blue transition-all" style={{ width: `${Math.max(percent, 2)}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-white/70">
            {days.length} de {TOTAL_DAYS} días completados en tu viaje de 6 meses
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-3xl border border-white/15 bg-card p-4 shadow-soft sm:p-5">
              <s.icon className="h-6 w-6 text-blue" />
              <p className="mt-3 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase sm:text-xs">{s.label}</p>
              <p className="font-display text-2xl font-extrabold text-navy sm:text-3xl">{s.value}</p>
              <p className="text-[11px] text-muted-foreground sm:text-xs">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-white/15 bg-card p-5 shadow-soft sm:mt-8 sm:p-6">
          <h2 className="font-display text-lg font-extrabold text-navy sm:text-xl">Cómo ganas estrellas</h2>
          <p className="mt-1 text-xs text-muted-foreground">Se otorgan automáticamente al avanzar en la plataforma.</p>
          <div className="mt-4 grid gap-2">
            {rewards.map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-3 rounded-xl bg-ice px-3 py-2.5 sm:px-4">
                <span className="text-sm text-navy">{k}</span>
                <span className="shrink-0 font-display font-bold text-blue">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
