// Shared calendar events. Times are stored in UTC ISO strings so that every
// viewer sees the class at their local wall-clock time.
//
// The schedule now lives in the `calendar_events` table (managed from the
// teacher panel); the hardcoded list below is the fallback while the table
// is empty or unreachable.

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type EventKind = "europa" | "latam" | "taller" | "repos";

export type CalendarEvent = {
  id: string;
  kind: EventKind;
  title: string;
  // ISO string in UTC. For all-week "repos" events we use start-of-week UTC.
  startUtc: string;
  // Duration in minutes. Repos events span 7 days.
  durationMin: number;
  desc?: string;
  zoomUrl?: string;
  zoomId?: string;
  materialTo?: string;
  // Reference time zones to display in the event modal.
  referenceTimes?: { flag: string; label: string; time: string }[];
};

// Helpers -------------------------------------------------------------------

// Build a UTC date from wall-clock in a given fixed offset (hours from UTC).
// Example: parisAt(2026, 6, 13, 21) — 21:00 Paris (CEST = UTC+2) => 19:00 UTC.
function utcFromOffset(y: number, m: number, d: number, h: number, min: number, offsetHours: number) {
  return new Date(Date.UTC(y, m, d, h - offsetHours, min)).toISOString();
}

// Paris in July/August 2026 is CEST (UTC+2)
const parisAt = (y: number, m: number, d: number, h = 21, min = 0) => utcFromOffset(y, m, d, h, min, 2);
// Bolivia is UTC-4 year round.
const boliviaAt = (y: number, m: number, d: number, h: number, min = 0) => utcFromOffset(y, m, d, h, min, -4);

// Clase EUROPA — Mon/Wed × 4 weeks, 21:00 Paris ---------------------------
const EUROPA_DATES: [number, number, number][] = [
  [2026, 6, 13], [2026, 6, 15],
  [2026, 6, 20], [2026, 6, 22],
  [2026, 6, 27], [2026, 6, 29],
  [2026, 7, 3],  [2026, 7, 5],
];

const EUROPA_REF = [
  { flag: "🇫🇷", label: "France", time: "21:00" },
  { flag: "🇨🇦/🇧🇴", label: "Québec / Bolivia", time: "15:00" },
  { flag: "🇨🇴", label: "Colombia", time: "14:00" },
];

const europaEvents: CalendarEvent[] = EUROPA_DATES.map(([y, m, d], i) => ({
  id: `europa-${i + 1}`,
  kind: "europa",
  title: `Clase EUROPA En vivo #${i + 1}`,
  startUtc: parisAt(y, m, d, 21),
  durationMin: 90,
  desc: `Sesión ${i + 1} de 8. Nos vemos en Zoom para practicar en vivo.`,
  zoomUrl: "https://us06web.zoom.us/j/86574307208",
  zoomId: "865 7430 7208",
  materialTo: "/clasesenvivo",
  referenceTimes: EUROPA_REF,
}));

// Clase LATAM — Tue/Thu × 4 weeks, 21:00 Bolivia --------------------------
// Different Zoom link for Tuesdays vs Thursdays.
const LATAM_TUE_ZOOM = { url: "https://us06web.zoom.us/j/89051918151", id: "890 5191 8151" };
const LATAM_THU_ZOOM = { url: "https://us06web.zoom.us/j/88268165745", id: "882 6816 5745" };

const LATAM_DATES: { y: number; m: number; d: number; dow: "tue" | "thu" }[] = [
  { y: 2026, m: 6, d: 14, dow: "tue" }, { y: 2026, m: 6, d: 16, dow: "thu" },
  { y: 2026, m: 6, d: 21, dow: "tue" }, { y: 2026, m: 6, d: 23, dow: "thu" },
  { y: 2026, m: 6, d: 28, dow: "tue" }, { y: 2026, m: 6, d: 30, dow: "thu" },
  { y: 2026, m: 7, d: 4,  dow: "tue" }, { y: 2026, m: 7, d: 6,  dow: "thu" },
];

const LATAM_REF = [
  { flag: "🇨🇦/🇧🇴", label: "Québec / Bolivia", time: "21:00" },
  { flag: "🇨🇴", label: "Colombia", time: "20:00" },
];

const latamEvents: CalendarEvent[] = LATAM_DATES.map((e, i) => {
  const zoom = e.dow === "tue" ? LATAM_TUE_ZOOM : LATAM_THU_ZOOM;
  return {
    id: `latam-${i + 1}`,
    kind: "latam",
    title: `Clase LATAM En vivo #${i + 1}`,
    startUtc: boliviaAt(e.y, e.m, e.d, 21),
    durationMin: 90,
    desc: `Sesión ${i + 1} de 8. Nos vemos en Zoom para practicar en vivo.`,
    zoomUrl: zoom.url,
    zoomId: zoom.id,
    materialTo: "/clasesenvivo",
    referenceTimes: LATAM_REF,
  };
});

// Taller 1 — Sat Jul 18, 10:00 Bolivia ------------------------------------
const tallerEvents: CalendarEvent[] = [
  {
    id: "taller-1",
    kind: "taller",
    title: "Taller 1",
    startUtc: boliviaAt(2026, 6, 18, 10),
    durationMin: 90,
    desc: "Taller especial en vivo. ¡Nos vemos en Zoom!",
    zoomUrl: "https://us06web.zoom.us/j/89546346403",
    zoomId: "895 4634 6403",
    materialTo: "/clasesenvivo",
    referenceTimes: [
      { flag: "🇧🇴", label: "Bolivia", time: "10:00" },
      { flag: "🇨🇴", label: "Colombia", time: "09:00" },
      { flag: "🇫🇷", label: "France", time: "16:00" },
    ],
  },
];

// Semaine de repos — full week after the 4-week program (Aug 10 → Aug 16, 2026)
const reposEvents: CalendarEvent[] = [
  {
    id: "repos-1",
    kind: "repos",
    title: "Semaine de repos 😴",
    // Anchor at Mon 00:00 UTC — we render this across the whole week regardless of TZ.
    startUtc: new Date(Date.UTC(2026, 7, 10, 0, 0)).toISOString(),
    durationMin: 60 * 24 * 7,
  },
];

export const CALENDAR_EVENTS: CalendarEvent[] = [
  ...europaEvents,
  ...latamEvents,
  ...tallerEvents,
  ...reposEvents,
];

// DB-backed events ----------------------------------------------------------

type CalendarEventRow = {
  id: string;
  kind: string;
  title: string;
  start_utc: string;
  duration_min: number;
  description: string | null;
  zoom_url: string | null;
  zoom_id: string | null;
  material_to: string | null;
  reference_times: unknown;
};

function rowToEvent(r: CalendarEventRow): CalendarEvent {
  return {
    id: r.id,
    kind: (["europa", "latam", "taller", "repos"].includes(r.kind) ? r.kind : "taller") as EventKind,
    title: r.title,
    startUtc: r.start_utc,
    durationMin: r.duration_min,
    desc: r.description ?? undefined,
    zoomUrl: r.zoom_url ?? undefined,
    zoomId: r.zoom_id ?? undefined,
    materialTo: r.material_to ?? undefined,
    referenceTimes: Array.isArray(r.reference_times)
      ? (r.reference_times as { flag: string; label: string; time: string }[])
      : undefined,
  };
}

export function useCalendarEvents(): { events: CalendarEvent[]; loading: boolean; refresh: () => Promise<void> } {
  const [events, setEvents] = useState<CalendarEvent[]>(CALENDAR_EVENTS);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("id, kind, title, start_utc, duration_min, description, zoom_url, zoom_id, material_to, reference_times")
        .order("start_utc", { ascending: true });
      if (!error && data && data.length > 0) {
        setEvents((data as CalendarEventRow[]).map(rowToEvent));
      }
    } catch {
      // Table missing or fetch failed — keep the hardcoded fallback.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { events, loading, refresh };
}

// Visual palette per event kind --------------------------------------------
export const KIND_STYLE: Record<EventKind, { bg: string; dot: string; label: string }> = {
  europa: { bg: "bg-blue text-white", dot: "#4BB1EC", label: "Clase EUROPA" },
  latam:  { bg: "bg-red text-white", dot: "#C44536", label: "Clase LATAM" },
  taller: { bg: "bg-amber-500 text-white", dot: "#F59E0B", label: "Taller" },
  repos:  { bg: "bg-success/80 text-white", dot: "#3BA776", label: "Repos" },
};

// Local-time helpers -------------------------------------------------------
export function localTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function localDateParts(iso: string) {
  const d = new Date(iso);
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
}

// Return upcoming class events sorted by soonest first (excludes repos).
export function upcomingClasses(now = new Date(), events: CalendarEvent[] = CALENDAR_EVENTS): CalendarEvent[] {
  return events
    .filter((e) => e.kind !== "repos")
    .filter((e) => {
      const end = new Date(e.startUtc).getTime() + e.durationMin * 60_000;
      return end > now.getTime();
    })
    .sort((a, b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime());
}

// Return every UTC-day (YYYY-MM-DD in *local* time) the repos event spans.
export function reposDays(ev: CalendarEvent): string[] {
  const days: string[] = [];
  const start = new Date(ev.startUtc);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }
  return days;
}
