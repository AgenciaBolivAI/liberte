import { useCallback, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { speakFr } from "@/lib/speak";
import type { Month3Word } from "@/data/month3";
import {
  ROUND_MS,
  WRONG_TAP_PENALTY_MS,
  buildPhraseRounds,
  daySeed,
  emptyScore,
  starsFor,
  type PhraseRound,
  type Score,
} from "./engine";
import { useGameLoop } from "./useGameLoop";
import { ArcadeShell, PauseButton, themeFor } from "./ArcadeShell";

/**
 * « Complète la phrase » — the grammar half.
 *
 * The client's document gives, for every word, a real sentence that uses it, and
 * those sentences ARE the day's grammar in action: « Mon frère est né trois ans
 * après moi » is the passé composé avec être, « Je travaille sur ce projet
 * depuis plus d'un an » is depuis + présent. Blanking the word turns each one
 * into a round that cannot be won without reading the whole French sentence —
 * the Spanish translation gives the meaning, so only the form is left to choose.
 *
 * Different arcade SHAPE from the whack-a-mole on purpose: there the targets
 * come to you, here the sentence is fixed and the clock is the pressure. Two
 * games that felt the same would be the boredom the client complained about.
 */
export function PhraseGame({
  dayId,
  topic,
  grammar,
  vocabulary,
}: {
  dayId: number;
  topic: string;
  grammar: string;
  vocabulary: Month3Word[];
}) {
  const theme = themeFor(topic);
  const [rounds, setRounds] = useState<PhraseRound[]>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState<Score>(emptyScore());
  const [picked, setPicked] = useState<string | null>(null);
  const [missed, setMissed] = useState<{ fr: string; es: string }[]>([]);
  const streakRef = useRef(0);
  const idxRef = useRef(0);
  const scoreRef = useRef(score);
  scoreRef.current = score;

  const loop = useGameLoop({
    durationMs: ROUND_MS,
    onTick: () => {},
    onEnd: () => setPicked(null),
  });

  const start = useCallback(() => {
    const built = buildPhraseRounds(vocabulary, { seed: daySeed(dayId, 2), decoys: 3 });
    setRounds(built);
    setIdx(0);
    idxRef.current = 0;
    setScore(emptyScore());
    setMissed([]);
    setPicked(null);
    streakRef.current = 0;
    loop.start();
  }, [dayId, vocabulary, loop]);

  const round = rounds[idx % Math.max(1, rounds.length)];

  const choose = useCallback(
    (label: string) => {
      if (loop.state !== "running" || picked || !round) return;
      setPicked(label);
      const ok = label === round.answer;
      if (ok) {
        streakRef.current += 1;
        setScore((s) => ({
          ...s,
          hits: s.hits + 1,
          streak: streakRef.current,
          best: Math.max(s.best, streakRef.current),
        }));
        // Hear the COMPLETE sentence, not the bare word: the grammar is the
        // point, and she has just built it.
        speakFr(round.masked.replace("____", round.answer));
      } else {
        streakRef.current = 0;
        setScore((s) => ({ ...s, misses: s.misses + 1, streak: 0 }));
        loop.penalise(WRONG_TAP_PENALTY_MS);
        const w = vocabulary.find((v) => v.fr === round.answer);
        if (w) {
          setMissed((m) => (m.some((x) => x.fr === w.fr) ? m : [...m, { fr: w.fr, es: w.es }]));
        }
      }
      // Show the answer in place for a beat — a wrong tap has to TEACH, or the
      // round is just a buzzer.
      window.setTimeout(
        () => {
          setPicked(null);
          idxRef.current += 1;
          setIdx(idxRef.current);
        },
        ok ? 700 : 1500,
      );
    },
    [loop, picked, round, vocabulary],
  );

  return (
    <ArcadeShell
      title="Complète la phrase"
      howTo={`Elige la palabra que falta. La frase es del curso — hoy practicas ${grammar}.`}
      theme={theme}
      state={loop.state}
      remaining={loop.remaining}
      totalMs={ROUND_MS}
      score={score}
      missedWords={missed}
      onStart={start}
      onResume={loop.resume}
      onReplay={start}
    >
      <PauseButton onPause={loop.pause} />

      {round && (
        <div className="p-4">
          <div className="rounded-2xl bg-white/85 p-4 text-center shadow-soft">
            <p className="font-display text-lg leading-snug font-extrabold text-navy">
              {round.masked.split("____")[0]}
              <span
                className={`mx-1 inline-block min-w-[5rem] rounded-lg border-b-4 px-2 ${
                  picked
                    ? picked === round.answer
                      ? "border-green-500 bg-green-100 text-green-800"
                      : "border-red-400 bg-red-100 text-red-700"
                    : "border-blue/60 bg-blue/10 text-blue"
                }`}
              >
                {picked ?? "?"}
              </span>
              {round.masked.split("____")[1]}
            </p>
            <p className="mt-2 text-sm text-navy/70">{round.promptEs}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {round.targets.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={!!picked}
                onClick={() => choose(t.label)}
                className="rounded-2xl border-2 border-white bg-white px-3 py-3 font-display text-base font-extrabold break-words text-navy shadow-card transition-transform active:scale-95 disabled:opacity-60"
              >
                {t.label}
              </button>
            ))}
          </div>

          {picked && picked !== round.answer && (
            <p className="mt-3 text-center text-sm font-bold text-navy">
              Era <span className="text-green-700">{round.answer}</span>
              <button
                type="button"
                onClick={() => speakFr(round.masked.replace("____", round.answer))}
                className="ml-2 inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-xs text-blue"
              >
                <Volume2 className="h-3 w-3" /> oír
              </button>
            </p>
          )}
        </div>
      )}

      {rounds.length === 0 && loop.state === "running" && (
        <p className="p-6 text-center text-sm text-navy/70">
          Este día no tiene frases suficientes para este juego.
        </p>
      )}
      <p className="pb-2 text-center text-[10px] text-navy/40">
        {starsFor(score) > 0 ? `${"⭐".repeat(starsFor(score))}` : ""}
      </p>
    </ArcadeShell>
  );
}
