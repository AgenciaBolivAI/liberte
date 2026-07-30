import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PLUS_RESOURCES_BY_WEEK, type PlusResource } from "@/routes/plus.$weekId.$itemId";

/**
 * "Le Petit Plus Liberté" — the weekly bonus videos.
 *
 * They used to live only in a hardcoded map inside the route module, so the
 * teacher had no way to change them ("no hay donde cambiar ahí los videitos").
 * Now they come from `plus_resources`, falling back to the code map for any week
 * the teacher hasn't touched — same `dbRows ?? HARDCODED` shape the recorded
 * classes use, so nothing changes until something is actually saved.
 */

export type PlusRow = {
  id: string;
  week: number;
  emoji: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  note: string | null;
  youtube_id: string;
  sort: number;
};

/** A saved row rendered through the same shape the player already knows. */
export function rowToResource(r: PlusRow): PlusResource {
  return {
    id: r.id,
    emoji: r.emoji || "✨",
    eyebrow: r.eyebrow || "",
    title: r.title,
    subtitle: r.subtitle || "",
    note: r.note ?? undefined,
    youtubeId: r.youtube_id,
  };
}

/** Pull the bare video id out of anything a teacher might paste. */
export function extractYouTubeId(raw: string): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  const m =
    /youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/)([\w-]{6,})/.exec(s) ??
    /youtu\.be\/([\w-]{6,})/.exec(s);
  if (m) return m[1];
  // Already a bare id.
  return /^[\w-]{6,}$/.test(s) ? s : "";
}

async function fetchWeek(week: number): Promise<PlusResource[] | null> {
  const { data, error } = await supabase
    .from("plus_resources")
    .select("id, week, emoji, eyebrow, title, subtitle, note, youtube_id, sort")
    .eq("week", week)
    .order("sort", { ascending: true });
  // Table missing (pre-migration) or read failure → let the caller fall back.
  if (error || !data || data.length === 0) return null;
  return (data as PlusRow[]).map(rowToResource);
}

/**
 * Bonus items for a week: saved rows when they exist, else the code defaults.
 *
 * Returns `[]` for a week that has neither. The old code did
 * `BY_WEEK[week] ?? BY_WEEK["1"]`, which silently served WEEK 1's videos on
 * every week from 3 onward — students saw the same bonus over and over.
 */
export function usePlusResources(week: number): { items: PlusResource[]; loading: boolean } {
  const fallback = PLUS_RESOURCES_BY_WEEK[String(week)] ?? [];
  const [items, setItems] = useState<PlusResource[]>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setItems(PLUS_RESOURCES_BY_WEEK[String(week)] ?? []);
    setLoading(true);
    void fetchWeek(week).then((rows) => {
      if (!alive) return;
      if (rows) setItems(rows);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [week]);

  return { items, loading };
}
