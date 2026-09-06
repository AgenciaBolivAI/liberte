import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callChat, speakFrenchBase64, TUTOR_MODEL, TUTOR_TEMPERATURE } from "@/lib/ai";
import { isNotFrench } from "@/lib/french-text";
import { getTutorDayContext, TUTOR_MAX_DAY, type TutorDayContext } from "@/lib/tutorContext";
import { buildTutorSystem } from "@/lib/tutorPrompt";
import type { RichDay } from "@/data/week34.meta";
import { effectiveOverride, OPEN_THROUGH_DAY } from "@/lib/unlock";
import { loadUserOverrides } from "@/lib/content-access.functions";
import { requireApprovedStudent } from "@/lib/approval";

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
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (isAdmin) return;
  // Admin day/week enable-disable wins over everything below (an explicit lock
  // closes even weeks 1-2; an explicit open bypasses the sequential rule).
  const override = effectiveOverride(dayId, await loadUserOverrides(context.supabase, context.userId));
  if (override === "locked") {
    throw new Error(`Esta escena está bloqueada por tu profesor. 🔒`);
  }
  if (override === "open") return;
  // Launch setting: every scene in weeks 1-2 is open to all students.
  if (dayId <= OPEN_THROUGH_DAY) return;
  if (dayId <= 1) return;
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

// The paid-AI approval gate now lives in @/lib/approval (shared with the défi /
// weekly-eval / staff-directory endpoints).

/**
 * Resolve the tutor's day context. Days 11+ can be teacher-edited (their lesson
 * lives in `authored_days.rich`), so a published rich row OVERRIDES the code seed:
 * the tutor then teaches the exact vocabulary/grammar/scene the teacher edited.
 * Falls back to the code context (`getTutorDayContext`) when there's no DB row.
 */
async function resolveTutorContext(c: Ctx, dayId: number): Promise<TutorDayContext> {
  const base = getTutorDayContext(dayId);
  if (dayId < 11) return base;
  try {
    const { data } = await c.supabase
      .from("authored_days")
      .select("rich")
      .eq("day_id", dayId)
      .maybeSingle();
    const rich = data?.rich as unknown as RichDay | null;
    if (!rich) return base;
    const t = rich.tutor;
    const scenario =
      t && t.role && t.opener_fr
        ? {
            role: t.role,
            opener_fr: t.opener_fr,
            opener_es: t.opener_es,
            objectives: (t.objectives ?? []).slice(0, 3),
          }
        : base.scenario;
    return {
      dayId: base.dayId,
      topic: t?.topic || base.topic,
      scenario,
      vocab: Array.isArray(rich.vocabulary) && rich.vocabulary.length
        ? rich.vocabulary.map((v) => ({ fr: v.fr, es: v.es }))
        : base.vocab,
      grammar: Array.isArray(rich.grammar) && rich.grammar.length
        ? rich.grammar.map((g) => `${g.formula} — ${g.use}`)
        : base.grammar,
    };
  } catch {
    return base; // DB unreachable / column missing → code content
  }
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
    const d = input as { dayId?: number; text?: string; withAudio?: boolean };
    const text = String(d?.text ?? "").trim();
    if (!text) throw new Error("Escribe un mensaje primero.");
    const dayId = Math.max(1, Math.min(TUTOR_MAX_DAY, Number(d?.dayId) || 1));
    return { dayId, text: text.slice(0, 1000), withAudio: Boolean(d?.withAudio) };
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

    const tutorCtx = await resolveTutorContext(c, data.dayId);

    // Lib only understands French — enforced here, not left to the model's
    // judgement. This is a French course: answering a Spanish message in
    // substance teaches the student that Spanish works, which is the opposite
    // of practising. No token is spent either. Short unmarked answers come back
    // "unsure" from `frenchness` and go through normally.
    if (isNotFrench(data.text)) {
      // Scaffold from the day's own vocabulary so the nudge is useful, not a
      // dead end: she is told what she COULD say in French right now.
      const word = tutorCtx.vocab[0];
      return {
        reply: "Pardon, je ne comprends qu'en français. Essaie en français !",
        replyEs: "Perdona, solo entiendo francés. Inténtalo en francés.",
        suggestion: word
          ? { fr: word.fr, es: word.es }
          : { fr: "Je ne comprends pas. Tu peux répéter ?", es: "No entiendo. ¿Puedes repetir?" },
        correction: null as TutorCorrection,
        encouragement: null as string | null,
        objectivesDone: prevObjectives,
        audio: null as string | null,
        remaining: Math.max(0, TUTOR_DAILY_LIMIT - used),
        notFrench: true,
      };
    }

    const out = await callChat(
      buildTutorSystem(tutorCtx, data.withAudio),
      [...history, { role: "user", content: data.text }],
      { model: TUTOR_MODEL, temperature: TUTOR_TEMPERATURE },
    );

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

    // Durable "failed attempt" log for the teacher report: a correction means
    // the student said something that needed fixing. Best-effort, service role
    // so a student can't forge their own record; never blocks the reply.
    if (correction) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("tutor_events").insert({
          user_id: c.userId,
          day_id: data.dayId,
          kind: "correction",
          said: correction.said,
          corrected: correction.corrected,
          rule_es: correction.rule_es,
        });
      } catch {
        /* logging is best-effort */
      }
    }

    // Voice mode: synthesise the reply in the same round trip so the student
    // hears it immediately instead of waiting for a second request.
    let audio: string | null = null;
    if (data.withAudio) {
      try {
        audio = await speakFrenchBase64(reply);
      } catch {
        audio = null; // fall back to the browser voice client-side
      }
    }

    return {
      reply,
      replyEs,
      suggestion,
      correction,
      encouragement,
      objectivesDone,
      audio,
      remaining: Math.max(0, TUTOR_DAILY_LIMIT - (used + 1)),
      notFrench: false,
    };
  });

/* ---------------- Speak arbitrary French text (opener, replays) ---------------- */

export const speakTutorLine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { text?: string };
    const text = String(d?.text ?? "").trim();
    if (!text) throw new Error("text required");
    return { text: text.slice(0, 800) };
  })
  .handler(async ({ data, context }) => {
    const c = context as unknown as Ctx;
    await requireApprovedStudent(c);
    // Count against the same daily quota so this can't be looped for free,
    // unmetered TTS. Over the cap → no audio (the UI falls back to the browser
    // voice), never an error that would break the conversation.
    const { data: consumed } = await c.supabase.rpc("tutor_consume_message", {
      _limit: TUTOR_DAILY_LIMIT,
    });
    if (consumed === null || consumed === undefined) {
      return { audio: null as string | null };
    }
    return { audio: await speakFrenchBase64(data.text) };
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
