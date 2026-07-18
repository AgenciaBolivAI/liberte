import { createFileRoute, Link } from "@tanstack/react-router";
import { TopNav } from "@/components/TopNav";
import parisBg from "@/assets/paris-map-bg.jpg";
import { useState } from "react";
import { Video, X, Clock, ChevronLeft, ChevronRight, BookOpen, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  KIND_STYLE,
  localTime,
  localDateParts,
  reposDays,
  useCalendarEvents,
  type CalendarEvent,
} from "@/lib/calendarEvents";

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "Calendario — Liberté" }] }),
  component: CalendarPage,
});

export default function CalendarPage() {
  const [open, setOpen] = useState<CalendarEvent | null>(null);
  const { events } = useCalendarEvents();
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const monthName = new Date(view.year, view.month, 1).toLocaleString("es-ES", {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const firstDow = (new Date(view.year, view.month, 1).getDay() + 6) % 7;

  const changeMonth = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  // Non-repos events assigned to their local calendar day
  const pointEvents = events.filter((e) => e.kind !== "repos").map((e) => ({
    ev: e,
    ...localDateParts(e.startUtc),
  }));

  // Repos events: expand to every local day they cover
  const reposByDay = new Map<string, CalendarEvent>();
  events.filter((e) => e.kind === "repos").forEach((e) => {
    reposDays(e).forEach((k) => reposByDay.set(k, e));
  });

  // Sidebar "Próximos eventos": upcoming from now, all kinds, limited
  const upcoming = [...events]
    .filter((e) => new Date(e.startUtc).getTime() + e.durationMin * 60_000 > today.getTime())
    .sort((a, b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime())
    .slice(0, 8);

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `linear-gradient(180deg, oklch(0.42 0.075 265 / 0.78) 0%, oklch(0.32 0.08 265 / 0.90) 100%), url(${parisBg})`,
      }}
    >
      <TopNav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-extrabold text-white first-letter:uppercase sm:text-4xl sm:text-navy">📅 {monthName}</h1>
            <p className="mt-1 text-xs text-white/85 sm:text-base sm:text-navy/70">Horarios mostrados en tu zona horaria local.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => changeMonth(-1)} aria-label="Mes anterior" className="grid h-10 w-10 place-items-center rounded-full bg-card shadow-soft hover:bg-muted">
              <ChevronLeft className="h-5 w-5 text-navy" />
            </button>
            <button onClick={() => changeMonth(1)} aria-label="Mes siguiente" className="grid h-10 w-10 place-items-center rounded-full bg-card shadow-soft hover:bg-muted">
              <ChevronRight className="h-5 w-5 text-navy" />
            </button>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-white/15 bg-card shadow-card">
          <div className="grid grid-cols-7 border-b border-border bg-ice text-center text-xs font-bold tracking-widest text-navy uppercase">
            {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
              <div key={d} className="py-3">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDow }, (_, i) => (
              <div key={`b${i}`} className="h-20 border-b border-r border-border bg-muted/30 sm:h-24" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dayEvents = pointEvents.filter(
                (p) => p.year === view.year && p.month === view.month && p.day === day,
              );
              const reposEv = reposByDay.get(`${view.year}-${view.month}-${day}`);
              const isToday =
                day === today.getDate() &&
                view.month === today.getMonth() &&
                view.year === today.getFullYear();
              return (
                <div key={day} className="relative h-20 border-b border-r border-border p-1.5 sm:h-24 sm:p-2">
                  <div className={`text-[11px] font-semibold sm:text-xs ${isToday ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue text-white" : "text-navy/70"}`}>
                    {day}
                  </div>
                  <div className="mt-1 space-y-1">
                    {reposEv && (
                      <button
                        onClick={() => setOpen(reposEv)}
                        aria-label={reposEv.title}
                        className={`block w-full truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-semibold ${KIND_STYLE.repos.bg}`}
                      >
                        <span className="hidden sm:inline">{reposEv.title}</span>
                        <span className="sm:hidden">😴</span>
                      </button>
                    )}
                    {/* Mobile: dots */}
                    <div className="flex flex-wrap gap-1 sm:hidden">
                      {dayEvents.map((p) => {
                        const style = KIND_STYLE[p.ev.kind];
                        return (
                          <button
                            key={p.ev.id}
                            onClick={() => setOpen(p.ev)}
                            aria-label={`${style.label} ${localTime(p.ev.startUtc)}`}
                            className={`h-2.5 w-2.5 rounded-full ${style.bg}`}
                          />
                        );
                      })}
                    </div>
                    {/* Desktop: labels */}
                    <div className="hidden space-y-1 sm:block">
                      {dayEvents.map((p) => {
                        const style = KIND_STYLE[p.ev.kind];
                        return (
                          <button
                            key={p.ev.id}
                            onClick={() => setOpen(p.ev)}
                            className={`block w-full truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-semibold ${style.bg}`}
                          >
                            {style.label} · {localTime(p.ev.startUtc)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-3">
          <h2 className="font-display text-xl font-extrabold text-white">Próximos eventos</h2>
          {upcoming.map((e) => {
            const style = KIND_STYLE[e.kind];
            const isRepos = e.kind === "repos";
            return (
              <button
                key={e.id}
                onClick={() => setOpen(e)}
                className="flex items-center gap-4 rounded-2xl border border-white/15 bg-card p-4 text-left shadow-soft transition hover:translate-y-[-1px]"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${style.bg}`}>
                  {isRepos ? <Moon className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-display font-bold text-navy">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.startUtc).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                    {!isRepos && ` · ${localTime(e.startUtc)}`}
                  </p>
                </div>
                <span className="hidden text-xs font-semibold tracking-wider uppercase sm:inline" style={{ color: style.dot }}>
                  {style.label}
                </span>
              </button>
            );
          })}
        </div>
      </main>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: KIND_STYLE[open.kind].dot }}>
                  {KIND_STYLE[open.kind].label}
                </p>
                <h3 className="font-display text-2xl font-extrabold text-navy">{open.title}</h3>
              </div>
              <button onClick={() => setOpen(null)} className="rounded-full p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            {open.kind !== "repos" && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {new Date(open.startUtc).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {localTime(open.startUtc)}
                <span className="text-xs">(tu hora local)</span>
              </div>
            )}
            {open.desc && <p className="mt-3 text-navy">{open.desc}</p>}
            {open.referenceTimes && (
              <div className="mt-3 rounded-xl bg-ice p-3 text-sm text-navy">
                <p className="mb-1 font-semibold">Horarios de referencia</p>
                <ul className="space-y-1">
                  {open.referenceTimes.map((r, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span>{r.flag} {r.label}</span>
                      <span className="tabular-nums font-semibold">{r.time}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {open.zoomId && (
              <div className="mt-3 rounded-xl bg-ice p-3 text-sm text-navy">
                <p className="font-semibold">ID de reunión</p>
                <p className="tabular-nums">{open.zoomId}</p>
              </div>
            )}
            {open.zoomUrl && (
              <Button asChild className="mt-4 w-full bg-gradient-blue text-white">
                <a href={open.zoomUrl} target="_blank" rel="noreferrer">
                  <Video className="mr-2 h-4 w-4" /> Entrar a clase (Zoom)
                </a>
              </Button>
            )}
            {open.materialTo && (
              <Button asChild variant="outline" className="mt-2 w-full border-navy text-navy hover:bg-ice">
                <Link to={open.materialTo}>
                  <BookOpen className="mr-2 h-4 w-4" /> Material de la clase
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
