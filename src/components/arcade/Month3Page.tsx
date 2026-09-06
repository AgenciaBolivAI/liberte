import { useState } from "react";
import { Gamepad2, ListChecks } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { AdminPreviewBanner } from "@/components/AdminPreviewBanner";
import parisBg from "@/assets/paris-map-bg.jpg";
import { month3Day } from "@/data/month3";
import { WhackGame } from "./WhackGame";
import { PhraseGame } from "./PhraseGame";

/**
 * Month 3 — the arcade day.
 *
 * Days 41-60 have no authored lesson yet (authored_days holds 1-40), so this is
 * what a Month-3 day renders: the client's own vocabulary for that day, and the
 * two real-time games built on it. When the full lesson content is authored the
 * games move into the normal shell; nothing here has to change to allow that.
 *
 * Wired for Month 3 ONLY, on the client's instruction ("los juegos solo en mes 3
 * por ahora"): days 11-40 keep the activities they have.
 */
export function Month3Page({ dayId }: { dayId: string }) {
  const day = month3Day(dayId);
  const [tab, setTab] = useState<"jeux" | "mots">("jeux");

  if (!day) return null;

  return (
    <div
      className="relative min-h-screen bg-cover bg-center md:bg-fixed"
      style={{
        backgroundImage: `linear-gradient(180deg, oklch(0.42 0.075 265 / 0.80) 0%, oklch(0.32 0.08 265 / 0.92) 100%), url(${parisBg})`,
      }}
    >
      <TopNav />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <AdminPreviewBanner />

        <header className="mb-5 text-white">
          <p className="text-xs font-extrabold tracking-widest text-gold uppercase">
            Mes 3 · Je m&apos;exprime · Jour {day.platformDay}
          </p>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
            {day.emoji} {day.theme}
          </h1>
          <p className="mt-1 text-sm text-white/85">{day.objective}</p>
          <p className="mt-2 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
            📘 {day.grammar}
          </p>
        </header>

        <div className="mb-4 flex gap-2">
          <TabBtn active={tab === "jeux"} onClick={() => setTab("jeux")}>
            <Gamepad2 className="h-4 w-4" /> Juegos
          </TabBtn>
          <TabBtn active={tab === "mots"} onClick={() => setTab("mots")}>
            <ListChecks className="h-4 w-4" /> Las 30 palabras
          </TabBtn>
        </div>

        {tab === "jeux" ? (
          <div className="space-y-5">
            <WhackGame
              dayId={day.platformDay}
              topic={day.theme}
              vocabulary={day.vocabulary}
            />
            <PhraseGame
              dayId={day.platformDay}
              topic={day.theme}
              grammar={day.grammar}
              vocabulary={day.vocabulary}
            />
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-card p-4 shadow-card">
            <p className="mb-3 text-sm text-muted-foreground">
              El vocabulario de hoy, con la frase del curso para cada palabra.
            </p>
            <ul className="divide-y divide-border">
              {day.vocabulary.map((v) => (
                <li key={v.fr} className="py-2.5">
                  <p className="font-display text-base font-extrabold text-navy">
                    {v.fr} <span className="font-medium text-muted-foreground">— {v.es}</span>
                  </p>
                  <p className="mt-0.5 text-sm text-navy/80 italic">« {v.example} »</p>
                  <p className="text-xs text-muted-foreground">{v.exampleEs}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
        active ? "bg-white text-navy shadow-soft" : "bg-white/10 text-white/80 hover:bg-white/20"
      }`}
    >
      {children}
    </button>
  );
}
