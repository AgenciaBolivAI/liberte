import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callChat, transcribeFr } from "@/lib/ai";
import { assertWeekNotLocked } from "@/lib/content-access.functions";
import { requireApprovedStudent } from "@/lib/approval";

/* ---------- Which days did the user complete ---------- */

/** A "done" day = défi submitted (defi_results) OR day marked complete
 *  (day_completions) — the SAME union the server-side evaluateWeek gate and
 *  every progress surface use. This used to read defi_results only, which made
 *  the weekly-challenge routes stricter than the sidebar that says
 *  "Disponible": a student who finished Day 10 without submitting the défi
 *  audio was invited in and then blocked ("terminé el día 10 pero no se me
 *  abre el desafío"). */
export const getCompletedDays = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [defis, comps] = await Promise.all([
      context.supabase.from("defi_results").select("day_id").eq("user_id", context.userId),
      context.supabase.from("day_completions").select("day_id").eq("user_id", context.userId),
    ]);
    if (defis.error) throw defis.error;
    if (comps.error) throw comps.error;
    return Array.from(
      new Set([...(defis.data ?? []), ...(comps.data ?? [])].map((r) => Number(r.day_id))),
    ).sort((a, b) => a - b);
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

/** Pronunciation focus per week, so the AI grades the sounds actually taught
 *  that week (it used to check week-1 sounds for EVERY week). Keyed by week
 *  number; weeks fall back to a generic instruction. */
const PRONUNCIATION_TARGETS: Record<number, string> = {
  1: "voudrais [vudʁɛ], croissant [kʁwasɑ̃], sans [sɑ̃], s'il vous plaît [sil vu plɛ]",
  2: "l'addition [ladisjɔ̃], je voudrais [ʒə vudʁɛ], combien [kɔ̃bjɛ̃], merci [mɛʁsi]",
  3: "à gauche [a goʃ], tout droit [tu dʁwa], en face de [ɑ̃ fas də], j'ai mal [ʒe mal]",
  4: "taille [taj], essayer [eseje], un kilo de [œ̃ kilo də], s'inscrire [sɛ̃skʁiʁ]",
  5: "allô [alo], je vais [ʒə vɛ], je le rappelle [ʒələʁapɛl], aujourd'hui [oʒuʁdɥi]",
  6: "cordialement [kɔʁdjalmɑ̃], répéter [ʁepete], plus [ply], moins [mwɛ̃]",
  7: "lui [lɥi], leur [lœʁ], je viens de [ʒəvjɛ̃də], d'abord [daboʁ], ensuite [ɑ̃sɥit]",
  8: "remplissez [ʁɑ̃plise], cochez [koʃe], il dit que [ildikə], je voudrais savoir [ʒəvudʁɛsavwaʁ]",
};

/** Push a finished weekly report into the teacher's Mensajes inbox (sender =
 *  the student, so the thread lives between the right two people). Recipients:
 *  the student's assigned teacher, or every admin when none is assigned. */
export async function sendWeeklyReportToTeacher(
  supabaseAdmin: {
    from: (t: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
  },
  studentId: string,
  weekNumber: number,
  weeklyScore: number,
  report: { verdict_title?: string; coach_summary?: string },
): Promise<void> {
  const { data: prof } = await supabaseAdmin
    .from("profiles")
    .select("full_name, email, assigned_coach")
    .eq("id", studentId)
    .maybeSingle();
  let recipients: string[] = prof?.assigned_coach ? [prof.assigned_coach] : [];
  if (!recipients.length) {
    const { data: admins } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
    recipients = [...new Set(((admins ?? []) as { user_id: string }[]).map((r) => r.user_id))];
  }
  recipients = recipients.filter((r) => r !== studentId);
  if (!recipients.length) return;

  const name = prof?.full_name || prof?.email || "Alumno/a";
  const body =
    `📊 Informe semanal automático — Semana ${weekNumber}\n` +
    `Alumno/a: ${name}\n` +
    `Nota semanal: ${Number(weeklyScore).toFixed(1)}/10` +
    (report?.verdict_title ? ` · ${report.verdict_title}` : "") +
    (report?.coach_summary ? `\n\n${String(report.coach_summary).slice(0, 3000)}` : "") +
    `\n\nVer el detalle completo en el panel de seguimiento.`;
  for (const rid of recipients) {
    await supabaseAdmin.from("messages").insert({ sender_id: studentId, recipient_id: rid, body });
  }
}

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
    // Unapproved accounts can't spend OpenAI tokens.
    await requireApprovedStudent(context);
    // Hard gate: a week an admin has disabled can't be evaluated. Admins bypass.
    await assertWeekNotLocked(context, data.weekNumber);

    // Server-side completion gate. The weekly evaluation inserts a
    // weekly_evaluations row, which fires a +3-star trigger — so a crafted call
    // must not score (and mint stars for) a week the student hasn't finished.
    // "Finished" = the week's LAST day is done (marked complete OR défi
    // submitted), mirroring the client gate. Admins bypass for content review.
    {
      const { data: isAdmin } = await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "admin",
      });
      if (!isAdmin) {
        const lastDay = data.weekNumber * 5;
        const [dc, dr] = await Promise.all([
          context.supabase.from("day_completions").select("day_id").eq("user_id", context.userId).eq("day_id", lastDay).maybeSingle(),
          context.supabase.from("defi_results").select("day_id").eq("user_id", context.userId).eq("day_id", lastDay).maybeSingle(),
        ]);
        if (!dc.data && !dr.data) {
          throw new Error(`Termina el Día ${lastDay} antes de hacer la evaluación de la semana ${data.weekNumber}.`);
        }
      }
    }
    // ---- Fetch weekly data from DB ----
    // Week N covers days (N-1)*5+1 .. N*5 (5 days/week), so the AI evaluation
    // reads the right days for ANY week — not just week 1.
    const dayIds = Array.from({ length: 5 }, (_, i) => (data.weekNumber - 1) * 5 + i + 1);
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

Tu tarea: dar puntuaciones justas de PE y PO sobre 10, y generar un informe cálido en español (con ejemplos concretos citando lo que ESCRIBIÓ/DIJO el alumno).

REGLA CLAVE sobre el audio: las lecturas llegan como TRANSCRIPCIÓN AUTOMÁTICA imperfecta, NO como audio. El reconocedor quita acentos, une/separa palabras, confunde homófonos y "normaliza" el francés — una transcripción distinta del texto NO prueba mala pronunciación. Señala como error de pronunciación SOLO diferencias que un reconocedor no produciría por sí solo (palabra completamente distinta, sílabas ausentes) y, ante la duda, cuenta a favor del alumno. PO se puntúa por COMUNICACIÓN: si completó la tarea y se le entiende, 7-10. Sonidos objetivo de esta semana (guía, no lista de fallos): ${PRONUNCIATION_TARGETS[data.weekNumber] ?? "los sonidos que aparecen en las lecturas de esta semana"}.

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

    // Deliver the report to the teacher's Mensajes inbox automatically (client
    // request: the student report should reach their teacher in-platform, not by
    // WhatsApp). Recipient = the student's assigned teacher; fallback = every
    // admin. Best-effort: a delivery failure must never fail the evaluation.
    try {
      await sendWeeklyReportToTeacher(supabaseAdmin, context.userId, data.weekNumber, weeklyScore, finalReport);
    } catch (e) {
      console.error("[weekly] report delivery failed", e);
    }

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

/** Every weekly evaluation of the logged-in student — powers the « Mes
 *  rapports » list on /progress so past reports (and their PDFs) are always
 *  findable, not only on the one-time result screen. */
export const getMyWeeklyEvaluations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("weekly_evaluations")
      .select("week_number, weekly_score, test_score, test_scores, ai_report, created_at")
      .eq("user_id", context.userId)
      .order("week_number", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
