import { useEffect, useState } from "react";
import { Video, X, Radio } from "lucide-react";
import { KIND_STYLE, localTime, useCalendarEvents, type CalendarEvent } from "@/lib/calendarEvents";

// Thresholds (minutes before start) at which we show a notice.
const THRESHOLDS = [120, 30, 5];

function pickStage(minutesUntil: number, endMs: number, now: number) {
  if (now >= endMs) return null;
  if (minutesUntil <= 0) return { label: "En vivo", live: true };
  if (minutesUntil <= 5) return { label: "Tu clase inicia en 5 min", live: false };
  if (minutesUntil <= 30) return { label: "Tu clase inicia en 30 min", live: false };
  if (minutesUntil <= 120) return { label: "Tu clase inicia en 2 horas", live: false };
  return null;
}

function nextRelevantEvent(now: Date, events: CalendarEvent[]): CalendarEvent | null {
  const ms = now.getTime();
  const candidates = events
    .filter((e) => e.kind !== "repos")
    .filter((e) => {
      const start = new Date(e.startUtc).getTime();
      const end = start + e.durationMin * 60_000;
      return end > ms && start - ms <= THRESHOLDS[0] * 60_000;
    })
    .sort((a, b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime());
  return candidates[0] ?? null;
}

export function UpcomingClassPopup() {
  const [now, setNow] = useState(() => new Date());
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const { events } = useCalendarEvents();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const ev = nextRelevantEvent(now, events);
  if (!ev || dismissedId === ev.id) return null;

  const start = new Date(ev.startUtc).getTime();
  const end = start + ev.durationMin * 60_000;
  const minutesUntil = Math.ceil((start - now.getTime()) / 60_000);
  const stage = pickStage(minutesUntil, end, now.getTime());
  if (!stage) return null;

  const style = KIND_STYLE[ev.kind];

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-white/20 bg-card p-4 shadow-card">
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${style.bg}`}>
          {stage.live ? <Radio className="h-5 w-5 animate-pulse" /> : <Video className="h-5 w-5" />}
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: style.dot }}>
            {stage.live ? "En vivo ahora" : style.label}
          </p>
          <p className="font-display text-sm font-extrabold text-navy">{stage.label}</p>
          <p className="text-xs text-muted-foreground">{ev.title} · {localTime(ev.startUtc)}</p>
          {ev.zoomUrl && (
            <a
              href={ev.zoomUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-blue px-3 py-1.5 text-xs font-bold text-white"
            >
              <Video className="h-3.5 w-3.5" /> Entrar a Zoom
            </a>
          )}
        </div>
        <button onClick={() => setDismissedId(ev.id)} aria-label="Cerrar" className="rounded-full p-1 hover:bg-muted">
          <X className="h-4 w-4 text-navy" />
        </button>
      </div>
    </div>
  );
}
