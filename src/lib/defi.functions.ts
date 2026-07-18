import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callChat, transcribeFr } from "@/lib/ai";

/* ---------------- Correct one open activity (PE or PO) ---------------- */

const CORRECTOR_SYSTEM = `Eres el corrector de Liberté, un programa de francés para hispanohablantes de nivel A2-B1. Evalúa la respuesta del alumno contra la consigna. Reglas: (1) Prioriza la comunicación: si un francófono lo entendería, es un acierto aunque tenga errores menores. (2) Máximo 2 correcciones, las más importantes. (3) Tono cálido y celebratorio, nunca severo. (4) Responde SOLO en este formato JSON:

{ "resultado": "correcto | parcial | incorrecto",
  "nota": 0-10,
  "aciertos": ["estructura o frase que usó bien", "..."],
  "errores": [{"dijo": "...", "correcto": "...", "regla": "una línea"}],
  "punto_debil": "competencia o estructura a reforzar",
  "practica_recomendada": "una acción concreta y pequeña",
  "feedback_alumno": "2 frases cálidas en español: qué hizo bien + la mejora, terminando con ánimo en francés (ej. 'Continue comme ça !')" }`;

type CorrectionResult = {
  resultado: "correcto" | "parcial" | "incorrecto";
  nota: number;
  aciertos: string[];
  errores: { dijo: string; correcto: string; regla: string }[];
  punto_debil: string;
  practica_recomendada: string;
  feedback_alumno: string;
};

export const correctActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as {
      dayId?: number;
      section?: string;
      competence?: string;
      itemIndex?: number;
      prompt?: string;
      expected?: string;
      response?: string;
    };
    if (!d?.dayId) throw new Error("dayId required");
    if (!d?.response) throw new Error("response required");
    const section = d.section === "cles" ? "cles" : "vocab";
    const competence = d.competence === "PO" ? "PO" : d.competence === "CE" ? "CE" : d.competence === "CO" ? "CO" : "PE";
    return {
      dayId: Number(d.dayId),
      section,
      competence,
      itemIndex: Number(d.itemIndex ?? 0),
      prompt: String(d.prompt ?? ""),
      expected: String(d.expected ?? ""),
      response: String(d.response),
    };
  })
  .handler(async ({ data, context }) => {
    const user = JSON.stringify({
      dia: data.dayId,
      seccion: data.section,
      competencia: data.competence,
      consigna: data.prompt,
      respuesta_esperada: data.expected,
      respuesta_alumno: data.response,
    });

    const aiRaw = await callChat(CORRECTOR_SYSTEM, user);
    if (Object.keys(aiRaw).length === 0) {
      throw new Error("La IA devolvió una respuesta inválida.");
    }
    const parsed = aiRaw as unknown as CorrectionResult;

    const resultado =
      parsed.resultado === "correcto" || parsed.resultado === "incorrecto" || parsed.resultado === "parcial"
        ? parsed.resultado
        : "parcial";
    const nota = Math.max(0, Math.min(10, Number(parsed.nota ?? 0)));
    const aciertos = Array.isArray(parsed.aciertos) ? parsed.aciertos.map(String) : [];
    const errores = Array.isArray(parsed.errores)
      ? parsed.errores.map((e) => ({
          dijo: String(e?.dijo ?? ""),
          correcto: String(e?.correcto ?? ""),
          regla: String(e?.regla ?? ""),
        }))
      : [];

    // Save (non-blocking failure — we still return feedback to the student)
    try {
      await context.supabase.from("activity_results").insert({
        user_id: context.userId,
        day_id: data.dayId,
        section: data.section,
        competence: data.competence,
        item_index: data.itemIndex,
        prompt: data.prompt,
        expected: data.expected,
        response: data.response,
        resultado,
        score: nota,
        aciertos,
        errores,
        punto_debil: String(parsed.punto_debil ?? ""),
        practica_recomendada: String(parsed.practica_recomendada ?? ""),
        feedback_alumno: String(parsed.feedback_alumno ?? ""),
      });
    } catch {
      // ignore — feedback still returned
    }

    return {
      resultado,
      nota,
      aciertos,
      errores,
      punto_debil: String(parsed.punto_debil ?? ""),
      practica_recomendada: String(parsed.practica_recomendada ?? ""),
      feedback_alumno: String(parsed.feedback_alumno ?? ""),
    };
  });



/* ---------------- STT: transcribe one stage ---------------- */

export const transcribeStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { audioBase64?: string; mimeType?: string };
    if (!d?.audioBase64) throw new Error("audioBase64 required");
    return { audioBase64: d.audioBase64, mimeType: d.mimeType || "audio/webm" };
  })
  .handler(async ({ data }) => {
    return { text: await transcribeFr(data.audioBase64, data.mimeType) };
  });

/* ---------------- Evaluate & save ---------------- */

type StageInput = { hint: string; example: string; transcript: string };

export const evaluateDefi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as {
      dayId?: number;
      title?: string;
      criteria?: string[];
      stages?: StageInput[];
    };
    if (!d?.dayId || !Array.isArray(d.stages) || !Array.isArray(d.criteria)) {
      throw new Error("Invalid input");
    }
    return {
      dayId: Number(d.dayId),
      title: String(d.title ?? ""),
      criteria: d.criteria.map(String),
      stages: d.stages.map((s) => ({
        hint: String(s.hint ?? ""),
        example: String(s.example ?? ""),
        transcript: String(s.transcript ?? ""),
      })),
    };
  })
  .handler(async ({ data, context }) => {
    const system = `Eres una profesora de francés cálida y precisa. Evalúas el DESAFÍO FINAL del Día ${data.dayId} ("${data.title}"). Recibes por cada etapa: la intención (hint), el ejemplo base en francés y la transcripción real del alumno. Devuelves SOLO JSON válido con esta forma exacta, sin texto extra:

{
  "stages": [ { "passed": boolean, "note": "es-corta", "error": null | { "said": "fr", "corrected": "fr" } } ],
  "matched_criteria": ["criterio 1", ...],
  "strengths": ["...", "..."],
  "improvement": { "said": "fr", "corrected": "fr" },
  "score_10": 0-10,
  "celebration_message": "es-cálido",
  "weak_points": ["..."],
  "recommendation": "es-corta"
}

Reglas:
- "stages" debe tener EXACTAMENTE ${data.stages.length} elementos, en orden.
- "matched_criteria" = subconjunto EXACTO de los criterios provistos que el alumno SÍ cumplió (copia el texto literal).
- "strengths" = 2 elogios concretos en español.
- "improvement" = 1 mejora: cita lo que dijo (o su hueco) y da la versión corregida en francés.
- "score_10" = (aciertos_criterios / total_criterios) * 10, redondeado a 1 decimal.
- "weak_points" = 1-3 puntos débiles en español (por estructura o competencia).
- "recommendation" = "debería practicar…" con 1-2 acciones concretas.
Tono cálido, profesional, en español.`;

    const user = JSON.stringify({
      criterios: data.criteria,
      etapas: data.stages.map((s, i) => ({
        n: i + 1,
        hint: s.hint,
        example_fr: s.example,
        transcript_fr: s.transcript || "(sin audio detectado)",
      })),
    });

    const aiResult = await callChat(system, user);

    type Eval = {
      stages: { passed: boolean; note: string; error: null | { said: string; corrected: string } }[];
      matched_criteria: string[];
      strengths: string[];
      improvement: { said: string; corrected: string };
      score_10: number;
      celebration_message: string;
      weak_points: string[];
      recommendation: string;
    };
    if (Object.keys(aiResult).length === 0) {
      throw new Error("La IA devolvió una respuesta inválida. Intenta de nuevo.");
    }
    const parsed = aiResult as unknown as Eval;

    const matched = Array.isArray(parsed.matched_criteria) ? parsed.matched_criteria : [];
    const hits = matched.length;
    const misses = Math.max(0, data.criteria.length - hits);
    const score =
      typeof parsed.score_10 === "number"
        ? Math.max(0, Math.min(10, Number(parsed.score_10.toFixed(1))))
        : Number(((hits / Math.max(1, data.criteria.length)) * 10).toFixed(1));

    const errors: { stage: number; said: string; corrected: string }[] = [];
    (parsed.stages ?? []).forEach((s, i) => {
      if (s?.error?.corrected) {
        errors.push({ stage: i + 1, said: s.error.said ?? "", corrected: s.error.corrected });
      }
    });
    if (parsed.improvement?.corrected) {
      errors.push({ stage: 0, said: parsed.improvement.said ?? "", corrected: parsed.improvement.corrected });
    }

    const stagesRecord = data.stages.map((s, i) => ({
      n: i + 1,
      hint: s.hint,
      transcript: s.transcript,
      passed: !!parsed.stages?.[i]?.passed,
      note: parsed.stages?.[i]?.note ?? "",
    }));

    const { error: upErr } = await context.supabase
      .from("defi_results")
      .upsert(
        {
          user_id: context.userId,
          day_id: data.dayId,
          score_10: score,
          hits,
          misses,
          strengths: parsed.strengths ?? [],
          errors,
          weak_points: parsed.weak_points ?? [],
          recommendation: parsed.recommendation ?? "",
          celebration_message: parsed.celebration_message ?? "",
          stages: stagesRecord,
        },
        { onConflict: "user_id,day_id" },
      );
    if (upErr) {
      // fall back to plain insert if no unique — non-fatal for UX
      await context.supabase.from("defi_results").insert({
        user_id: context.userId,
        day_id: data.dayId,
        score_10: score,
        hits,
        misses,
        strengths: parsed.strengths ?? [],
        errors,
        weak_points: parsed.weak_points ?? [],
        recommendation: parsed.recommendation ?? "",
        celebration_message: parsed.celebration_message ?? "",
        stages: stagesRecord,
      });
    }

    return {
      score,
      hits,
      misses,
      total: data.criteria.length,
      strengths: parsed.strengths ?? [],
      improvement: parsed.improvement ?? { said: "", corrected: "" },
      celebration_message: parsed.celebration_message ?? "",
      recommendation: parsed.recommendation ?? "",
      weak_points: parsed.weak_points ?? [],
      matched_criteria: matched,
      stages: stagesRecord,
    };
  });

/* ---------------- Reads ---------------- */

export const getMyDefiResults = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("defi_results")
      .select("*")
      .eq("user_id", context.userId)
      .order("day_id");
    if (error) throw error;
    return data ?? [];
  });

export const getCoachRoster = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Verify role
    const { data: isCoach } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "coach",
    });
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isCoach && !isAdmin) return [];

    const { data: profiles, error } = await context.supabase
      .from("profiles")
      .select("id, full_name, email");
    if (error) throw error;

    const { data: results } = await context.supabase
      .from("defi_results")
      .select("user_id, day_id, score_10, hits, misses, created_at");

    const byUser = new Map<string, { day_id: number; score_10: number; hits: number; misses: number }[]>();
    (results ?? []).forEach((r) => {
      const arr = byUser.get(r.user_id) ?? [];
      arr.push({ day_id: r.day_id, score_10: Number(r.score_10), hits: r.hits, misses: r.misses });
      byUser.set(r.user_id, arr);
    });

    return (profiles ?? []).map((p) => {
      const rs = byUser.get(p.id) ?? [];
      const avg = rs.length ? rs.reduce((a, b) => a + b.score_10, 0) / rs.length : 0;
      return {
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        days_completed: rs.length,
        avg_score: Number(avg.toFixed(1)),
        total_hits: rs.reduce((a, b) => a + b.hits, 0),
        total_misses: rs.reduce((a, b) => a + b.misses, 0),
      };
    });
  });

export const getStudentResults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { userId?: string };
    if (!d?.userId) throw new Error("userId required");
    return { userId: String(d.userId) };
  })
  .handler(async ({ data, context }) => {
    const { data: isCoach } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "coach",
    });
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isCoach && !isAdmin) throw new Error("Forbidden");

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", data.userId)
      .maybeSingle();

    const { data: results, error } = await context.supabase
      .from("defi_results")
      .select("*")
      .eq("user_id", data.userId)
      .order("day_id");
    if (error) throw error;
    const { data: weekly } = await context.supabase
      .from("weekly_evaluations")
      .select("week_number, weekly_score, test_scores, pdf_generated, pdf_generated_at, created_at")
      .eq("user_id", data.userId)
      .order("week_number");
    return { profile, results: results ?? [], weekly: weekly ?? [] };
  });

export const getWeekDefiSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { fromDay?: number; toDay?: number };
    return { fromDay: Number(d?.fromDay ?? 1), toDay: Number(d?.toDay ?? 7) };
  })
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("get_week_defi_summary", {
      _user_id: context.userId,
      _from_day: data.fromDay,
      _to_day: data.toDay,
    });
    if (error) throw error;
    return rows?.[0] ?? null;
  });
