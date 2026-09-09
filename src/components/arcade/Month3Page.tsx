import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Gamepad2, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useAdminPreview } from "@/lib/admin-preview";
import { markDayCompleted, useDayCompletions } from "@/lib/progress";
import { weekOfDay } from "@/lib/unlock";
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
  return <Month3Day day={day} tab={tab} setTab={setTab} />;
}

/** Split out so the hooks below never sit after the `!day` early return. */
function Month3Day({
  day,
  tab,
  setTab,
}: {
  day: NonNullable<ReturnType<typeof month3Day>>;
  tab: "jeux" | "mots";
  setTab: (t: "jeux" | "mots") => void;
}) {
  const { user } = useAuth();
  const { readOnly } = useAdminPreview();
  const { rows, refresh } = useDayCompletions();
  const dayNum = day.platformDay;
  const alreadyDone = rows.some((r) => r.day_id === dayNum);

  // Days 41-60 used to record NOTHING. The games ran, the student played, and
  // "Jours complétés" stayed at 40/120 forever — so the tutor's next scene, the
  // week-9 challenge and the next day all stayed locked behind a day she had
  // actually finished. Playing a full round of BOTH games is the day's work, so
  // that is what completes it.
  const [played, setPlayed] = useState({ whack: false, phrase: false });
  const bothPlayed = played.whack && played.phrase;
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);

  const markDone = useCallback(
    async (silent: boolean) => {
      if (readOnly) return; // impersonating: would write to the admin's own row
      if (!user) {
        if (!silent) toast.error("Connecte-toi pour enregistrer ta progression");
        return;
      }
      if (savingRef.current || alreadyDone) return;
      savingRef.current = true;
      setSaving(true);
      try {
        await markDayCompleted(user.id, dayNum, weekOfDay(dayNum));
        await refresh().catch(() => { /* list refresh is cosmetic */ });
        toast.success("Jour terminé ! +2 ⭐");
      } catch {
        // Never silent: a swallowed failure here is exactly how a day stops
        // counting with no signal to the student.
        toast.error(
          "Ton jour n'a pas pu être enregistré. Vérifie ta connexion et réessaie avec le bouton.",
        );
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [readOnly, user, alreadyDone, dayNum, refresh],
  );

  useEffect(() => {
    if (bothPlayed && !alreadyDone) void markDone(true);
  }, [bothPlayed, alreadyDone, markDone]);

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
              onFinish={() => setPlayed((p) => (p.whack ? p : { ...p, whack: true }))}
            />
            <PhraseGame
              dayId={day.platformDay}
              topic={day.theme}
              grammar={day.grammar}
              vocabulary={day.vocabulary}
              onFinish={() => setPlayed((p) => (p.phrase ? p : { ...p, phrase: true }))}
            />

            {/* The manual escape hatch, same role as DayCompleteBlock on days
                1-40: if the automatic write fails (offline, RLS) the student
                still has a way to make the day count. */}
            <div className="rounded-3xl border-2 border-blue/60 bg-gradient-to-br from-ice to-white p-5 text-center shadow-card">
              {alreadyDone ? (
                <p className="inline-flex items-center gap-2 font-display text-base font-extrabold text-navy">
                  <CheckCircle2 className="h-5 w-5 text-green-600" /> Jour {dayNum} terminé
                </p>
              ) : (
                <>
                  <p className="font-display text-base font-extrabold text-navy">
                    {bothPlayed
                      ? "Tu as joué aux deux jeux — on enregistre ton jour."
                      : "Joue une partie aux deux jeux pour terminer le jour."}
                  </p>
                  <button
                    type="button"
                    onClick={() => void markDone(false)}
                    disabled={saving}
                    className="mt-3 rounded-full bg-gradient-blue px-8 py-2.5 font-display text-sm font-extrabold text-white shadow-card active:scale-95 disabled:opacity-60"
                  >
                    {saving ? "…" : "Marquer le jour comme terminé"}
                  </button>
                </>
              )}
            </div>
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
