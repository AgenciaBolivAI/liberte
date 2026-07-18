import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import eiffelBg from "@/assets/paris-eiffel-bg.jpg";
import logo from "@/assets/liberte-logo-full.png.asset.json";

export const NAVY = "#3D5589";
export const CREAM = "#FAF7F2";
export const BLUE = "#73ACDB";
export const SKY = "#9BCBEF";
export const RED = "#C44536";

export function Slide({
  children,
  kicker,
}: {
  children: ReactNode;
  kicker?: string;
}) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4 sm:px-10 py-8 sm:py-14 text-center">
      {kicker && (
        <p
          className="mb-3 text-[11px] sm:text-sm font-bold uppercase tracking-[0.35em]"
          style={{ color: SKY }}
        >
          {kicker}
        </p>
      )}
      <div className="w-full max-w-5xl">{children}</div>
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl border border-white/60 ${className}`}
    >
      {children}
    </div>
  );
}

export function SlideTitle({ children }: { children: ReactNode }) {
  return (
    <h1
      className="font-[var(--font-display)] font-extrabold text-4xl sm:text-6xl md:text-7xl leading-[0.95] tracking-tight text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
    >
      {children}
    </h1>
  );
}

export function SlideH2({ children }: { children: ReactNode }) {
  return (
    <h2
      className="font-[var(--font-display)] font-extrabold text-3xl sm:text-5xl leading-tight text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.35)] mb-6"
    >
      {children}
    </h2>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-block px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-widest text-white shadow-md mb-4"
      style={{ background: RED }}
    >
      {children}
    </span>
  );
}

export function Reveal({ q, a }: { q: ReactNode; a: ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3">
      <p className="flex-1 text-base sm:text-xl font-semibold text-left" style={{ color: NAVY }}>
        {q}
      </p>
      {show ? (
        <p
          className="text-base sm:text-xl font-extrabold text-left sm:text-right"
          style={{ color: RED }}
        >
          → {a}
        </p>
      ) : (
        <button
          onClick={() => setShow(true)}
          className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full text-white shadow hover:opacity-90 transition"
          style={{ background: BLUE }}
        >
          <Eye className="h-3.5 w-3.5" /> Voir la réponse
        </button>
      )}
    </div>
  );
}

export function QuizSlide({
  children,
  kicker,
  title,
}: {
  children: ReactNode;
  kicker?: string;
  title?: ReactNode;
}) {
  const [hideKey, setHideKey] = useState(0);
  return (
    <Slide kicker={kicker}>
      {title && <SlideH2>{title}</SlideH2>}
      <div className="mb-3 flex justify-end">
        <button
          onClick={() => setHideKey((k) => k + 1)}
          className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full text-white shadow-md hover:opacity-90 transition"
          style={{ background: NAVY }}
        >
          <EyeOff className="h-3.5 w-3.5" /> Cacher tout
        </button>
      </div>
      <Card className="p-4 sm:p-6 text-left">
        <div key={hideKey} className="divide-y divide-slate-200">
          {children}
        </div>
      </Card>
    </Slide>
  );
}


export function SlideDeck({ slides }: { slides: ReactNode[] }) {
  const [i, setI] = useState(0);
  const total = slides.length;

  const next = useCallback(
    () => setI((v) => Math.min(v + 1, total - 1)),
    [total],
  );
  const prev = useCallback(() => setI((v) => Math.max(v - 1, 0)), []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [next, prev]);

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(180deg, oklch(0.42 0.075 265 / 0.75) 0%, oklch(0.32 0.08 265 / 0.88) 60%, oklch(0.28 0.08 265 / 0.94) 100%), url(${eiffelBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div className="min-h-screen flex items-center justify-center pb-28 pt-6">
        {slides[i]}
      </div>

      {/* Logo bottom-right on every slide */}
      <img
        src={logo.url}
        alt="Liberté · Instituto de Francés"
        className="fixed bottom-3 right-3 h-9 sm:h-12 w-auto opacity-95 drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] bg-white/90 rounded-lg px-2 py-1"
      />

      {/* Nav controls */}
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 rounded-full px-2.5 sm:px-3 py-2 shadow-2xl backdrop-blur-md max-w-[92vw]"
        style={{ background: "rgba(61,85,137,0.9)" }}
      >
        <button
          onClick={prev}
          disabled={i === 0}
          aria-label="Précédent"
          className="h-9 w-9 sm:h-10 sm:w-10 rounded-full grid place-items-center text-white transition disabled:opacity-30 hover:bg-white/15 shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-white/95 text-xs sm:text-sm font-bold tabular-nums px-2 min-w-[4rem] text-center">
          {i + 1} / {total}
        </span>
        <button
          onClick={next}
          disabled={i === total - 1}
          aria-label="Suivant"
          className="h-9 w-9 sm:h-10 sm:w-10 rounded-full grid place-items-center text-white transition disabled:opacity-30 hover:bg-white/15 shrink-0"
          style={{ background: i === total - 1 ? "transparent" : BLUE }}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
