import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { speakFr } from "@/lib/speak";
import type { Month3Word } from "@/data/month3";
import {
  LIFETIME_MS,
  ROUND_MS,
  WRONG_TAP_PENALTY_MS,
  accuracy,
  buildRounds,
  daySeed,
  emptyScore,
  nextDifficulty,
  starsFor,
  type Difficulty,
  type Round,
  type Score,
} from "./engine";
import { useGameLoop } from "./useGameLoop";
import { ArcadeShell, PauseButton, themeFor } from "./ArcadeShell";

/**
 * « Attrape le mot » — the game the client pointed at.
 *
 * Wordwall whack-a-mole, but the moles are the day's French words and the
 * prompt is the Spanish meaning: she reads the meaning she HAS and must produce
 * the French she is LEARNING. That direction matters — showing the French and
 * asking for the Spanish is recognition, which feels easier and teaches less.
 *
 * The one thing that makes it teach rather than just test: on a wrong tap it
 * says out loud what she actually tapped, and on a right tap it speaks the word.
 * A round is 75 seconds of hearing correct French, not 75 seconds of buzzing.
 */

type Live = {
  key: number;
  label: string;
  correct: boolean;
  /** grid slot 0-5 */
  slot: number;
  bornAt: number;
  diesAt: number;
};

const SLOTS = 6;

export function WhackGame({
  dayId,
  topic,
  vocabulary,
  onAward,
}: {
  dayId: number;
  topic: string;
  vocabulary: Month3Word[];
  onAward?: (n?: number) => void;
}) {
  const theme = themeFor(topic);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [live, setLive] = useState<Live[]>([]);
  const [score, setScore] = useState<Score>(emptyScore());
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [flash, setFlash] = useState<{ key: number; ok: boolean } | null>(null);
  const [missed, setMissed] = useState<{ fr: string; es: string }[]>([]);
  const awarded = useRef(false);

  const keyRef = useRef(0);
  const roundRef = useRef(0);
  const nextSpawnRef = useRef(0);
  const queueRef = useRef<Round["targets"]>([]);
  const diffRef = useRef<Difficulty>("easy");
  const streakRef = useRef(0);

  const loop = useGameLoop({
    durationMs: ROUND_MS,
    onTick: (elapsed) => {
      // Retire anything past its lifetime. A target that expires is NOT a miss:
      // only a wrong TAP counts against her, so hesitating is free.
      setLive((cur) => (cur.some((t) => t.diesAt <= elapsed) ? cur.filter((t) => t.diesAt > elapsed) : cur));
      if (elapsed < nextSpawnRef.current) return;
      const life = LIFETIME_MS[diffRef.current];
      nextSpawnRef.current = elapsed + Math.max(650, life / 3);
      const next = queueRef.current.shift();
      if (!next) return;
      setLive((cur) => {
        const taken = new Set(cur.map((t) => t.slot));
        const free = [...Array(SLOTS).keys()].filter((s) => !taken.has(s));
        if (!free.length) return cur;
        const slot = free[(keyRef.current + next.id) % free.length];
        return [
          ...cur,
          {
            key: keyRef.current++,
            label: next.label,
            correct: next.correct,
            slot,
            bornAt: elapsed,
            diesAt: elapsed + life,
          },
        ];
      });
    },
    onEnd: () => {
      setLive([]);
      if (!awarded.current) {
        awarded.current = true;
        const s = starsFor(scoreRef.current);
        if (s > 0) onAward?.(1);
      }
    },
  });

  // The loop's onEnd closure would otherwise read a stale score — the same
  // class of bug that stalled the voice tutor.
  const scoreRef = useRef(score);
  scoreRef.current = score;

  const loadRound = useCallback(
    (idx: number, all: Round[]) => {
      const r = all[idx % all.length];
      if (!r) return;
      queueRef.current = [...r.targets];
      setLive([]);
    },
    [],
  );

  const start = useCallback(() => {
    const built = buildRounds(vocabulary, { seed: daySeed(dayId, 1), decoys: 3 });
    setRounds(built);
    setRoundIdx(0);
    roundRef.current = 0;
    setScore(emptyScore());
    setMissed([]);
    setDifficulty("easy");
    diffRef.current = "easy";
    streakRef.current = 0;
    keyRef.current = 0;
    nextSpawnRef.current = 0;
    awarded.current = false;
    loadRound(0, built);
    loop.start();
  }, [dayId, vocabulary, loadRound, loop]);

  const advance = useCallback(() => {
    const next = roundRef.current + 1;
    roundRef.current = next;
    setRoundIdx(next);
    loadRound(next, rounds);
  }, [rounds, loadRound]);

  const tap = useCallback(
    (t: Live) => {
      if (loop.state !== "running") return;
      setLive((cur) => cur.filter((x) => x.key !== t.key));
      setFlash({ key: t.key, ok: t.correct });
      window.setTimeout(() => setFlash(null), 320);
      const round = rounds[roundRef.current % rounds.length];

      if (t.correct) {
        streakRef.current += 1;
        setScore((s) => ({
          ...s,
          hits: s.hits + 1,
          streak: streakRef.current,
          best: Math.max(s.best, streakRef.current),
        }));
        // Hearing it is the teaching moment — this is a language game, not a
        // reflex test.
        speakFr(t.label);
        const d = nextDifficulty(diffRef.current, streakRef.current, false);
        diffRef.current = d;
        setDifficulty(d);
        advance();
      } else {
        streakRef.current = 0;
        setScore((s) => ({ ...s, misses: s.misses + 1, streak: 0 }));
        loop.penalise(WRONG_TAP_PENALTY_MS);
        const word = vocabulary.find((v) => v.fr === t.label);
        if (word) {
          setMissed((m) =>
            m.some((x) => x.fr === word.fr) ? m : [...m, { fr: word.fr, es: word.es }],
          );
        }
        const d = nextDifficulty(diffRef.current, 0, true);
        diffRef.current = d;
        setDifficulty(d);
        // Keep the round: she still has to find the right one.
        void round;
      }
    },
    [loop, rounds, advance, vocabulary],
  );

  useEffect(() => () => setLive([]), []);

  const round = rounds[roundIdx % Math.max(1, rounds.length)];

  return (
    <ArcadeShell
      title="Attrape le mot"
      howTo="Toca la palabra francesa que significa lo que se muestra. Fallar solo cuesta tiempo."
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
        <div className="px-4 pt-4 text-center">
          <p className="text-[11px] font-bold tracking-widest text-navy/50 uppercase">
            ¿Cómo se dice?
          </p>
          <p className="font-display text-xl font-extrabold text-navy">{round.promptEs}</p>
          <button
            type="button"
            onClick={() => speakFr(round.answerFr)}
            className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-blue"
          >
            <Volume2 className="h-3.5 w-3.5" /> Pista sonora
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
        {[...Array(SLOTS).keys()].map((slot) => {
          const t = live.find((x) => x.slot === slot);
          const isFlash = t && flash?.key === t.key;
          return (
            <div key={slot} className="grid h-20 place-items-center">
              {t && (
                <button
                  type="button"
                  onClick={() => tap(t)}
                  className={`w-full rounded-2xl border-2 px-2 py-3 font-display text-base font-extrabold break-words shadow-card transition-transform duration-150 active:scale-95 ${
                    isFlash
                      ? flash.ok
                        ? "border-green-500 bg-green-100 text-green-800"
                        : "border-red-400 bg-red-100 text-red-700"
                      : "border-white bg-white text-navy"
                  }`}
                  style={{ animation: "arcade-pop 180ms ease-out" }}
                >
                  {t.label}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {score.misses > 0 && loop.state === "running" && (
        <p className="pb-3 text-center text-xs text-navy/60">
          {accuracy(score)}% de acierto · fallar solo resta segundos
        </p>
      )}
      <p className="pb-3 text-center text-[10px] text-navy/40">nivel: {difficulty}</p>
    </ArcadeShell>
  );
}
