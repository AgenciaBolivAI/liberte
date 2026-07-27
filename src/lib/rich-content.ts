// Teacher-editable lesson content for weeks 3+ (days 11+). The full lesson
// (a RichDay: WeekDay content + UI meta) is stored in `authored_days.rich`
// (jsonb). The lesson player renders `dbRich ?? WEEK34[day]` so a published DB
// row overrides the code seed, and the code stays as an always-safe fallback.
// Writes are staff-only (enforced by the `authored_days` RLS "staff write" policy).
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { RichDay } from "@/data/week34.meta";

/** An empty rich day (weeks 3+), pre-shaped so the editor and the lesson player
 *  have every section present. Used when the teacher creates a brand-new day. */
export function blankRichDay(dayId: number): RichDay {
  const week = Math.ceil(dayId / 5);
  return {
    meta: {
      label: `Jour ${dayId} · `,
      headTitle: `Jour ${dayId} — Liberté`,
      headDesc: "",
      week,
      weekEmoji: "✨",
      intro: `Bienvenue au Jour ${dayId} !`,
      introSub: "",
      clesSub: "",
      defiTitle: "",
      defiSubtitle: "",
      defiAvatar: "🎙️",
    },
    gym: "https://www.youtube.com/embed/AdJPOTR-CdU",
    vocabulary: [],
    flashQuiz: [],
    grammar: [],
    vocabGames: { reading: [], listening: [], speaking: [], writing: [] },
    clesReading: { title: "", text: "", questions: [] },
    clesGames: { listening: [], speaking: [], writing: [] },
    defiSteps: [],
    defiCriteria: [],
    tutor: { role: "", opener_fr: "", opener_es: "", objectives: ["", "", ""], topic: "" },
  };
}

/** Accepts any YouTube URL shape the teacher may paste (watch?v=, youtu.be/,
 *  shorts/, live/, embed/) and returns the /embed/ URL the lesson player needs.
 *  Anything non-YouTube passes through untouched (self-hosted mp4, etc.). */
export function toYouTubeEmbed(raw: string): string {
  const url = raw.trim();
  if (!url) return "";
  const m =
    /youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/)([\w-]{6,})/.exec(url) ??
    /youtu\.be\/([\w-]{6,})/.exec(url);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
}

export type RichDayRow = {
  day_id: number;
  title: string;
  subtitle: string;
  status: "draft" | "published";
  rich: RichDay | null;
};

/** Fetch one day's rich lesson content for the player. Returns null while
 *  loading, for days < 11, on error, or when no DB row exists (caller then
 *  falls back to the WEEK34 code seed). RLS gives students published rows only;
 *  staff also see drafts, so the admin preview shows unpublished edits. */
export function useRichDay(dayId: string | number): RichDay | null {
  const [data, setData] = useState<RichDay | null>(null);
  const n = Number(dayId);
  useEffect(() => {
    let alive = true;
    if (!Number.isInteger(n) || n < 1) {
      setData(null);
      return;
    }
    void (async () => {
      const { data: row, error } = await supabase
        .from("authored_days")
        .select("rich, status")
        .eq("day_id", n)
        .maybeSingle();
      if (!alive) return;
      // Days 1-10 ship with a hand-built design. Their converted row is seeded as
      // a DRAFT so the teacher can edit it, and it only takes over the rendering
      // once they PUBLISH — students never see a half-edited flagship day.
      // Days 11+ are data-driven from the start, so any row applies.
      const usable = row?.rich && (n >= 11 || row.status === "published");
      setData(error || !usable ? null : (row!.rich as unknown as RichDay));
    })();
    return () => {
      alive = false;
    };
  }, [n]);
  return data;
}

/** Teacher-saved video URLs for one day, by slot — fetched through the
 *  `getDayVideos` server fn so they apply REGARDLESS of publish status (RLS
 *  hides draft rows from students, and days 1-10 live as drafts by design).
 *  This is what makes "pegar un enlace y guardar" show up instantly for
 *  students without republishing (or redesigning) the day. */
export type DayVideos = { gym?: string; intro?: string; vocab?: string; cles?: string };

export function useDayVideos(dayId: string | number): DayVideos {
  const [videos, setVideos] = useState<DayVideos>({});
  const n = Number(dayId);
  useEffect(() => {
    let alive = true;
    if (!Number.isInteger(n) || n < 1) {
      setVideos({});
      return;
    }
    void import("@/lib/day-videos.functions")
      .then(({ getDayVideos }) => getDayVideos({ data: { dayId: n } }))
      .then((v) => {
        if (alive) setVideos(v ?? {});
      })
      .catch(() => {
        if (alive) setVideos({}); // fall back to the bundled videos silently
      });
    return () => {
      alive = false;
    };
  }, [n]);
  return videos;
}

/** All authored days (staff view), lightweight — for the content manager list. */
export async function listRichDays(): Promise<RichDayRow[]> {
  const { data, error } = await supabase
    .from("authored_days")
    .select("day_id, title, subtitle, status, rich")
    .order("day_id");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    day_id: r.day_id,
    title: r.title,
    subtitle: r.subtitle,
    status: (r.status as "draft" | "published") ?? "draft",
    rich: (r.rich as unknown as RichDay) ?? null,
  }));
}

/** Full rich content for one day, for the editor. */
export async function getRichDay(dayId: number): Promise<RichDayRow | null> {
  const { data, error } = await supabase
    .from("authored_days")
    .select("day_id, title, subtitle, status, rich")
    .eq("day_id", dayId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    day_id: data.day_id,
    title: data.title,
    subtitle: data.subtitle,
    status: (data.status as "draft" | "published") ?? "draft",
    rich: (data.rich as unknown as RichDay) ?? null,
  };
}

/** Create/update a rich day (staff-only via RLS). Title/subtitle mirror the
 *  meta so the existing content-manager list stays readable. */
export async function saveRichDay(input: {
  dayId: number;
  status: "draft" | "published";
  rich: RichDay;
}): Promise<void> {
  const { dayId, status, rich } = input;
  const { error } = await supabase.from("authored_days").upsert(
    {
      day_id: dayId,
      title: rich.meta.label,
      subtitle: rich.meta.clesSub,
      status,
      rich: rich as unknown as Json,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "day_id" },
  );
  if (error) throw error;
}

/** Delete a rich day (also removes any legacy blocks via ON DELETE CASCADE). */
export async function deleteRichDay(dayId: number): Promise<void> {
  const { error } = await supabase.from("authored_days").delete().eq("day_id", dayId);
  if (error) throw error;
}
