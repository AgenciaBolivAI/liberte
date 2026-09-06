import { useEffect, useState, type ReactNode } from "react";
import { Pause, Play, RotateCcw, Trophy } from "lucide-react";
import { accuracy, starsFor, type Score } from "./engine";
import type { LoopState } from "./useGameLoop";

/**
 * The frame every Month-3 arcade game sits in.
 *
 * Holds the parts that are the same in all of them — the start card, the HUD,
 * the pause overlay, the end card — so each game file is only its own mechanic.
 *
 * The end card is the piece that decides whether a beginner plays again. It
 * never shows a bare score: it shows what she GOT, names the words she missed so
 * the round taught her something even when it went badly, and the copy stays
 * warm without being patronising. A 45-year-old who scored 3/12 is not told
 * "¡casi!" — she is told what to look at next time.
 */

export type Theme = {
  /** Tailwind classes for the play area background. */
  bg: string;
  /** Accent used for the timer bar and the streak pill. */
  accent: string;
  emoji: string;
  label: string;
};

export function ArcadeShell({
  title,
  howTo,
  theme,
  state,
  remaining,
  totalMs,
  score,
  missedWords,
  onStart,
  onResume,
  onReplay,
  children,
}: {
  title: string;
  /** One line. If it needs two, the game is too complicated. */
  howTo: string;
  theme: Theme;
  state: LoopState;
  remaining: number;
  totalMs: number;
  score: Score;
  /** French words she got wrong, with their meaning — the teaching moment. */
  missedWords: { fr: string; es: string }[];
  onStart: () => void;
  onResume: () => void;
  onReplay: () => void;
  children: ReactNode;
}) {
  const pct = Math.max(0, Math.min(100, (remaining / totalMs) * 100));
  const seconds = Math.ceil(remaining / 1000);
  // Under 10s the bar turns urgent — the only place colour carries meaning, and
  // the number is right next to it, so it never carries it alone.
  const urgent = state === "running" && remaining <= 10_000;

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="font-display text-base font-extrabold text-navy">
            {theme.emoji} {title}
          </p>
          <p className="truncate text-xs text-muted-foreground">{theme.label}</p>
        </div>
        {state === "running" && (
          <div className="flex items-center gap-3">
            <span
              className={`font-display text-lg font-extrabold tabular-nums ${urgent ? "text-red-600" : "text-navy"}`}
              aria-label={`${seconds} segundos`}
            >
              {seconds}s
            </span>
            <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-extrabold text-navy tabular-nums">
              {score.hits} ✓
            </span>
            {score.streak >= 3 && (
              <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${theme.accent}`}>
                🔥 {score.streak}
              </span>
            )}
          </div>
        )}
      </div>

      {state === "running" && (
        <div className="h-1.5 w-full bg-muted" role="progressbar" aria-valuenow={seconds}>
          <div
            className={`h-full transition-[width] duration-100 ease-linear ${urgent ? "bg-red-500" : "bg-gradient-blue"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <div className={`arcade-board relative min-h-[380px] ${theme.bg}`}>
        {state === "idle" && (
          <StartCard title={title} howTo={howTo} theme={theme} onStart={onStart} />
        )}

        {state === "paused" && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-navy/70 backdrop-blur-sm">
            <button
              type="button"
              onClick={onResume}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white px-8 py-6 font-display text-lg font-extrabold text-navy shadow-card"
            >
              <Play className="h-8 w-8 text-blue" />
              Continuar
              <span className="text-xs font-medium text-muted-foreground">
                Se pausó solo — no perdiste nada.
              </span>
            </button>
          </div>
        )}

        {state === "over" && (
          <EndCard score={score} missedWords={missedWords} onReplay={onReplay} />
        )}

        {(state === "running" || state === "paused") && children}
      </div>
    </div>
  );
}

function StartCard({
  title,
  howTo,
  theme,
  onStart,
}: {
  title: string;
  howTo: string;
  theme: Theme;
  onStart: () => void;
}) {
  return (
    <div className="absolute inset-0 grid place-items-center p-6 text-center">
      <div>
        <div className="text-5xl" aria-hidden>
          {theme.emoji}
        </div>
        <h3 className="mt-3 font-display text-xl font-extrabold text-navy">{title}</h3>
        {/* One line, then the button. A wall of rules before a game is why nobody
            reads the rules. */}
        <p className="mx-auto mt-2 max-w-xs text-sm text-navy/75">{howTo}</p>
        <button
          type="button"
          onClick={onStart}
          className="mt-5 rounded-full bg-gradient-blue px-10 py-3 font-display text-base font-extrabold text-white shadow-card transition hover:opacity-90 active:scale-95"
        >
          Jouer
        </button>
        <p className="mt-3 text-xs text-muted-foreground">75 segundos · sin penalización de puntos</p>
      </div>
    </div>
  );
}

function EndCard({
  score,
  missedWords,
  onReplay,
}: {
  score: Score;
  missedWords: { fr: string; es: string }[];
  onReplay: () => void;
}) {
  const acc = accuracy(score);
  const stars = starsFor(score);
  // Never "casi" and never a bare number: say what she DID, then what to look at.
  const headline =
    score.hits === 0
      ? "Primera vez — ya está, ahora sabes cómo va"
      : acc >= 80
        ? "Muy bien — dominas estas palabras"
        : acc >= 55
          ? `${score.hits} aciertos — vas bien`
          : `${score.hits} aciertos — estas palabras son nuevas todavía`;

  return (
    <div className="absolute inset-0 z-20 overflow-y-auto bg-white/95 p-5 backdrop-blur-sm">
      <div className="mx-auto max-w-sm text-center">
        <Trophy className="mx-auto h-8 w-8 text-gold" />
        <h3 className="mt-2 font-display text-lg font-extrabold text-navy">{headline}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {score.hits} de {score.hits + score.misses} · racha máxima {score.best}
        </p>
        <p className="mt-2 text-2xl" aria-label={`${stars} estrellas`}>
          {"⭐".repeat(stars)}
          {"·".repeat(Math.max(0, 3 - stars))}
        </p>

        {missedWords.length > 0 && (
          <div className="mt-4 rounded-2xl border border-gold/40 bg-gold/5 p-3 text-left">
            <p className="text-[11px] font-bold tracking-wide text-navy/60 uppercase">
              Para la próxima
            </p>
            <ul className="mt-1 space-y-1">
              {missedWords.slice(0, 6).map((w) => (
                <li key={w.fr} className="text-sm text-navy">
                  <b>{w.fr}</b> <span className="text-muted-foreground">— {w.es}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={onReplay}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-blue px-8 py-3 font-display text-base font-extrabold text-white shadow-card active:scale-95"
        >
          <RotateCcw className="h-4 w-4" />
          Otra vez
        </button>
      </div>
    </div>
  );
}

/** Pause button the games render into their own HUD row. */
export function PauseButton({ onPause }: { onPause: () => void }) {
  return (
    <button
      type="button"
      onClick={onPause}
      aria-label="Pausa"
      className="absolute top-2 right-2 z-10 rounded-full bg-white/80 p-2 text-navy shadow-soft backdrop-blur"
    >
      <Pause className="h-4 w-4" />
    </button>
  );
}

/** Themes are per TOPIC, so the skin reinforces the day's own subject. */
export const MONTH3_THEMES: Record<string, Theme> = {
  "Mi infancia": { bg: "bg-gradient-to-b from-amber-50 to-orange-100", accent: "bg-amber-200 text-amber-900", emoji: "🧸", label: "Mi infancia" },
  "Mi familia": { bg: "bg-gradient-to-b from-rose-50 to-rose-100", accent: "bg-rose-200 text-rose-900", emoji: "👨‍👩‍👧", label: "Mi familia" },
  "Mi país": { bg: "bg-gradient-to-b from-emerald-50 to-teal-100", accent: "bg-emerald-200 text-emerald-900", emoji: "🗺️", label: "Mi país" },
  "Mis estudios": { bg: "bg-gradient-to-b from-sky-50 to-indigo-100", accent: "bg-sky-200 text-sky-900", emoji: "🎓", label: "Mis estudios" },
  "Mi experiencia laboral": { bg: "bg-gradient-to-b from-slate-50 to-slate-200", accent: "bg-slate-300 text-slate-900", emoji: "💼", label: "Mi experiencia laboral" },
  "Mis viajes": { bg: "bg-gradient-to-b from-cyan-50 to-blue-100", accent: "bg-cyan-200 text-cyan-900", emoji: "✈️", label: "Mis viajes" },
  "Mis sueños": { bg: "bg-gradient-to-b from-violet-50 to-purple-100", accent: "bg-violet-200 text-violet-900", emoji: "🌠", label: "Mis sueños" },
  "Mis objetivos": { bg: "bg-gradient-to-b from-lime-50 to-green-100", accent: "bg-lime-200 text-lime-900", emoji: "🎯", label: "Mis objetivos" },
  "Mis emociones": { bg: "bg-gradient-to-b from-pink-50 to-fuchsia-100", accent: "bg-pink-200 text-pink-900", emoji: "💗", label: "Mis emociones" },
  "Una experiencia importante": { bg: "bg-gradient-to-b from-orange-50 to-red-100", accent: "bg-orange-200 text-orange-900", emoji: "🔥", label: "Una experiencia importante" },
};

export function themeFor(topic: string): Theme {
  return (
    MONTH3_THEMES[topic] ?? {
      bg: "bg-gradient-to-b from-ice to-blue-100",
      accent: "bg-blue/20 text-navy",
      emoji: "🇫🇷",
      label: topic,
    }
  );
}

/** Shared hook: the browser's reduced-motion preference, for the games' juice. */
export function useReducedMotionClass(): string {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);
  return reduced ? "" : "transition-transform duration-200";
}
