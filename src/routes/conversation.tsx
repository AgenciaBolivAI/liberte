import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, RotateCcw, Send, Square, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { TopNav } from "@/components/TopNav";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import mascot from "@/assets/liberte-mascot.png.asset.json";
import parisBg from "@/assets/paris-map-bg.jpg";
import { useAuth } from "@/lib/auth-context";
import { useDayCompletions } from "@/lib/progress";
import { speakFr } from "@/lib/speak";
import { blobToBase64, useRecorder } from "@/lib/audio";
import { transcribeStage } from "@/lib/defi.functions";
import { TUTOR_DAY_TOPICS } from "@/lib/tutorContext";
import {
  getTutorState,
  resetTutorConversation,
  sendTutorMessage,
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
  correction?: TutorCorrection;
  encouragement?: string | null;
};

const GREETING: Bubble = {
  role: "assistant",
  content: "Bonjour ! Je suis Lib 🐦 On pratique un peu de français ensemble ?",
};

function ConversationPage() {
  const { loading: authLoading, user } = useAuth();
  const { days } = useDayCompletions();
  const [dayId, setDayId] = useState<number | null>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const recorder = useRecorder();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Default day: one past the latest completed day (capped at 10).
  const suggestedDay = Math.min(10, (days.length ? Math.max(...days) : 0) + 1);
  const activeDay = dayId ?? suggestedDay;

  useEffect(() => {
    if (authLoading || !user) return;
    let alive = true;
    (async () => {
      try {
        const state = await getTutorState();
        if (!alive) return;
        setRemaining(state.remaining);
        if (state.messages.length > 0) {
          setDayId(state.dayId);
          setBubbles([GREETING, ...state.messages]);
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
  }, [authLoading, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [bubbles, sending]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setBubbles((b) => [...b, { role: "user", content: text }]);
    try {
      const out = await sendTutorMessage({ data: { dayId: activeDay, text } });
      setRemaining(out.remaining);
      setBubbles((b) => {
        const next = [...b];
        // Attach the correction to the user bubble it corrects.
        const lastUserIdx = next.length - 1;
        next[lastUserIdx] = { ...next[lastUserIdx], correction: out.correction };
        next.push({ role: "assistant", content: out.reply, encouragement: out.encouragement });
        return next;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo enviar el mensaje");
      setBubbles((b) => b.slice(0, -1));
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  async function handleMic() {
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
    setBubbles([GREETING]);
    setDayId(d);
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

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `linear-gradient(180deg, oklch(0.42 0.075 265 / 0.82) 0%, oklch(0.32 0.08 265 / 0.92) 100%), url(${parisBg})`,
      }}
    >
      <TopNav />
      <Toaster position="top-center" richColors />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="grid gap-4 md:grid-cols-[1fr_260px]">
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
            </header>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {bubbles.map((m, i) => (
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
                        <button
                          onClick={() => speakFr(m.content)}
                          aria-label="Escuchar en francés"
                          className="ml-2 inline-flex translate-y-0.5 text-blue hover:text-navy"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
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
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void handleMic()}
                    disabled={transcribing || sending}
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
                    disabled={sending}
                    className="h-11 rounded-full border-border bg-white"
                  />
                  <Button
                    onClick={() => void handleSend()}
                    disabled={sending || !input.trim()}
                    aria-label="Enviar"
                    className="h-11 w-11 shrink-0 rounded-full bg-gradient-blue p-0 text-white"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </footer>
          </section>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="rounded-3xl border border-white/15 bg-card p-4 shadow-card">
              <p className="text-xs font-extrabold tracking-widest text-navy/70 uppercase">Tema del día</p>
              <select
                value={activeDay}
                onChange={(e) => void handleReset(Number(e.target.value))}
                className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-navy"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Día {d} — {TUTOR_DAY_TOPICS[d]}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Cambiar de día inicia una conversación nueva.
              </p>
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
              💡 Consejos: escribe o usa el micrófono 🎙️ y revisa la transcripción antes de enviar.
              Toca el altavoz 🔊 para escuchar a Lib. Ella te corrige con cariño — ¡equivocarse es
              parte de aprender!
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
