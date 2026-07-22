import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Clock, Moon, Pencil, Plus, Trash2, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KIND_STYLE, localDateParts, localTime, reposDays, type CalendarEvent } from "@/lib/calendarEvents";
import { useIsStaff } from "@/lib/use-staff";
import { CalendarEventEditor } from "@/components/CalendarEventEditor";
import { supabase } from "@/integrations/supabase/client";

/**
 * The interactive month calendar, in one self-contained white card so it drops
 * into any page (the Calendar tab AND the coach panel) with identical behaviour:
 * students tap an event to see details; staff tap a day to open its agenda
 * (all its events + edit/delete each + "add"), so a day can hold many classes.
 * Takes `events` + `refresh` from the host's useCalendarEvents so the host's
 * other views (e.g. "Próximos eventos") stay in sync after an edit.
 */
export function CalendarBoard({ events, refresh }: { events: CalendarEvent[]; refresh: () => Promise<void> }) {
  const isStaff = useIsStaff();
  const [open, setOpen] = useState<CalendarEvent | null>(null);
  const [dayPanel, setDayPanel] = useState<{ year: number; month: number; day: number } | null>(null);
  const [editor, setEditor] = useState<
    | { mode: "create"; presetDateISO: string }
    | { mode: "edit"; event: CalendarEvent }
    | null
  >(null);
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const pad2 = (n: number) => String(n).padStart(2, "0");

  const onEventClick = (ev: CalendarEvent) => {
    if (!isStaff) { setOpen(ev); return; }
    const d = new Date(ev.startUtc);
    setDayPanel({ year: d.getFullYear(), month: d.getMonth(), day: d.getDate() });
  };
  async function deleteEvent(ev: CalendarEvent) {
    if (!window.confirm(`¿Eliminar «${ev.title}»?`)) return;
    await supabase.from("calendar_events").delete().eq("id", ev.id);
    await refresh();
  }

  const monthName = new Date(view.year, view.month, 1).toLocaleString("es-ES", { month: "long", year: "numeric" });
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const firstDow = (new Date(view.year, view.month, 1).getDay() + 6) % 7;
  const changeMonth = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  const pointEvents = events.filter((e) => e.kind !== "repos").map((e) => ({ ev: e, ...localDateParts(e.startUtc) }));
  const reposByDay = new Map<string, CalendarEvent>();
  events.filter((e) => e.kind === "repos").forEach((e) => {
    reposDays(e).forEach((k) => reposByDay.set(k, e));
  });

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="font-display text-lg font-extrabold text-navy first-letter:uppercase sm:text-xl">📅 {monthName}</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => changeMonth(-1)} aria-label="Mes anterior" className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-soft hover:bg-muted">
            <ChevronLeft className="h-5 w-5 text-navy" />
          </button>
          <button onClick={() => changeMonth(1)} aria-label="Mes siguiente" className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-soft hover:bg-muted">
            <ChevronRight className="h-5 w-5 text-navy" />
          </button>
        </div>
      </div>

      {isStaff && (
        <p className="flex items-center gap-2 border-b border-border bg-blue/5 px-4 py-2 text-xs font-semibold text-navy">
          <Plus className="h-3.5 w-3.5 text-blue" /> Toca un día para ver, añadir o editar sus clases.
        </p>
      )}

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
          const dayEvents = pointEvents.filter((p) => p.year === view.year && p.month === view.month && p.day === day);
          const reposEv = reposByDay.get(`${view.year}-${view.month}-${day}`);
          const isToday = day === today.getDate() && view.month === today.getMonth() && view.year === today.getFullYear();
          return (
            <div
              key={day}
              onClick={isStaff ? () => setDayPanel({ year: view.year, month: view.month, day }) : undefined}
              className={`group relative h-20 border-b border-r border-border p-1.5 sm:h-24 sm:p-2 ${isStaff ? "cursor-pointer transition hover:bg-blue/5" : ""}`}
            >
              <div className={`text-[11px] font-semibold sm:text-xs ${isToday ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue text-white" : "text-navy/70"}`}>
                {day}
              </div>
              {isStaff && (
                <span aria-hidden className="pointer-events-none absolute right-1 top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-blue text-white opacity-0 transition group-hover:flex group-hover:opacity-100">
                  <Plus className="h-3 w-3" />
                </span>
              )}
              <div className="mt-1 space-y-1">
                {reposEv && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEventClick(reposEv); }}
                    aria-label={reposEv.title}
                    className={`block w-full truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-semibold ${KIND_STYLE.repos.bg}`}
                  >
                    <span className="hidden sm:inline">{reposEv.title}</span>
                    <span className="sm:hidden">😴</span>
                  </button>
                )}
                <div className="flex flex-wrap sm:hidden">
                  {dayEvents.map((p) => {
                    const style = KIND_STYLE[p.ev.kind];
                    return (
                      <button
                        key={p.ev.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick(p.ev); }}
                        aria-label={`${style.label} ${localTime(p.ev.startUtc)}`}
                        className="grid h-7 w-7 place-items-center"
                      >
                        <span className={`block h-2.5 w-2.5 rounded-full ${style.bg}`} />
                      </button>
                    );
                  })}
                </div>
                <div className="hidden space-y-1 sm:block">
                  {dayEvents.map((p) => {
                    const style = KIND_STYLE[p.ev.kind];
                    return (
                      <button
                        key={p.ev.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick(p.ev); }}
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

      {/* Student read-only detail */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <div className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-card p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: KIND_STYLE[open.kind].dot }}>
                  {KIND_STYLE[open.kind].label}
                </p>
                <h3 className="font-display text-2xl font-extrabold text-navy">{open.title}</h3>
              </div>
              <button onClick={() => setOpen(null)} className="rounded-full p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
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

      {/* Staff day agenda: all events for the day + add */}
      {dayPanel && (() => {
        const key = `${dayPanel.year}-${dayPanel.month}-${dayPanel.day}`;
        const reposEv = reposByDay.get(key);
        const dayEvents = pointEvents
          .filter((p) => p.year === dayPanel.year && p.month === dayPanel.month && p.day === dayPanel.day)
          .map((p) => p.ev);
        const list = reposEv ? [reposEv, ...dayEvents] : dayEvents;
        const presetDateISO = `${dayPanel.year}-${pad2(dayPanel.month + 1)}-${pad2(dayPanel.day)}`;
        const labelDate = new Date(dayPanel.year, dayPanel.month, dayPanel.day);
        return (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm" onClick={() => setDayPanel(null)}>
            <div className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-card p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold tracking-widest text-blue uppercase">Clases del día</p>
                  <h3 className="font-display text-xl font-extrabold text-navy first-letter:uppercase">
                    {labelDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                  </h3>
                </div>
                <button onClick={() => setDayPanel(null)} aria-label="Cerrar" className="rounded-full p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
              </div>
              <ul className="mt-4 space-y-2">
                {list.length === 0 && (
                  <li className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                    No hay clases este día todavía.
                  </li>
                )}
                {list.map((ev) => {
                  const style = KIND_STYLE[ev.kind];
                  return (
                    <li key={ev.id} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: style.dot }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {style.label}{ev.kind !== "repos" && ` · ${localTime(ev.startUtc)}`}
                        </p>
                      </div>
                      <button onClick={() => setEditor({ mode: "edit", event: ev })} aria-label="Editar" className="rounded-full p-2 text-blue hover:bg-blue/10"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => void deleteEvent(ev)} aria-label="Eliminar" className="rounded-full p-2 text-red hover:bg-red/10"><Trash2 className="h-4 w-4" /></button>
                    </li>
                  );
                })}
              </ul>
              <Button onClick={() => setEditor({ mode: "create", presetDateISO })} className="mt-4 w-full gap-2 bg-gradient-blue font-bold text-white">
                <Plus className="h-4 w-4" /> Añadir una clase
              </Button>
            </div>
          </div>
        );
      })()}

      {editor && (
        <CalendarEventEditor
          init={editor}
          onClose={() => setEditor(null)}
          onSaved={async () => {
            await refresh();
            setEditor(null);
          }}
        />
      )}
    </div>
  );
}
