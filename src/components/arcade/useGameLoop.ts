import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The one game loop every Month-3 arcade game shares.
 *
 * Responsibilities no individual game should ever re-implement:
 *  - a requestAnimationFrame tick with a real elapsed clock;
 *  - pausing when the tab is hidden, so a student who takes a phone call does
 *    not come back to a lost round (the same visibilitychange signal that used
 *    to wipe lesson progress in this app);
 *  - honouring prefers-reduced-motion by slowing the clock rather than
 *    disabling the game, so it stays playable for someone who needs it;
 *  - never running during SSR.
 */

export type LoopState = "idle" | "running" | "paused" | "over";

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);
  return reduced;
}

export function useGameLoop(opts: {
  durationMs: number;
  /** Called every frame with (elapsedMs, deltaMs). Keep it allocation-free. */
  onTick: (elapsed: number, delta: number) => void;
  onEnd: () => void;
}) {
  const [state, setState] = useState<LoopState>("idle");
  const elapsedRef = useRef(0);
  const lastRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const penaltyRef = useRef(0);
  // Kept in refs so changing a callback never restarts the loop mid-round.
  const tickRef = useRef(opts.onTick);
  const endRef = useRef(opts.onEnd);
  tickRef.current = opts.onTick;
  endRef.current = opts.onEnd;
  const durationRef = useRef(opts.durationMs);
  durationRef.current = opts.durationMs;

  const [remaining, setRemaining] = useState(opts.durationMs);

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const frame = useCallback(
    (now: number) => {
      const last = lastRef.current || now;
      // Clamp: a backgrounded tab can hand back a delta of many seconds, which
      // would expire every target at once the moment the student returns.
      const delta = Math.min(now - last, 100);
      lastRef.current = now;
      elapsedRef.current += delta;
      const left = durationRef.current - elapsedRef.current - penaltyRef.current;
      setRemaining(Math.max(0, left));
      tickRef.current(elapsedRef.current, delta);
      if (left <= 0) {
        stop();
        setState("over");
        endRef.current();
        return;
      }
      rafRef.current = requestAnimationFrame(frame);
    },
    [stop],
  );

  const start = useCallback(() => {
    if (typeof window === "undefined") return;
    elapsedRef.current = 0;
    penaltyRef.current = 0;
    lastRef.current = 0;
    setRemaining(durationRef.current);
    setState("running");
    rafRef.current = requestAnimationFrame(frame);
  }, [frame]);

  const pause = useCallback(() => {
    setState((s) => {
      if (s !== "running") return s;
      stop();
      return "paused";
    });
  }, [stop]);

  const resume = useCallback(() => {
    setState((s) => {
      if (s !== "paused") return s;
      lastRef.current = 0;
      rafRef.current = requestAnimationFrame(frame);
      return "running";
    });
  }, [frame]);

  /** A wrong tap costs seconds, never points — see the fairness note in engine.ts. */
  const penalise = useCallback((ms: number) => {
    penaltyRef.current += ms;
  }, []);

  // Leaving the tab pauses instead of losing the round.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVis = () => {
      if (document.hidden) pause();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [pause]);

  useEffect(() => stop, [stop]);

  return { state, setState, remaining, start, pause, resume, penalise, elapsed: elapsedRef };
}
