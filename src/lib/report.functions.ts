import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callChat } from "@/lib/ai";

// A detailed, teacher-facing AI report on how one student is doing — built from
// every performance signal we store: daily challenges (said↔corrected errors,
// weak points), per-competence activity corrections, weekly evaluations
// (pronunciation, CO/CE/PE/PO), pace, stars, and AI-tutor volume + corrections.

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
const strList = (v: unknown, n = 8): string[] =>
  asArr(v).map((x) => String(x)).filter(Boolean).slice(0, n);

export const getStudentAIReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { userId?: string };
    if (!d?.userId) throw new Error("userId required");
    return { userId: String(d.userId) };
  })
  .handler(async ({ data, context }) => {
    await requireStaff(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = data.userId;

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

    // ---- Deterministic stats (shown even if the AI call fails) ----
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

    // ---- Compact payload for the model ----
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

    const system = `Eres el analista pedagógico de Liberté, un programa de francés para hispanohablantes. Recibes TODOS los datos de rendimiento de un alumno en JSON y escribes un informe claro y accionable PARA SU PROFESOR (en español). Sé específico: cita ejemplos reales de errores (dijo → correcto), patrones de pronunciación, competencias débiles (CO=comprensión oral, CE=comprensión escrita, PE=producción escrita, PO=producción oral), ritmo/constancia y su actividad con el tutor de IA. Si faltan datos en algún área, dilo brevemente en vez de inventar. Devuelve SOLO este JSON válido, sin texto extra:

{
  "resumen": "2-3 frases: cómo va el alumno en general",
  "nivel": "estimación breve del nivel/progresión (ej. 'A1 avanzado, encaminado a A2')",
  "fortalezas": ["…", "…"],
  "dificultades": ["…", "…"],
  "errores_frecuentes": [{"tipo": "gramática/vocabulario/…", "ejemplo": "lo que dijo", "correccion": "lo correcto"}],
  "pronunciacion": ["nota de pronunciación con palabra/objetivo si existe; [] si no hay datos"],
  "tutor_ia": "cómo le va con el tutor de IA: volumen de práctica y nº de correcciones/errores; si no ha usado el tutor, dilo",
  "ritmo": "constancia y velocidad de avance (días completados, huecos)",
  "recomendaciones": ["acciones concretas para el profesor o el alumno"],
  "mensaje_sugerido": "un mensaje corto, cálido y personal que el profesor podría enviar al alumno (español), mencionando algo concreto"
}`;

    let report: StudentReport = {
      resumen: "", nivel: "", fortalezas: [], dificultades: [], errores_frecuentes: [],
      pronunciacion: [], tutor_ia: "", ritmo: "", recomendaciones: [], mensaje_sugerido: "",
    };
    if (hasData) {
      try {
        const ai = await callChat(system, JSON.stringify(payload));
        if (Object.keys(ai).length > 0) {
          report = {
          resumen: String(ai.resumen ?? ""),
          nivel: String(ai.nivel ?? ""),
          fortalezas: strList(ai.fortalezas, 8),
          dificultades: strList(ai.dificultades, 8),
          errores_frecuentes: asArr(ai.errores_frecuentes).slice(0, 10).map((e) => {
            const x = e as Record<string, unknown>;
            return { tipo: String(x.tipo ?? ""), ejemplo: String(x.ejemplo ?? ""), correccion: String(x.correccion ?? "") };
          }),
          pronunciacion: strList(ai.pronunciacion, 10),
          tutor_ia: String(ai.tutor_ia ?? ""),
          ritmo: String(ai.ritmo ?? ""),
          recomendaciones: strList(ai.recomendaciones, 8),
          mensaje_sugerido: String(ai.mensaje_sugerido ?? ""),
          };
        }
      } catch {
        // AI failed (rate limit / network / overflow) — still return the
        // deterministic stats with an empty narrative, as promised above.
      }
    }

    return { stats, report, hasData, name: (profile.full_name as string) ?? null };
  });
