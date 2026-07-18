import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callChat } from "@/lib/ai";
import { getTutorDayContext, TUTOR_MAX_DAY } from "@/lib/tutorContext";

export const TUTOR_DAILY_LIMIT = 30;
const MAX_HISTORY = 20;
const MAX_VOCAB_IN_PROMPT = 30;

export type TutorMessage = { role: "user" | "assistant"; content: string };
export type TutorCorrection = { said: string; corrected: string; rule_es: string } | null;

type Ctx = {
  supabase: {
    from: (table: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => PromiseLike<{ data: unknown; error?: { message: string } | null }>;
  };
  userId: string;
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// Scenes follow the same progressive unlock as the lessons: day N opens once
// day N-1 is finished (défi submitted or day marked complete). Enforced here
// too, not just in the picker, so the server fn can't be called for a locked
// day. Admins bypass.
async function assertDayUnlocked(context: Ctx, dayId: number): Promise<void> {
  if (dayId <= 1) return;
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (isAdmin) return;
  const prev = dayId - 1;
  const [completions, defis] = await Promise.all([
    context.supabase
      .from("day_completions")
      .select("day_id")
      .eq("user_id", context.userId)
      .eq("day_id", prev)
      .maybeSingle(),
    context.supabase
      .from("defi_results")
      .select("day_id")
      .eq("user_id", context.userId)
      .eq("day_id", prev)
      .maybeSingle(),
  ]);
  if (!completions.data && !defis.data) {
    throw new Error(`Termina el Día ${prev} para desbloquear esta escena. 🔒`);
  }
}

// The paid-AI gate: unapproved accounts can't spend tokens. Fails open if the
// approval migration hasn't been applied yet (column missing → query error).
async function requireApprovedStudent(context: Ctx): Promise<void> {
  try {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("approved_at")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) return; // pre-migration: fail open
    if (data && data.approved_at == null) {
      const { data: isAdmin } = await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "admin",
      });
      if (!isAdmin) {
        throw new Error("Tu cuenta aún no está aprobada. El equipo activará tu acceso pronto.");
      }
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Tu cuenta")) throw e;
    // any other failure: fail open
  }
}

function buildTutorSystem(dayId: number): string {
  const ctx = getTutorDayContext(dayId);
  const vocab = ctx.vocab
    .slice(0, MAX_VOCAB_IN_PROMPT)
    .map((v) => `${v.fr} (${v.es})`)
    .join(" · ");
  const grammar = ctx.grammar.join("\n- ");
  const objectives = ctx.scenario.objectives.map((o, i) => `${i + 1}. ${o}`).join("\n");
  return `Eres "Lib", la tutora de conversación del programa Liberté (francés para hispanohablantes PRINCIPIANTES, nivel A1-A2). Hoy es el Día ${ctx.dayId}: ${ctx.topic}.

ESCENA (roleplay): Tú eres ${ctx.scenario.role}. Tu primera frase ya fue: « ${ctx.scenario.opener_fr} ». Mantente SIEMPRE en tu papel dentro de la escena, con calidez.

OBJETIVOS DEL ALUMNO en esta escena (en orden):
${objectives}

VOCABULARIO DEL DÍA (úsalo activamente y da preferencia a estas palabras): ${vocab}

ESTRUCTURAS DEL DÍA:
- ${grammar}

REGLAS:
1. "reply_fr" es TU respuesta COMO PERSONAJE de la escena (ej.: la serveuse responde al pedido del cliente). NUNCA repitas ahí la frase corregida del alumno — las correcciones van SOLO en "correction". Ejemplo: alumno dice « je veux un café » → reply_fr: « Très bien, un café ! Et avec ça ? », correction: {"said":"je veux","corrected":"je voudrais",…}.
2. Francés MUY sencillo: máximo 2 frases CORTAS (10-12 palabras), presente y fórmulas hechas. El alumno es principiante — nada de subjuntivo ni frases largas.
3. Termina casi siempre con una pregunta corta que invite al alumno a cumplir su siguiente objetivo pendiente.
4. Corrige con cariño: máximo UNA corrección por turno y solo si el error es importante; si no, "correction" = null.
5. Si el alumno escribe en español o parece perdido: mantente en francés sencillo, y en "suggestion" dale exactamente la frase que necesita.
6. "reply_es" = traducción natural al español de tu "reply_fr" (siempre).
7. "suggestion" = una frase corta en francés que el alumno PODRÍA decir ahora para avanzar en sus objetivos, con su traducción (siempre).
8. "objectives_done" = lista ACUMULADA de números de objetivos que el alumno YA cumplió en TODA la conversación (historial + este turno). Sé GENEROSO: si comunicó la idea del objetivo, cuenta — aunque tenga errores de gramática. Ejemplo: « bonjour, je veux un café » cumple el objetivo "saludar y pedir una bebida" → [1].
9. "encouragement_es" = ánimo breve en español, solo cuando aporte (si no, null). Si acaba de cumplir los 3 objetivos, celébralo aquí.

Respondes SIEMPRE con SOLO este JSON válido, sin texto extra:
{ "reply_fr": "…",
  "reply_es": "…",
  "suggestion": { "fr": "…", "es": "…" },
  "objectives_done": [1],
  "correction": null | { "said": "…", "corrected": "…", "rule_es": "…" },
  "encouragement_es": null | "…" }`;
}

/* ---------------- Load current state ---------------- */

export const getTutorState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const c = context as unknown as Ctx;
    let messages: TutorMessage[] = [];
    let dayId = 1;
    let used = 0;
    let objectivesDone: number[] = [];
    try {
      const [{ data: conv }, { data: usage }] = await Promise.all([
        c.supabase
          .from("tutor_conversations")
          .select("day_id, messages, objectives_done")
          .eq("user_id", c.userId)
          .maybeSingle(),
        c.supabase
          .from("tutor_usage")
          .select("message_count")
          .eq("user_id", c.userId)
          .eq("usage_date", todayKey())
          .maybeSingle(),
      ]);
      if (conv) {
        dayId = Number(conv.day_id) || 1;
        if (Array.isArray(conv.messages)) messages = conv.messages as TutorMessage[];
        if (Array.isArray(conv.objectives_done)) {
          objectivesDone = (conv.objectives_done as number[]).map(Number);
        }
      }
      used = Number(usage?.message_count ?? 0);
    } catch {
      // tables missing pre-migration → fresh state, full quota
    }
    return {
      messages,
      dayId,
      objectivesDone,
      remaining: Math.max(0, TUTOR_DAILY_LIMIT - used),
    };
  });

/* ---------------- Send one message ---------------- */

export const sendTutorMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { dayId?: number; text?: string };
    const text = String(d?.text ?? "").trim();
    if (!text) throw new Error("Escribe un mensaje primero.");
    const dayId = Math.max(1, Math.min(TUTOR_MAX_DAY, Number(d?.dayId) || 1));
    return { dayId, text: text.slice(0, 1000) };
  })
  .handler(async ({ data, context }) => {
    const c = context as unknown as Ctx;
    await requireApprovedStudent(c);
    await assertDayUnlocked(c, data.dayId);

    // Daily cap: a single atomic statement checks the limit AND increments, so
    // parallel requests can't both slip through on the same count.
    const { data: consumed, error: usageError } = await c.supabase.rpc(
      "tutor_consume_message",
      { _limit: TUTOR_DAILY_LIMIT },
    );
    if (usageError) {
      throw new Error(
        "El tutor aún no está disponible: falta aplicar la migración de base de datos.",
      );
    }
    if (consumed === null || consumed === undefined) {
      throw new Error(
        "Has llegado a tu límite de mensajes de hoy. ¡Vuelve mañana para seguir practicando! 🌙",
      );
    }
    const used = Number(consumed) - 1;

    // History (reset when the student switches day).
    let history: TutorMessage[] = [];
    let prevObjectives: number[] = [];
    const { data: conv } = await c.supabase
      .from("tutor_conversations")
      .select("day_id, messages, objectives_done")
      .eq("user_id", c.userId)
      .maybeSingle();
    if (conv && Number(conv.day_id) === data.dayId) {
      if (Array.isArray(conv.messages)) {
        history = (conv.messages as TutorMessage[]).slice(-MAX_HISTORY);
      }
      if (Array.isArray(conv.objectives_done)) {
        prevObjectives = (conv.objectives_done as number[]).map(Number);
      }
    }

    const out = await callChat(buildTutorSystem(data.dayId), [
      ...history,
      { role: "user", content: data.text },
    ]);

    const reply = String(out.reply_fr ?? "").trim() || "Pardon, peux-tu répéter ?";
    const replyEs = String(out.reply_es ?? "").trim() || null;
    const rawSuggestion = out.suggestion as Record<string, unknown> | null | undefined;
    const suggestion =
      rawSuggestion && typeof rawSuggestion === "object" && rawSuggestion.fr
        ? { fr: String(rawSuggestion.fr), es: String(rawSuggestion.es ?? "") }
        : null;
    const rawCorrection = out.correction as Record<string, unknown> | null | undefined;
    const correction: TutorCorrection =
      rawCorrection && typeof rawCorrection === "object" && rawCorrection.corrected
        ? {
            said: String(rawCorrection.said ?? ""),
            corrected: String(rawCorrection.corrected ?? ""),
            rule_es: String(rawCorrection.rule_es ?? ""),
          }
        : null;
    const encouragement = out.encouragement_es ? String(out.encouragement_es) : null;

    // Objectives only ever accumulate — the model can add, never remove.
    const modelObjectives = Array.isArray(out.objectives_done)
      ? (out.objectives_done as unknown[]).map(Number).filter((n) => n >= 1 && n <= 3)
      : [];
    const objectivesDone = Array.from(new Set([...prevObjectives, ...modelObjectives])).sort();

    const fullHistory: TutorMessage[] = [
      ...history,
      { role: "user", content: data.text },
      { role: "assistant", content: reply },
    ];
    const nextMessages = fullHistory.slice(-MAX_HISTORY * 2);

    await c.supabase.from("tutor_conversations").upsert(
      {
        user_id: c.userId,
        day_id: data.dayId,
        messages: nextMessages,
        objectives_done: objectivesDone,
      },
      { onConflict: "user_id" },
    );

    return {
      reply,
      replyEs,
      suggestion,
      correction,
      encouragement,
      objectivesDone,
      remaining: Math.max(0, TUTOR_DAILY_LIMIT - (used + 1)),
    };
  });

/* ---------------- Reset ---------------- */

export const resetTutorConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { dayId?: number };
    return { dayId: Math.max(1, Math.min(TUTOR_MAX_DAY, Number(d?.dayId) || 1)) };
  })
  .handler(async ({ data, context }) => {
    const c = context as unknown as Ctx;
    try {
      await c.supabase.from("tutor_conversations").upsert(
        { user_id: c.userId, day_id: data.dayId, messages: [], objectives_done: [] },
        { onConflict: "user_id" },
      );
    } catch {
      // table missing pre-migration — nothing to reset
    }
    return { ok: true };
  });
