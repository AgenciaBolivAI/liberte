import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Download, ExternalLink, Loader2, Lock, Mic, Square } from "lucide-react";
import confetti from "canvas-confetti";
import { TopNav } from "@/components/TopNav";
import { AdminPreviewBanner } from "@/components/AdminPreviewBanner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useAdminPreview } from "@/lib/admin-preview";
import { useContentOverrides } from "@/lib/content-access";
import { effectiveOverride, isDayUnlocked as isDayUnlockedRule } from "@/lib/unlock";
import { markDayCompleted, useDayCompletions } from "@/lib/progress";
import { correctActivity } from "@/lib/defi.functions";
import { transcribeAudio } from "@/lib/week.functions";
import { blobToBase64, useRecorder } from "@/lib/audio";
import { toEmbedUrl, weekOfAuthoredDay, type AuthoredBlock, type AuthoredDay } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Renders a teacher-authored day (11-120). Sits behind the same unlock rules as
// code-authored days: sequential + admin content_access overrides; admins see
// drafts (labelled). Completion uses the normal day_completions flow so stars
// and progress integrate.

export function AuthoredDayView({ dayId }: { dayId: number }) {
  const { user } = useAuth();
  const { bypassLocks: isAdmin, viewAsUserId, readOnly } = useAdminPreview();
  const { days, defiDays, refresh } = useDayCompletions(viewAsUserId);
  const accessOverrides = useContentOverrides(viewAsUserId);
  const [day, setDay] = useState<AuthoredDay | null | "missing">(null);
  const [blocks, setBlocks] = useState<AuthoredBlock[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [d, b] = await Promise.all([
        supabase.from("authored_days").select("day_id, title, subtitle, status").eq("day_id", dayId).maybeSingle(),
        supabase.from("authored_blocks").select("id, day_id, sort, type, payload").eq("day_id", dayId).order("sort").order("id"),
      ]);
      if (!alive) return;
      setDay((d.data as AuthoredDay | null) ?? "missing");
      setBlocks((b.data ?? []) as AuthoredBlock[]);
    })();
    return () => {
      alive = false;
    };
  }, [dayId]);

  const doneDays = useMemo(() => new Set([...days, ...defiDays]), [days, defiDays]);
  const unlocked = isDayUnlockedRule(dayId, doneDays, {
    isAdmin,
    override: effectiveOverride(dayId, accessOverrides),
  });
  const isDone = doneDays.has(dayId);

  const complete = useCallback(async () => {
    if (!user || readOnly || isDone) return;
    try {
      await markDayCompleted(user.id, dayId, weekOfAuthoredDay(dayId));
      confetti({ particleCount: 120, spread: 75, origin: { y: 0.7 } });
      toast.success("¡Día completado! 🎉");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    }
  }, [user, readOnly, isDone, dayId, refresh]);

  const shell = (child: React.ReactNode) => (
    <div className="min-h-screen bg-ice">
      <TopNav />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <AdminPreviewBanner />
        {child}
      </main>
    </div>
  );

  if (day === null) {
    return shell(
      <div className="grid place-items-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-blue" />
      </div>,
    );
  }

  if (day === "missing" || (day.status !== "published" && !isAdmin)) {
    return shell(
      <div className="rounded-3xl border-2 border-blue/30 bg-white p-8 text-center shadow-card">
        <p className="text-4xl">🚧</p>
        <h1 className="mt-3 font-display text-2xl font-extrabold text-navy">Jour {dayId} — próximamente</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tu profesora aún está preparando este contenido. 🐦</p>
        <BackHome />
      </div>,
    );
  }

  if (!unlocked) {
    return shell(
      <div className="rounded-3xl border-2 border-blue/30 bg-white p-8 text-center shadow-card">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-navy text-white">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-navy">Jour {dayId} encore verrouillé</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Este día aún no está disponible. Se abrirá al completar el día anterior o cuando tu profesor lo habilite. 🐦
        </p>
        <BackHome />
      </div>,
    );
  }

  return shell(
    <>
      {day.status !== "published" && (
        <p className="mb-4 rounded-xl border border-gold/50 bg-gold/15 p-3 text-xs font-bold text-navy">
          📝 Borrador — solo el equipo puede verlo. Publícalo desde el panel para los alumnos.
        </p>
      )}
      <p className="text-xs font-extrabold tracking-widest text-blue uppercase">
        Semana {weekOfAuthoredDay(dayId)} · Jour {dayId}
      </p>
      <h1 className="mt-1 font-display text-3xl font-extrabold text-navy">{day.title || `Jour ${dayId}`}</h1>
      {day.subtitle && <p className="mt-1 text-sm text-muted-foreground">{day.subtitle}</p>}

      <div className="mt-6 space-y-5">
        {blocks.length === 0 && (
          <p className="rounded-2xl border border-border bg-white p-6 text-sm text-muted-foreground">
            Este día aún no tiene contenido.
          </p>
        )}
        {blocks.map((b) => (
          <Block key={b.id} block={b} dayId={dayId} readOnly={readOnly} />
        ))}
      </div>

      <div className="mt-8 rounded-3xl border-2 border-gold/50 bg-gradient-to-br from-white to-gold/10 p-6 text-center shadow-card">
        {isDone ? (
          <p className="font-display text-lg font-extrabold text-success">✅ Día completado</p>
        ) : (
          <Button onClick={() => void complete()} disabled={readOnly} className="bg-gradient-blue px-8 py-5 font-display text-base font-extrabold text-white">
            <Check className="mr-2 h-5 w-5" /> Marcar día como terminado
          </Button>
        )}
      </div>
    </>,
  );
}

function BackHome() {
  return (
    <Link
      to="/liberte-plataforma-834798234728482934254-student"
      className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-blue px-6 py-3 font-display font-extrabold text-white shadow-card"
    >
      <ArrowLeft className="h-4 w-4" /> Volver al inicio
    </Link>
  );
}

/* ---------------- Block renderers ---------------- */

function Block({ block, dayId, readOnly }: { block: AuthoredBlock; dayId: number; readOnly: boolean }) {
  const p = block.payload ?? {};
  const card = "rounded-3xl border border-border bg-white p-5 shadow-soft";

  switch (block.type) {
    case "video": {
      if (!p.url) return null;
      const v = toEmbedUrl(p.url);
      return (
        <div className={card}>
          {v.kind === "youtube" ? (
            <div className="aspect-video overflow-hidden rounded-2xl">
              <iframe src={v.embed} title="Video" className="h-full w-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
            </div>
          ) : (
            <video src={v.url} controls playsInline className="w-full rounded-2xl" />
          )}
        </div>
      );
    }
    case "text":
      return (
        <div className={card}>
          {p.title && <h2 className="font-display text-xl font-extrabold text-navy">{p.title}</h2>}
          {(p.body ?? "").split(/\n\s*\n/).filter(Boolean).map((para, i) => (
            <p key={i} className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-navy/90">{para}</p>
          ))}
        </div>
      );
    case "vocab":
      return (
        <div className={card}>
          <h2 className="font-display text-xl font-extrabold text-navy">🗂️ Vocabulaire</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {(p.items ?? []).map((it, i) => (
                  <tr key={i} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-4 font-bold text-navy">{it.fr}</td>
                    <td className="py-2 text-navy/80">{it.es}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    case "quiz":
      return <QuizBlock questions={p.questions ?? []} card={card} />;
    case "writing":
      return <WritingBlock dayId={dayId} title={p.title} prompt={p.prompt ?? ""} example={p.example ?? ""} card={card} readOnly={readOnly} />;
    case "speaking":
      return <SpeakingBlock dayId={dayId} title={p.title} prompt={p.prompt ?? ""} example={p.example ?? ""} card={card} readOnly={readOnly} />;
    case "file":
      if (!p.url) return null;
      return (
        <a href={p.url} target="_blank" rel="noopener noreferrer" className={`${card} flex items-center gap-3 transition hover:border-blue/50`}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue/10 text-blue"><Download className="h-5 w-5" /></span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-navy">{p.name || "Material del día"}</span>
            <span className="text-xs text-muted-foreground">Toca para abrir o descargar</span>
          </span>
        </a>
      );
    case "link":
      if (!p.url) return null;
      return (
        <a href={p.url} target="_blank" rel="noopener noreferrer" className={`${card} flex items-center gap-3 transition hover:border-blue/50`}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold/15 text-navy"><ExternalLink className="h-5 w-5" /></span>
          <span className="text-sm font-bold text-navy">{p.label || p.url}</span>
        </a>
      );
    default:
      return null;
  }
}

function QuizBlock({ questions, card }: { questions: { q: string; options: string[]; correct: number }[]; card: string }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  if (!questions.length) return null;
  const score = questions.filter((q, i) => answers[i] === q.correct).length;
  return (
    <div className={card}>
      <h2 className="font-display text-xl font-extrabold text-navy">✅ Quiz</h2>
      <div className="mt-3 space-y-4">
        {questions.map((q, i) => (
          <div key={i}>
            <p className="text-sm font-bold text-navy">{i + 1}. {q.q}</p>
            <div className="mt-1.5 space-y-1">
              {q.options.map((op, oi) => {
                const sel = answers[i] === oi;
                const good = checked && oi === q.correct;
                const bad = checked && sel && oi !== q.correct;
                return (
                  <button
                    key={oi}
                    disabled={checked}
                    onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                    className={`block w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                      good ? "border-success bg-success/10 text-success" : bad ? "border-red bg-red/10 text-red" : sel ? "border-blue bg-blue/10 text-navy" : "border-border text-navy/85 hover:border-blue/40"
                    }`}
                  >
                    {op}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {checked ? (
        <p className="mt-4 text-sm font-extrabold text-navy">Resultado: {score}/{questions.length} 🎯</p>
      ) : (
        <Button onClick={() => setChecked(true)} disabled={Object.keys(answers).length < questions.length} className="mt-4 bg-gradient-blue text-white">
          Comprobar
        </Button>
      )}
    </div>
  );
}

type Feedback = { feedback_alumno?: string; nota?: number; errores?: { dijo: string; correcto: string; regla: string }[] };

function FeedbackCard({ fb }: { fb: Feedback }) {
  return (
    <div className="mt-3 rounded-2xl border border-blue/30 bg-blue/5 p-3 text-sm text-navy">
      {typeof fb.nota === "number" && <p className="font-extrabold">Nota: {fb.nota}/10</p>}
      {fb.feedback_alumno && <p className="mt-1">{fb.feedback_alumno}</p>}
      {(fb.errores ?? []).map((e, i) => (
        <p key={i} className="mt-1 text-xs">« {e.dijo} » → <b>« {e.correcto} »</b> — {e.regla}</p>
      ))}
    </div>
  );
}

function WritingBlock({ dayId, title, prompt, example, card, readOnly }: { dayId: number; title?: string; prompt: string; example: string; card: string; readOnly: boolean }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [fb, setFb] = useState<Feedback | null>(null);

  async function submit() {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const res = await correctActivity({ data: { dayId, section: "cles", competence: "PE", prompt, expected: example, response: text.trim() } });
      setFb(res as Feedback);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo corregir");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={card}>
      <h2 className="font-display text-xl font-extrabold text-navy">✍️ {title || "Production écrite"}</h2>
      <p className="mt-2 text-sm text-navy/85">{prompt}</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Écris ta réponse en français…" className="mt-3 w-full rounded-2xl border border-border bg-ice p-3 text-base text-navy sm:text-sm" />
      <Button onClick={() => void submit()} disabled={busy || !text.trim() || readOnly} className="mt-2 bg-gradient-blue text-white">
        {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Corregir con IA
      </Button>
      {fb && <FeedbackCard fb={fb} />}
    </div>
  );
}

function SpeakingBlock({ dayId, title, prompt, example, card, readOnly }: { dayId: number; title?: string; prompt: string; example: string; card: string; readOnly: boolean }) {
  const recorder = useRecorder();
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [fb, setFb] = useState<Feedback | null>(null);

  async function toggle() {
    if (busy || readOnly) return;
    if (!recorder.recording) {
      setFb(null);
      setTranscript("");
      await recorder.start();
      return;
    }
    const blob = await recorder.stop();
    if (!blob) return;
    setBusy(true);
    try {
      const b64 = await blobToBase64(blob);
      const { text } = await transcribeAudio({ data: { audioBase64: b64, mimeType: blob.type || "audio/webm" } });
      setTranscript(text);
      if (text.trim()) {
        const res = await correctActivity({ data: { dayId, section: "cles", competence: "PO", prompt, expected: example, response: text } });
        setFb(res as Feedback);
      } else {
        toast.error("No se escuchó nada — inténtalo de nuevo más cerca del micrófono.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo transcribir");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={card}>
      <h2 className="font-display text-xl font-extrabold text-navy">🎙️ {title || "Production orale"}</h2>
      <p className="mt-2 text-sm text-navy/85">{prompt}</p>
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => void toggle()}
          disabled={busy || readOnly}
          aria-label={recorder.recording ? "Detener" : "Grabar"}
          className={`grid h-12 w-12 place-items-center rounded-full text-white transition ${recorder.recording ? "animate-pulse bg-red" : "bg-navy hover:bg-navy/85"} disabled:opacity-50`}
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : recorder.recording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        <p className="text-xs text-muted-foreground">
          {recorder.recording ? "Grabando… habla en francés y pulsa para terminar" : "Pulsa para grabar tu respuesta"}
        </p>
      </div>
      {transcript && <p className="mt-3 rounded-xl bg-ice p-3 text-sm text-navy">🗣️ « {transcript} »</p>}
      {fb && <FeedbackCard fb={fb} />}
    </div>
  );
}
