import mascot from "@/assets/liberte-mascot.png.asset.json";

/** Inline animated hummingbird — replaces the 👋 emoji. */
export function MascotIcon({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-block align-middle ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={mascot.url}
        alt="Liberté"
        className="h-full w-full object-contain animate-mascot-fly drop-shadow-[0_4px_10px_rgba(75,177,236,0.5)]"
      />
      <style>{`
        @keyframes mascot-fly {
          0%,100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-4px) rotate(-6deg); }
          50% { transform: translateY(-2px) rotate(2deg); }
          75% { transform: translateY(-5px) rotate(-3deg); }
        }
        .animate-mascot-fly { animation: mascot-fly 2.4s ease-in-out infinite; transform-origin: 60% 70%; }
      `}</style>
    </span>
  );
}
