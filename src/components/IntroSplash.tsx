import { useEffect, useState } from "react";
import mascot from "@/assets/liberte-mascot.png.asset.json";

/** Welcome splash: hummingbird flying with sparkles. Shown once per session. */
export function IntroSplash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem("liberte:intro-seen") === "1") return;
      sessionStorage.setItem("liberte:intro-seen", "1");
    } catch { /* ignore */ }
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2800);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  // 14 sparkles around the bird
  const sparkles = Array.from({ length: 14 });

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center animate-intro-fade"
      style={{
        background:
          "radial-gradient(ellipse at center, oklch(0.42 0.075 265 / 0.97) 0%, oklch(0.22 0.08 265 / 1) 70%)",
      }}
    >
      <div className="relative flex flex-col items-center">
        <div className="relative">
          {sparkles.map((_, i) => {
            const angle = (i / sparkles.length) * Math.PI * 2;
            const r = 110 + (i % 3) * 30;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            const delay = (i * 90) % 1400;
            return (
              <span
                key={i}
                className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-white animate-sparkle"
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                  animationDelay: `${delay}ms`,
                  boxShadow:
                    "0 0 8px 2px rgba(255,255,255,0.95), 0 0 18px 4px rgba(155,203,239,0.6)",
                }}
              />
            );
          })}
          <img
            src={mascot.url}
            alt="Liberté"
            className="relative h-44 w-44 object-contain animate-intro-bird drop-shadow-[0_8px_30px_rgba(75,177,236,0.7)] sm:h-56 sm:w-56"
          />
        </div>
        <p className="mt-8 font-display text-2xl font-extrabold tracking-wide text-white animate-intro-text sm:text-3xl">
          Bienvenue, <span className="text-sky">Liberté</span>
        </p>
      </div>

      <style>{`
        @keyframes intro-fade { 0% { opacity: 0 } 8% { opacity: 1 } 88% { opacity: 1 } 100% { opacity: 0; visibility: hidden } }
        .animate-intro-fade { animation: intro-fade 2.8s ease forwards; }

        @keyframes intro-bird {
          0%   { transform: translateY(40px) scale(0.4) rotate(-10deg); opacity: 0; }
          25%  { transform: translateY(-10px) scale(1) rotate(2deg); opacity: 1; }
          50%  { transform: translateY(-22px) scale(1.04) rotate(-4deg); }
          75%  { transform: translateY(-8px) scale(1) rotate(3deg); }
          100% { transform: translateY(-16px) scale(1) rotate(0); opacity: 1; }
        }
        .animate-intro-bird { animation: intro-bird 2.2s cubic-bezier(0.2,0.7,0.2,1) forwards; }

        @keyframes intro-text { 0%,40% { opacity: 0; transform: translateY(12px) } 100% { opacity: 1; transform: translateY(0) } }
        .animate-intro-text { animation: intro-text 1.4s ease forwards; animation-delay: 0.6s; opacity: 0; }

        @keyframes sparkle {
          0%   { opacity: 0; transform: translate(0,0) scale(0); }
          40%  { opacity: 1; }
          100% { opacity: 0; transform: translate(var(--tx,0), var(--ty,0)) scale(1.4); }
        }
        .animate-sparkle { animation: sparkle 1.6s ease-out infinite; }
      `}</style>
    </div>
  );
}
