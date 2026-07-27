/**
 * Reject a promise that takes too long, so the UI can always recover.
 *
 * The server now has its own deadlines (src/lib/ai.ts), but a request can also
 * stall in the browser — a dropped mobile connection never rejects `fetch`. A
 * student reported the writing exercise stuck on "Corrigiendo… ✨" forever:
 * the awaited call simply never settled, so the button's `busy` flag was never
 * cleared. Anything a student waits on must have a client-side deadline too.
 */
export function withTimeout<T>(p: Promise<T>, ms: number, label = "La operación"): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} tardó demasiado. Inténtalo de nuevo.`)), ms),
    ),
  ]);
}
