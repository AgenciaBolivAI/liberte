import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callChat } from "@/lib/ai";
import { requireApprovedStudent } from "@/lib/approval";
import { aiText, aiTextList, aiPronunciationLines } from "@/lib/ai-text";

// A detailed AI report on how one student is doing — built from every
// performance signal we store: daily challenges (said↔corrected errors, weak
// points), per-competence activity corrections, weekly evaluations
// (pronunciation, CO/CE/PE/PO), pace, stars, and AI-tutor volume + corrections.
//
// Visible to BOTH roles (client request 2026-07-26): the latest generation is
// persisted in ai_student_reports so teacher and student always see the SAME
// report. Students regenerate at most once per 24h (token-cost control);
// teachers can regenerate at will, which also refreshes what the student sees.

type Ctx = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { rpc: any };
  userId: string;
};

async function requireStaff(context: Ctx): Promise<void> {
  const [coach, admin] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "coach" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
  ]);
  if (!coach.data && !admin.data) throw new Response("Forbidden", { status: 403 });
}

export type StudentReport = {
  resumen: string;
  nivel: string;
  fortalezas: string[];
  dificultades: string[];
  errores_frecuentes: { tipo: string; ejemplo: string; correccion: string }[];
  pronunciacion: string[];
  tutor_ia: string;
  ritmo: string;
  recomendaciones: string[];
  mensaje_sugerido: string;
};

export type StudentReportStats = {
  daysCompleted: number;
  avgDefiScore: number;
  totalStars: number;
  tutorMessages: number;
  tutorCorrections: number;
  weeksEvaluated: number;
  lastActive: string | null;
};

const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
/** AI lists are coerced through aiTextList: the model often answers with the
 *  OBJECT shape it was shown in the payload even when the prompt asks for
 *  strings, and a raw String(obj) printed "[object Object]" to the teacher. */
const strList = (v: unknown, n = 8): string[] => aiTextList(v, n);

const EMPTY_REPORT: StudentReport = {
  resumen: "", nivel: "", fortalezas: [], dificultades: [], errores_frecuentes: [],
  pronunciacion: [], tutor_ia: "", ritmo: "", recomendaciones: [], mensaje_sugerido: "",
};

/** Students can regenerate at most once per 24h; the stored report is served
 *  in between. Teachers bypass the cooldown (and refresh the stored copy). */
const REPORT_TTL_MS = 24 * 60 * 60 * 1000;

type Gathered = {
  stats: StudentReportStats;
  payload: Record<string, unknown>;
  hasData: boolean;
  name: string | null;
};

/** The deterministic half: 8 cheap reads → live stats + the compact payload
 *  for the model. ALWAYS recomputed — /progress renders live counters next to
 *  this card, and a cached daysCompleted would visibly contradict them. */
async function gatherStudentData(uid: string): Promise<Gathered> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [profileR, defisR, actsR, weekliesR, compsR, starsR, usageR, eventsR] = await Promise.all([
    supabaseAdmin.from("profiles").select("full_name, email, mother_tongue, objective, nationality, birth_date, created_at").eq("id", uid).maybeSingle(),
    supabaseAdmin.from("defi_results").select("day_id, score_10, hits, misses, strengths, errors, weak_points, recommendation").eq("user_id", uid).order("day_id", { ascending: true }),
    supabaseAdmin.from("activity_results").select("day_id, section, competence, resultado, score, errores, punto_debil").eq("user_id", uid).order("created_at", { ascending: false }).limit(150),
    supabaseAdmin.from("weekly_evaluations").select("week_number, weekly_score, test_scores, ai_report").eq("user_id", uid).order("week_number", { ascending: true }),
    supabaseAdmin.from("day_completions").select("day_id, completed_at").eq("user_id", uid).order("completed_at", { ascending: true }),
    supabaseAdmin.from("star_awards").select("amount, reason").eq("user_id", uid),
    supabaseAdmin.from("tutor_usage").select("usage_date, message_count").eq("user_id", uid),
    supabaseAdmin.from("tutor_events").select("day_id, said, corrected, rule_es, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(80),
  ]);

  const profile = (profileR.data ?? {}) as Record<string, unknown>;
  const defis = (defisR.data ?? []) as Record<string, unknown>[];
  const acts = (actsR.data ?? []) as Record<string, unknown>[];
  const weeklies = (weekliesR.data ?? []) as Record<string, unknown>[];
  const comps = (compsR.data ?? []) as { day_id: number; completed_at: string }[];
  const stars = (starsR.data ?? []) as { amount: number; reason: string }[];
  const usage = (usageR.data ?? []) as { usage_date: string; message_count: number }[];
  const events = (eventsR.data ?? []) as { day_id: number; said: string | null; corrected: string | null; rule_es: string | null; created_at: string }[];

  const defiScores = defis.map((d) => Number(d.score_10 ?? 0)).filter((n) => !Number.isNaN(n));
  const avgDefiScore = defiScores.length ? Math.round((defiScores.reduce((a, b) => a + b, 0) / defiScores.length) * 10) / 10 : 0;
  const tutorMessages = usage.reduce((a, u) => a + Number(u.message_count ?? 0), 0);
  const lastActive = [
    comps.at(-1)?.completed_at,
    events[0]?.created_at,
    usage.map((u) => u.usage_date).sort().at(-1),
  ].filter(Boolean).sort().at(-1) ?? null;

  const stats: StudentReportStats = {
    daysCompleted: comps.length,
    avgDefiScore,
    totalStars: stars.reduce((a, s) => a + Number(s.amount ?? 0), 0),
    tutorMessages,
    tutorCorrections: events.length,
    weeksEvaluated: weeklies.length,
    lastActive: lastActive as string | null,
  };

  const pace = {
    dias_completados: comps.length,
    primer_dia: comps[0]?.completed_at ?? null,
    ultimo_dia: comps.at(-1)?.completed_at ?? null,
  };
  const defiPayload = defis.map((d) => ({
    dia: Number(d.day_id),
    nota_10: Number(d.score_10 ?? 0),
    puntos_debiles: strList(d.weak_points, 4),
    errores: asArr(d.errors).slice(0, 3).map((e) => {
      const x = e as Record<string, unknown>;
      return { dijo: String(x.said ?? ""), correcto: String(x.corrected ?? "") };
    }),
    recomendacion: d.recommendation ? String(d.recommendation) : null,
  }));
  const activityErrors: { competencia: string; dijo: string; correcto: string; regla: string }[] = [];
  for (const a of acts) {
    for (const e of asArr(a.errores).slice(0, 2)) {
      const x = e as Record<string, unknown>;
      activityErrors.push({
        competencia: String(a.competence ?? ""),
        dijo: String(x.dijo ?? ""),
        correcto: String(x.correcto ?? ""),
        regla: String(x.regla ?? ""),
      });
    }
    if (activityErrors.length >= 25) break;
  }
  const weeklyPayload = weeklies.map((w) => {
    const rep = (w.ai_report ?? {}) as Record<string, unknown>;
    return {
      semana: Number(w.week_number),
      nota: Number(w.weekly_score ?? 0),
      competencias: rep.competence_scores ?? w.test_scores ?? null,
      pronunciacion: asArr(rep.pronunciation).slice(0, 8).map((p) => {
        const x = p as Record<string, unknown>;
        return { palabra: String(x.word ?? ""), escuchado: String(x.heard ?? ""), objetivo: String(x.target ?? ""), tip: String(x.tip ?? "") };
      }),
      errores_comunes: asArr(rep.common_errors).slice(0, 5).map((c) => {
        const x = c as Record<string, unknown>;
        return { dijo: String(x.said ?? ""), correcto: String(x.corrected ?? ""), regla: String(x.rule ?? "") };
      }),
      resumen_coach: rep.coach_summary ? String(rep.coach_summary) : null,
    };
  });
  const tutorPayload = {
    mensajes_totales: tutorMessages,
    correcciones_totales: events.length,
    muestras: events.slice(0, 12).map((e) => ({ dia: e.day_id, dijo: e.said, correcto: e.corrected, regla: e.rule_es })),
  };

  const payload = {
    alumno: {
      nombre: profile.full_name ?? null,
      lengua_materna: profile.mother_tongue ?? null,
      objetivo: profile.objective ?? null,
      nacionalidad: profile.nationality ?? null,
      inscrito: profile.created_at ?? null,
    },
    ritmo: pace,
    estrellas: stats.totalStars,
    desafios_diarios: defiPayload,
    errores_actividades: activityErrors,
    evaluaciones_semanales: weeklyPayload,
    tutor_ia: tutorPayload,
  };

  const hasData = defis.length + acts.length + weeklies.length + comps.length + events.length > 0;

  return { stats, payload, hasData, name: (profile.full_name as string) ?? null };
}

const REPORT_SYSTEM = `Eres el analista pedagógico de Liberté, un programa de francés para hispanohablantes. Recibes TODOS los datos de rendimiento de un alumno en JSON y escribes un informe claro y accionable PARA SU PROFESOR (en español). Sé específico: cita ejemplos reales de errores (dijo → correcto), patrones de pronunciación, competencias débiles (CO=comprensión oral, CE=comprensión escrita, PE=producción escrita, PO=producción oral), ritmo/constancia y su actividad con el tutor de IA. Si faltan datos en algún área, dilo brevemente en vez de inventar. Devuelve SOLO este JSON válido, sin texto extra:

{
  "resumen": "2-3 frases: cómo va el alumno en general",
  "nivel": "estimación breve del nivel/progresión (ej. 'A1 avanzado, encaminado a A2')",
  "fortalezas": ["…", "…"],
  "dificultades": ["…", "…"],
  "errores_frecuentes": [{"tipo": "gramática/vocabulario/…", "ejemplo": "lo que dijo", "correccion": "lo correcto"}],
  "pronunciacion": ["FRASE DE TEXTO PLANO, nunca un objeto. Ej: 'voudrais — se escuchó « vudré », debe sonar « vu-DRÈ »; practicar la R francesa'. [] si no hay datos"],
  "tutor_ia": "cómo le va con el tutor de IA: volumen de práctica y nº de correcciones/errores; si no ha usado el tutor, dilo",
  "ritmo": "constancia y velocidad de avance (días completados, huecos)",
  "recomendaciones": ["acciones concretas para el profesor o el alumno"],
  "mensaje_sugerido": "un mensaje corto, cálido y personal que el profesor podría enviar al alumno (español), mencionando algo concreto"
}

FORMATO OBLIGATORIO: "fortalezas", "dificultades", "pronunciacion" y "recomendaciones" son arrays de CADENAS DE TEXTO, nunca de objetos — aunque los datos de entrada vengan como objetos, aquí se redactan como frases. Escribe los nombres de tipo en español ("gramática", "vocabulario", "pronunciación", "expresión oral").`;

/** One AI generation, fully coerced. Returns NULL on failure or an empty
 *  narrative — a failed generation must never be stored or served as fresh
 *  (it would silently blank the report for a whole cooldown window). */
async function buildStudentReport(g: Gathered): Promise<StudentReport | null> {
  if (!g.hasData) return null;
  try {
    const ai = await callChat(REPORT_SYSTEM, JSON.stringify(g.payload));
    if (Object.keys(ai).length === 0) return null;
    const report: StudentReport = {
      resumen: String(ai.resumen ?? ""),
      nivel: String(ai.nivel ?? ""),
      fortalezas: strList(ai.fortalezas, 8),
      dificultades: strList(ai.dificultades, 8),
      errores_frecuentes: asArr(ai.errores_frecuentes)
        .slice(0, 10)
        .map((e) => {
          if (typeof e === "string") return { tipo: "", ejemplo: e.trim(), correccion: "" };
          const x = (e ?? {}) as Record<string, unknown>;
          return { tipo: aiText(x.tipo), ejemplo: aiText(x.ejemplo), correccion: aiText(x.correccion) };
        })
        .filter((e) => e.ejemplo || e.correccion),
      // Handles BOTH the requested strings and the {palabra, escuchado,
      // objetivo, tip} objects the model tends to mirror back from the payload.
      pronunciacion: aiPronunciationLines(ai.pronunciacion, 10),
      tutor_ia: String(ai.tutor_ia ?? ""),
      ritmo: String(ai.ritmo ?? ""),
      recomendaciones: strList(ai.recomendaciones, 8),
      mensaje_sugerido: String(ai.mensaje_sugerido ?? ""),
    };
    return report.resumen ? report : null;
  } catch {
    return null; // rate limit / network / overflow — caller decides fallback
  }
}

/** Best-effort persistence — a storage hiccup must not fail the response. */
async function storeReport(uid: string, report: StudentReport, stats: StudentReportStats, generatedBy: string): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("ai_student_reports").upsert(
      {
        user_id: uid,
        report: JSON.parse(JSON.stringify(report)),
        stats: JSON.parse(JSON.stringify(stats)),
        generated_by: generatedBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) console.error("[ai_student_reports] store failed", error.message);
  } catch (e) {
    console.error("[ai_student_reports] store threw", e);
  }
}

/** Teacher/coach: regenerate on demand for any student (no cooldown). The
 *  result is stored, so the student's «Mon rapport IA» shows the same thing. */
export const getStudentAIReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { userId?: string };
    if (!d?.userId) throw new Error("userId required");
    return { userId: String(d.userId) };
  })
  .handler(async ({ data, context }) => {
    await requireStaff(context as Ctx);
    const g = await gatherStudentData(data.userId);
    const built = await buildStudentReport(g);
    if (built) await storeReport(data.userId, built, g.stats, context.userId);
    return { stats: g.stats, report: built ?? EMPTY_REPORT, hasData: g.hasData, name: g.name };
  });

/** Student: own report. Live stats on every call; the AI narrative is cached
 *  24h (regenerates when missing/stale/empty). `mensaje_sugerido` is stripped
 *  SERVER-side — it is the teacher's draft message to the student and must not
 *  even reach the student's network tab. */
export const getMyAIReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireApprovedStudent(context);
    const uid = context.userId;
    const g = await gatherStudentData(uid);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("ai_student_reports")
      .select("report, updated_at")
      .eq("user_id", uid)
      .maybeSingle();
    const stored = (row?.report ?? null) as StudentReport | null;
    const storedAt = row?.updated_at ? new Date(row.updated_at).getTime() : 0;
    const storedUsable = Boolean(stored && stored.resumen);
    const storedFresh = storedUsable && Date.now() - storedAt < REPORT_TTL_MS;

    let report: StudentReport | null = storedFresh ? stored : null;
    let generatedAtMs = storedFresh ? storedAt : 0;
    if (!report) {
      const built = await buildStudentReport(g);
      if (built) {
        await storeReport(uid, built, g.stats, uid);
        report = built;
        generatedAtMs = Date.now();
      } else if (storedUsable) {
        // Generation failed right now — serving yesterday's report beats a blank.
        report = stored;
        generatedAtMs = storedAt;
      }
    }

    return {
      stats: g.stats,
      report: report ? { ...report, mensaje_sugerido: "" } : EMPTY_REPORT,
      hasData: g.hasData,
      generatedAt: generatedAtMs ? new Date(generatedAtMs).toISOString() : null,
      // null = the student may retry immediately (nothing usable was generated).
      nextRefreshAt: generatedAtMs ? new Date(generatedAtMs + REPORT_TTL_MS).toISOString() : null,
    };
  });
