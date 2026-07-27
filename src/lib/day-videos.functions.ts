import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** The teacher-saved video URLs of one day, by pedagogical slot. */
export type DayVideoOverrides = {
  gym?: string;
  intro?: string;
  vocab?: string;
  cles?: string;
};

/**
 * Video URLs from a day's authored row REGARDLESS of publish status.
 *
 * WHY THIS EXISTS: RLS only lets students read PUBLISHED authored_days rows,
 * and days 1-10 ship as drafts so publishing swaps the whole hand-built design.
 * The teacher's most common edit — "cambié el video y no se actualiza" — must
 * not require publishing (and before this fn, the gym video was read from the
 * CODE bundle and ignored the DB row entirely, even for published days 11+).
 * This exposes ONLY the four video URLs via the service role, never the rest
 * of a draft's lesson content, so saves go live instantly on every day.
 */
export const getDayVideos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { dayId?: number };
    const n = Number(d?.dayId);
    if (!Number.isInteger(n) || n < 1 || n > 120) throw new Error("dayId 1-120 required");
    return { dayId: n };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("authored_days")
      .select("rich")
      .eq("day_id", data.dayId)
      .maybeSingle();
    const rich = (row?.rich ?? null) as {
      gym?: unknown;
      introVideo?: unknown;
      vocabVideo?: unknown;
      clesVideo?: unknown;
    } | null;
    const pick = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
    const out: DayVideoOverrides = {
      gym: pick(rich?.gym),
      intro: pick(rich?.introVideo),
      vocab: pick(rich?.vocabVideo),
      cles: pick(rich?.clesVideo),
    };
    return out;
  });
