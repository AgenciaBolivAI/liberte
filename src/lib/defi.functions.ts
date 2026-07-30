import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callChat, parseScore10, transcribeFr } from "@/lib/ai";
import { assertDayNotLocked } from "@/lib/content-access.functions";
import { requireApprovedStudent } from "@/lib/approval";
import { aiText, aiTextList } from "@/lib/ai-text";

/* ---------------- Correct one open activity (PE or PO) ---------------- */

const CORRECTOR_SYSTEM = `Eres el corrector de Liberté, un programa de francés para hispanohablantes de nivel A1-A2 (principiantes). Evalúa la respuesta del alumno contra la consigna. Reglas: (1) Prioriza la comunicación: si un francófono lo entendería, es un acierto aunque tenga errores menores. (2) MUY IMPORTANTE para respuestas ORALES (competencia PO): la respuesta llega como TRANSCRIPCIÓN AUTOMÁTICA imperfecta. El sistema de reconocimiento suele quitar acentos, unir o separar palabras, confundir homófonos (« c'est » / « ses » / « sait », « a » / « à ») y normalizar el francés del alumno. NUNCA marques como error algo que probablemente sea ruido de transcripción; ante la duda, cuenta a favor del alumno. Solo señala errores claros de vocabulario o estructura que la transcripción no explicaría. (3) Máximo 2 correcciones, las más importantes. (4) Tono cálido y celebratorio, nunca severo. (5) LA NOTA: "nota" es un NÚMERO (no texto) de 0 a 10 y mide COMUNICACIÓN, no perfección. Si el alumno hizo la tarea y se le entiende, la nota es 7-10 aunque tenga errores de principiante. Usa 5-6.9 solo cuando la idea se entiende a medias, y menos de 5 solo cuando la respuesta no responde a la consigna o no se entiende. La "respuesta_esperada" es UN ejemplo válido, no la única respuesta correcta: no bajes la nota por no coincidir con ella. (6) "punto_debil" y "practica_recomendada" son orientación para seguir mejorando; escribirlos NO significa que la nota deba bajar. (7) Responde SOLO en este formato JSON:

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
    // Unapproved accounts can't spend OpenAI tokens.
    await requireApprovedStudent(context);
    // Same hard gate as evaluateDefi: a day an admin disabled can't run the
    // paid per-activity AI correction either. Admins bypass.
    await assertDayNotLocked(context, data.dayId);
    const user = JSON.stringify({
      dia: data.dayId,
      seccion: data.section,
      competencia: data.competence,
      consigna: data.prompt,
      respuesta_esperada: data.expected,
      respuesta_alumno: data.response,
    });

    const aiRaw = await callChat(CORRECTOR_SYSTEM, user, { temperature: 0.2 });
    if (Object.keys(aiRaw).length === 0) {
      throw new Error("La IA devolvió una respuesta inválida.");
    }
    const parsed = aiRaw as unknown as CorrectionResult;

    const resultado =
      parsed.resultado === "correcto" || parsed.resultado === "incorrecto" || parsed.resultado === "parcial"
        ? parsed.resultado
        : "parcial";
    // `Number(parsed.nota ?? 0)` scored a perfectly good answer 0 whenever the
    // model emitted "8" as a string or omitted the key — and this number is half
    // of the weekly history score. Read the grade tolerantly, and when there is
    // genuinely no number, take it from the verdict the model DID commit to
    // instead of assuming the worst.
    const notaFromVerdict = resultado === "correcto" ? 9 : resultado === "parcial" ? 6.5 : 3;
    const nota = parseScore10(parsed.nota) ?? notaFromVerdict;
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
  .handler(async ({ data, context }) => {
    // Was completely ungated: any signed-in account could burn STT tokens.
    // (transcribeFr also caps the payload at MAX_AUDIO_B64.)
    await requireApprovedStudent(context);
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
    // Unapproved accounts can't spend OpenAI tokens.
    await requireApprovedStudent(context);
    // Hard gate: a day an admin has disabled can't be scored (also blocks the
    // paid AI call). A locked week locks its days too. Admins bypass.
    await assertDayNotLocked(context, data.dayId);
    const system = `Eres una profesora de francés cálida y precisa. Evalúas el DESAFÍO FINAL del Día ${data.dayId} ("${data.title}") de alumnos A1-A2. Recibes por cada etapa: la intención (hint), el ejemplo base en francés y la TRANSCRIPCIÓN AUTOMÁTICA (imperfecta) del audio real del alumno. Devuelves SOLO JSON válido con esta forma exacta, sin texto extra:

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
- TRANSCRIPCIÓN IMPERFECTA (regla clave): las transcripciones vienen de un
  reconocedor automático que quita acentos, une/separa palabras, confunde
  homófonos (« c'est »/« ses », « a »/« à », « et »/« est ») y "corrige" el
  francés del alumno. Cualquier desviación que pueda explicarse por la
  transcripción CUENTA A FAVOR del alumno. Un criterio se cumple si la INTENCIÓN
  comunicativa se logró, aunque las palabras exactas difieran del ejemplo.
- "matched_criteria" = criterios que el alumno cumplió EN INTENCIÓN (copia el
  texto literal del criterio). Sé generoso: A1-A2 comunicándose = criterio cumplido.
- "strengths" = 2 elogios concretos en español.
- "improvement" = 1 mejora: cita lo que dijo (o su hueco) y da la versión corregida en francés.
- "score_10" = evaluación GLOBAL de comunicación sobre 10, no una fracción
  mecánica de criterios: si el alumno completó la conversación y se hizo
  entender, la nota es 7-10; reserva <5 para intentos donde la comunicación
  realmente falló. Concede crédito parcial por criterios casi logrados.
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

    const aiResult = await callChat(system, user, { temperature: 0.2 });

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
    // The prompt asks for a GLOBAL communication mark, but this only accepted a
    // real JSON number — and `json_object` mode returns "8" as a string often
    // enough that scores kept collapsing back to the mechanical criteria
    // fraction the rubric had deliberately abandoned. Parse tolerantly first.
    const stagesPassed = (parsed.stages ?? []).filter((s) => s?.passed).length;
    const stageCount = Math.max(1, (parsed.stages ?? []).length);
    const score =
      parseScore10(parsed.score_10) ??
      // No readable number at all: fall back to how much the student actually
      // completed, taking the kinder of criteria-met vs stages-passed rather
      // than punishing them for compound criteria they mostly satisfied.
      Number(
        Math.max(
          (hits / Math.max(1, data.criteria.length)) * 10,
          (stagesPassed / stageCount) * 10,
        ).toFixed(1),
      );

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

    // Written with the service role, never the user client: defi_results holds
    // AI-computed scores that fire a star-award trigger, so students must not
    // be able to insert their own rows (which would mint stars). user_id is
    // pinned to the authenticated caller.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: upErr } = await supabaseAdmin
      .from("defi_results")
      .upsert(
        {
          user_id: context.userId,
          day_id: data.dayId,
          score_10: score,
          hits,
          misses,
          // Coerced before storage: the model does not always honour "array of
          // strings", and raw objects rendered as "[object Object]" in the
          // student's result screen and the coach panel.
          strengths: aiTextList(parsed.strengths, 4),
          errors,
          weak_points: aiTextList(parsed.weak_points, 4),
          recommendation: aiText(parsed.recommendation),
          celebration_message: aiText(parsed.celebration_message),
          stages: stagesRecord,
        },
        { onConflict: "user_id,day_id" },
      );
    if (upErr) {
      // fall back to plain insert if no unique — non-fatal for UX
      await supabaseAdmin.from("defi_results").insert({
        user_id: context.userId,
        day_id: data.dayId,
        score_10: score,
        hits,
        misses,
        strengths: aiTextList(parsed.strengths, 4),
        errors,
        weak_points: aiTextList(parsed.weak_points, 4),
        recommendation: aiText(parsed.recommendation),
        celebration_message: aiText(parsed.celebration_message),
        stages: stagesRecord,
      });
    }

    return {
      score,
      hits,
      misses,
      total: data.criteria.length,
      // Same coercion on the way to the student's result screen.
      strengths: aiTextList(parsed.strengths, 4),
      improvement: {
        said: aiText(parsed.improvement?.said),
        corrected: aiText(parsed.improvement?.corrected),
      },
      celebration_message: aiText(parsed.celebration_message),
      recommendation: aiText(parsed.recommendation),
      weak_points: aiTextList(parsed.weak_points, 4),
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
