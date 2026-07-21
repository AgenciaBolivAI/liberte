import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import mascot from "@/assets/liberte-mascot.png.asset.json";

// Lib the colibrí — the AI tutor's persona — follows you across the ENTIRE app
// (landing, dashboard, lessons, everywhere) and flies you to the conversation
// tutor on tap. Hidden only on the tutor page itself, where it is redundant and
// would sit on top of the chat composer. Its z-index sits BELOW drawers (z-40)
// and modals (z-50) so it never pokes through them.
const HIDE_PREFIXES = ["/conversation"];

export function TutorMascot() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [greeting, setGreeting] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setGreeting(false), 6000);
    return () => clearTimeout(t);
  }, [pathname]);

  if (HIDE_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <Link
      to="/conversation"
      aria-label="Habla con Lib, tu tutor de IA"
      className="group fixed bottom-5 right-4 z-30 flex items-center gap-2 sm:bottom-6 sm:right-6"
    >
      <span
        className={`pointer-events-none hidden max-w-[200px] rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-navy shadow-card transition-opacity duration-300 sm:block ${
          greeting ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        ¡Bonjour! Soy Lib 🐦 ¿Practicamos francés?
      </span>
      <span className="relative grid h-16 w-16 place-items-center rounded-full bg-gradient-blue shadow-card transition-transform duration-200 group-hover:scale-110 group-active:scale-95">
        <span className="absolute inset-0 rounded-full bg-blue/30 opacity-60 [animation:ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
        <img
          src={mascot.url}
          alt=""
          className="relative h-12 w-12 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
        />
      </span>
    </Link>
  );
}
