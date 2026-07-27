import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Detects that a NEW build was deployed while this tab stayed open, and nudges
 * a reload.
 *
 * WHY: the SPA had no version check, so tabs opened before a deploy keep
 * running the old JS indefinitely. That is how students kept reporting bugs
 * that were already fixed (forensics: a student's défi session at 14:03 ran a
 * pre-fix bundle and saved nothing, 21 minutes before a fresh tab worked), and
 * how the teacher's student-view tab showed no video fields after they shipped.
 *
 * HOW: the entry bundle filename is content-hashed (/assets/index-XXXX.js).
 * Re-fetch the HTML shell (cheap, no-store) at most every 5 minutes while
 * visible and compare hashes; on mismatch show a persistent reload toast.
 */
export function useNewBuildNudge() {
  const notified = useRef(false);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const current = Array.from(document.querySelectorAll("script[src]"))
      .map((s) => s.getAttribute("src") ?? "")
      .find((src) => /\/assets\/index-[\w-]+\.js/.test(src));
    if (!current) return; // dev server shell — nothing to compare
    let last = 0;
    const check = async () => {
      if (notified.current) return;
      const now = Date.now();
      if (now - last < 5 * 60_000) return;
      last = now;
      try {
        const res = await fetch(`/?v=${now}`, { cache: "no-store" });
        const html = await res.text();
        const m = html.match(/\/assets\/index-[\w-]+\.js/);
        if (m && !current.includes(m[0])) {
          notified.current = true;
          toast.info("Nouvelle version disponible ✨", {
            description: "Recharge la page pour avoir les dernières corrections.",
            duration: Infinity,
            action: { label: "Recharger", onClick: () => window.location.reload() },
          });
        }
      } catch {
        /* offline — retry on the next tick */
      }
    };
    const onVis = () => {
      if (document.visibilityState === "visible") void check();
    };
    const iv = setInterval(onVis, 10 * 60_000);
    document.addEventListener("visibilitychange", onVis);
    const t = setTimeout(() => void check(), 15_000); // first check off the critical path
    return () => {
      clearInterval(iv);
      clearTimeout(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
}
