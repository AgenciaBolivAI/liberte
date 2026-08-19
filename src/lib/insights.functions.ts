import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { aiErrors, aiPronunciation, type AiError, type AiPronunciation } from "@/lib/ai-text";

/**
 * "Mes points à travailler" — the student's OWN recurring errors.
 *
 * From the August 2026 survey: "No sé qué puedo mejorar… o si tengo el mismo
 * error todo el tiempo (pronunciación, escritura)." Every graded answer already
 * stores the corrections and the AI's diagnosis, but only the coach could see
 * them; each student saw one day's feedback and never the pattern across days.
 * This returns the same aggregation the coach view uses, scoped by RLS to the
 * caller — so a student sees exactly their own data and nobody else's.
 */

export type WeakPoint = { label: string; times: number; lastDay: number };
export type CompetenceStat = { competence: string; hits: number; misses: number; accuracy: number };
export type Insights = {
  weakPoints: WeakPoint[];
  competences: CompetenceStat[];
  recentCorrections: { day: number; text: string }[];
  /** The SAME structured objects the coach panel reads out of the stored weekly
   *  reports — « dijiste X → lo correcto es Y → la regla es Z » — instead of the
   *  flat strings the student used to get. Newest week first, deduped. */
  commonErrors: (AiError & { week: number })[];
  pronunciation: (AiPronunciation & { week: number })[];
  graded: number;
};

/** Group near-identical diagnoses: the AI phrases the same point many ways. */
function key(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const asList = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : [];

export const myInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Insights> => {
    // RLS restricts both tables to the caller's own rows — no user_id filter
    // needed, and none accepted: a student can never read someone else's.
    const [acts, defis, weekly] = await Promise.all([
      context.supabase
        .from("activity_results")
        .select("day_id, competence, aciertos, errores, punto_debil, created_at")
        .order("created_at", { ascending: false })
        .limit(400),
      context.supabase
        .from("defi_results")
        .select("day_id, hits, misses, weak_points, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      context.supabase
        .from("weekly_evaluations")
        .select("week_number, ai_report")
        .order("week_number", { ascending: false })
        .limit(24),
    ]);

    const weak = new Map<string, { label: string; times: number; lastDay: number }>();
    const bump = (raw: string, day: number) => {
      const k = key(raw);
      if (!k || k.length < 4) return;
      const cur = weak.get(k);
      if (cur) {
        cur.times += 1;
        cur.lastDay = Math.max(cur.lastDay, day);
      } else {
        weak.set(k, { label: raw.trim(), times: 1, lastDay: day });
      }
    };

    const comp = new Map<string, { hits: number; misses: number }>();
    const corrections: { day: number; text: string }[] = [];
    let graded = 0;

    for (const r of acts.data ?? []) {
      const day = Number(r.day_id) || 0;
      graded += 1;
      if (r.punto_debil) bump(String(r.punto_debil), day);
      const errs = asList(r.errores);
      for (const e of errs) if (corrections.length < 12) corrections.push({ day, text: e });
      const c = String(r.competence || "").toUpperCase() || "—";
      const slot = comp.get(c) ?? { hits: 0, misses: 0 };
      slot.hits += asList(r.aciertos).length;
      slot.misses += errs.length;
      comp.set(c, slot);
    }

    for (const r of defis.data ?? []) {
      const day = Number(r.day_id) || 0;
      graded += 1;
      for (const w of asList(r.weak_points)) bump(w, day);
      const slot = comp.get("PO") ?? { hits: 0, misses: 0 };
      // defi hits/misses are real integers, unlike the activity jsonb arrays.
      slot.hits += Number(r.hits) || 0;
      slot.misses += Number(r.misses) || 0;
      comp.set("PO", slot);
    }

    const weakPoints = [...weak.values()]
      .filter((w) => w.times >= 2) // "recurring" means it happened more than once
      .sort((a, b) => b.times - a.times || b.lastDay - a.lastDay)
      .slice(0, 8);

    const competences = [...comp.entries()]
      .map(([competence, v]) => ({
        competence,
        hits: v.hits,
        misses: v.misses,
        accuracy: v.hits + v.misses > 0 ? Math.round((v.hits / (v.hits + v.misses)) * 100) : 0,
      }))
      .filter((c) => c.hits + c.misses > 0)
      .sort((a, b) => a.accuracy - b.accuracy);

    // Structured errors + pronunciation, read from the stored weekly reports
    // with the very same normalizers the coach panel uses. Deduped on the
    // corrected form / word so a repeated point is listed once, newest week.
    const errSeen = new Set<string>();
    const commonErrors: (AiError & { week: number })[] = [];
    const proSeen = new Set<string>();
    const pronunciation: (AiPronunciation & { week: number })[] = [];

    for (const row of weekly.data ?? []) {
      const week = Number(row.week_number) || 0;
      const rep = (row.ai_report ?? {}) as Record<string, unknown>;
      for (const e of aiErrors(rep.common_errors)) {
        const k = key(e.corrected || e.said);
        if (!k || errSeen.has(k)) continue;
        errSeen.add(k);
        if (commonErrors.length < 8) commonErrors.push({ ...e, week });
      }
      for (const p of aiPronunciation(rep.pronunciation)) {
        const k = key(p.word);
        if (!k || proSeen.has(k)) continue;
        proSeen.add(k);
        if (pronunciation.length < 8) pronunciation.push({ ...p, week });
      }
    }

    return {
      weakPoints,
      competences,
      recentCorrections: corrections.slice(0, 6),
      commonErrors,
      pronunciation,
      graded,
    };
  });
