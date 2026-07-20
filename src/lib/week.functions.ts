import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callChat, transcribeFr } from "@/lib/ai";
import { assertWeekNotLocked } from "@/lib/content-access.functions";

/* ---------- Which days did the user complete (defi sent) ---------- */

export const getCompletedDays = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("defi_results")
      .select("day_id")
      .eq("user_id", context.userId);
    if (error) throw error;
    return Array.from(new Set((data ?? []).map((r) => Number(r.day_id)))).sort((a, b) => a - b);
  });

/* ---------- STT for the weekly speaking tasks (reuses gateway) ---------- */

export const transcribeAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { audioBase64?: string; mimeType?: string };
    if (!d?.audioBase64) throw new Error("audioBase64 required");
    return { audioBase64: d.audioBase64, mimeType: d.mimeType || "audio/webm" };
  })
  .handler(async ({ data }) => {
    return { text: await transcribeFr(data.audioBase64, data.mimeType) };
  });

/* ---------- Evaluate the whole week 1 test ---------- */

type WeeklyTestInput = {
  weekNumber: number;
  co: { correct: number; total: number };
  ce: { correct: number; total: number };
  pe: { prompt: string; response: string }[];
  po: { prompt: string; expected?: string; transcript: string }[];
};

type WeeklyReport = {
  verdict_key: "excellent" | "tres_bien" | "en_camino" | "retomar";
  verdict_title: string;
  verdict_message: string;
  strengths: { title: string; example: string }[];
  common_errors: { said: string; corrected: string; rule: string }[];
  improvements: string[];
  pronunciation: { word: string; heard: string; target: string; tip: string }[];
  coach_summary: string;
  competence_scores: { CO: number; CE: number; PE: number; PO: number };
};

export const evaluateWeek = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as WeeklyTestInput;
    if (!d?.weekNumber) throw new Error("weekNumber required");
    return {
      weekNumber: Number(d.weekNumber),
      co: { correct: Number(d.co?.correct ?? 0), total: Number(d.co?.total ?? 0) },
      ce: { correct: Number(d.ce?.correct ?? 0), total: Number(d.ce?.total ?? 0) },
      pe: Array.isArray(d.pe) ? d.pe.map((x) => ({ prompt: String(x.prompt), response: String(x.response) })) : [],
      po: Array.isArray(d.po)
        ? d.po.map((x) => ({ prompt: String(x.prompt), expected: String(x.expected ?? ""), transcript: String(x.transcript) }))
        : [],
    };
  })
  .handler(async ({ data, context }) => {
    // Hard gate: a week an admin has disabled can't be evaluated. Admins bypass.
    await assertWeekNotLocked(context, data.weekNumber);
    // ---- Fetch weekly data from DB ----
    const dayIds = data.weekNumber === 1 ? [1, 2, 3, 4, 5] : [];
    const { data: defis } = await context.supabase
      .from("defi_results")
      .select("day_id, score_10, hits, misses, strengths, errors, weak_points, recommendation")
      .eq("user_id", context.userId)
      .in("day_id", dayIds);
    const { data: acts } = await context.supabase
      .from("activity_results")
      .select("day_id, section, competence, score, aciertos, errores, punto_debil")
      .eq("user_id", context.userId)
      .in("day_id", dayIds);

    const defiRows = defis ?? [];
    const actRows = acts ?? [];

    // ---- Compute per-block test score /10 ----
    const coScore = data.co.total ? (data.co.correct / data.co.total) * 10 : 0;
    const ceScore = data.ce.total ? (data.ce.correct / data.ce.total) * 10 : 0;

    // ---- AI evaluation ----
    const system = `Eres la profesora de Liberté (francés A1-A2 para hispanohablantes). Evalúas la autoevaluación de la Semana ${data.weekNumber} de un alumno. Recibes:
- resultados del test cerrado (CO, CE),
- tareas de escritura (PE) con consigna y respuesta del alumno,
- lecturas y una mini situación oral (PO) transcritas del audio real,
- historial de la semana: puntuación de cada desafío final diario + errores/aciertos ya detectados en actividades diarias.

Tu tarea: dar puntuaciones justas de PE y PO sobre 10, y generar un informe cálido en español (con ejemplos concretos citando lo que ESCRIBIÓ/DIJO el alumno). Detecta errores de pronunciación comparando la transcripción de las lecturas con el texto original: los sonidos objetivo de la semana 1 son voudrais [vudʁɛ], croissant [kʁwasɑ̃], sans [sɑ̃], s'il vous plaît [sil vu plɛ].

Responde SOLO JSON con esta forma EXACTA:
{
  "competence_scores": { "CO": 0-10, "CE": 0-10, "PE": 0-10, "PO": 0-10 },
  "verdict_key": "excellent | tres_bien | en_camino | retomar",
  "verdict_title": "cadena corta en francés",
  "verdict_message": "1-2 frases cálidas en español",
  "strengths": [ { "title": "es-corto", "example": "cita real de lo que hizo bien" }, ... ],
  "common_errors": [ { "said": "lo que dijo/escribió", "corrected": "versión correcta", "rule": "regla en una línea" } ],
  "improvements": [ "recomendación 1 pequeña y accionable", "recomendación 2" ],
  "pronunciation": [ { "word": "voudrais", "heard": "como sonó", "target": "cómo suena bien", "tip": "truco corto" } ],
  "coach_summary": "3 frases para la coach: progreso, ánimo detectado, alertas"
}

Reglas:
- 2-3 strengths, máximo 3 common_errors, 2 improvements, 2-3 pronunciation.
- Usa las notas del test (CO=${coScore.toFixed(1)}, CE=${ceScore.toFixed(1)}) como CO/CE en competence_scores.
- verdict_key: >=8.5 excellent, 7-8.4 tres_bien, 5-6.9 en_camino, <5 retomar (basado en promedio semanal aprox).
- Tono cálido, celebratorio si va bien, amoroso si va mal, NUNCA severo.`;

    const user = JSON.stringify({
      semana: data.weekNumber,
      test: {
        CO: { aciertos: data.co.correct, total: data.co.total, nota: Number(coScore.toFixed(1)) },
        CE: { aciertos: data.ce.correct, total: data.ce.total, nota: Number(ceScore.toFixed(1)) },
        PE: data.pe,
        PO: data.po,
      },
      historial_semana: {
        desafios_diarios: defiRows.map((d) => ({
          dia: d.day_id,
          nota: Number(d.score_10),
          aciertos: d.hits,
          errores: d.misses,
          fortalezas: d.strengths,
          errores_detectados: d.errors,
          puntos_debiles: d.weak_points,
          recomendacion: d.recommendation,
        })),
        actividades_diarias: actRows.map((a) => ({
          dia: a.day_id,
          seccion: a.section,
          competencia: a.competence,
          nota: Number(a.score),
          aciertos: a.aciertos,
          errores: a.errores,
          punto_debil: a.punto_debil,
        })),
      },
    });

    const aiResult = await callChat(system, user);
    if (Object.keys(aiResult).length === 0) {
      throw new Error("La IA devolvió una respuesta inválida.");
    }
    const report = aiResult as unknown as WeeklyReport;

    // Sanitize competence scores
    const cs = report.competence_scores ?? { CO: 0, CE: 0, PE: 0, PO: 0 };
    const clamp = (n: number) => Math.max(0, Math.min(10, Number(Number(n).toFixed(1))));
    const compScores = {
      CO: clamp(coScore),
      CE: clamp(ceScore),
      PE: clamp(Number(cs.PE ?? 0)),
      PO: clamp(Number(cs.PO ?? 0)),
    };
    const testScore = clamp((compScores.CO + compScores.CE + compScores.PE + compScores.PO) / 4);

    // Week history score = avg defi scores + activity scores
    const defiAvg = defiRows.length
      ? defiRows.reduce((a, b) => a + Number(b.score_10), 0) / defiRows.length
      : 0;
    const actAvg = actRows.length
      ? actRows.reduce((a, b) => a + Number(b.score), 0) / actRows.length
      : 0;
    const historyScore = defiAvg && actAvg ? (defiAvg + actAvg) / 2 : defiAvg || actAvg;
    const weeklyScore = clamp(testScore * 0.5 + historyScore * 0.5);

    // Verdict fallback
    const verdict_key: WeeklyReport["verdict_key"] =
      weeklyScore >= 8.5 ? "excellent" : weeklyScore >= 7 ? "tres_bien" : weeklyScore >= 5 ? "en_camino" : "retomar";
    const verdict_title =
      report.verdict_title ||
      { excellent: "Excellente semaine !", tres_bien: "Très bien !", en_camino: "En camino", retomar: "Semana para retomar" }[verdict_key];

    const finalReport: WeeklyReport = {
      ...report,
      competence_scores: compScores,
      verdict_key,
      verdict_title,
      verdict_message: report.verdict_message ?? "",
      strengths: Array.isArray(report.strengths) ? report.strengths : [],
      common_errors: Array.isArray(report.common_errors) ? report.common_errors : [],
      improvements: Array.isArray(report.improvements) ? report.improvements : [],
      pronunciation: Array.isArray(report.pronunciation) ? report.pronunciation : [],
      coach_summary: String(report.coach_summary ?? ""),
    };

    const daysCompleted = new Set(defiRows.map((d) => d.day_id)).size;

    // Service role: weekly_evaluations holds the AI score that fires the
    // +3-stars trigger, so students must not write it directly.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("weekly_evaluations")
      .upsert(
        {
          user_id: context.userId,
          week_number: data.weekNumber,
          test_scores: compScores,
          test_score: testScore,
          weekly_score: weeklyScore,
          ai_report: finalReport,
          responses: { co: data.co, ce: data.ce, pe: data.pe, po: data.po },
        },
        { onConflict: "user_id,week_number" },
      );

    return {
      weeklyScore,
      testScore,
      historyScore: clamp(historyScore),
      compScores,
      report: finalReport,
      daysCompleted,
    };
  });

export const markWeeklyPdfGenerated = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { weekNumber?: number };
    return { weekNumber: Number(d?.weekNumber ?? 1) };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("weekly_evaluations")
      .update({ pdf_generated: true, pdf_generated_at: new Date().toISOString() })
      .eq("user_id", context.userId)
      .eq("week_number", data.weekNumber);
    return { ok: true };
  });

export const getMyWeeklyEvaluation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { weekNumber?: number };
    return { weekNumber: Number(d?.weekNumber ?? 1) };
  })
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("weekly_evaluations")
      .select("*")
      .eq("user_id", context.userId)
      .eq("week_number", data.weekNumber)
      .maybeSingle();
    return row;
  });
