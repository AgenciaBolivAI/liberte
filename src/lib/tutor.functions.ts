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
    rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown }>;
  };
  userId: string;
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
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
  return `Eres "Lib", la tutora de conversación del programa Liberté (francés para hispanohablantes A2-B1). Hoy practican el Día ${ctx.dayId}: ${ctx.topic}.

VOCABULARIO DEL DÍA (úsalo activamente en tus respuestas): ${vocab}

ESTRUCTURAS DEL DÍA:
- ${grammar}

REGLAS DE CONVERSACIÓN:
1. Conversa SOLO en francés simple y claro (A2-B1), máximo 2-3 frases por turno, sobre el tema del día. Haz preguntas para que el alumno hable.
2. Corrige con cariño: máximo UNA corrección por turno, solo si el error es importante. Si no hay error relevante, "correction" es null.
3. Nunca cambies al español dentro de "reply_fr". El ánimo en español va en "encouragement_es" (1 frase corta, opcional — usa null si no aporta).
4. Si el alumno escribe en español, anímale en "encouragement_es" a intentarlo en francés y dale en "reply_fr" una frase modelo sencilla.

Respondes SIEMPRE con SOLO este JSON válido, sin texto extra:
{ "reply_fr": "tu respuesta en francés",
  "correction": null | { "said": "lo que dijo el alumno (fr)", "corrected": "versión correcta (fr)", "rule_es": "regla en una línea, en español" },
  "encouragement_es": null | "ánimo breve en español" }`;
}

/* ---------------- Load current state ---------------- */

export const getTutorState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const c = context as unknown as Ctx;
    let messages: TutorMessage[] = [];
    let dayId = 1;
    let used = 0;
    try {
      const [{ data: conv }, { data: usage }] = await Promise.all([
        c.supabase
          .from("tutor_conversations")
          .select("day_id, messages")
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
      }
      used = Number(usage?.message_count ?? 0);
    } catch {
      // tables missing pre-migration → fresh state, full quota
    }
    return { messages, dayId, remaining: Math.max(0, TUTOR_DAILY_LIMIT - used) };
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

    // Daily cap, increment-first so parallel requests can't sneak past it.
    const today = todayKey();
    const { data: usage } = await c.supabase
      .from("tutor_usage")
      .select("message_count")
      .eq("user_id", c.userId)
      .eq("usage_date", today)
      .maybeSingle();
    const used = Number(usage?.message_count ?? 0);
    if (used >= TUTOR_DAILY_LIMIT) {
      throw new Error(
        "Has llegado a tu límite de mensajes de hoy. ¡Vuelve mañana para seguir practicando! 🌙",
      );
    }
    const { error: usageError } = await c.supabase
      .from("tutor_usage")
      .upsert(
        { user_id: c.userId, usage_date: today, message_count: used + 1 },
        { onConflict: "user_id,usage_date" },
      );
    if (usageError) {
      throw new Error(
        "El tutor aún no está disponible: falta aplicar la migración de base de datos.",
      );
    }

    // History (reset when the student switches day).
    let history: TutorMessage[] = [];
    const { data: conv } = await c.supabase
      .from("tutor_conversations")
      .select("day_id, messages")
      .eq("user_id", c.userId)
      .maybeSingle();
    if (conv && Number(conv.day_id) === data.dayId && Array.isArray(conv.messages)) {
      history = (conv.messages as TutorMessage[]).slice(-MAX_HISTORY);
    }

    const out = await callChat(buildTutorSystem(data.dayId), [
      ...history,
      { role: "user", content: data.text },
    ]);

    const reply = String(out.reply_fr ?? "").trim() || "Pardon, peux-tu répéter ?";
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

    const fullHistory: TutorMessage[] = [
      ...history,
      { role: "user", content: data.text },
      { role: "assistant", content: reply },
    ];
    const nextMessages = fullHistory.slice(-MAX_HISTORY * 2);

    await c.supabase.from("tutor_conversations").upsert(
      { user_id: c.userId, day_id: data.dayId, messages: nextMessages },
      { onConflict: "user_id" },
    );

    return {
      reply,
      correction,
      encouragement,
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
        { user_id: c.userId, day_id: data.dayId, messages: [] },
        { onConflict: "user_id" },
      );
    } catch {
      // table missing pre-migration — nothing to reset
    }
    return { ok: true };
  });
