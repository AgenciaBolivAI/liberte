import { useMemo, useRef, useState } from "react";
import {
  Check,
  Loader2,
  Mic,
  MicOff,
  PartyPopper,
  Square,
  Trophy,
  Upload,
  Volume2,
  Sparkles,
  Target,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { speakFr } from "@/lib/speak";
import { evaluateDefi, transcribeStage } from "@/lib/defi.functions";
import { useAdminPreview } from "@/lib/admin-preview";

type Step = { serveur: string; hint: string; example: string };
type StageState = {
  blob: Blob | null;
  url: string | null;
  recording: boolean;
  saved: boolean;
  transcript?: string;
};
type Evaluation = Awaited<ReturnType<typeof evaluateDefi>>;

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  let s = "";
  const arr = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < arr.length; i += chunk) {
    s += String.fromCharCode(...arr.subarray(i, i + chunk));
  }
  return btoa(s);
}

function fireConfetti() {
  const end = Date.now() + 1500;
  const colors = ["#4BB1EC", "#3D5589", "#EDF8FC", "#F4C542", "#C44536"];
  const frame = () => {
    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors });
}

export type StagedDefiProps = {
  dayId: number;
  title: string;
  subtitle: string;
  eyebrow: string;
  steps: Step[];
  criteria: string[];
  avatar?: string;
  onAward: (n?: number) => void;
  onDone: () => void;
};

export function StagedDefi(props: StagedDefiProps) {
  const { dayId, title, subtitle, eyebrow, steps, criteria, avatar = "🎙️", onAward, onDone } = props;
  // While an admin previews "as student", never write/spend under their account.
  const { readOnly } = useAdminPreview();

  const [stages, setStages] = useState<StageState[]>(
    () => steps.map(() => ({ blob: null, url: null, recording: false, saved: false })),
  );
  const [uploading, setUploading] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>("");
  const [result, setResult] = useState<Evaluation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const activeIdxRef = useRef<number>(-1);

  const allSaved = useMemo(() => stages.every((s) => s.saved), [stages]);

  const updateStage = (i: number, patch: Partial<StageState>) => {
    setStages((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const startRec = async (i: number) => {
    if (recRef.current || stages[i].recording) return;
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      activeIdxRef.current = i;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const b = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        const url = URL.createObjectURL(b);
        const idx = activeIdxRef.current;
        setStages((prev) =>
          prev.map((s, k) =>
            k === idx
              ? { ...s, blob: b, url, recording: false, saved: true, transcript: undefined }
              : s,
          ),
        );
        stream.getTracks().forEach((t) => t.stop());
        recRef.current = null;
      };
      recRef.current = rec;
      rec.start();
      updateStage(i, { recording: true, saved: false });
    } catch (e) {
      const err = e as DOMException;
      const inIframe = typeof window !== "undefined" && window.self !== window.top;
      if (inIframe) {
        setErrorMsg("El micrófono está bloqueado en la vista previa. Abre la app en una pestaña nueva (botón ↗ arriba a la derecha) o usa el enlace publicado para grabar.");
      } else if (err?.name === "NotAllowedError") {
        setErrorMsg("Bloqueaste el micrófono. Haz clic en el candado 🔒 de la barra de direcciones → Permitir micrófono → recarga.");
      } else if (err?.name === "NotFoundError") {
        setErrorMsg("No detectamos ningún micrófono conectado.");
      } else {
        setErrorMsg("No pudimos acceder al micrófono. Revisa los permisos del navegador.");
      }
    }

  };

  const stopRec = () => {
    recRef.current?.stop();
  };

  const clearRec = (i: number) => {
    const s = stages[i];
    if (s.url) URL.revokeObjectURL(s.url);
    updateStage(i, { blob: null, url: null, saved: false, transcript: undefined });
  };

  const submit = async () => {
    if (readOnly) return; // impersonating — never write defi_results / spend AI
    setUploading(true);
    setErrorMsg("");
    setProgressMsg("Transcribiendo tus grabaciones…");
    try {
      // Transcribe each stage
      const transcripts: string[] = [];
      for (let i = 0; i < stages.length; i++) {
        setProgressMsg(`Transcribiendo etapa ${i + 1} de ${stages.length}…`);
        const s = stages[i];
        if (!s.blob) throw new Error(`Falta la etapa ${i + 1}`);
        const b64 = await blobToBase64(s.blob);
        const res = await transcribeStage({
          data: { audioBase64: b64, mimeType: s.blob.type || "audio/webm" },
        });
        transcripts.push(res.text);
        updateStage(i, { transcript: res.text });
      }

      setProgressMsg("Evaluando tu desafío con la profesora IA…");
      const evalRes = await evaluateDefi({
        data: {
          dayId,
          title,
          criteria,
          stages: steps.map((st, i) => ({
            hint: st.hint,
            example: st.example,
            transcript: transcripts[i] ?? "",
          })),
        },
      });

      setResult(evalRes);
      onAward(5);
      onDone();
      fireConfetti();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error inesperado";
      setErrorMsg(msg);
    } finally {
      setUploading(false);
      setProgressMsg("");
    }
  };

  const playServeur = (text: string) => speakFr(text);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-[oklch(0.32_0.08_265)] via-[oklch(0.4_0.09_265)] to-[oklch(0.28_0.08_265)] p-6 text-white shadow-card sm:p-8">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-gold" />
          <p className="text-xs font-bold tracking-widest text-gold uppercase">{eyebrow}</p>
        </div>
        <h3 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">🏆 {title}</h3>
        <p className="mt-1 text-sm text-white/80">{subtitle}</p>
      </div>

      {/* Stages */}
      <div className="space-y-3">
        {steps.map((r, idx) => {
          const st = stages[idx];
          const isRec = st.recording;
          return (
            <div
              key={idx}
              className={`rounded-2xl border-2 p-5 transition ${
                st.saved
                  ? "border-gold/60 bg-gold/5"
                  : isRec
                    ? "border-red bg-white shadow-card"
                    : "border-border bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold ${
                      st.saved ? "bg-gold text-navy" : isRec ? "bg-red text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {st.saved ? <Check className="h-4 w-4" /> : idx + 1}
                  </span>
                  <p className="text-xs font-bold tracking-widest text-navy/70 uppercase">
                    Étape {idx + 1}/{steps.length}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    st.saved
                      ? "bg-gold/20 text-navy"
                      : isRec
                        ? "bg-red/10 text-red"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {st.saved ? "Guardada ✓" : isRec ? "Grabando…" : "Pendiente"}
                </span>
              </div>

              <div className="mt-3 flex items-start gap-3 rounded-xl bg-ice p-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold text-navy">
                  {avatar}
                </span>
                <div className="flex-1">
                  <p className="text-xs font-bold tracking-wider text-navy/60 uppercase">Interlocuteur</p>
                  <p className="font-display text-base font-bold text-navy">{r.serveur}</p>
                  <button
                    onClick={() => playServeur(r.serveur)}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue hover:underline"
                  >
                    <Volume2 className="h-3 w-3" /> Escuchar
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border-2 border-gold/60 bg-gradient-to-br from-gold/15 via-gold/5 to-white p-4 shadow-soft sm:p-5">
                <p className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 text-[10px] font-extrabold tracking-widest text-navy uppercase">
                  🎯 Tu misión — Di esto en francés
                </p>
                <p className="mt-3 font-display text-lg font-extrabold leading-snug text-navy sm:text-xl">
                  {r.hint}
                </p>
                <div className="mt-3 rounded-xl border border-dashed border-blue/40 bg-white/70 p-3">
                  <p className="text-[10px] font-bold tracking-widest text-blue uppercase">💬 Ejemplo de apoyo</p>
                  <p className="mt-1 text-sm italic text-navy/80">« {r.example} »</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Puedes decirlo con tus propias palabras.</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => (isRec ? stopRec() : startRec(idx))}
                  disabled={uploading || readOnly || (!isRec && stages.some((s) => s.recording) && !st.recording)}
                  className={`grid h-14 w-14 place-items-center rounded-full text-white shadow-card transition disabled:opacity-40 ${
                    isRec ? "bg-red animate-pulse" : st.saved ? "bg-gold text-navy" : "bg-gradient-blue hover:scale-105"
                  }`}
                  aria-label={isRec ? "Detener" : "Grabar"}
                >
                  {isRec ? <Square className="h-6 w-6" /> : st.saved ? <Check className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </button>
                {st.url && <audio src={st.url} controls className="max-w-xs flex-1" />}
                {st.saved && !isRec && (
                  <Button variant="ghost" onClick={() => clearRec(idx)} className="text-muted-foreground" disabled={uploading}>
                    <MicOff className="mr-1 h-4 w-4" /> Volver a grabar
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit */}
      <div className="rounded-3xl border-2 border-gold/40 bg-white p-6 shadow-card">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gold" />
          <p className="font-display text-lg font-extrabold text-navy">Subir mi desafío</p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Cuando todas las etapas estén grabadas, envía tu desafío para recibir tu evaluación personalizada.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {stages.filter((s) => s.saved).length} / {steps.length} etapas guardadas
          </p>
          <Button
            onClick={submit}
            disabled={!allSaved || uploading || !!result || readOnly}
            className="bg-gradient-to-r from-gold to-[oklch(0.78_0.14_80)] text-navy font-extrabold shadow-card"
          >
            {uploading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluando…</>
            ) : result ? (
              <><Check className="mr-2 h-4 w-4" /> Enviado</>
            ) : (
              <>📤 Subir mi desafío <Upload className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </div>
        {uploading && progressMsg && <p className="mt-3 text-xs text-navy/70">{progressMsg}</p>}
        {errorMsg && <p className="mt-3 text-xs text-red">{errorMsg}</p>}
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-3xl border-2 border-blue/30 bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PartyPopper className="h-6 w-6 text-gold" />
              <h4 className="font-display text-2xl font-extrabold text-navy">¡Bravo ! Día {dayId} evaluado</h4>
            </div>
            <div className="rounded-full bg-gradient-blue px-4 py-1 text-white font-extrabold">
              {result.score.toFixed(1)} / 10
            </div>
          </div>
          {result.celebration_message && (
            <p className="mt-2 text-sm text-navy/80">{result.celebration_message}</p>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-success/30 bg-success/5 p-4">
              <p className="flex items-center gap-1 text-xs font-extrabold uppercase text-success">
                <Check className="h-3.5 w-3.5" /> Lo que hiciste bien
              </p>
              <ul className="mt-2 space-y-1 text-sm text-navy/90">
                {result.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-success">✅</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-blue/30 bg-blue/5 p-4">
              <p className="flex items-center gap-1 text-xs font-extrabold uppercase text-blue">
                <Sparkles className="h-3.5 w-3.5" /> Una mejora
              </p>
              {result.improvement.corrected ? (
                <div className="mt-2 text-sm text-navy/90">
                  <p className="text-xs text-muted-foreground">Dijiste:</p>
                  <p className="italic">« {result.improvement.said || "—"} »</p>
                  <p className="mt-1 text-xs text-muted-foreground">Versión corregida:</p>
                  <p className="font-semibold text-navy">« {result.improvement.corrected} »</p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-navy/70">Sin correcciones importantes. ¡Impresionante!</p>
              )}
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-border bg-ice/40 p-4">
            <p className="flex items-center gap-1 text-xs font-extrabold uppercase text-navy">
              <Target className="h-3.5 w-3.5" /> Criterios cumplidos ({result.hits}/{result.total})
            </p>
            <ul className="mt-2 grid gap-1 text-xs text-navy/80 sm:grid-cols-2">
              {criteria.map((c, i) => {
                const done = result.matched_criteria.includes(c);
                return (
                  <li key={i} className={`flex items-start gap-2 ${done ? "" : "text-navy/40 line-through"}`}>
                    {done ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" /> : <span className="mt-0.5 h-3.5 w-3.5 shrink-0">·</span>}
                    <span>{c}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {result.recommendation && (
            <div className="mt-3 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm text-navy/90">
              <p className="text-xs font-extrabold uppercase text-navy">Tu próximo paso</p>
              <p className="mt-1">💡 {result.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
