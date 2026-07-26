import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callChat } from "@/lib/ai";
import { assertWeekNotLocked } from "@/lib/content-access.functions";

const callAI = (system: string, user: string) => callChat(system, user);

/* ---------- Writing evaluation ---------- */

export const evaluateWeek2Writing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { situation?: 1 | 2; text?: string };
    if (!d?.situation || !d?.text) throw new Error("Invalid input");
    return { situation: d.situation === 2 ? 2 : 1, text: String(d.text).slice(0, 4000) };
  })
  .handler(async ({ data, context }) => {
    // Week-2 challenge is week-2 content: honour an admin lock on week 2.
    await assertWeekNotLocked(context, 2);
    const criteria =
      data.situation === 1
        ? [
            "Usa futur proche correctamente al menos 2 veces",
            "Vocabulario apropiado de restaurante",
            "Diálogo con al menos 8 intercambios",
            "Menciona restricción alimentaria correctamente",
            "Pide la cuenta con la fórmula correcta",
            "Ortografía y gramática básica",
          ]
        : [
            "Preposiciones EN/À/PAR correctas en contexto",
            "Verbo PRENDRE usado correctamente 2+ veces",
            "DEVOIR + infinitif correcto",
            "Duración del viaje mencionada correctamente",
            "Coherencia y fluidez del texto",
          ];

    const system = `Eres el Coach IA de Liberté (francés A2-B1). Evalúas una producción escrita del Défi Semana 2 (Situación ${data.situation}). Devuelves SOLO JSON válido:

{ "score_15": 0-15, "checklist": [ { "criterio": "...", "cumplido": true|false } ], "aciertos": ["..."], "mejoras": [{"dijo":"fr","corrected":"fr","regla":"es-corta"}], "feedback": "3-4 frases cálidas en español con ánimo en francés al final" }

Reglas:
- La checklist debe contener EXACTAMENTE estos criterios en orden, con boolean cumplido: ${JSON.stringify(criteria)}
- score_15 = round( (nb_cumplidos / total) * 15 ), entero.
- Prioriza comunicación sobre errores menores.
- Máximo 2 mejoras.`;

    const user = JSON.stringify({ situacion: data.situation, texto: data.text });
    const out = (await callAI(system, user)) as {
      score_15?: number;
      checklist?: { criterio: string; cumplido: boolean }[];
      aciertos?: string[];
      mejoras?: { dijo: string; corrected: string; regla: string }[];
      feedback?: string;
    };
    const score = Math.max(0, Math.min(15, Math.round(Number(out.score_15 ?? 0))));
    return {
      score_15: score,
      checklist: Array.isArray(out.checklist) ? out.checklist : [],
      aciertos: Array.isArray(out.aciertos) ? out.aciertos : [],
      mejoras: Array.isArray(out.mejoras) ? out.mejoras : [],
      feedback: String(out.feedback ?? ""),
    };
  });

/* ---------- Roleplay chat (Coach at Carrefour) ---------- */

export const chatWeek2Roleplay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { messages?: { role: "user" | "assistant"; content: string }[]; finish?: boolean };
    return {
      messages: Array.isArray(d?.messages)
        ? d.messages.slice(-40).map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: String(m.content ?? "").slice(0, 2000),
          }))
        : [],
      finish: Boolean(d?.finish),
    };
  })
  .handler(async ({ data, context }) => {
    await assertWeekNotLocked(context, 2);
    const system = `Eres un empleado amable del supermercado Carrefour en París que habla SOLO en francés claro (nivel A2-B1). El alumno está haciendo un roleplay del Défi Semana 2. Objetivos que debe cumplir:
1) Saluda y pregunta dónde está la sección de lácteos (rayon produits laitiers)
2) Usa IL Y A o IL N'Y A PAS DE al menos 1 vez
3) Usa DEVOIR + infinitif para mencionar lo que necesita comprar
4) Pregunta el precio de al menos un producto
5) Se despide y agradece

Tu comportamiento:
- Responde brevemente (máx 2 frases) en francés, natural y educado.
- No corrijas errores; sigue la conversación.
- Si es la primera respuesta, saluda: "Bonjour ! Bienvenue au Carrefour ! Je peux vous aider ?"
- Cuando finish=true, en vez de charlar devuelves el balance.

SIEMPRE devuelves SOLO este JSON:
{ "reply": "fr...", "objectives": [ {"id":1,"done":true|false},{"id":2,"done":...},{"id":3,"done":...},{"id":4,"done":...},{"id":5,"done":...} ], "score_10": 0-10, "finished": true|false, "feedback_es": "opcional, 2-3 frases al finalizar" }

score_10: (# objetivos cumplidos) * 2, redondeado. "finished" true solo cuando finish=true en input.`;

    const history = data.messages
      .map((m) => `[${m.role === "user" ? "ALUMNO" : "COACH"}] ${m.content}`)
      .join("\n");
    const user = `finish=${data.finish}\n\nHISTORIAL:\n${history || "(vacío)"}`;
    const out = (await callAI(system, user)) as {
      reply?: string;
      objectives?: { id: number; done: boolean }[];
      score_10?: number;
      finished?: boolean;
      feedback_es?: string;
    };
    const objectives = Array.isArray(out.objectives)
      ? out.objectives.map((o) => ({ id: Number(o.id), done: Boolean(o.done) }))
      : [1, 2, 3, 4, 5].map((id) => ({ id, done: false }));
    const done = objectives.filter((o) => o.done).length;
    const score = data.finish ? Math.max(0, Math.min(10, done * 2)) : Math.max(0, Math.min(10, Number(out.score_10 ?? 0)));
    return {
      reply: String(out.reply ?? ""),
      objectives,
      score_10: score,
      finished: Boolean(data.finish),
      feedback_es: String(out.feedback_es ?? ""),
    };
  });

/* ---------- Save & load result ---------- */

type Week2Report = {
  totalScore: number;
  quizScore: number;
  vocabScore: number;
  writingScore: number;
  roleplayScore: number;
  byTopic: Record<string, { correct: number; total: number }>;
  responses: unknown;
};

export const saveWeek2Result = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => input as Week2Report)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    // A real (small) AI report so week 2 has parity with every other week: the
    // coach panel and the auto-sent teacher message read `ai_report`, which used
    // to be `{}` here — the only week with an empty report.
    const weeklyScore = data.totalScore / 10;
    const topics = Object.entries(data.byTopic ?? {})
      .map(([k, v]) => `${k}: ${v.correct}/${v.total}`)
      .join(" · ");
    const verdict =
      weeklyScore >= 8.5 ? "EXCELLENCE" : weeklyScore >= 6 ? "TRÈS BIEN" : weeklyScore >= 4 ? "EN CAMINO" : "COURAGE";
    const weakTopics = Object.entries(data.byTopic ?? {})
      .filter(([, v]) => v.total > 0 && v.correct / v.total < 0.6)
      .map(([k]) => k);
    const aiReport = {
      verdict_key: verdict.toLowerCase().replace(" ", "_"),
      verdict_title: verdict,
      verdict_message: `Semana 2 completada con ${data.totalScore}/100.`,
      competence_scores: {
        CO: Math.round((data.quizScore / 40) * 100) / 10,
        CE: Math.round((data.vocabScore / 20) * 100) / 10,
        PE: Math.round((data.writingScore / 30) * 100) / 10,
        PO: Math.round((data.roleplayScore / 10) * 100) / 10,
      },
      strengths: [],
      common_errors: [],
      improvements: weakTopics.map((t) => `Repasar ${t.replace(/_/g, " ")}`),
      pronunciation: [],
      coach_summary:
        `Défi Semana 2: ${data.totalScore}/100 (quiz ${data.quizScore}/40, vocab ${data.vocabScore}/20, ` +
        `escritura ${data.writingScore}/30, roleplay ${data.roleplayScore}/10). Por tema: ${topics || "—"}.`,
    };
    const payload = {
      user_id: userId,
      week_number: 2,
      test_scores: {
        quiz: data.quizScore,
        vocab: data.vocabScore,
        writing: data.writingScore,
        roleplay: data.roleplayScore,
        byTopic: data.byTopic as unknown,
      } as unknown as Record<string, unknown>,
      test_score: data.totalScore,
      weekly_score: weeklyScore,
      ai_report: aiReport as unknown as Record<string, unknown>,
      responses: (data.responses ?? {}) as Record<string, unknown>,
    };
    // Service role: this row fires the weekly star trigger; students must not
    // write it directly.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("weekly_evaluations")
      .upsert(payload as never, { onConflict: "user_id,week_number" });
    if (error) throw new Error(error.message);
    // Same automatic delivery to the teacher as every other week (best-effort).
    try {
      const { sendWeeklyReportToTeacher } = await import("@/lib/week.functions");
      await sendWeeklyReportToTeacher(supabaseAdmin, userId, 2, weeklyScore, aiReport);
    } catch (e) {
      console.error("[week2] report delivery failed", e);
    }
    return { ok: true };
  });

export const getMyWeek2Result = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("weekly_evaluations")
      .select("test_scores, test_score, weekly_score, responses, created_at, updated_at")
      .eq("user_id", userId)
      .eq("week_number", 2)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });
