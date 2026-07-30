import hero from "@/assets/bon-voyage-hero.png.asset.json";

/**
 * The no-WebGL night sky. Three jobs:
 *  1. Instant first paint behind the content while the 3D chunk downloads.
 *  2. The permanent backdrop for reduced-motion users and WebGL failures.
 *  3. The graceful landing spot if the 3D chunk 404s after a deploy.
 *
 * Pure CSS — stars only twinkle when the user has NOT asked for reduced
 * motion (the media query gates the animation, not the dots).
 */

// Deterministic pseudo-random star field (no Math.random — SSR-stable markup).
const STARS = Array.from({ length: 40 }, (_, i) => {
  const h = (i * 2654435761) % 997;
  return {
    left: ((h * 7) % 100) + 0.3,
    top: (((h * 13) % 83) + 1) * 0.7,
    size: 1 + ((h * 3) % 10) / 8,
    delay: ((h * 11) % 50) / 10,
  };
});

export function StaticCityFallback() {
  return (
    <div aria-hidden className="lp-static fixed inset-0 z-0 overflow-hidden">
      {/* Night gradient: zenith ink to horizon navy */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, #0A1029 0%, #16203f 55%, #3D5589 130%)" }}
      />
      {/* Star field */}
      {STARS.map((s, i) => (
        <span
          key={i}
          className="lp-star absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            opacity: 0.7,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
      {/* Warm glow where the tower lives */}
      <div
        className="absolute"
        style={{
          left: "50%",
          bottom: "-12%",
          width: "70vmax",
          height: "50vmax",
          transform: "translateX(-50%)",
          background:
            "radial-gradient(ellipse at 50% 90%, rgba(234,197,91,0.28) 0%, transparent 60%)",
        }}
      />
      {/* Paris skyline photo, screened into the night */}
      <img
        src={hero.url}
        alt=""
        className="absolute bottom-0 left-0 h-[55%] w-full object-cover opacity-30"
        style={{
          mixBlendMode: "screen",
          maskImage: "linear-gradient(180deg, transparent, black 35%)",
        }}
      />
    </div>
  );
}
