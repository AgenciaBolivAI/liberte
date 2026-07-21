import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Languages, Lightbulb, Loader2, Mic, Phone, PhoneOff, RotateCcw, Send, Square, Volume2 } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { TopNav } from "@/components/TopNav";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import mascot from "@/assets/liberte-mascot.png.asset.json";
import parisBg from "@/assets/paris-map-bg.jpg";
import { useAuth } from "@/lib/auth-context";
import { useDayCompletions } from "@/lib/progress";
import { speakFr } from "@/lib/speak";
import { blobToBase64, playBase64Mp3, unlockAudioPlayback, useRecorder } from "@/lib/audio";
import { transcribeStage } from "@/lib/defi.functions";
import { effectiveOverride, furthestUnlockedDay, isSceneUnlocked } from "@/lib/unlock";
import { useContentOverrides } from "@/lib/content-access";
import { useAdminPreview } from "@/lib/admin-preview";
import { AdminPreviewBanner } from "@/components/AdminPreviewBanner";
import { TUTOR_DAY_TOPICS, TUTOR_SCENARIOS } from "@/lib/tutorContext";
import { tutorDayGroups } from "@/data/program";
import {
  getTutorState,
  resetTutorConversation,
  sendTutorMessage,
  speakTutorLine,
  TUTOR_DAILY_LIMIT,
  type TutorCorrection,
  type TutorMessage,
} from "@/lib/tutor.functions";

export const Route = createFileRoute("/conversation")({
  head: () => ({
    meta: [
      { title: "Tutor de conversación — Liberté" },
      {
        name: "description",
        content: "Practica francés conversando con Lib, la tutora IA de Liberté.",
      },
    ],
  }),
  component: ConversationPage,
});

type Bubble = TutorMessage & {
  translation?: string | null;
  correction?: TutorCorrection;
  encouragement?: string | null;
};

function openerBubble(dayId: number): Bubble {
  const sc = TUTOR_SCENARIOS[dayId];
  return { role: "assistant", content: sc.opener_fr, translation: sc.opener_es };
}

function ConversationPage() {
  const { loading: authLoading, user } = useAuth();
  // "view as student": load the chosen student's progress (read-only — an admin
  // previewing can see the student's scenes but can't send messages as them).
  const { bypassLocks: isAdmin, viewAsUserId, readOnly } = useAdminPreview();
  const { days, defiDays } = useDayCompletions(viewAsUserId);
  const [dayId, setDayId] = useState<number | null>(null);
  const [bubbles, setBubbles] = useState<Bubble[] | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [objectivesDone, setObjectivesDone] = useState<number[]>([]);
  const [suggestion, setSuggestion] = useState<{ fr: string; es: string } | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [showTranslation, setShowTranslation] = useState<Set<number>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const celebratedRef = useRef(false);
  const recorder = useRecorder();
  const scrollRef = useRef<HTMLDivElement>(null);

  // ---- Hands-free voice mode ----
  // idle → listening → thinking → speaking → listening …
  type VoicePhase = "off" | "listening" | "thinking" | "speaking";
  const [voicePhase, setVoicePhase] = useState<VoicePhase>("off");
  const voiceOn = voicePhase !== "off";
  const voiceOnRef = useRef(false);
  voiceOnRef.current = voiceOn;
  const listenRef = useRef<() => void>(() => {});
  // Guards a turn against being finished twice (VAD + timer + manual tap).
  const turnBusyRef = useRef(false);

  // Scenes unlock progressively: day N opens once day N-1 is finished
  // (day marked complete OR its défi submitted). Mirrors the lesson locks.
  const doneDays = useMemo(() => new Set([...days, ...defiDays]), [days, defiDays]);
  // Tutor scenes follow the SAME day/week gating as the lessons — an admin who
  // disables a day or week also disables its matching tutor lesson.
  const accessOverrides = useContentOverrides(viewAsUserId);
  const isDayUnlocked = (d: number) =>
    isSceneUnlocked(d, doneDays, { isAdmin, override: effectiveOverride(d, accessOverrides) });
  // Default to the furthest scene the student has actually reached.
  const furthestDay = useMemo(() => furthestUnlockedDay(doneDays), [doneDays]);

  const activeDay = dayId ?? furthestDay;
  const scenario = TUTOR_SCENARIOS[activeDay];
  const shownBubbles = bubbles ?? [openerBubble(activeDay)];

  useEffect(() => {
    if (authLoading || !user) return;
    // Impersonating: getTutorState() is keyed to the CALLER (the admin), so
    // hydrating would show the admin's own chat under the student's banner.
    // There's no staff snapshot of a student's tutor_conversations, so preview
    // an empty, read-only session instead.
    if (viewAsUserId) {
      setHydrated(true);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const state = await getTutorState();
        if (!alive) return;
        setRemaining(state.remaining);
        if (state.messages.length > 0) {
          setDayId(state.dayId);
          setBubbles([openerBubble(state.dayId), ...state.messages]);
          setObjectivesDone(state.objectivesDone ?? []);
          celebratedRef.current = (state.objectivesDone ?? []).length >= 3;
        }
      } catch {
        // start fresh
      } finally {
        if (alive) setHydrated(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [authLoading, user, viewAsUserId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [bubbles, sending]);

  // Leaving the page mid-conversation must stop the loop and free the mic.
  useEffect(() => {
    return () => {
      voiceOnRef.current = false;
      recorder.releaseMic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleTranslation(idx: number) {
    setShowTranslation((s) => {
      const n = new Set(s);
      if (n.has(idx)) n.delete(idx);
      else n.add(idx);
      return n;
    });
  }

  async function handleSend(textOverride?: string, opts?: { voice?: boolean }) {
    if (readOnly) return; // impersonating — read-only preview
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;
    // Pin the scene: `furthestDay` can still change as progress queries resolve,
    // which would otherwise switch scenes mid-conversation and discard history.
    if (dayId === null) setDayId(activeDay);
    setInput("");
    setShowSuggestion(false);
    setSending(true);
    const useVoice = opts?.voice ?? false;
    if (useVoice) setVoicePhase("thinking");
    setBubbles((b) => [...(b ?? [openerBubble(activeDay)]), { role: "user", content: text }]);
    try {
      const out = await withTimeout(
        sendTutorMessage({ data: { dayId: activeDay, text, withAudio: useVoice } }),
        45_000,
        "La respuesta de Lib",
      );
      setRemaining(out.remaining);
      setSuggestion(out.suggestion);
      setObjectivesDone(out.objectivesDone);
      if (out.objectivesDone.length >= 3 && !celebratedRef.current) {
        celebratedRef.current = true;
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
      setBubbles((b) => {
        const next = [...(b ?? [])];
        const lastUserIdx = next.length - 1;
        next[lastUserIdx] = { ...next[lastUserIdx], correction: out.correction };
        next.push({
          role: "assistant",
          content: out.reply,
          translation: out.replyEs,
          encouragement: out.encouragement,
        });
        return next;
      });

      if (useVoice && voiceOnRef.current) {
        setVoicePhase("speaking");
        if (out.audio) await playBase64Mp3(out.audio);
        else speakFr(out.reply); // TTS failed — fall back to the browser voice
        // Loop: hand the turn straight back to the student.
        if (voiceOnRef.current) listenRef.current();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo enviar el mensaje");
      setBubbles((b) => (b ?? []).slice(0, -1));
      // In voice mode keep the conversation alive: hand the turn back rather
      // than dropping the student on a dead spinner.
      if (voiceOnRef.current) listenRef.current();
      else setInput(text);
    } finally {
      setSending(false);
    }
  }

  /** Rejects if a step takes too long, so the loop can never hang silently. */
  function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
    return Promise.race([
      p,
      new Promise<T>((_, rej) =>
        setTimeout(() => rej(new Error(`${label} tardó demasiado. Inténtalo otra vez.`)), ms),
      ),
    ]);
  }

  /** One hands-free turn: listen → auto-stop on silence → transcribe → send. */
  async function listenTurn() {
    if (!voiceOnRef.current) return;
    turnBusyRef.current = false;
    setVoicePhase("listening");
    const ok = await recorder.start({
      // Hold the mic for the whole conversation: re-acquiring it every turn is
      // what makes the browser ask for permission again and again.
      keepAlive: true,
      onSilence: () => {
        void finishListening();
      },
    });
    if (!ok) {
      toast.error(recorder.error || "No pudimos acceder al micrófono");
      setVoicePhase("off");
      voiceOnRef.current = false;
    }
  }
  listenRef.current = listenTurn;

  async function finishListening() {
    // The VAD, the max-turn timer and a manual tap can all land here; only the
    // first one may proceed, otherwise turns overlap and the loop deadlocks.
    if (turnBusyRef.current) return;
    turnBusyRef.current = true;

    const blob = await recorder.stop();
    if (!voiceOnRef.current) return;
    if (!blob || !recorder.heardSpeech() || blob.size < 4000) {
      listenTurn(); // nothing audible — don't pay to transcribe noise
      return;
    }
    setVoicePhase("thinking");
    try {
      const b64 = await blobToBase64(blob);
      const r = await withTimeout(
        transcribeStage({ data: { audioBase64: b64, mimeType: blob.type || "audio/webm" } }),
        25_000,
        "La transcripción",
      );
      const said = r.text.trim();
      if (!said) {
        listenTurn(); // silence or noise — listen again
        return;
      }
      await handleSend(said, { voice: true });
    } catch (e) {
      // Never strand the student on a spinner: report and hand the turn back.
      toast.error(e instanceof Error ? e.message : "No se pudo transcribir el audio");
      listenTurn();
    }
  }

  async function toggleVoiceMode() {
    if (readOnly && !voiceOn) return; // impersonating — read-only preview
    if (voiceOn) {
      voiceOnRef.current = false;
      setVoicePhase("off");
      if (recorder.recording) await recorder.stop();
      // Hand the mic back so the browser's recording indicator goes off.
      recorder.releaseMic();
      return;
    }
    // MUST happen synchronously in this tap: iOS blocks any later playback
    // from an element that wasn't started inside a user gesture.
    unlockAudioPlayback();
    voiceOnRef.current = true;
    // Greet with the scene opener so the student hears French immediately.
    setVoicePhase("speaking");
    try {
      const { audio } = await speakTutorLine({ data: { text: scenario.opener_fr } });
      if (voiceOnRef.current && audio) await playBase64Mp3(audio);
    } catch {
      /* skip the spoken opener if TTS is unavailable */
    }
    if (voiceOnRef.current) listenTurn();
  }

  async function handleMic() {
    if (readOnly && !recorder.recording) return; // impersonating — read-only preview
    if (recorder.recording) {
      const blob = await recorder.stop();
      if (!blob) return;
      setTranscribing(true);
      try {
        const b64 = await blobToBase64(blob);
        const r = await transcribeStage({
          data: { audioBase64: b64, mimeType: blob.type || "audio/webm" },
        });
        // The transcript goes to the input so the student can review/edit it.
        setInput((prev) => (prev ? `${prev} ${r.text}` : r.text));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo transcribir el audio");
      } finally {
        setTranscribing(false);
      }
    } else {
      const ok = await recorder.start();
      if (!ok && recorder.error) toast.error(recorder.error);
    }
  }

  async function handleReset(newDay?: number) {
    const d = newDay ?? activeDay;
    setDayId(d);
    setBubbles([openerBubble(d)]);
    setObjectivesDone([]);
    setSuggestion(null);
    setShowSuggestion(false);
    setShowTranslation(new Set());
    celebratedRef.current = false;
    if (readOnly) return; // impersonating — browse scenes locally, never write
    try {
      await resetTutorConversation({ data: { dayId: d } });
    } catch {
      // non-fatal
    }
  }

  if (authLoading || !hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1b3a]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  const quotaEmpty = remaining !== null && remaining <= 0;
  const allDone = objectivesDone.length >= 3;

  return (
    <div
      className="relative min-h-screen bg-cover bg-center md:bg-fixed"
      style={{
        backgroundImage: `linear-gradient(180deg, oklch(0.42 0.075 265 / 0.82) 0%, oklch(0.32 0.08 265 / 0.92) 100%), url(${parisBg})`,
      }}
    >
      <TopNav />
      <Toaster position="top-center" richColors />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <AdminPreviewBanner />
        <div className="grid gap-4 md:grid-cols-[1fr_280px]">
          {/* Chat panel */}
          <section className="flex min-h-[70vh] flex-col rounded-3xl border border-white/15 bg-card shadow-card">
            <header className="flex items-center gap-3 border-b border-border p-4">
              <img src={mascot.url} alt="Lib" className="h-10 w-10 object-contain" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-extrabold text-navy">Lib · Tutora de conversación</p>
                <p className="truncate text-xs text-muted-foreground">
                  Día {activeDay} · {TUTOR_DAY_TOPICS[activeDay]}
                </p>
              </div>
              {allDone && (
                <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                  🎉 ¡Escena completada!
                </span>
              )}
            </header>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {shownBubbles.map((m, i) => (
                <div key={i}>
                  <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                        m.role === "user"
                          ? "bg-gradient-blue text-white"
                          : "border border-border bg-white text-navy shadow-soft"
                      }`}
                    >
                      {m.content}
                      {m.role === "assistant" && (
                        <span className="ml-2 inline-flex translate-y-0.5 gap-2">
                          <button
                            onClick={() => speakFr(m.content)}
                            aria-label="Escuchar en francés"
                            className="text-blue hover:text-navy"
                          >
                            <Volume2 className="h-4 w-4" />
                          </button>
                          {m.translation && (
                            <button
                              onClick={() => toggleTranslation(i)}
                              aria-label="Ver traducción"
                              className={showTranslation.has(i) ? "text-navy" : "text-blue hover:text-navy"}
                            >
                              <Languages className="h-4 w-4" />
                            </button>
                          )}
                        </span>
                      )}
                      {m.role === "assistant" && m.translation && showTranslation.has(i) && (
                        <span className="mt-1 block border-t border-border pt-1 text-xs italic text-navy/60">
                          {m.translation}
                        </span>
                      )}
                    </div>
                  </div>
                  {m.correction && (
                    <div className="mt-1 flex justify-end">
                      <div className="max-w-[85%] rounded-xl border border-gold/50 bg-gold/10 px-3 py-2 text-xs text-navy">
                        ✏️ <span className="line-through opacity-70">{m.correction.said}</span>{" "}
                        → <span className="font-bold">{m.correction.corrected}</span>
                        {m.correction.rule_es && (
                          <span className="block text-[11px] text-navy/70">{m.correction.rule_es}</span>
                        )}
                      </div>
                    </div>
                  )}
                  {m.encouragement && (
                    <p className="mt-1 pl-1 text-[11px] italic text-sky">💬 {m.encouragement}</p>
                  )}
                </div>
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Lib écrit…
                </div>
              )}
            </div>

            <footer className="border-t border-border p-3">
              {quotaEmpty ? (
                <p className="rounded-xl bg-ice p-3 text-center text-sm text-navy">
                  Has usado tus {TUTOR_DAILY_LIMIT} mensajes de hoy. ¡Vuelve mañana! 🌙
                </p>
              ) : voiceOn ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Manual end-of-turn, in case silence detection misses.
                      if (voicePhase === "listening") void finishListening();
                    }}
                    disabled={voicePhase !== "listening"}
                    aria-label={voicePhase === "listening" ? "He terminado de hablar" : undefined}
                    className={`relative grid h-20 w-20 place-items-center rounded-full text-white transition ${
                      voicePhase === "listening"
                        ? "bg-red"
                        : voicePhase === "speaking"
                          ? "bg-blue"
                          : "bg-navy"
                    }`}
                  >
                    {voicePhase === "listening" && (
                      <span className="absolute inset-0 animate-ping rounded-full bg-red/40" />
                    )}
                    {voicePhase === "thinking" ? (
                      <Loader2 className="h-8 w-8 animate-spin" />
                    ) : voicePhase === "speaking" ? (
                      <Volume2 className="h-8 w-8" />
                    ) : (
                      <Mic className="h-8 w-8" />
                    )}
                  </button>
                  <p className="text-center text-sm font-semibold text-navy">
                    {voicePhase === "listening" && "🎙️ Habla en francés… te escucho"}
                    {voicePhase === "thinking" && "Un instant…"}
                    {voicePhase === "speaking" && "🔊 Lib está hablando"}
                  </p>
                  <p className="text-center text-xs text-muted-foreground">
                    {voicePhase === "listening"
                      ? "Cuando dejes de hablar te respondo sola — o toca el micrófono para enviar."
                      : "Cuando dejes de hablar, te respondo automáticamente."}
                  </p>
                  <Button
                    onClick={() => void toggleVoiceMode()}
                    variant="outline"
                    className="rounded-full border-navy/20 text-navy"
                  >
                    <PhoneOff className="mr-2 h-4 w-4" /> Terminar conversación
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    onClick={() => void toggleVoiceMode()}
                    className="mb-2 h-12 w-full rounded-full bg-gradient-blue font-display text-base font-extrabold text-white shadow-card"
                  >
                    <Phone className="mr-2 h-5 w-5" /> Conversar en voz con Lib
                  </Button>
                  {showSuggestion && suggestion && (
                    <button
                      onClick={() => {
                        setInput(suggestion.fr);
                        setShowSuggestion(false);
                      }}
                      className="mb-2 block w-full rounded-xl border border-sky/50 bg-ice px-3 py-2 text-left text-sm text-navy transition hover:border-blue"
                    >
                      <span className="font-bold">{suggestion.fr}</span>
                      <span className="block text-xs italic text-navy/60">{suggestion.es}</span>
                      <span className="block text-[10px] text-blue">Toca para usar esta frase ↑</span>
                    </button>
                  )}
                  {readOnly && (
                    <p className="mb-2 text-center text-xs text-navy/60">
                      👀 Vista de solo lectura — no puedes enviar mensajes como este alumno.
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void handleMic()}
                      disabled={transcribing || sending || readOnly}
                      aria-label={recorder.recording ? "Detener grabación" : "Grabar audio"}
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition ${
                        recorder.recording ? "animate-pulse bg-red" : "bg-navy hover:bg-navy/85"
                      } disabled:opacity-50`}
                    >
                      {transcribing ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : recorder.recording ? (
                        <Square className="h-5 w-5" />
                      ) : (
                        <Mic className="h-5 w-5" />
                      )}
                    </button>
                    {suggestion && (
                      <button
                        onClick={() => setShowSuggestion((v) => !v)}
                        aria-label="¿Qué puedo decir?"
                        title="¿Qué puedo decir?"
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold/20 text-gold transition hover:bg-gold/30"
                      >
                        <Lightbulb className="h-5 w-5" />
                      </button>
                    )}
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void handleSend();
                        }
                      }}
                      placeholder={recorder.recording ? "Grabando… habla en francés 🎙️" : "Écris en français…"}
                      disabled={sending || readOnly}
                      className="h-11 rounded-full border-border bg-white"
                    />
                    <Button
                      onClick={() => void handleSend()}
                      disabled={sending || !input.trim() || readOnly}
                      aria-label="Enviar"
                      className="h-11 w-11 shrink-0 rounded-full bg-gradient-blue p-0 text-white"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </>
              )}
            </footer>
          </section>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="rounded-3xl border border-white/15 bg-card p-4 shadow-card">
              <p className="text-xs font-extrabold tracking-widest text-navy/70 uppercase">La escena de hoy</p>
              <select
                value={activeDay}
                onChange={(e) => void handleReset(Number(e.target.value))}
                className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-base text-navy sm:text-sm"
              >
                {tutorDayGroups(10).map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.days.map((d) => {
                      const locked = !isDayUnlocked(d);
                      return (
                        <option key={d} value={d} disabled={locked}>
                          {locked ? "🔒 " : ""}Día {d} — {TUTOR_DAY_TOPICS[d]}
                        </option>
                      );
                    })}
                  </optgroup>
                ))}
              </select>
              {activeDay < 10 && !isDayUnlocked(activeDay + 1) && (
                <p className="mt-2 text-[11px] text-navy/55">
                  🔒 Termina el Día {activeDay} para desbloquear la siguiente escena.
                </p>
              )}
              <p className="mt-3 text-xs text-navy/75">
                🎭 Lib es <span className="font-semibold">{scenario.role.split(";")[0]}</span>.
              </p>
              <ul className="mt-3 space-y-2">
                {scenario.objectives.map((o, i) => {
                  const isDone = objectivesDone.includes(i + 1);
                  return (
                    <li key={i} className="flex items-start gap-2 text-xs text-navy/85">
                      <span
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-extrabold ${
                          isDone ? "bg-success text-white" : "bg-ice text-navy/60"
                        }`}
                      >
                        {isDone ? <Check className="h-3 w-3" /> : i + 1}
                      </span>
                      <span className={isDone ? "line-through opacity-60" : ""}>{o}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-3xl border border-white/15 bg-card p-4 shadow-card">
              <p className="text-xs font-extrabold tracking-widest text-navy/70 uppercase">Mensajes de hoy</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-navy">
                {remaining ?? TUTOR_DAILY_LIMIT}
                <span className="text-sm font-bold text-navy/60"> / {TUTOR_DAILY_LIMIT}</span>
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-ice">
                <div
                  className="h-full rounded-full bg-gradient-blue transition-all"
                  style={{ width: `${((remaining ?? TUTOR_DAILY_LIMIT) / TUTOR_DAILY_LIMIT) * 100}%` }}
                />
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => void handleReset()}
              className="w-full rounded-2xl border-white/40 bg-white/10 text-white hover:bg-white/20"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Nueva conversación
            </Button>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-4 text-xs text-white/85">
              💡 Escribe o usa el micrófono 🎙️. Toca 🔊 para escuchar a Lib y{" "}
              <Languages className="inline h-3 w-3" /> para ver la traducción. Si te quedas sin
              palabras, toca la 💡 para una sugerencia. ¡Equivocarse es parte de aprender!
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
