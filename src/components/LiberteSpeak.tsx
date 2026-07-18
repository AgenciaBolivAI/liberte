import { useEffect, useState } from "react";
import mascot from "@/assets/liberte-mascot.png.asset.json";
import { Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSpeaking, onSpeakChange, speakFr } from "@/lib/speak";

export function LiberteSpeak({
  message,
  size = "md",
  tone = "card",
}: {
  message: string;
  size?: "sm" | "md" | "lg";
  tone?: "card" | "ghost";
}) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => onSpeakChange(() => setPlaying(isSpeaking(message))), [message]);



  const toggle = () => {
    void speakFr(message);
  };
  const sizes = {
    sm: { img: "h-14 w-14", text: "text-sm" },
    md: { img: "h-24 w-24", text: "text-base" },
    lg: { img: "h-32 w-32", text: "text-lg" },
  } as const;
  return (
    <div
      className={`flex items-start gap-4 rounded-3xl p-5 ${
        tone === "card" ? "border border-sky/40 bg-ice shadow-soft" : ""
      }`}
    >
      <img
        src={mascot.url}
        alt="Liberté el colibrí"
        className={`${sizes[size].img} shrink-0 bg-transparent object-contain animate-[float_3s_ease-in-out_infinite] drop-shadow-[0_8px_18px_rgba(75,177,236,0.35)]`}
      />
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="font-display text-xs font-bold tracking-wider text-navy uppercase">
            Liberté
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={toggle}
            className="h-6 rounded-full px-2 text-navy hover:bg-sky/30"
            aria-label={playing ? "Pause" : "Écouter"}
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <p className={`${sizes[size].text} text-navy leading-relaxed`}>{message}</p>
      </div>
      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
      `}</style>
    </div>
  );
}
