/**
 * Maps native page scroll to flight progress p ∈ [0, N−1], where N is the
 * number of `[data-flight]` sections on the page.
 *
 * Deliberately NO scroll hijacking: the DOM scrolls normally (form, accordion,
 * anchor links, accessibility all intact) and the camera follows. Progress is
 * anchored to each section's measured top so layout changes (FAQ accordion
 * opening, the lead form's success card, iOS URL-bar resizes) only require a
 * re-measure, which ResizeObserver provides.
 */
export type ScrollRig = {
  /** Current progress; piecewise-linear between section anchors. */
  getProgress: () => number;
  /** Number of flight stops found in the DOM. */
  stops: number;
  dispose: () => void;
};

export function createScrollRig(): ScrollRig {
  let anchors: number[] = [];

  const measure = () => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-flight]")).sort(
      (a, b) => Number(a.dataset.flight) - Number(b.dataset.flight),
    );
    // Anchor = the scrollY at which a section is "reached": its top minus a
    // quarter viewport, so the camera settles while the section slides in.
    anchors = sections.map((el) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      return Math.max(0, top - window.innerHeight * 0.25);
    });
  };

  measure();

  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(measure, 150);
  };
  window.addEventListener("resize", onResize);
  window.addEventListener("load", measure);
  // Accordion opens / form success change the document height mid-session.
  const ro = new ResizeObserver(onResize);
  ro.observe(document.body);

  const getProgress = () => {
    if (anchors.length < 2) return 0;
    const y = window.scrollY;
    if (y <= anchors[0]) return 0;
    const last = anchors.length - 1;
    if (y >= anchors[last]) return last;
    let i = 0;
    while (i < last && anchors[i + 1] <= y) i++;
    const span = anchors[i + 1] - anchors[i];
    return span > 0 ? i + (y - anchors[i]) / span : i;
  };

  return {
    getProgress,
    stops: anchors.length,
    dispose: () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", measure);
      ro.disconnect();
    },
  };
}
