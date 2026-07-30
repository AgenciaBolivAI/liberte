import { useEffect } from "react";
import { prefersReducedMotion } from "./quality";

/**
 * Section entrances: every `[data-reveal]` element fades/slides in the first
 * time it enters the viewport (class `lp-in`, styles in styles.css). CSS-only
 * animation — works identically over the 3D city and the static fallback.
 * Under prefers-reduced-motion everything is revealed immediately.
 */
export function useReveal(): void {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (els.length === 0) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.classList.add("lp-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("lp-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.15 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
