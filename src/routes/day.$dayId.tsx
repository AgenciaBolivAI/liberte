import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Download,
  Lock,
  Mic,
  MicOff,
  PartyPopper,
  Pencil,
  PlayCircle,
  Square,
  Star,
  Trophy,
  Upload,
  Volume2,
  X,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LiberteSpeak } from "@/components/LiberteSpeak";
import { StagedDefi } from "@/components/StagedDefi";
import { getCompletedDays } from "@/lib/week.functions";
import { markDayCompleted, useDayCompletions } from "@/lib/progress";
import {
  isDayUnlocked as isDayUnlockedRule,
  isLessonUnlocked as isLessonUnlockedRule,
} from "@/lib/unlock";
import { useAdminPreview } from "@/lib/admin-preview";
import { AdminPreviewBanner } from "@/components/AdminPreviewBanner";
import { getStudentSnapshot, type StudentSnapshot } from "@/lib/admin.functions";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PLUS_RESOURCES_BY_WEEK, type PlusResource } from "@/routes/plus.$weekId.$itemId";
import logo from "@/assets/liberte-logo.png.asset.json";
import {
  vocabulary,
  videos,
  vocabReadingTexts,
  vocabListeningMC,
  vocabSpeakingItems,
  vocabWritingItems,
  clesReadingText,
  clesListeningMC,
  clesSpeakingItems,
  clesWritingItems,
  defiRoleplay,
} from "@/data/day1Lessons";
import {
  day2Videos,
  day2Vocabulary,
  day2FlashQuiz,
  day2DefiSteps,
  day2GrammarStructures,
  day2VocabReadingTexts,
  day2VocabListeningMC,
  day2VocabSpeakingItems,
  day2VocabWritingItems,
  day2ClesReadingText,
  day2ClesListeningMC,
  day2ClesSpeakingItems,
  day2ClesWritingItems,
} from "@/data/day2Lessons";
import {
  day3Videos,
  day3Vocabulary,
  
  day3FlashQuiz,
  day3DefiSteps,
  day3GrammarStructures,
  day3VocabReadingTexts,
  day3VocabListeningMC,
  day3VocabSpeakingItems,
  day3VocabWritingItems,
  day3ClesReadingText,
  day3ClesListeningMC,
  day3ClesSpeakingItems,
  day3ClesWritingItems,
} from "@/data/day3Lessons";
import {
  day4Videos,
  day4Vocabulary,
  day4FlashQuiz,
  day4DefiSteps,
  day4GrammarStructures,
  day4VocabReadingTexts,
  day4VocabListeningMC,
  day4VocabSpeakingItems,
  day4VocabWritingItems,
  day4ClesReadingText,
  day4ClesListeningMC,
  day4ClesSpeakingItems,
  day4ClesWritingItems,
} from "@/data/day4Lessons";
import {
  day5Videos,
  day5Vocabulary,
  day5FlashQuiz,
  day5DefiSteps,
  day5GrammarStructures,
  day5VocabReadingTexts,
  day5VocabListeningMC,
  day5VocabSpeakingItems,
  day5VocabWritingItems,
  day5ClesReadingText,
  day5ClesListeningMC,
  day5ClesSpeakingItems,
  day5ClesWritingItems,
} from "@/data/day5Lessons";
import {
  day6Videos,
  day6Vocabulary,
  day6FlashQuiz,
  day6DefiSteps,
  day6GrammarStructures,
  day6VocabReadingTexts,
  day6VocabListeningMC,
  day6VocabSpeakingItems,
  day6VocabWritingItems,
  day6ClesReadingText,
  day6ClesListeningMC,
  day6ClesSpeakingItems,
  day6ClesWritingItems,
} from "@/data/day6Lessons";
import {
  day7Videos,
  day7Vocabulary,
  day7FlashQuiz,
  day7DefiSteps,
  day7GrammarStructures,
  day7VocabReadingTexts,
  day7VocabListeningMC,
  day7VocabSpeakingItems,
  day7VocabWritingItems,
  day7ClesReadingText,
  day7ClesListeningMC,
  day7ClesSpeakingItems,
  day7ClesWritingItems,
} from "@/data/day7Lessons";
import {
  day8Videos,
  day8Vocabulary,
  day8FlashQuiz,
  day8DefiSteps,
  day8GrammarStructures,
  day8VocabReadingTexts,
  day8VocabListeningMC,
  day8VocabSpeakingItems,
  day8VocabWritingItems,
  day8ClesReadingText,
  day8ClesListeningMC,
  day8ClesSpeakingItems,
  day8ClesWritingItems,
} from "@/data/day8Lessons";
import {
  day9Videos,
  day9Vocabulary,
  day9FlashQuiz,
  day9DefiSteps,
  day9GrammarStructures,
  day9VocabReadingTexts,
  day9VocabListeningMC,
  day9VocabSpeakingItems,
  day9VocabWritingItems,
  day9ClesReadingText,
  day9ClesListeningMC,
  day9ClesSpeakingItems,
  day9ClesWritingItems,
} from "@/data/day9Lessons";
import {
  day10Videos,
  day10Vocabulary,
  day10FlashQuiz,
  day10DefiSteps,
  day10GrammarStructures,
  day10VocabReadingTexts,
  day10VocabListeningMC,
  day10VocabSpeakingItems,
  day10VocabWritingItems,
  day10ClesReadingText,
  day10ClesListeningMC,
  day10ClesSpeakingItems,
  day10ClesWritingItems,
} from "@/data/day10Lessons";
import vocabVideo from "@/assets/vocabulario-dia1.mp4.asset.json";
import cuadernilloSemana1 from "@/assets/cuadernillo-semana1.pdf.asset.json";
import { speakFr, stopFr } from "@/lib/speak";

const DAY_TITLES: Record<string, { title: string; desc: string }> = {
  "1": { title: "Jour 1 · Le Café — Liberté", desc: "Premier jour : commander un café à Paris avec politesse." },
  "2": { title: "Jour 2 · Retour au café — Liberté", desc: "Deuxième jour : recommander, essayer et payer avec aisance." },
  "3": { title: "Jour 3 · La Boulangerie — Liberté", desc: "Troisième jour : commander du pain comme un parisien." },
  "4": { title: "Jour 4 · La Vitrine des Douceurs — Liberté", desc: "Quatrième jour : choisir un dulce et acheter un cadeau." },
  "5": { title: "Jour 5 · Le Bistrot Liberté", desc: "Cinquième jour : réserver, choisir et dîner dans un bistrot parisien." },
  "6": { title: "Jour 6 · Restaurant · Partie 2 — Liberté", desc: "Sixième jour : restrictions alimentaires, erreurs et paiement séparé." },
  "7": { title: "Jour 7 · Supermarché · Partie 1 — Liberté", desc: "Septième jour : orientarse en un supermercado francés y preguntar por productos." },
  "8": { title: "Jour 8 · Faire les courses — Liberté", desc: "Huitième jour : la compra semanal completa con devoir + infinitivo y partitivos." },
  "9": { title: "Jour 9 · Le métro & les transports — Liberté", desc: "Neuvième jour : moverse en el metro de París y dominar las preposiciones de transporte." },
};

export const Route = createFileRoute("/day/$dayId")({
  head: ({ params }) => {
    const info = DAY_TITLES[params.dayId] ?? DAY_TITLES["1"];
    return { meta: [{ title: info.title }, { name: "description", content: info.desc }] };
  },
  component: DayPage,
});

/* -------------------- helpers -------------------- */

function playTone(kind: "ok" | "no") {
  if (typeof window === "undefined") return;
  try {
    const Ctx =
      (window.AudioContext as typeof AudioContext) ||
      ((window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = kind === "ok" ? "triangle" : "square";
    o.frequency.value = kind === "ok" ? 660 : 220;
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    o.start();
    o.stop(ctx.currentTime + 0.25);
  } catch {
    /* ignore */
  }
}

function fireConfetti() {
  const end = Date.now() + 1500;
  const colors = ["#4BB1EC", "#3D5589", "#EDF8FC", "#F4C542", "#C44536"];
  const frame = () => {
    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors });
}

/* -------------------- main page -------------------- */

type LessonKey =
  | "gym" | "cafe" | "vocab" | "cles" | "defi"
  | "intro" | "bonus";

type LessonMeta = { key: LessonKey; emoji: string; title: string; subtitle: string; duration: string };

const DAYS_META = [
  { id: 1, label: "Jour 1 · Le Café", week: 1 },
  { id: 2, label: "Jour 2 · Retour au café", week: 1 },
  { id: 3, label: "Jour 3 · La Boulangerie", week: 1 },
  { id: 4, label: "Jour 4 · La Vitrine des Douceurs", week: 1 },
  { id: 5, label: "Jour 5 · Le Bistrot Liberté", week: 1 },
  { id: 6, label: "Jour 6 · Restaurant · Partie 2", week: 2 },
  { id: 7, label: "Jour 7 · Supermarché · Partie 1", week: 2 },
  { id: 8, label: "Jour 8 · Faire les courses", week: 2 },
  { id: 9, label: "Jour 9 · Le métro & les transports", week: 2 },
  { id: 10, label: "Jour 10 · Taxi & ville à pied", week: 2 },
];

const WEEK_OF_DAY: Record<string, number> = {
  "1": 1, "2": 1, "3": 1, "4": 1, "5": 1,
  "6": 2, "7": 2, "8": 2, "9": 2, "10": 2,
};


const LESSONS_BY_DAY: Record<string, LessonMeta[]> = {
  "1": [
    { key: "gym", emoji: "🧠", title: "Gym cérébral", subtitle: "Réveille ton cerveau.", duration: "3 min" },
    { key: "cafe", emoji: "☕", title: "Bienvenue au café", subtitle: "Ton premier café parisien.", duration: "4 min" },
    { key: "vocab", emoji: "📚", title: "Vocabulaire", subtitle: "30 phrases + pratique.", duration: "15 min" },
    { key: "cles", emoji: "🗝️", title: "Les clés de la Liberté", subtitle: "Je voudrais — la politesse.", duration: "20 min" },
    { key: "defi", emoji: "🏆", title: "Défi final", subtitle: "Roleplay avec le camarero.", duration: "10 min" },
  ],
  "2": [
    { key: "gym", emoji: "🧠", title: "Gym cérébral", subtitle: "Réveille ton cerveau.", duration: "3 min" },
    { key: "intro", emoji: "🎬", title: "Intro · Jour 2", subtitle: "De retour au café.", duration: "3 min" },
    { key: "vocab", emoji: "📚", title: "Vocabulaire", subtitle: "30 mots + flashcards + pratique.", duration: "18 min" },
    { key: "cles", emoji: "🗝️", title: "Les clés de la Liberté", subtitle: "4 structures pour choisir & décrire.", duration: "20 min" },
    { key: "defi", emoji: "🏆", title: "Défi final", subtitle: "Ma première vraie conversation.", duration: "12 min" },
    { key: "bonus", emoji: "✨", title: "Le Petit Plus", subtitle: "Bonus cultural débloqué.", duration: "4 min" },
  ],
  "3": [
    { key: "gym", emoji: "🧠", title: "Gym cérébral", subtitle: "Réveille ton cerveau.", duration: "3 min" },
    { key: "intro", emoji: "🎬", title: "Intro · Jour 3", subtitle: "La Boulangerie Liberté.", duration: "3 min" },
    { key: "vocab", emoji: "📚", title: "Vocabulaire", subtitle: "30 mots + pratique.", duration: "18 min" },
    { key: "cles", emoji: "🗝️", title: "Les clés de la Liberté", subtitle: "Cantidad, textura, precio, cierre.", duration: "20 min" },
    { key: "defi", emoji: "🏆", title: "Défi final", subtitle: "Ma première boulangerie.", duration: "12 min" },
  ],
  "4": [
    { key: "gym", emoji: "🧠", title: "Gym cérébral", subtitle: "Réveille ton cerveau.", duration: "3 min" },
    { key: "intro", emoji: "🎬", title: "Intro · Jour 4", subtitle: "La vitrine des douceurs.", duration: "3 min" },
    { key: "vocab", emoji: "📚", title: "Vocabulaire", subtitle: "30 mots + pratique.", duration: "18 min" },
    { key: "cles", emoji: "🗝️", title: "Les clés de la Liberté", subtitle: "Ça a l'air · Il reste · Offrir · Goûter.", duration: "20 min" },
    { key: "defi", emoji: "🏆", title: "Défi final", subtitle: "Un cadeau à emporter.", duration: "12 min" },
  ],
  "5": [
    { key: "gym", emoji: "🧠", title: "Gym cérébral", subtitle: "Réveille ton cerveau.", duration: "3 min" },
    { key: "intro", emoji: "🎬", title: "Intro · Jour 5", subtitle: "Le Bistrot Liberté.", duration: "3 min" },
    { key: "vocab", emoji: "📚", title: "Vocabulaire", subtitle: "30 mots + pratique.", duration: "18 min" },
    { key: "cles", emoji: "🗝️", title: "Les clés de la Liberté", subtitle: "Comme · Je préfère · Au nom de · Questions.", duration: "20 min" },
    { key: "defi", emoji: "🏆", title: "Défi final", subtitle: "Ma première soirée au restaurant.", duration: "14 min" },
  ],
  "6": [
    { key: "gym", emoji: "🧠", title: "Gym cérébral", subtitle: "Réveille ton cerveau.", duration: "3 min" },
    { key: "intro", emoji: "🎬", title: "Intro · Jour 6", subtitle: "Retour au restaurant.", duration: "3 min" },
    { key: "vocab", emoji: "📚", title: "Vocabulaire", subtitle: "30 mots + pratique.", duration: "18 min" },
    { key: "cles", emoji: "🗝️", title: "Les clés de la Liberté", subtitle: "Futur proche : aller + infinitif.", duration: "20 min" },
    { key: "defi", emoji: "🏆", title: "Défi final", subtitle: "Restrictions, erreurs et paiement.", duration: "14 min" },
  ],
  "7": [
    { key: "gym", emoji: "🧠", title: "Gym cérébral", subtitle: "Réveille ton cerveau.", duration: "3 min" },
    { key: "intro", emoji: "🎬", title: "Intro · Jour 7", subtitle: "Au supermarché français.", duration: "3 min" },
    { key: "vocab", emoji: "📚", title: "Vocabulaire", subtitle: "30 mots + pratique.", duration: "18 min" },
    { key: "cles", emoji: "🗝️", title: "Les clés de la Liberté", subtitle: "Il y a / Il n'y a pas de.", duration: "20 min" },
    { key: "defi", emoji: "🏆", title: "Défi final", subtitle: "Preguntar por 2 secciones del supermercado.", duration: "12 min" },
  ],
  "8": [
    { key: "gym", emoji: "🧠", title: "Gym cérébral", subtitle: "Réveille ton cerveau.", duration: "3 min" },
    { key: "intro", emoji: "🎬", title: "Intro · Jour 8", subtitle: "Faire les courses de la semaine.", duration: "3 min" },
    { key: "vocab", emoji: "📚", title: "Vocabulaire", subtitle: "30 mots + pratique.", duration: "18 min" },
    { key: "cles", emoji: "🗝️", title: "Les clés de la Liberté", subtitle: "Devoir + infinitif.", duration: "20 min" },
    { key: "defi", emoji: "🏆", title: "Défi final", subtitle: "La compra semanal completa.", duration: "14 min" },
  ],
  "9": [
    { key: "gym", emoji: "🧠", title: "Gym cérébral", subtitle: "Réveille ton cerveau.", duration: "3 min" },
    { key: "intro", emoji: "🎬", title: "Intro · Jour 9", subtitle: "Au métro de Paris.", duration: "3 min" },
    { key: "vocab", emoji: "📚", title: "Vocabulaire", subtitle: "30 mots + pratique.", duration: "18 min" },
    { key: "cles", emoji: "🗝️", title: "Les clés de la Liberté", subtitle: "Prépositions en / à / par.", duration: "20 min" },
    { key: "defi", emoji: "🏆", title: "Défi final", subtitle: "Roleplay au guichet du métro.", duration: "12 min" },
  ],
  "10": [
    { key: "gym", emoji: "🧠", title: "Gym cérébral", subtitle: "Réveille ton cerveau.", duration: "3 min" },
    { key: "intro", emoji: "🎬", title: "Intro · Jour 10", subtitle: "Taxi & ville à pied.", duration: "3 min" },
    { key: "vocab", emoji: "📚", title: "Vocabulaire", subtitle: "30 mots + pratique.", duration: "18 min" },
    { key: "cles", emoji: "🗝️", title: "Les clés de la Liberté", subtitle: "Prendre + transport & questions pratiques.", duration: "20 min" },
    { key: "defi", emoji: "🏆", title: "Défi final", subtitle: "Roleplay en taxi.", duration: "12 min" },
  ],
};

const WEEK_TITLE_BY_DAY: Record<string, string> = {
  "1": "Semaine 1 · J'OSE 🗼",
  "2": "Semaine 1 · J'OSE 🗼",
  "3": "Semaine 1 · J'OSE 🗼",
  "4": "Semaine 1 · J'OSE 🗼",
  "5": "Semaine 1 · J'OSE 🗼",
  "6": "Semaine 2 · J'OSE 🍽️",
  "7": "Semaine 2 · J'OSE 🛒",
  "8": "Semaine 2 · J'OSE 🧺",
  "9": "Semaine 2 · J'OSE 🚇",
  "10": "Semaine 2 · J'OSE 🚕",
};


function DayPage() {
  const { dayId } = Route.useParams();
  const navigate = useNavigate();
  const activeDay = dayId in LESSONS_BY_DAY ? dayId : "1";
  const lessonsList = LESSONS_BY_DAY[activeDay];
  const order = useMemo(() => lessonsList.map((l) => l.key), [lessonsList]);
  const weekTitle = WEEK_TITLE_BY_DAY[activeDay] ?? WEEK_TITLE_BY_DAY["1"];

  const [openDay, setOpenDay] = useState<number>(Number(activeDay));
  const [lesson, setLesson] = useState<LessonKey>(order[0]);
  const [stars, setStars] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const [plusItemId, setPlusItemId] = useState<string | null>(null);
  const activeWeekForPlus = WEEK_OF_DAY[activeDay] ?? 1;
  const PLUS_ITEMS = PLUS_RESOURCES_BY_WEEK[String(activeWeekForPlus)] ?? PLUS_RESOURCES_BY_WEEK["1"] ?? [];
  const plusItemIdx = plusItemId ? PLUS_ITEMS.findIndex((i) => i.id === plusItemId) : -1;
  const plusItem = plusItemIdx >= 0 ? PLUS_ITEMS[plusItemIdx] : null;
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const completed = order.filter((k) => done[k]).length;
  const progress = Math.round((completed / order.length) * 100);

  const activeWeek = WEEK_OF_DAY[activeDay] ?? 1;
  const { user } = useAuth();
  // Admins bypass locks in teacher mode; "view as" modes behave like a student.
  const { bypassLocks: isAdmin, viewAsUserId, readOnly } = useAdminPreview();
  const [snapshot, setSnapshot] = useState<StudentSnapshot | null>(null);

  // While impersonating, load that student's real progress (read-only).
  useEffect(() => {
    if (!viewAsUserId) {
      setSnapshot(null);
      return;
    }
    let alive = true;
    getStudentSnapshot({ data: { userId: viewAsUserId } })
      .then((s) => {
        if (alive) setSnapshot(s);
      })
      .catch(() => {
        if (alive) setSnapshot(null);
      });
    return () => {
      alive = false;
    };
  }, [viewAsUserId]);
  const { days: persistedDays, loading: daysLoading, refresh: refreshDays } = useDayCompletions();

  // Progressive unlock: a day opens once the previous day is completed
  // (défi sent or day marked done). The first day of the week is always open;
  // the week itself is time-gated on the dashboard. Admins see everything.
  const doneDays = useMemo(
    () =>
      snapshot
        ? new Set([...snapshot.completedDays, ...snapshot.defiDays])
        : new Set([...persistedDays, ...completedDays]),
    [snapshot, persistedDays, completedDays],
  );
  const firstDayOfWeek = useMemo(
    () => Math.min(...DAYS_META.filter((d) => d.week === activeWeek).map((d) => d.id)),
    [activeWeek],
  );
  const isDayUnlocked = useCallback(
    (id: number) => isDayUnlockedRule(id, doneDays, { isAdmin, firstDayOfWeek }),
    [isAdmin, firstDayOfWeek, doneDays],
  );
  const DAYS = useMemo(
    () =>
      DAYS_META.filter((d) => d.week === activeWeek).map((d) => ({
        ...d,
        unlocked: isDayUnlocked(d.id),
      })),
    [activeWeek, isDayUnlocked],
  );

  const currentDayUnlocked = isDayUnlocked(Number(activeDay));
  const week1Done = doneDays.has(5);

  // Within the day, lessons unlock one at a time as the previous is completed.
  const isLessonUnlocked = useCallback(
    (idx: number) => isLessonUnlockedRule(idx, done, order, { isAdmin }),
    [isAdmin, done, order],
  );

  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    getCompletedDays()
      .then((days) => { if (alive) setCompletedDays(days); })
      .catch(() => { /* ignore */ });
    return () => { alive = false; };
  }, [user?.id]);

  // Hydrate per-day state (done lessons, current lesson, stars) from DB
  // so that progress survives refresh and syncs across devices.
  const hydratedKeyRef = useRef<string>("");
  useEffect(() => {
    const key = `${viewAsUserId ?? user?.id ?? "anon"}:${activeDay}`;
    hydratedKeyRef.current = "";
    setOpenDay(Number(activeDay));
    setLesson(order[0]);
    setDone({});
    setStars(0);
    // Impersonating: use the snapshot instead of our own row, and never mark
    // as hydrated so the autosave effect can't fire for someone else's data.
    if (viewAsUserId) {
      if (snapshot) {
        const st = snapshot.dayStates.find((d) => d.day_id === Number(activeDay));
        if (st) {
          const doneMap: Record<string, boolean> = {};
          st.done_lessons.forEach((k) => { doneMap[k] = true; });
          setDone(doneMap);
          setStars(st.stars);
          if (st.current_lesson && order.includes(st.current_lesson as LessonKey)) {
            setLesson(st.current_lesson as LessonKey);
          }
        }
      }
      return;
    }
    if (!user) {
      hydratedKeyRef.current = key;
      return;
    }
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("day_state")
        .select("done_lessons, current_lesson, stars")
        .eq("user_id", user.id)
        .eq("day_id", Number(activeDay))
        .maybeSingle();
      if (!alive) return;
      if (data) {
        const doneArr = Array.isArray(data.done_lessons) ? (data.done_lessons as string[]) : [];
        const doneMap: Record<string, boolean> = {};
        doneArr.forEach((k) => { doneMap[k] = true; });
        setDone(doneMap);
        setStars(Number(data.stars ?? 0));
        if (data.current_lesson && order.includes(data.current_lesson as LessonKey)) {
          setLesson(data.current_lesson as LessonKey);
        }
      }
      hydratedKeyRef.current = key;
    })();
    return () => { alive = false; };
    // Keyed on user?.id, NOT the user object: onAuthStateChange hands us a new
    // object on every token refresh, which would otherwise reset the lesson
    // state and cancel a pending save mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDay, order, user?.id, viewAsUserId, snapshot]);

  // Autosave: whenever done/stars/lesson changes after hydration, upsert.
  // A pending (debounced) save is flushed on unmount so leaving the page
  // right after clicking "Suivant" can't lose progress.
  const pendingSaveRef = useRef<(() => void) | null>(null);
  const userId = user?.id;
  useEffect(() => {
    if (!userId || readOnly) return; // never write while impersonating
    const key = `${userId}:${activeDay}`;
    if (hydratedKeyRef.current !== key) return;
    const doneArr = Object.keys(done).filter((k) => done[k]);
    const save = () => {
      pendingSaveRef.current = null;
      void supabase.from("day_state").upsert(
        {
          user_id: userId,
          day_id: Number(activeDay),
          done_lessons: doneArr,
          current_lesson: lesson,
          stars,
        },
        { onConflict: "user_id,day_id" },
      );
    };
    pendingSaveRef.current = save;
    const t = setTimeout(save, 300);
    return () => clearTimeout(t);
  }, [done, stars, lesson, userId, activeDay, readOnly]);
  useEffect(() => {
    return () => {
      pendingSaveRef.current?.();
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setSidebarOpen(false);
    stopFr();
  }, [lesson, plusItemId]);

  const award = (n = 1) => setStars((s) => s + n);
  const complete = (k: LessonKey) => {
    if (readOnly) return; // impersonating: never alter a student's progress
    setDone((d) => ({ ...d, [k]: true }));
    if (k === "defi") {
      // Refresh unlocked days when a défi is completed
      getCompletedDays().then(setCompletedDays).catch(() => { /* ignore */ });
      // Persistir automáticamente el día en cuanto se completa el défi,
      // para que el progreso y las estrellas no se pierdan si el alumno
      // cierra o refresca antes de pulsar el botón manual.
      const dayNum = Number(activeDay);
      if (user && !persistedDays.includes(dayNum)) {
        markDayCompleted(user.id, dayNum, activeWeek)
          .then(() => refreshDays())
          .catch(() => { /* ignore duplicates */ });
      }
    }
  };


  const Sidebar = (
    <aside className="flex h-full w-full flex-col bg-navy text-white">
      <div className="border-b border-white/10 p-5">
        <Link to="/liberte-plataforma-834798234728482934254-student" className="inline-flex items-center gap-2 text-xs font-semibold text-sky hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Retour
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-blue text-sm font-extrabold">L</span>
          <p className="font-display text-xs font-bold tracking-widest text-sky uppercase">A1 · Liberté</p>
        </div>
        <h2 className="mt-3 font-display text-xl font-extrabold leading-tight">{weekTitle}</h2>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>Ton progrès</span><span className="font-bold text-white">{progress}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-gradient-to-r from-sky to-blue transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto p-3">
        {DAYS.map((d) => {
          const isOpen = openDay === d.id;
          return (
            <div
              key={d.id}
              className={`rounded-2xl border transition ${
                isOpen && d.unlocked
                  ? "border-sky/40 bg-white/[0.06] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <button
                onClick={() => d.unlocked && setOpenDay(isOpen ? 0 : d.id)}
                disabled={!d.unlocked}
                className={`flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-2.5 text-left transition ${d.unlocked ? "hover:bg-white/5" : "opacity-50"}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-extrabold ${d.unlocked ? "bg-gradient-to-br from-sky to-blue text-white" : "bg-white/5 text-white/40"}`}>{d.id}</span>
                  <p className="truncate text-sm font-bold">{d.label}</p>
                </div>
                {!d.unlocked ? <Lock className="h-3.5 w-3.5 shrink-0 text-white/40" /> : <ArrowRight className={`h-3.5 w-3.5 shrink-0 text-white/50 transition-transform ${isOpen ? "rotate-90" : ""}`} />}
              </button>

              {isOpen && d.unlocked && (
                <div className="space-y-1 border-t border-white/10 p-2">
                  <p className="px-2 pb-1 pt-1 text-[10px] font-bold tracking-widest text-sky/80 uppercase">Jour {d.id} · Actif</p>
                  {(LESSONS_BY_DAY[String(d.id)] ?? []).map((l, idx) => {
                    const isActive = lesson === l.key;
                    // Lessons unlock sequentially within the day being viewed.
                    const lessonLocked = String(d.id) === activeDay && !isLessonUnlocked(idx);
                    return (
                      <button
                        key={l.key}
                        disabled={lessonLocked}
                        onClick={() => {
                          if (lessonLocked) return;
                          if (String(d.id) !== activeDay) {
                            navigate({ to: "/day/$dayId", params: { dayId: String(d.id) } });
                          }
                          setPlusItemId(null);
                          setLesson(l.key);
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${isActive && String(d.id) === activeDay && !plusItemId ? "bg-gradient-to-r from-blue to-blue-deep shadow-card" : lessonLocked ? "cursor-not-allowed opacity-45" : "hover:bg-white/5"}`}
                      >
                        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-extrabold ${isActive ? "bg-white/25 text-white" : "bg-white/10 text-white/70"}`}>
                          {done[l.key] ? <Check className="h-3.5 w-3.5" /> : lessonLocked ? <Lock className="h-3 w-3" /> : idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold tracking-widest text-sky/90 uppercase">Leçon · {l.duration}</p>
                          <p className="truncate text-sm font-bold text-white">{l.emoji} {l.title}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Le petit plus — expandable like a day */}
        <div
          className={`rounded-2xl border transition ${
            plusOpen
              ? "border-gold/40 bg-white/[0.06]"
              : "border-white/10 bg-white/[0.03]"
          }`}
        >
          <button
            onClick={() => setPlusOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-2.5 text-left transition hover:bg-white/5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold to-[oklch(0.78_0.14_80)] text-sm">✨</span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-widest text-gold uppercase">Bonus · siempre abierto</p>
                <p className="truncate text-sm font-bold">Le petit plus Liberté</p>
              </div>
            </div>
            <ArrowRight className={`h-3.5 w-3.5 shrink-0 text-white/50 transition-transform ${plusOpen ? "rotate-90" : ""}`} />
          </button>
          {plusOpen && (
            <div className="space-y-1 border-t border-white/10 p-2">
              <p className="px-2 pb-1 pt-1 text-[10px] font-bold tracking-widest text-gold/80 uppercase">Semaine 1 · Recursos extras</p>
              {PLUS_ITEMS.map((it, idx) => {
                const isActivePlus = plusItemId === it.id;
                return (
                  <button
                    key={it.id}
                    onClick={() => setPlusItemId(it.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${isActivePlus ? "bg-gradient-to-r from-gold/30 to-gold/10 shadow-card" : "hover:bg-white/5"}`}
                  >
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-extrabold ${isActivePlus ? "bg-gold text-navy" : "bg-white/10 text-white/80"}`}>
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold tracking-widest text-gold/80 uppercase">{it.eyebrow}</p>
                      <p className="truncate text-sm font-bold text-white">{it.emoji} {it.title}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Le défi de la semaine */}
        {week1Done ? (
          <Link
            to="/semaine/$weekId"
            params={{ weekId: "1" }}
            className="flex items-center gap-3 rounded-2xl border border-gold/60 bg-gradient-to-r from-gold to-[oklch(0.78_0.14_80)] px-3 py-3 text-left text-navy shadow-card transition hover:brightness-105"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/70 text-sm">🎉</span>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold tracking-widest uppercase">Disponible</p>
              <p className="truncate text-sm font-extrabold">Le défi de la semaine</p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left opacity-70">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-sm">🎉</span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold tracking-widest text-sky/70 uppercase">Se abre tras el Día 5</p>
              <p className="truncate text-sm font-bold text-white">Le défi de la semaine</p>
            </div>
            <Lock className="h-3.5 w-3.5 shrink-0 text-white/40" />
          </div>
        )}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs">
          <span className="text-white/70">{completed}/{order.length} leçons</span>
          <span className="inline-flex items-center gap-1 font-bold text-white" title="Étoiles gagnées aujourd'hui">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {stars} aujourd'hui
          </span>
        </div>
      </div>
    </aside>
  );

  // Direct-URL guard: a day stays locked until the previous one is completed.
  if (!currentDayUnlocked) {
    if (daysLoading) {
      return (
        <div className="grid min-h-screen place-items-center bg-ice">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue border-t-transparent" />
        </div>
      );
    }
    const lastOpen = Math.max(
      firstDayOfWeek,
      ...[...doneDays].filter((d) => WEEK_OF_DAY[String(d)] === activeWeek).map((d) => Math.min(d + 1, 10)),
    );
    return (
      <div className="flex min-h-screen items-center justify-center bg-ice p-6">
        <div className="max-w-md rounded-3xl border-2 border-blue/30 bg-white p-8 text-center shadow-card">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-navy text-white">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-navy">Jour {activeDay} encore verrouillé</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Termina el día anterior para desbloquear este. Cada lección se abre al completar la anterior — ¡paso a paso! 🐦
          </p>
          <button
            onClick={() => navigate({ to: "/day/$dayId", params: { dayId: String(lastOpen) } })}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-blue px-6 py-3 font-display font-extrabold text-white shadow-card"
          >
            Continuar en el Jour {lastOpen} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ice">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white px-3 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="neon-index-btn inline-flex items-center gap-2 rounded-full border-2 border-blue bg-gradient-blue px-5 py-2.5 font-display text-sm font-extrabold text-white"
          aria-label="Abrir el índice"
        >
          <BookOpen className="h-4 w-4" /> Índice
        </button>
        <img src={logo.url} alt="Liberté" className="h-8 w-auto" />
        <div
          className="inline-flex items-center gap-1 rounded-full bg-navy px-3 py-1 text-xs font-bold text-white"
          title="Étoiles gagnées aujourd'hui"
        >
          <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {stars}
        </div>
        <style>{`
          @keyframes neonIndexPulse {
            0%,100% { box-shadow: 0 0 0 0 rgba(75,177,236,0), 0 0 12px 2px rgba(75,177,236,0.45), inset 0 0 6px rgba(155,203,239,0.30); }
            50%     { box-shadow: 0 0 0 6px rgba(75,177,236,0.12), 0 0 26px 7px rgba(75,177,236,0.85), inset 0 0 12px rgba(155,203,239,0.60); }
          }
          .neon-index-btn { animation: neonIndexPulse 1.8s ease-in-out infinite; }
        `}</style>
      </header>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm">{Sidebar}</div>
        </div>
      )}

      <div className="flex">
        <div className="sticky top-0 hidden h-screen w-[320px] shrink-0 lg:block">{Sidebar}</div>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">
          <div className="mx-auto max-w-4xl">
            <AdminPreviewBanner />
            {plusItem ? (
              <PlusInlineView
                item={plusItem}
                index={plusItemIdx}
                total={PLUS_ITEMS.length}
                onPrev={plusItemIdx > 0 ? () => setPlusItemId(PLUS_ITEMS[plusItemIdx - 1].id) : null}
                onNext={plusItemIdx < PLUS_ITEMS.length - 1 ? () => setPlusItemId(PLUS_ITEMS[plusItemIdx + 1].id) : null}
                onBackToIndex={() => setPlusItemId(null)}
              />
            ) : (
            <LessonView
              dayId={activeDay}
              lessons={lessonsList}
              lesson={lesson}
              onAward={award}
              onComplete={() => complete(lesson)}
              isLessonDone={!!done[lesson]}
              nextDayId={Number(activeDay) < 10 ? String(Number(activeDay) + 1) : null}
              onGoNextDay={() => {
                const next = Number(activeDay) + 1;
                if (next <= 10) navigate({ to: "/day/$dayId", params: { dayId: String(next) } });
              }}
              onPrev={() => {
                const i = order.indexOf(lesson);
                if (i > 0) setLesson(order[i - 1]);
              }}
              onNext={() => {
                const i = order.indexOf(lesson);
                if (i >= 0 && i < order.length - 1) setLesson(order[i + 1]);
              }}
              isFirst={lesson === order[0]}
              isLast={lesson === order[order.length - 1]}
            />
            )}
            {week1Done && activeDay === "5" && !readOnly && (
              <div className="mt-6 rounded-3xl border-2 border-gold/50 bg-gradient-to-br from-white to-gold/10 p-6 text-center shadow-card">
                <p className="text-xs font-bold tracking-widest text-gold uppercase">Fin de la Semaine 1</p>
                <h3 className="mt-1 font-display text-2xl font-extrabold text-navy">🎉 Le défi de la semaine t'attend</h3>
                <p className="mt-1 text-sm text-navy/80">
                  Un momento para celebrar y descubrir todo lo que ya sabes decir en francés — con tu informe listo para tu coach.
                </p>
                <Link
                  to="/semaine/$weekId"
                  params={{ weekId: "1" }}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-[oklch(0.78_0.14_80)] px-6 py-3 font-extrabold text-navy shadow-card transition hover:brightness-105"
                >
                  Comenzar mi défi <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* -------------------- Le petit plus inline view -------------------- */

function PlusInlineView({
  item, index, total, onPrev, onNext, onBackToIndex,
}: {
  item: PlusResource;
  index: number;
  total: number;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  onBackToIndex: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-[oklch(0.32_0.08_265)] via-[oklch(0.4_0.09_265)] to-[oklch(0.28_0.08_265)] p-6 text-white shadow-card sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-extrabold tracking-widest text-gold uppercase">
          ✨ Le petit plus · Recurso {index + 1} de {total}
        </div>
        <p className="mt-3 text-[11px] font-bold tracking-widest text-gold uppercase">{item.eyebrow}</p>
        <h2 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">{item.emoji} {item.title}</h2>
        <p className="mt-2 text-sm text-white/85">{item.subtitle}</p>
      </div>

      {item.note && (
        <div className="rounded-2xl border border-dashed border-gold/40 bg-gold/5 p-4 text-sm text-navy/80">
          💡 {item.note}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-soft">
        <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
          <iframe
            src={`https://www.youtube.com/embed/${item.youtubeId}?rel=0`}
            title={item.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onPrev ?? undefined}
          disabled={!onPrev}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-navy shadow-soft transition hover:bg-ice disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" /> Précédent
        </button>
        <button
          onClick={onBackToIndex}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-navy shadow-soft transition hover:bg-ice"
        >
          Volver al índice
        </button>
        <button
          onClick={onNext ?? undefined}
          disabled={!onNext}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-blue px-5 py-2.5 text-sm font-extrabold text-white shadow-card transition hover:brightness-105 disabled:opacity-40"
        >
          Suivant <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}



/* -------------------- lesson container -------------------- */

function LessonView({
  dayId, lessons, lesson, onAward, onComplete, onPrev, onNext, isFirst, isLast,
  isLessonDone, nextDayId, onGoNextDay,
}: {
  dayId: string;
  lessons: LessonMeta[];
  lesson: LessonKey;
  onAward: (n?: number) => void;
  onComplete: () => void;
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
  isLessonDone: boolean;
  nextDayId: string | null;
  onGoNextDay: () => void;
}) {
  const meta = lessons.find((l) => l.key === lesson)!;
  // Use the preview-aware flag so "Ver como alumno" actually exercises the gate.
  const { bypassLocks, readOnly } = useAdminPreview();

  // Video gate: every native video in this lesson must be watched to the end
  // before "Suivant" unlocks. Already-completed lessons aren't re-gated.
  const [pendingVideos, setPendingVideos] = useState<Set<string>>(new Set());
  const videoGate = useMemo(
    () => ({
      register: (id: string) =>
        setPendingVideos((s) => (s.has(id) ? s : new Set(s).add(id))),
      ended: (id: string) =>
        setPendingVideos((s) => {
          if (!s.has(id)) return s;
          const n = new Set(s);
          n.delete(id);
          return n;
        }),
    }),
    [],
  );
  // NOTE: no reset effect here. React flushes child effects before the
  // parent's, so a parent-level reset would wipe the registrations the
  // VideoBlocks just made. Each VideoBlock unregisters itself on unmount
  // instead, which handles lesson/day changes correctly.
  const nextLocked = pendingVideos.size > 0 && !isLessonDone && !bypassLocks;
  const advance = () => {
    if (nextLocked) return;
    onComplete();
    if (!isLast) onNext();
  };

  // Fire confetti once the final lesson of the day is completed — only on the
  // transition, not when revisiting a day that was already finished.
  const firedRef = useRef<string | null>(null);
  const wasDoneAtMount = useRef<Record<string, boolean>>({});
  const lessonKey = `${dayId}-${lesson}`;
  if (!(lessonKey in wasDoneAtMount.current)) {
    wasDoneAtMount.current[lessonKey] = isLessonDone;
  }
  useEffect(() => {
    if (isLast && isLessonDone && !wasDoneAtMount.current[`${dayId}-${lesson}`]) {
      const key = `${dayId}-${lesson}`;
      if (firedRef.current !== key) {
        firedRef.current = key;
        fireConfetti();
      }
    }
  }, [isLast, isLessonDone, dayId, lesson]);

  const nextDayLabel = nextDayId
    ? `Jour ${nextDayId} · ${(DAYS_META.find((d) => String(d.id) === nextDayId)?.label ?? "").replace(/^Jour \d+ · /, "")}`
    : null;

  return (
    <VideoGateCtx.Provider value={videoGate}>
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-card sm:p-8">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-widest text-blue uppercase">
          <span>{meta.emoji}</span> Jour {dayId} · {meta.duration}
        </div>
        <h2 className="font-display text-3xl font-extrabold text-navy sm:text-4xl">{meta.title}</h2>

        <div className="mt-6">
          {lesson === "gym" && <GymCerebral dayId={dayId} />}
          {dayId === "1" && lesson === "cafe" && <CafeWelcome />}
          {dayId === "1" && lesson === "vocab" && <VocabLesson onAward={onAward} />}
          {dayId === "1" && lesson === "cles" && <ClesLesson onAward={onAward} />}
          {dayId === "1" && lesson === "defi" && <DefiLesson onAward={onAward} onDone={onComplete} />}

          {dayId === "2" && lesson === "intro" && <IntroDay2 />}
          {dayId === "2" && lesson === "vocab" && <VocabLessonDay2 onAward={onAward} />}
          {dayId === "2" && lesson === "cles" && <ClesLessonDay2 onAward={onAward} />}
          {dayId === "2" && lesson === "defi" && <DefiLessonDay2 onAward={onAward} onDone={onComplete} />}
          {dayId === "2" && lesson === "bonus" && <BonusLessonDay2 onAward={onAward} onDone={onComplete} />}

          {dayId === "3" && lesson === "intro" && <IntroDay3 />}
          {dayId === "3" && lesson === "vocab" && <VocabLessonDay3 onAward={onAward} />}
          {dayId === "3" && lesson === "cles" && <ClesLessonDay3 onAward={onAward} />}
          {dayId === "3" && lesson === "defi" && <DefiLessonDay3 onAward={onAward} onDone={onComplete} />}

          {dayId === "4" && lesson === "intro" && <IntroDay4 />}
          {dayId === "4" && lesson === "vocab" && <VocabLessonDay4 onAward={onAward} />}
          {dayId === "4" && lesson === "cles" && <ClesLessonDay4 onAward={onAward} />}
          {dayId === "4" && lesson === "defi" && <DefiLessonDay4 onAward={onAward} onDone={onComplete} />}

          {dayId === "5" && lesson === "intro" && <IntroDay5 />}
          {dayId === "5" && lesson === "vocab" && <VocabLessonDay5 onAward={onAward} />}
          {dayId === "5" && lesson === "cles" && <ClesLessonDay5 onAward={onAward} />}
          {dayId === "5" && lesson === "defi" && <DefiLessonDay5 onAward={onAward} onDone={onComplete} />}

          {dayId === "6" && lesson === "intro" && <IntroDay6 />}
          {dayId === "6" && lesson === "vocab" && <VocabLessonDay6 onAward={onAward} />}
          {dayId === "6" && lesson === "cles" && <ClesLessonDay6 onAward={onAward} />}
          {dayId === "6" && lesson === "defi" && <DefiLessonDay6 onAward={onAward} onDone={onComplete} />}

          {dayId === "7" && lesson === "intro" && <IntroDay7 />}
          {dayId === "7" && lesson === "vocab" && <VocabLessonDay7 onAward={onAward} />}
          {dayId === "7" && lesson === "cles" && <ClesLessonDay7 onAward={onAward} />}
          {dayId === "7" && lesson === "defi" && <DefiLessonDay7 onAward={onAward} onDone={onComplete} />}

          {dayId === "8" && lesson === "intro" && <IntroDay8 />}
          {dayId === "8" && lesson === "vocab" && <VocabLessonDay8 onAward={onAward} />}
          {dayId === "8" && lesson === "cles" && <ClesLessonDay8 onAward={onAward} />}
          {dayId === "8" && lesson === "defi" && <DefiLessonDay8 onAward={onAward} onDone={onComplete} />}

          {dayId === "9" && lesson === "intro" && <IntroDay9 />}
          {dayId === "9" && lesson === "vocab" && <VocabLessonDay9 onAward={onAward} />}
          {dayId === "9" && lesson === "cles" && <ClesLessonDay9 onAward={onAward} />}
          {dayId === "9" && lesson === "defi" && <DefiLessonDay9 onAward={onAward} onDone={onComplete} />}

          {dayId === "10" && lesson === "intro" && <IntroDay10 />}
          {dayId === "10" && lesson === "vocab" && <VocabLessonDay10 onAward={onAward} />}
          {dayId === "10" && lesson === "cles" && <ClesLessonDay10 onAward={onAward} />}
          {dayId === "10" && lesson === "defi" && <DefiLessonDay10 onAward={onAward} onDone={onComplete} />}
        </div>
      </div>

      {isLast && isLessonDone && (
        <DayCompleteBlock dayId={dayId} nextDayId={nextDayId} nextDayLabel={nextDayLabel} onGoNextDay={onGoNextDay} readOnly={readOnly} />
      )}


      <NeonLessonNav
        onPrev={onPrev}
        onNext={advance}
        isFirst={isFirst}
        isLast={isLast}
        endOfDayReady={isLast && isLessonDone && !!nextDayId}
        onGoNextDay={onGoNextDay}
        nextDayId={nextDayId}
        nextLocked={nextLocked}
      />

    </div>
    </VideoGateCtx.Provider>
  );
}

function DayCompleteBlock({ dayId, nextDayId, nextDayLabel, onGoNextDay, readOnly }: {
  readOnly?: boolean;
  dayId: string;
  nextDayId: string | null;
  nextDayLabel: string | null;
  onGoNextDay: () => void;
}) {
  const { user } = useAuth();
  const { days, refresh } = useDayCompletions();
  const dayNum = Number(dayId);
  const alreadyMarked = days.includes(dayNum);
  const [saving, setSaving] = useState(false);

  async function handleMark() {
    if (readOnly) return; // impersonating: would write to the admin's own row
    if (!user) { toast.error("Inicia sesión para guardar tu progreso"); return; }
    setSaving(true);
    try {
      await markDayCompleted(user.id, dayNum, WEEK_OF_DAY[dayId] ?? 1);
      await refresh();
      toast.success("¡Día marcado como terminado! +2 ⭐");
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl border-2 border-blue/60 bg-gradient-to-br from-ice to-white p-6 text-center shadow-card">
      <p className="text-xs font-extrabold tracking-widest text-blue uppercase">🎉 Bravo ! Tu as terminé le Jour {dayId}</p>
      {readOnly ? (
        <p className="mt-2 font-display text-lg font-extrabold text-navy/70">
          👁️ Vista de solo lectura
        </p>
      ) : !alreadyMarked ? (
        <>
          <h3 className="mt-2 font-display text-xl font-extrabold text-navy sm:text-2xl">
            Marca este día como terminado para sumar tu progreso
          </h3>
          <button
            type="button"
            onClick={handleMark}
            disabled={saving}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border-2 border-gold bg-gradient-to-r from-gold to-[oklch(0.78_0.14_80)] px-8 py-3 font-display text-base font-extrabold text-navy shadow-card transition hover:brightness-105 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "✓ Marquer le jour comme terminé (+2 ⭐)"}
          </button>
        </>
      ) : (
        <p className="mt-2 font-display text-lg font-extrabold text-navy">✓ Día registrado en tu progreso</p>
      )}
      {nextDayId && nextDayLabel && (
        <>
          <h3 className="mt-6 font-display text-xl font-extrabold text-navy sm:text-2xl">
            On enchaîne avec le {nextDayLabel} ?
          </h3>
          <button
            type="button"
            onClick={onGoNextDay}
            className="neon-btn neon-btn--next mt-4 inline-flex items-center justify-center gap-2 rounded-full border-2 border-blue bg-gradient-blue px-8 py-3 font-display text-base font-extrabold text-white sm:text-lg"
          >
            Jour {nextDayId} <ArrowRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}


function NeonLessonNav({ onPrev, onNext, isFirst, isLast, endOfDayReady, onGoNextDay, nextDayId, nextLocked = false }: {
  onPrev: () => void; onNext: () => void; isFirst: boolean; isLast: boolean;
  endOfDayReady: boolean; onGoNextDay: () => void; nextDayId: string | null;
  nextLocked?: boolean;
}) {
  const showNextDay = isLast && endOfDayReady && !!nextDayId;
  return (
    <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={onPrev}
        disabled={isFirst}
        className="neon-btn neon-btn--back inline-flex items-center justify-center gap-2 rounded-full border-2 border-sky/70 bg-white/90 px-6 py-3 font-display text-sm font-extrabold text-navy transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowLeft className="h-4 w-4" /> Retourner
      </button>
      {showNextDay ? (
        <button
          type="button"
          onClick={onGoNextDay}
          className="neon-btn neon-btn--next inline-flex items-center justify-center gap-2 rounded-full border-2 border-blue bg-gradient-blue px-6 py-3 font-display text-sm font-extrabold text-white transition"
        >
          Jour {nextDayId} <ArrowRight className="h-4 w-4" />
        </button>
      ) : (
        <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
          <button
            type="button"
            onClick={onNext}
            disabled={isLast || nextLocked}
            className="neon-btn neon-btn--next inline-flex items-center justify-center gap-2 rounded-full border-2 border-blue bg-gradient-blue px-6 py-3 font-display text-sm font-extrabold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {nextLocked ? <Lock className="h-4 w-4" /> : null}
            Suivant <ArrowRight className="h-4 w-4" />
          </button>
          {nextLocked && (
            <p className="text-center text-[11px] font-semibold text-navy/60 sm:text-right">
              🎬 Termine la vidéo pour continuer
            </p>
          )}
        </div>
      )}
      <style>{`
        @keyframes neonPulseBlue {
          0%,100% { box-shadow: 0 0 0 0 rgba(75,177,236,0), 0 0 12px 2px rgba(75,177,236,0.35), inset 0 0 6px rgba(155,203,239,0.25); transform: translateY(0); }
          50%     { box-shadow: 0 0 0 6px rgba(75,177,236,0.10), 0 0 24px 6px rgba(75,177,236,0.75), inset 0 0 10px rgba(155,203,239,0.55); transform: translateY(-2px); }
        }
        @keyframes neonPulseSky {
          0%,100% { box-shadow: 0 0 0 0 rgba(155,203,239,0), 0 0 10px 2px rgba(155,203,239,0.35), inset 0 0 6px rgba(75,177,236,0.15); transform: translateY(0); }
          50%     { box-shadow: 0 0 0 6px rgba(155,203,239,0.15), 0 0 22px 5px rgba(75,177,236,0.55), inset 0 0 10px rgba(75,177,236,0.30); transform: translateY(-2px); }
        }
        @keyframes neonNudgeR { 0%,100%{transform:translateX(0)} 50%{transform:translateX(4px)} }
        @keyframes neonNudgeL { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-4px)} }
        .neon-btn { position: relative; }
        .neon-btn:not(:disabled).neon-btn--next { animation: neonPulseBlue 1.8s ease-in-out infinite; }
        .neon-btn:not(:disabled).neon-btn--back { animation: neonPulseSky 2.2s ease-in-out infinite; }
        .neon-btn:not(:disabled).neon-btn--next svg:last-child { animation: neonNudgeR 1.4s ease-in-out infinite; }
        .neon-btn:not(:disabled).neon-btn--back svg:first-child { animation: neonNudgeL 1.4s ease-in-out infinite; }
        .neon-btn:not(:disabled):hover { transform: translateY(-3px); }
      `}</style>
    </div>
  );
}

/* -------------------- shared UI -------------------- */

// Lessons with a video require watching it to the end before "Suivant"
// unlocks. Every native video registers itself with the lesson's gate.
const VideoGateCtx = createContext<{
  register: (id: string) => void;
  ended: (id: string) => void;
} | null>(null);

function VideoBlock({ src, title }: { src: string; title: string }) {
  const isYouTube = src.includes("youtube.com/embed") || src.includes("youtube.com/watch") || src.includes("youtu.be");
  const gate = useContext(VideoGateCtx);

  useEffect(() => {
    if (isYouTube) return;
    gate?.register(src);
    // Unregister when the lesson changes or this video unmounts, so the gate
    // only ever tracks videos currently on screen.
    return () => gate?.ended(src);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, isYouTube]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-navy shadow-card">
      <div className="relative aspect-video w-full">
        {isYouTube ? (
          <iframe
            key={src}
            src={src}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full border-0"
          />
        ) : (
          <video
            key={src}
            src={src}
            controls
            playsInline
            preload="metadata"
            onEnded={() => gate?.ended(src)}
            className="h-full w-full"
          />
        )}
      </div>
      <div className="flex items-center gap-2 bg-navy px-4 py-3 text-sm text-white">
        <PlayCircle className="h-4 w-4 text-sky" /> {title}
      </div>
    </div>
  );
}



function ResultCard({ title, score, message }: { title: string; score: string; message: string }) {
  return (
    <div className="rounded-3xl bg-gradient-navy p-8 text-center text-white shadow-card">
      <PartyPopper className="mx-auto h-10 w-10 text-gold" />
      <p className="mt-2 font-display text-2xl font-extrabold">{title}</p>
      {score && <p className="mt-1 font-display text-3xl font-extrabold">{score}</p>}
      <p className="mt-1 text-white/85">{message}</p>
    </div>
  );
}

/* -------------------- Lesson 1: Gym -------------------- */

function GymCerebral({ dayId }: { dayId?: string }) {
  const src =
    dayId === "10" ? day10Videos.gym :
    dayId === "9" ? day9Videos.gym :
    dayId === "8" ? day8Videos.gym :
    dayId === "7" ? day7Videos.gym :
    dayId === "6" ? day6Videos.gym :
    videos.gymCerebral;
  return (
    <div className="space-y-5">
      <LiberteSpeak message="Bonjour ! Aujourd'hui, on commence par un petit exercice pour reprogrammer ton cerveau. Regarde la vidéo, respire et amuse-toi." />
      <VideoBlock src={src} title={`🧠 Gym cérébral — Jour ${dayId ?? "1"}`} />
    </div>
  );
}

/* -------------------- Lesson 2: Café -------------------- */

function CafeWelcome() {
  return (
    <div className="space-y-5">
      <VideoBlock src={videos.bienvenue} title="☕ Bienvenue au café" />
      <a
        href={cuadernilloSemana1.url}
        target="_blank"
        rel="noopener noreferrer"
        download="Cuadernillo_Semana1_Mes1_LIBERTE.pdf"
        className="inline-flex items-center gap-2 rounded-full border-2 border-blue bg-white px-5 py-2.5 text-sm font-bold text-navy shadow-soft transition hover:bg-ice"
      >
        <Download className="h-4 w-4 text-blue" /> Télécharger le guide
      </a>
      <LiberteSpeak size="sm" message="Tu viens d'entrer dans un café à Paris. Regarde, écoute, respire — on va apprendre ensemble." />
    </div>
  );
}

/* -------------------- Lesson 3: Vocab -------------------- */

function VocabLesson({ onAward }: { onAward: (n?: number) => void }) {
  return (
    <div className="space-y-6">
      <LiberteSpeak message="Regarde la vidéo, puis explore les 30 phrases une par une. Ensuite, gagne une étoile par mini-jeu." />
      <VideoBlock src={vocabVideo.url} title="📚 Vocabulaire — Jour 1" />

      <FlashGrid />

      <div className="rounded-2xl border-2 border-dashed border-blue/30 bg-ice p-5">
        <p className="font-display text-lg font-extrabold text-navy">🎯 Pratique — 4 mini-jeux</p>
        <p className="text-sm text-muted-foreground">Lecture, écoute, parler, écriture. Une étoile par jeu.</p>
      </div>

      <Tabs defaultValue="read" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 sm:grid-cols-4">
          <TabsTrigger value="read" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><BookOpen className="h-4 w-4" /> Lecture</TabsTrigger>
          <TabsTrigger value="listen" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Volume2 className="h-4 w-4" /> Écoute</TabsTrigger>
          <TabsTrigger value="speak" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Mic className="h-4 w-4" /> Parler</TabsTrigger>
          <TabsTrigger value="write" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Pencil className="h-4 w-4" /> Écriture</TabsTrigger>
        </TabsList>

        <TabsContent value="read" className="mt-4"><ReadingComprehension texts={vocabReadingTexts} onAward={onAward} /></TabsContent>
        <TabsContent value="listen" className="mt-4"><ListeningMCGame items={vocabListeningMC} onAward={onAward} /></TabsContent>
        <TabsContent value="speak" className="mt-4"><SpeakingGame items={vocabSpeakingItems} dayId={1} section="vocab" onAward={onAward} /></TabsContent>
        <TabsContent value="write" className="mt-4"><WritingGame items={vocabWritingItems} dayId={1} section="vocab" onAward={onAward} /></TabsContent>
      </Tabs>
    </div>
  );
}

function FlashGrid() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const total = vocabulary.length;
  const v = vocabulary[index];
  const go = (delta: number) => { setFlipped(false); setIndex((i) => (i + delta + total) % total); };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-navy/70">
        <span>Carte {index + 1} / {total}</span>
        <button onClick={() => { setFlipped(false); setIndex(0); }} className="text-blue hover:underline">Recommencer</button>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button onClick={() => go(-1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sky/40 bg-white text-navy shadow-soft hover:bg-ice" aria-label="Précédent"><ArrowLeft className="h-5 w-5" /></button>
        <button onClick={() => setFlipped((f) => !f)} className="relative h-56 flex-1 perspective-[1000px]" aria-label={`Carte ${v.fr}`}>
          <div className={`absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-card p-6 shadow-card [backface-visibility:hidden]">
              <span className="text-5xl">{v.emoji}</span>
              <p className="text-center font-display text-2xl font-extrabold text-navy sm:text-3xl">{v.fr}</p>
              <button onClick={(e) => { e.stopPropagation(); speakFr(v.fr); }} className="inline-flex items-center gap-2 rounded-full bg-blue/10 px-4 py-2 text-sm font-semibold text-blue hover:bg-blue/20"><Volume2 className="h-4 w-4" /> Écouter</button>
              <p className="text-[11px] text-muted-foreground">Touche la carte pour la retourner</p>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-gradient-blue p-6 text-white shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <p className="text-center font-display text-lg font-bold italic sm:text-2xl">"{v.example}"</p>
              <button onClick={(e) => { e.stopPropagation(); speakFr(v.example); }} className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30"><Volume2 className="h-4 w-4" /> Écouter</button>
            </div>
          </div>
        </button>
        <button onClick={() => go(1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sky/40 bg-white text-navy shadow-soft hover:bg-ice" aria-label="Suivant"><ArrowRight className="h-5 w-5" /></button>
      </div>
    </div>
  );
}

/* -------------------- Reusable practice games -------------------- */

type MCItem = { question?: string; audio?: string; options: string[]; answer: number };

function MCQuestion({
  item, index, total, onDone, showAudio,
}: {
  item: MCItem; index: number; total: number;
  onDone: (correct: boolean) => void; showAudio?: boolean;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  useEffect(() => { setPicked(null); }, [index]);

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const ok = i === item.answer;
    playTone(ok ? "ok" : "no");
    setTimeout(() => onDone(ok), 1100);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <p className="text-xs font-semibold text-muted-foreground">Question {index + 1}/{total}</p>

      {showAudio && item.audio && (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-ice p-3">
          <button onClick={() => speakFr(item.audio!)} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue text-white shadow-soft hover:scale-105" aria-label="Écouter">
            <Volume2 className="h-5 w-5" />
          </button>
          <p className="text-sm text-muted-foreground">Touchez pour écouter</p>
        </div>
      )}

      {item.question && (
        <p className="mt-4 font-display text-base font-bold text-navy">{item.question}</p>
      )}

      <div className="mt-4 grid gap-2">
        {item.options.map((o, i) => {
          const isPicked = picked === i;
          const isRight = picked !== null && i === item.answer;
          const isWrong = isPicked && i !== item.answer;
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={picked !== null}
              className={`rounded-xl border-2 bg-card p-3 text-left text-sm font-medium text-navy transition ${
                isRight ? "border-success bg-success/10" : isWrong ? "border-red bg-red/10" : "border-border hover:border-blue"
              }`}
            >
              {o}
              {isRight && <Check className="ml-2 inline h-4 w-4 text-success" />}
              {isWrong && <X className="ml-2 inline h-4 w-4 text-red" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ListeningMCGame({ items, onAward }: { items: MCItem[]; onAward: (n?: number) => void }) {
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (done) return <ResultCard title="Bravo !" score={`${score} / ${items.length}`} message="Tu as gagné une étoile." />;

  return (
    <MCQuestion
      item={items[i]}
      index={i}
      total={items.length}
      showAudio
      onDone={(ok) => {
        if (ok) setScore((s) => s + 1);
        if (i + 1 < items.length) setI(i + 1);
        else { setDone(true); onAward(1); }
      }}
    />
  );
}

/* -------------------- Reading comprehension (2 texts) -------------------- */

function ReadingComprehension({
  texts, onAward,
}: {
  texts: typeof vocabReadingTexts;
  onAward: (n?: number) => void;
}) {
  const [textIdx, setTextIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const t = texts[textIdx];
  const totalQ = texts.reduce((n, tt) => n + tt.questions.length, 0);

  if (done)
    return <ResultCard title="Lecture réussie !" score={`${score} / ${totalQ}`} message="Étoile débloquée." />;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <p className="text-xs font-bold tracking-widest text-blue uppercase">📖 {t.title}</p>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-navy">{t.text}</p>
      </div>
      <MCQuestion
        item={{ question: t.questions[qIdx].q, options: t.questions[qIdx].options, answer: t.questions[qIdx].answer }}
        index={qIdx}
        total={t.questions.length}
        onDone={(ok) => {
          if (ok) setScore((s) => s + 1);
          if (qIdx + 1 < t.questions.length) setQIdx(qIdx + 1);
          else if (textIdx + 1 < texts.length) { setTextIdx(textIdx + 1); setQIdx(0); }
          else { setDone(true); onAward(1); }
        }}
      />
      <p className="text-center text-xs text-muted-foreground">Texte {textIdx + 1} / {texts.length}</p>
    </div>
  );
}

/* -------------------- Writing (open input) -------------------- */

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,!?¡¿«»"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type Correction = {
  resultado: "correcto" | "parcial" | "incorrecto";
  nota: number;
  aciertos: string[];
  errores: { dijo: string; correcto: string; regla: string }[];
  feedback_alumno: string;
};

function FeedbackCard({ c }: { c: Correction }) {
  const tone =
    c.resultado === "correcto"
      ? { label: "✓ Bien joué !", cls: "border-success/40 bg-success/10 text-success" }
      : c.resultado === "parcial"
        ? { label: "≈ Presque !", cls: "border-blue/30 bg-blue/10 text-blue" }
        : { label: "Essaie encore", cls: "border-red/30 bg-red/10 text-red" };
  return (
    <div className={`mt-3 space-y-2 rounded-xl border p-3 text-sm ${tone.cls}`}>
      <div className="flex items-center justify-between">
        <span className="font-bold">{tone.label}</span>
        <span className="text-xs opacity-80">Note : {c.nota.toFixed(1)} / 10</span>
      </div>
      {c.feedback_alumno && <p className="text-navy">{c.feedback_alumno}</p>}
      {c.aciertos.length > 0 && (
        <ul className="ml-4 list-disc text-xs text-navy/80">
          {c.aciertos.slice(0, 2).map((a, i) => <li key={i}>{a}</li>)}
        </ul>
      )}
      {c.errores.length > 0 && (
        <div className="space-y-1">
          {c.errores.slice(0, 2).map((e, i) => (
            <div key={i} className="rounded-lg bg-white/60 p-2 text-xs text-navy">
              <div>💬 <span className="italic">« {e.dijo} »</span></div>
              <div>✅ <b>« {e.correcto} »</b></div>
              {e.regla && <div className="mt-1 text-navy/70">📌 {e.regla}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WritingGame({ items, onAward, dayId = 0, section = "vocab" }: {
  items: { prompt: string; answer: string }[];
  onAward: (n?: number) => void;
  dayId?: number;
  section?: "vocab" | "cles";
}) {
  const [i, setI] = useState(0);
  const [val, setVal] = useState("");
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [correction, setCorrection] = useState<Correction | null>(null);
  const [pending, setPending] = useState(false);
  const cur = items[i];

  const submit = async () => {
    if (!val.trim() || busy) return;
    setBusy(true);
    setCorrection(null);
    setPending(false);
    try {
      const { correctActivity } = await import("@/lib/defi.functions");
      const c = (await correctActivity({
        data: {
          dayId, section, competence: "PE", itemIndex: i,
          prompt: cur.prompt, expected: cur.answer, response: val,
        },
      })) as Correction;
      setCorrection(c);
      playTone(c.resultado === "incorrecto" ? "no" : "ok");
      if (c.resultado !== "incorrecto") setScore((s) => s + 1);
    } catch {
      setPending(true);
      playTone("ok");
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    if (i + 1 < items.length) {
      setI(i + 1); setVal(""); setCorrection(null); setPending(false);
    } else {
      setDone(true); onAward(1);
    }
  };

  if (done) return <ResultCard title="Écriture polie !" score={`${score} / ${items.length}`} message="Étoile gagnée." />;

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <p className="text-xs font-semibold text-muted-foreground">Écriture · {i + 1}/{items.length}</p>
      <p className="font-display text-base font-bold text-navy">{cur.prompt}</p>
      <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder="Écris ici…" className="text-base" disabled={busy || !!correction} />
      <div className="flex items-center justify-end gap-2">
        {!correction && !pending && (
          <Button onClick={submit} disabled={busy || !val.trim()} className="bg-gradient-blue text-white">
            {busy ? "Corrigiendo… ✨" : (<>Vérifier <ArrowRight className="ml-1 h-4 w-4" /></>)}
          </Button>
        )}
        {(correction || pending) && (
          <Button onClick={next} className="bg-gradient-blue text-white">
            {i + 1 < items.length ? "Suivant" : "Terminer"} <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
      {pending && (
        <div className="rounded-xl border border-blue/30 bg-blue/10 p-3 text-sm text-navy">
          Tu respuesta quedó guardada, la corrección llegará en un momento.
        </div>
      )}
      {correction && <FeedbackCard c={correction} />}
    </div>
  );
}

/* -------------------- Speaking (mic recording) -------------------- */

function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("audio/webm");
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    setBlob(null);
    if (url) { URL.revokeObjectURL(url); setUrl(null); }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const type = rec.mimeType || "audio/webm";
        const b = new Blob(chunksRef.current, { type });
        setBlob(b);
        setMimeType(type);
        setUrl(URL.createObjectURL(b));
        stream.getTracks().forEach((t) => t.stop());
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      alert("No pudimos acceder al micrófono. Revisa los permisos del navegador.");
    }
  };
  const stop = () => {
    recRef.current?.stop();
    setRecording(false);
  };
  const reset = () => {
    setBlob(null);
    if (url) URL.revokeObjectURL(url);
    setUrl(null);
  };
  return { recording, blob, url, mimeType, start, stop, reset };
}

async function blobToBase64(b: Blob): Promise<string> {
  const buf = await b.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(s);
}

function SpeakingGame({ items, onAward, dayId = 0, section = "vocab" }: {
  items: { situation: string; expected: string }[];
  onAward: (n?: number) => void;
  dayId?: number;
  section?: "vocab" | "cles";
}) {
  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [correction, setCorrection] = useState<Correction | null>(null);
  const [pending, setPending] = useState(false);
  const [score, setScore] = useState(0);
  const rec = useRecorder();
  const cur = items[i];

  useEffect(() => {
    rec.reset(); setCorrection(null); setPending(false); setStatus("");
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    if (!rec.blob || busy) return;
    setBusy(true);
    setCorrection(null);
    setPending(false);
    try {
      setStatus("Transcribiendo…");
      const { transcribeStage, correctActivity } = await import("@/lib/defi.functions");
      const audioBase64 = await blobToBase64(rec.blob);
      const t = (await transcribeStage({ data: { audioBase64, mimeType: rec.mimeType } })) as { text: string };
      setStatus("Corrigiendo… ✨");
      const c = (await correctActivity({
        data: {
          dayId, section, competence: "PO", itemIndex: i,
          prompt: cur.situation, expected: cur.expected, response: t.text,
        },
      })) as Correction;
      setCorrection(c);
      playTone(c.resultado === "incorrecto" ? "no" : "ok");
      if (c.resultado !== "incorrecto") setScore((s) => s + 1);
    } catch {
      setPending(true);
      playTone("ok");
    } finally {
      setBusy(false);
      setStatus("");
    }
  };

  const next = () => {
    if (i + 1 < items.length) setI(i + 1);
    else { setDone(true); onAward(1); }
  };

  if (done) return <ResultCard title="Bien parlé !" score={`${score} / ${items.length}`} message="Étoile gagnée." />;

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <p className="text-xs font-semibold text-muted-foreground">Parler · {i + 1}/{items.length}</p>
      <div className="rounded-xl bg-ice p-4">
        <p className="text-xs font-bold tracking-widest text-blue uppercase">Situación</p>
        <p className="mt-1 text-sm text-navy">{cur.situation}</p>
      </div>
      <div className="rounded-xl border border-blue/30 bg-white p-4">
        <p className="text-xs font-bold tracking-widest text-navy uppercase">Frase esperada</p>
        <p className="mt-1 font-display text-lg font-extrabold text-navy">{cur.expected}</p>
        <button onClick={() => speakFr(cur.expected)} className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue/10 px-3 py-1 text-xs font-semibold text-blue hover:bg-blue/20">
          <Volume2 className="h-3.5 w-3.5" /> Écouter le modèle
        </button>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={rec.recording ? rec.stop : rec.start}
          disabled={busy || !!correction}
          className={`grid h-20 w-20 place-items-center rounded-full text-white shadow-card transition ${rec.recording ? "bg-red animate-pulse" : "bg-gradient-blue hover:scale-105 disabled:opacity-60"}`}
          aria-label={rec.recording ? "Detener" : "Grabar"}
        >
          {rec.recording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
        </button>
        <p className="text-xs text-muted-foreground">
          {rec.recording ? "Grabando… toca para detener." : rec.url ? "Escucha tu grabación:" : "Toca para grabar tu respuesta."}
        </p>
        {rec.url && <audio src={rec.url} controls className="w-full max-w-md" />}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{status}</span>
        {!correction && !pending && (
          <Button onClick={submit} disabled={!rec.blob || busy} className="bg-gradient-blue text-white">
            {busy ? "Corrigiendo… ✨" : "Envoyer"}
          </Button>
        )}
        {(correction || pending) && (
          <Button onClick={next} className="bg-gradient-blue text-white">
            {i + 1 < items.length ? "Question suivante" : "Terminer"} <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
      {pending && (
        <div className="rounded-xl border border-blue/30 bg-blue/10 p-3 text-sm text-navy">
          Tu respuesta quedó guardada, la corrección llegará en un momento.
        </div>
      )}
      {correction && <FeedbackCard c={correction} />}
    </div>
  );
}


/* -------------------- Lesson 4: Les clés -------------------- */

function ClesLesson({ onAward }: { onAward: (n?: number) => void }) {
  return (
    <div className="space-y-6">
      <VideoBlock src={videos.grammar} title="🗝️ Le conditionnel de courtoisie — Je voudrais" />

      <div className="rounded-2xl border-2 border-blue/30 bg-ice p-5">
        <p className="text-xs font-bold tracking-widest text-blue uppercase">📌 La formule</p>
        <p className="mt-1 font-display text-2xl font-extrabold text-navy">JE VOUDRAIS + nom / infinitif</p>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-white p-3 text-navy">❌ <b>Je veux</b> un café.</div>
          <div className="rounded-xl bg-gradient-blue p-3 text-white">✅ <b>Je voudrais</b> un café, s'il vous plaît.</div>
        </div>
      </div>

      <Tabs defaultValue="read" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 sm:grid-cols-4">
          <TabsTrigger value="read" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><BookOpen className="h-4 w-4" /> Lecture</TabsTrigger>
          <TabsTrigger value="listen" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Volume2 className="h-4 w-4" /> Écoute</TabsTrigger>
          <TabsTrigger value="speak" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Mic className="h-4 w-4" /> Parler</TabsTrigger>
          <TabsTrigger value="write" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Pencil className="h-4 w-4" /> Écriture</TabsTrigger>
        </TabsList>

        <TabsContent value="read" className="mt-4">
          <ReadingComprehension texts={[clesReadingText]} onAward={onAward} />
        </TabsContent>
        <TabsContent value="listen" className="mt-4">
          <ListeningMCGame items={clesListeningMC} onAward={onAward} />
        </TabsContent>
        <TabsContent value="speak" className="mt-4">
          <SpeakingGame items={clesSpeakingItems} dayId={1} section="cles" onAward={onAward} />
        </TabsContent>
        <TabsContent value="write" className="mt-4">
          <WritingGame items={clesWritingItems} dayId={1} section="cles" onAward={onAward} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------- Lesson 5: Défi Final -------------------- */

const DAY1_CRITERIA = [
  "Indica si es SUR PLACE o À EMPORTER.",
  "Usa JE VOUDRAIS + bebida al menos 1 vez.",
  "Especifica AVEC/SANS lait o sucre.",
  "Dice cómo paga (EN ESPÈCES o PAR CARTE).",
  "Se despide con MERCI y BONNE JOURNÉE.",
];

function DefiLesson({ onAward, onDone }: { onAward: (n?: number) => void; onDone: () => void }) {
  return (
    <StagedDefi
      dayId={1}
      title="Le Petit Liberté, Paris"
      subtitle="Tu primera conversación real en el café: saluda, pide y paga en francés."
      eyebrow="Défi final · Misión París"
      avatar="🤵"
      steps={defiRoleplay}
      criteria={DAY1_CRITERIA}
      onAward={onAward}
      onDone={onDone}
    />
  );
}


/* ============================================================
   DAY 2 LESSONS
   ============================================================ */

function IntroDay2() {
  return (
    <div className="space-y-5">
      <LiberteSpeak message="Bienvenue au Jour 2 ! Aujourd'hui, tu retournes au café — mais cette fois, tu ne fais pas que commander. Tu conseilles, tu goûtes, tu payes. Respire et regarde." />
      <VideoBlock src={day2Videos.intro} title="🎬 Intro · Jour 2 · Retour au café" />
    </div>
  );
}

function VocabLessonDay2({ onAward }: { onAward: (n?: number) => void }) {
  return (
    <div className="space-y-6">
      <LiberteSpeak message="30 nouveaux mots pour la cafétéria. Explore les flashcards une par une, puis les 4 mini-jeux." />

      <VideoBlock src={day2Videos.vocab} title="📚 Vocabulaire — Jour 2" />

      <FlashGridDay2 />

      <FlashQuizGame onAward={onAward} />

      <div className="rounded-2xl border-2 border-dashed border-blue/30 bg-ice p-5">
        <p className="font-display text-lg font-extrabold text-navy">🎯 Pratique — 4 mini-jeux</p>
        <p className="text-sm text-muted-foreground">Lecture, écoute, parler, écriture. Une étoile par jeu.</p>
      </div>

      <Tabs defaultValue="read" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 sm:grid-cols-4">
          <TabsTrigger value="read" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><BookOpen className="h-4 w-4" /> Lecture</TabsTrigger>
          <TabsTrigger value="listen" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Volume2 className="h-4 w-4" /> Écoute</TabsTrigger>
          <TabsTrigger value="speak" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Mic className="h-4 w-4" /> Parler</TabsTrigger>
          <TabsTrigger value="write" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Pencil className="h-4 w-4" /> Écriture</TabsTrigger>
        </TabsList>
        <TabsContent value="read" className="mt-4"><ReadingComprehension texts={day2VocabReadingTexts} onAward={onAward} /></TabsContent>
        <TabsContent value="listen" className="mt-4"><ListeningMCGame items={day2VocabListeningMC} onAward={onAward} /></TabsContent>
        <TabsContent value="speak" className="mt-4"><SpeakingGame items={day2VocabSpeakingItems} dayId={2} section="vocab" onAward={onAward} /></TabsContent>
        <TabsContent value="write" className="mt-4"><WritingGame items={day2VocabWritingItems} dayId={2} section="vocab" onAward={onAward} /></TabsContent>
      </Tabs>
    </div>
  );
}

function FlashGridDay2() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const total = day2Vocabulary.length;
  const v = day2Vocabulary[index];
  const go = (delta: number) => { setFlipped(false); setIndex((i) => (i + delta + total) % total); };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-navy/70">
        <span>Carte {index + 1} / {total}</span>
        <button onClick={() => { setFlipped(false); setIndex(0); }} className="text-blue hover:underline">Recommencer</button>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button onClick={() => go(-1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sky/40 bg-white text-navy shadow-soft hover:bg-ice" aria-label="Précédent"><ArrowLeft className="h-5 w-5" /></button>
        <button onClick={() => setFlipped((f) => !f)} className="relative h-56 flex-1 perspective-[1000px]" aria-label={`Carte ${v.fr}`}>
          <div className={`absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-card p-6 shadow-card [backface-visibility:hidden]">
              <span className="text-5xl">{v.emoji}</span>
              <p className="text-center font-display text-2xl font-extrabold text-navy sm:text-3xl">{v.fr}</p>
              <button onClick={(e) => { e.stopPropagation(); speakFr(v.fr); }} className="inline-flex items-center gap-2 rounded-full bg-blue/10 px-4 py-2 text-sm font-semibold text-blue hover:bg-blue/20"><Volume2 className="h-4 w-4" /> Écouter</button>
              <p className="text-[11px] text-muted-foreground">Touche la carte pour la retourner</p>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-gradient-blue p-6 text-white shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <p className="text-center font-display text-lg font-bold italic sm:text-2xl">"{v.example}"</p>
              <button onClick={(e) => { e.stopPropagation(); speakFr(v.example); }} className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30"><Volume2 className="h-4 w-4" /> Écouter</button>
            </div>
          </div>
        </button>
        <button onClick={() => go(1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sky/40 bg-white text-navy shadow-soft hover:bg-ice" aria-label="Suivant"><ArrowRight className="h-5 w-5" /></button>
      </div>
    </div>
  );
}

function FlashQuizGame({ onAward }: { onAward: (n?: number) => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const total = day2FlashQuiz.length;
  const cur = day2FlashQuiz[i];

  if (done)
    return <ResultCard title="Flashcards terminées !" score={`${score} / ${total}`} message="Étoile débloquée." />;

  const choose = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const ok = idx === cur.answer;
    playTone(ok ? "ok" : "no");
    if (ok) setScore((s) => s + 1);
    setTimeout(() => {
      setPicked(null);
      if (i + 1 < total) setI(i + 1);
      else { setDone(true); onAward(1); }
    }, 1000);
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between text-xs font-semibold text-navy/70">
        <span>🃏 Flashcard {i + 1} / {total}</span>
        <span className="inline-flex items-center gap-1 text-navy">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {score}
        </span>
      </div>
      <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl bg-gradient-blue p-8 text-white">
        <span className="text-6xl">{cur.emoji}</span>
        <p className="font-display text-lg font-bold">{cur.concept}</p>
        <p className="text-xs text-white/70">¿Cómo se dice en français ?</p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {cur.options.map((o, idx) => {
          const isPicked = picked === idx;
          const isRight = picked !== null && idx === cur.answer;
          const isWrong = isPicked && idx !== cur.answer;
          return (
            <button
              key={idx}
              onClick={() => choose(idx)}
              disabled={picked !== null}
              className={`rounded-xl border-2 bg-white p-3 text-center text-sm font-semibold text-navy transition ${
                isRight ? "border-success bg-success/10" : isWrong ? "border-red bg-red/10" : "border-border hover:border-blue"
              }`}
            >
              {o}
              {isRight && <Check className="ml-1 inline h-4 w-4 text-success" />}
              {isWrong && <X className="ml-1 inline h-4 w-4 text-red" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ClesLessonDay2({ onAward }: { onAward: (n?: number) => void }) {
  return (
    <div className="space-y-6">
      <VideoBlock src={day2Videos.grammar} title="🗝️ Les clés de la Liberté — Jour 2" />

      <div className="rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-ice to-white p-5 shadow-card">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-gold text-gold" />
          <p className="text-xs font-bold tracking-widest text-navy uppercase">Les 4 structures du Jour 2</p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {day2GrammarStructures.map((s, i) => (
            <div key={i} className="rounded-xl border border-blue/20 bg-white p-4">
              <p className="font-display text-sm font-extrabold text-blue">{s.formula}</p>
              <p className="mt-1 text-xs text-navy/80">{s.use}</p>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="read" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 sm:grid-cols-4">
          <TabsTrigger value="read" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><BookOpen className="h-4 w-4" /> Lecture</TabsTrigger>
          <TabsTrigger value="listen" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Volume2 className="h-4 w-4" /> Écoute</TabsTrigger>
          <TabsTrigger value="speak" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Mic className="h-4 w-4" /> Parler</TabsTrigger>
          <TabsTrigger value="write" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Pencil className="h-4 w-4" /> Écriture</TabsTrigger>
        </TabsList>
        <TabsContent value="read" className="mt-4"><ReadingComprehension texts={[day2ClesReadingText]} onAward={onAward} /></TabsContent>
        <TabsContent value="listen" className="mt-4"><ListeningMCGame items={day2ClesListeningMC} onAward={onAward} /></TabsContent>
        <TabsContent value="speak" className="mt-4"><SpeakingGame items={day2ClesSpeakingItems} dayId={2} section="cles" onAward={onAward} /></TabsContent>
        <TabsContent value="write" className="mt-4"><WritingGame items={day2ClesWritingItems} dayId={2} section="cles" onAward={onAward} /></TabsContent>
      </Tabs>
    </div>
  );
}

const DAY2_CRITERIA = [
  "Usa JE PRÉFÈRE al menos 1 vez.",
  "Usa QU'EST-CE QUE VOUS RECOMMANDEZ al menos 1 vez.",
  "Usa JE VAIS ESSAYER al menos 1 vez.",
  "Usa C'EST + adjectif al menos 2 veces.",
  "Pregunta por FAIT MAISON o LA SPÉCIALITÉ DU JOUR.",
  "Maneja el ciclo del pago (service / monnaie / reçu).",
  "Se despide con BONNE JOURNÉE.",
  "Usa al menos 8 palabras del vocabulario del Día 2.",
];

function DefiLessonDay2({ onAward, onDone }: { onAward: (n?: number) => void; onDone: () => void }) {
  return (
    <StagedDefi
      dayId={2}
      title="Le Petit Liberté, Paris"
      subtitle="Marie te reconoce. Esta vez conversas, eliges y manejas el pago completo."
      eyebrow="Défi final · Ma première vraie conversation"
      avatar="☕"
      steps={day2DefiSteps}
      criteria={DAY2_CRITERIA}
      onAward={onAward}
      onDone={onDone}
    />
  );
}

function BonusLessonDay2({ onAward, onDone }: { onAward: (n?: number) => void; onDone: () => void }) {
  const [claimed, setClaimed] = useState(false);
  const claim = () => {
    if (claimed) return;
    setClaimed(true);
    onAward(2);
    onDone();
    fireConfetti();
  };
  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-[#3A2A5C] via-[#5A3A7A] to-[#7A5A9C] p-6 text-white shadow-card sm:p-8">
        <div className="flex items-center gap-2">
          <Star className="h-6 w-6 fill-gold text-gold" />
          <p className="text-xs font-bold tracking-widest text-gold uppercase">Bonus · Le Petit Plus</p>
        </div>
        <h3 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">✨ Cápsula cultural</h3>
        <p className="mt-1 text-sm text-white/85">Un extra de descubrimiento — no bloquea tu avance, pero desbloquea una insignia especial.</p>
      </div>

      <VideoBlock src={day2Videos.bonus} title="✨ Le Petit Plus — Cápsula cultural" />

      <div className="rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-white to-ice p-5 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold to-[#D7C1A9] text-2xl">🏅</div>
          <div className="flex-1">
            <p className="font-display text-lg font-extrabold text-navy">Insignia « Curieux culturel »</p>
            <p className="text-sm text-muted-foreground">Marca este bonus como visto y súmalo a tu perfil.</p>
          </div>
          <Button onClick={claim} disabled={claimed} className="bg-gradient-to-r from-gold to-[#D7C1A9] text-navy">
            {claimed ? <><Check className="mr-1 h-4 w-4" /> Desbloqueado</> : <>Reclamar <Star className="ml-1 h-4 w-4 fill-navy" /></>}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DAY 3 LESSONS — La Boulangerie Liberté
   ============================================================ */

function IntroDay3() {
  return (
    <div className="space-y-5">
      <LiberteSpeak message="Bienvenue au Jour 3 ! Aujourd'hui, on entre dans la boulangerie. Le pain sort du four — respire cet arôme et prépare-toi à commander comme un parisien." />
      <VideoBlock src={day3Videos.intro} title="🎬 Intro · Jour 3 · La Boulangerie Liberté" />
    </div>
  );
}

function VocabLessonDay3({ onAward }: { onAward: (n?: number) => void }) {
  return (
    <div className="space-y-6">
      <LiberteSpeak message="30 mots nouveaux pour la boulangerie. Écoute les 7 phrases ancre, explore les cartes, puis les 4 mini-jeux." />

      <VideoBlock src={day3Videos.vocab} title="📚 Vocabulaire — Jour 3" />


      <FlashGridDay3 />

      <FlashQuizGameDay3 onAward={onAward} />

      <div className="rounded-2xl border-2 border-dashed border-blue/30 bg-ice p-5">
        <p className="font-display text-lg font-extrabold text-navy">🎯 Pratique — 4 mini-jeux</p>
        <p className="text-sm text-muted-foreground">Lecture, écoute, parler, écriture. Une étoile par jeu.</p>
      </div>

      <Tabs defaultValue="read" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 sm:grid-cols-4">
          <TabsTrigger value="read" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><BookOpen className="h-4 w-4" /> Lecture</TabsTrigger>
          <TabsTrigger value="listen" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Volume2 className="h-4 w-4" /> Écoute</TabsTrigger>
          <TabsTrigger value="speak" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Mic className="h-4 w-4" /> Parler</TabsTrigger>
          <TabsTrigger value="write" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Pencil className="h-4 w-4" /> Écriture</TabsTrigger>
        </TabsList>
        <TabsContent value="read" className="mt-4"><ReadingComprehension texts={day3VocabReadingTexts} onAward={onAward} /></TabsContent>
        <TabsContent value="listen" className="mt-4"><ListeningMCGame items={day3VocabListeningMC} onAward={onAward} /></TabsContent>
        <TabsContent value="speak" className="mt-4"><SpeakingGame items={day3VocabSpeakingItems} dayId={3} section="vocab" onAward={onAward} /></TabsContent>
        <TabsContent value="write" className="mt-4"><WritingGame items={day3VocabWritingItems} dayId={3} section="vocab" onAward={onAward} /></TabsContent>
      </Tabs>
    </div>
  );
}



function FlashGridDay3() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const total = day3Vocabulary.length;
  const v = day3Vocabulary[index];
  const go = (delta: number) => { setFlipped(false); setIndex((i) => (i + delta + total) % total); };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-navy/70">
        <span>Carte {index + 1} / {total}</span>
        <button onClick={() => { setFlipped(false); setIndex(0); }} className="text-blue hover:underline">Recommencer</button>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button onClick={() => go(-1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sky/40 bg-white text-navy shadow-soft hover:bg-ice" aria-label="Précédent"><ArrowLeft className="h-5 w-5" /></button>
        <button onClick={() => setFlipped((f) => !f)} className="relative h-56 flex-1 perspective-[1000px]" aria-label={`Carte ${v.fr}`}>
          <div className={`absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-card p-6 shadow-card [backface-visibility:hidden]">
              <span className="text-5xl">{v.emoji}</span>
              <p className="text-center font-display text-2xl font-extrabold text-navy sm:text-3xl">{v.fr}</p>
              <p className="text-sm text-muted-foreground">{v.es}</p>
              <button onClick={(e) => { e.stopPropagation(); speakFr(v.fr); }} className="inline-flex items-center gap-2 rounded-full bg-blue/10 px-4 py-2 text-sm font-semibold text-blue hover:bg-blue/20"><Volume2 className="h-4 w-4" /> Écouter</button>
              <p className="text-[11px] text-muted-foreground">Touche la carte pour la retourner</p>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-gradient-blue p-6 text-white shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <p className="text-center font-display text-lg font-bold italic sm:text-2xl">"{v.example}"</p>
              <button onClick={(e) => { e.stopPropagation(); speakFr(v.example); }} className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30"><Volume2 className="h-4 w-4" /> Écouter</button>
            </div>
          </div>
        </button>
        <button onClick={() => go(1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sky/40 bg-white text-navy shadow-soft hover:bg-ice" aria-label="Suivant"><ArrowRight className="h-5 w-5" /></button>
      </div>
    </div>
  );
}

function FlashQuizGameDay3({ onAward }: { onAward: (n?: number) => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const total = day3FlashQuiz.length;
  const cur = day3FlashQuiz[i];

  // Ensure the shown options always include the correct French translation for the
  // current concept, and shuffle so the correct answer isn't always first.
  const shuffled = useMemo(() => {
    const correctText = cur.options[cur.answer];
    const withFlags = cur.options.map((text, idx) => ({ text, wasCorrect: idx === cur.answer }));
    for (let k = withFlags.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [withFlags[k], withFlags[j]] = [withFlags[j], withFlags[k]];
    }
    return {
      options: withFlags.map((o) => o.text),
      answer: withFlags.findIndex((o) => o.wasCorrect),
      correctText,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  if (done)
    return <ResultCard title="Flashcards terminées !" score={`${score} / ${total}`} message="Étoile débloquée." />;

  const choose = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const ok = idx === shuffled.answer;
    playTone(ok ? "ok" : "no");
    if (ok) setScore((s) => s + 1);
    setTimeout(() => {
      setPicked(null);
      if (i + 1 < total) setI(i + 1);
      else { setDone(true); onAward(1); }
    }, 1000);
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between text-xs font-semibold text-navy/70">
        <span>🃏 Flashcard {i + 1} / {total}</span>
        <span className="inline-flex items-center gap-1 text-navy">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {score}
        </span>
      </div>
      <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl bg-gradient-blue p-8 text-white">
        <span className="text-6xl">{cur.emoji}</span>
        <p className="font-display text-lg font-bold">{cur.concept}</p>
        <p className="text-xs text-white/70">¿Cómo se dice en français ?</p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {shuffled.options.map((o, idx) => {
          const isPicked = picked === idx;
          const isRight = picked !== null && idx === shuffled.answer;
          const isWrong = isPicked && idx !== shuffled.answer;
          return (
            <button
              key={`${i}-${idx}`}
              onClick={() => choose(idx)}
              disabled={picked !== null}
              className={`rounded-xl border-2 bg-white p-3 text-center text-sm font-semibold text-navy transition ${
                isRight ? "border-success bg-success/10" : isWrong ? "border-red bg-red/10" : "border-border hover:border-blue"
              }`}
            >
              {o}
              {isRight && <Check className="ml-1 inline h-4 w-4 text-success" />}
              {isWrong && <X className="ml-1 inline h-4 w-4 text-red" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ClesLessonDay3({ onAward }: { onAward: (n?: number) => void }) {
  return (
    <div className="space-y-6">
      <VideoBlock src={day3Videos.grammar} title="🗝️ Les clés de la Liberté — Jour 3" />

      <div className="rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-ice to-white p-5 shadow-card">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-gold text-gold" />
          <p className="text-xs font-bold tracking-widest text-navy uppercase">Las 4 estructuras del Día 3</p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {day3GrammarStructures.map((s, i) => (
            <div key={i} className="rounded-xl border border-blue/20 bg-white p-4">
              <p className="font-display text-sm font-extrabold text-blue">{s.formula}</p>
              <p className="mt-1 text-xs text-navy/80">{s.use}</p>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="read" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 sm:grid-cols-4">
          <TabsTrigger value="read" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><BookOpen className="h-4 w-4" /> Lecture</TabsTrigger>
          <TabsTrigger value="listen" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Volume2 className="h-4 w-4" /> Écoute</TabsTrigger>
          <TabsTrigger value="speak" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Mic className="h-4 w-4" /> Parler</TabsTrigger>
          <TabsTrigger value="write" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Pencil className="h-4 w-4" /> Écriture</TabsTrigger>
        </TabsList>
        <TabsContent value="read" className="mt-4"><ReadingComprehension texts={[day3ClesReadingText]} onAward={onAward} /></TabsContent>
        <TabsContent value="listen" className="mt-4"><ListeningMCGame items={day3ClesListeningMC} onAward={onAward} /></TabsContent>
        <TabsContent value="speak" className="mt-4"><SpeakingGame items={day3ClesSpeakingItems} dayId={3} section="cles" onAward={onAward} /></TabsContent>
        <TabsContent value="write" className="mt-4"><WritingGame items={day3ClesWritingItems} dayId={3} section="cles" onAward={onAward} /></TabsContent>
      </Tabs>
    </div>
  );
}

const DAY3_CRITERIA = [
  "Usa JE VOUDRAIS + cantidad + nombre + adjetivo al menos 1 vez.",
  "Usa un adjetivo de textura correctamente concordado con el género.",
  "Usa COMBIEN COÛTE o COMBIEN COÛTENT al menos 1 vez.",
  "Usa la diferencia entier / demi / tranché al pedir.",
  "Pregunta por FRAIS / BIEN CUIT / CROUSTILLANT o MOELLEUX.",
  "Cierra la compra con C'EST TOUT + EMPORTER.",
  "Pide el TICKET DE CAISSE.",
  "Usa al menos 8 palabras del vocabulario del Día 3.",
];

function DefiLessonDay3({ onAward, onDone }: { onAward: (n?: number) => void; onDone: () => void }) {
  return (
    <StagedDefi
      dayId={3}
      title="La Boulangerie Liberté, Paris"
      subtitle="7:30 du matin. Le pain sort du four. Sophie t'accueille — commande comme un parisien."
      eyebrow="Défi final · Ma première boulangerie"
      avatar="🥖"
      steps={day3DefiSteps}
      criteria={DAY3_CRITERIA}
      onAward={onAward}
      onDone={onDone}
    />
  );
}


/* ==================== DAY 4 ==================== */

function IntroDay4() {
  return (
    <div className="space-y-5">
      <LiberteSpeak message="Bienvenue au Jour 4 ! Aujourd'hui, on entre dans la vitrine des douceurs. Choisis, goûte et offre — comme un vrai parisien." />
      <VideoBlock src={day4Videos.intro} title="🎬 Intro · Jour 4 · La Vitrine des Douceurs" />
    </div>
  );
}

function VocabLessonDay4({ onAward }: { onAward: (n?: number) => void }) {
  return (
    <div className="space-y-6">
      <LiberteSpeak message="30 mots nouveaux pour la pâtisserie. Explore les cartes, puis les 4 mini-jeux." />

      <VideoBlock src={day4Videos.vocab} title="📚 Vocabulaire — Jour 4" />

      <FlashGridDay4 />

      <FlashQuizGameDay4 onAward={onAward} />

      <div className="rounded-2xl border-2 border-dashed border-blue/30 bg-ice p-5">
        <p className="font-display text-lg font-extrabold text-navy">🎯 Pratique — 4 mini-jeux</p>
        <p className="text-sm text-muted-foreground">Lecture, écoute, parler, écriture. Une étoile par jeu.</p>
      </div>

      <Tabs defaultValue="read" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 sm:grid-cols-4">
          <TabsTrigger value="read" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><BookOpen className="h-4 w-4" /> Lecture</TabsTrigger>
          <TabsTrigger value="listen" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Volume2 className="h-4 w-4" /> Écoute</TabsTrigger>
          <TabsTrigger value="speak" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Mic className="h-4 w-4" /> Parler</TabsTrigger>
          <TabsTrigger value="write" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Pencil className="h-4 w-4" /> Écriture</TabsTrigger>
        </TabsList>
        <TabsContent value="read" className="mt-4"><ReadingComprehension texts={day4VocabReadingTexts} onAward={onAward} /></TabsContent>
        <TabsContent value="listen" className="mt-4"><ListeningMCGame items={day4VocabListeningMC} onAward={onAward} /></TabsContent>
        <TabsContent value="speak" className="mt-4"><SpeakingGame items={day4VocabSpeakingItems} dayId={4} section="vocab" onAward={onAward} /></TabsContent>
        <TabsContent value="write" className="mt-4"><WritingGame items={day4VocabWritingItems} dayId={4} section="vocab" onAward={onAward} /></TabsContent>
      </Tabs>
    </div>
  );
}

function FlashGridDay4() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const total = day4Vocabulary.length;
  const v = day4Vocabulary[index];
  const go = (delta: number) => { setFlipped(false); setIndex((i) => (i + delta + total) % total); };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-navy/70">
        <span>Carte {index + 1} / {total}</span>
        <button onClick={() => { setFlipped(false); setIndex(0); }} className="text-blue hover:underline">Recommencer</button>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button onClick={() => go(-1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sky/40 bg-white text-navy shadow-soft hover:bg-ice" aria-label="Précédent"><ArrowLeft className="h-5 w-5" /></button>
        <button onClick={() => setFlipped((f) => !f)} className="relative h-56 flex-1 perspective-[1000px]" aria-label={`Carte ${v.fr}`}>
          <div className={`absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-card p-6 shadow-card [backface-visibility:hidden]">
              <span className="text-5xl">{v.emoji}</span>
              <p className="text-center font-display text-2xl font-extrabold text-navy sm:text-3xl">{v.fr}</p>
              <p className="text-sm text-muted-foreground">{v.es}</p>
              <button onClick={(e) => { e.stopPropagation(); speakFr(v.fr); }} className="inline-flex items-center gap-2 rounded-full bg-blue/10 px-4 py-2 text-sm font-semibold text-blue hover:bg-blue/20"><Volume2 className="h-4 w-4" /> Écouter</button>
              <p className="text-[11px] text-muted-foreground">Touche la carte pour la retourner</p>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-gradient-blue p-6 text-white shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <p className="text-center font-display text-lg font-bold italic sm:text-2xl">"{v.example}"</p>
              <button onClick={(e) => { e.stopPropagation(); speakFr(v.example); }} className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30"><Volume2 className="h-4 w-4" /> Écouter</button>
            </div>
          </div>
        </button>
        <button onClick={() => go(1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sky/40 bg-white text-navy shadow-soft hover:bg-ice" aria-label="Suivant"><ArrowRight className="h-5 w-5" /></button>
      </div>
    </div>
  );
}

function FlashQuizGameDay4({ onAward }: { onAward: (n?: number) => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const total = day4FlashQuiz.length;
  const cur = day4FlashQuiz[i];

  if (done)
    return <ResultCard title="Flashcards terminées !" score={`${score} / ${total}`} message="Étoile débloquée." />;

  const choose = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const ok = idx === cur.answer;
    playTone(ok ? "ok" : "no");
    if (ok) setScore((s) => s + 1);
    setTimeout(() => {
      setPicked(null);
      if (i + 1 < total) setI(i + 1);
      else { setDone(true); onAward(1); }
    }, 1000);
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between text-xs font-semibold text-navy/70">
        <span>🃏 Flashcard {i + 1} / {total}</span>
        <span className="inline-flex items-center gap-1 text-navy">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {score}
        </span>
      </div>
      <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl bg-gradient-blue p-8 text-white">
        <span className="text-6xl">{cur.emoji}</span>
        <p className="font-display text-lg font-bold">{cur.concept}</p>
        <p className="text-xs text-white/70">¿Cómo se dice en français ?</p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {cur.options.map((o, idx) => {
          const isPicked = picked === idx;
          const isRight = picked !== null && idx === cur.answer;
          const isWrong = isPicked && idx !== cur.answer;
          return (
            <button
              key={idx}
              onClick={() => choose(idx)}
              disabled={picked !== null}
              className={`rounded-xl border-2 bg-white p-3 text-center text-sm font-semibold text-navy transition ${
                isRight ? "border-success bg-success/10" : isWrong ? "border-red bg-red/10" : "border-border hover:border-blue"
              }`}
            >
              {o}
              {isRight && <Check className="ml-1 inline h-4 w-4 text-success" />}
              {isWrong && <X className="ml-1 inline h-4 w-4 text-red" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ClesLessonDay4({ onAward }: { onAward: (n?: number) => void }) {
  return (
    <div className="space-y-6">
      <VideoBlock src={day4Videos.grammar} title="🗝️ Les clés de la Liberté — Jour 4" />

      <div className="rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-ice to-white p-5 shadow-card">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-gold text-gold" />
          <p className="text-xs font-bold tracking-widest text-navy uppercase">Las 4 estructuras del Día 4</p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {day4GrammarStructures.map((s, i) => (
            <div key={i} className="rounded-xl border border-blue/20 bg-white p-4">
              <p className="font-display text-sm font-extrabold text-blue">{s.formula}</p>
              <p className="mt-1 text-xs text-navy/80">{s.use}</p>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="read" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 sm:grid-cols-4">
          <TabsTrigger value="read" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><BookOpen className="h-4 w-4" /> Lecture</TabsTrigger>
          <TabsTrigger value="listen" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Volume2 className="h-4 w-4" /> Écoute</TabsTrigger>
          <TabsTrigger value="speak" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Mic className="h-4 w-4" /> Parler</TabsTrigger>
          <TabsTrigger value="write" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Pencil className="h-4 w-4" /> Écriture</TabsTrigger>
        </TabsList>
        <TabsContent value="read" className="mt-4"><ReadingComprehension texts={[day4ClesReadingText]} onAward={onAward} /></TabsContent>
        <TabsContent value="listen" className="mt-4"><ListeningMCGame items={day4ClesListeningMC} onAward={onAward} /></TabsContent>
        <TabsContent value="speak" className="mt-4"><SpeakingGame items={day4ClesSpeakingItems} dayId={4} section="cles" onAward={onAward} /></TabsContent>
        <TabsContent value="write" className="mt-4"><WritingGame items={day4ClesWritingItems} dayId={4} section="cles" onAward={onAward} /></TabsContent>
      </Tabs>
    </div>
  );
}

const DAY4_CRITERIA = [
  "Usa ÇA A L'AIR + adjectif al menos 2 veces.",
  "Usa ÇA SENT BON al llegar.",
  "Usa IL RESTE para verificar disponibilidad.",
  "Reacciona correctamente ante C'EST TERMINÉ (Dommage !).",
  "Pide probar con VOUS POUVEZ ME LE FAIRE GOÛTER.",
  "Usa C'EST POUR OFFRIR para el regalo.",
  "Pide una BOÎTE para la presentación.",
  "Usa al menos 8 palabras del vocabulario del Día 4.",
];

function DefiLessonDay4({ onAward, onDone }: { onAward: (n?: number) => void; onDone: () => void }) {
  return (
    <StagedDefi
      dayId={4}
      title="Un cadeau à emporter"
      subtitle="9h du matin. Les macarons sortent du four. Choisis, goûte, décide — et repars avec un beau cadeau."
      eyebrow="Défi final · Les douceurs de la vitrine"
      avatar="🧁"
      steps={day4DefiSteps}
      criteria={DAY4_CRITERIA}
      onAward={onAward}
      onDone={onDone}
    />
  );
}

/* ==================== DAY 5 — Le Bistrot Liberté ==================== */

function IntroDay5() {
  return (
    <div className="space-y-5">
      <LiberteSpeak message="Bienvenue au Jour 5 ! Ce soir, on entre dans un vrai bistrot parisien. Réserve, choisis et déguste — comme chez toi." />
      <VideoBlock src={day5Videos.intro} title="🎬 Intro · Jour 5 · Le Bistrot Liberté" />
    </div>
  );
}

function VocabLessonDay5({ onAward }: { onAward: (n?: number) => void }) {
  return (
    <div className="space-y-6">
      <LiberteSpeak message="30 mots nouveaux pour ta soirée au restaurant. Explore les cartes, puis les 4 mini-jeux." />

      <VideoBlock src={day5Videos.vocab} title="📚 Vocabulaire — Jour 5" />

      <FlashGridDay5 />

      <FlashQuizGameDay5 onAward={onAward} />

      <div className="rounded-2xl border-2 border-dashed border-blue/30 bg-ice p-5">
        <p className="font-display text-lg font-extrabold text-navy">🎯 Pratique — 4 mini-jeux</p>
        <p className="text-sm text-muted-foreground">Lecture, écoute, parler, écriture. Une étoile par jeu.</p>
      </div>

      <Tabs defaultValue="read" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 sm:grid-cols-4">
          <TabsTrigger value="read" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><BookOpen className="h-4 w-4" /> Lecture</TabsTrigger>
          <TabsTrigger value="listen" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Volume2 className="h-4 w-4" /> Écoute</TabsTrigger>
          <TabsTrigger value="speak" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Mic className="h-4 w-4" /> Parler</TabsTrigger>
          <TabsTrigger value="write" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Pencil className="h-4 w-4" /> Écriture</TabsTrigger>
        </TabsList>
        <TabsContent value="read" className="mt-4"><ReadingComprehension texts={day5VocabReadingTexts} onAward={onAward} /></TabsContent>
        <TabsContent value="listen" className="mt-4"><ListeningMCGame items={day5VocabListeningMC} onAward={onAward} /></TabsContent>
        <TabsContent value="speak" className="mt-4"><SpeakingGame items={day5VocabSpeakingItems} dayId={5} section="vocab" onAward={onAward} /></TabsContent>
        <TabsContent value="write" className="mt-4"><WritingGame items={day5VocabWritingItems} dayId={5} section="vocab" onAward={onAward} /></TabsContent>
      </Tabs>
    </div>
  );
}

function FlashGridDay5() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const total = day5Vocabulary.length;
  const v = day5Vocabulary[index];
  const go = (delta: number) => { setFlipped(false); setIndex((i) => (i + delta + total) % total); };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-navy/70">
        <span>Carte {index + 1} / {total}</span>
        <button onClick={() => { setFlipped(false); setIndex(0); }} className="text-blue hover:underline">Recommencer</button>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button onClick={() => go(-1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sky/40 bg-white text-navy shadow-soft hover:bg-ice" aria-label="Précédent"><ArrowLeft className="h-5 w-5" /></button>
        <button onClick={() => setFlipped((f) => !f)} className="relative h-56 flex-1 perspective-[1000px]" aria-label={`Carte ${v.fr}`}>
          <div className={`absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-card p-6 shadow-card [backface-visibility:hidden]">
              <span className="text-5xl">{v.emoji}</span>
              <p className="text-center font-display text-2xl font-extrabold text-navy sm:text-3xl">{v.fr}</p>
              <p className="text-sm text-muted-foreground">{v.es}</p>
              <button onClick={(e) => { e.stopPropagation(); speakFr(v.fr); }} className="inline-flex items-center gap-2 rounded-full bg-blue/10 px-4 py-2 text-sm font-semibold text-blue hover:bg-blue/20"><Volume2 className="h-4 w-4" /> Écouter</button>
              <p className="text-[11px] text-muted-foreground">Touche la carte pour la retourner</p>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-gradient-blue p-6 text-white shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <p className="text-center font-display text-lg font-bold italic sm:text-2xl">"{v.example}"</p>
              <button onClick={(e) => { e.stopPropagation(); speakFr(v.example); }} className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30"><Volume2 className="h-4 w-4" /> Écouter</button>
            </div>
          </div>
        </button>
        <button onClick={() => go(1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sky/40 bg-white text-navy shadow-soft hover:bg-ice" aria-label="Suivant"><ArrowRight className="h-5 w-5" /></button>
      </div>
    </div>
  );
}

function FlashQuizGameDay5({ onAward }: { onAward: (n?: number) => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const total = day5FlashQuiz.length;
  const cur = day5FlashQuiz[i];

  if (done)
    return <ResultCard title="Flashcards terminées !" score={`${score} / ${total}`} message="Étoile débloquée." />;

  const choose = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const ok = idx === cur.answer;
    playTone(ok ? "ok" : "no");
    if (ok) setScore((s) => s + 1);
    setTimeout(() => {
      setPicked(null);
      if (i + 1 < total) setI(i + 1);
      else { setDone(true); onAward(1); }
    }, 1000);
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between text-xs font-semibold text-navy/70">
        <span>🃏 Flashcard {i + 1} / {total}</span>
        <span className="inline-flex items-center gap-1 text-navy">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {score}
        </span>
      </div>
      <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl bg-gradient-blue p-8 text-white">
        <span className="text-6xl">{cur.emoji}</span>
        <p className="font-display text-lg font-bold">{cur.concept}</p>
        <p className="text-xs text-white/70">¿Cómo se dice en français ?</p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {cur.options.map((o, idx) => {
          const isPicked = picked === idx;
          const isRight = picked !== null && idx === cur.answer;
          const isWrong = isPicked && idx !== cur.answer;
          return (
            <button
              key={idx}
              onClick={() => choose(idx)}
              disabled={picked !== null}
              className={`rounded-xl border-2 bg-white p-3 text-center text-sm font-semibold text-navy transition ${
                isRight ? "border-success bg-success/10" : isWrong ? "border-red bg-red/10" : "border-border hover:border-blue"
              }`}
            >
              {o}
              {isRight && <Check className="ml-1 inline h-4 w-4 text-success" />}
              {isWrong && <X className="ml-1 inline h-4 w-4 text-red" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ClesLessonDay5({ onAward }: { onAward: (n?: number) => void }) {
  return (
    <div className="space-y-6">
      <VideoBlock src={day5Videos.grammar} title="🗝️ Les clés de la Liberté — Jour 5" />

      <div className="rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-ice to-white p-5 shadow-card">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-gold text-gold" />
          <p className="text-xs font-bold tracking-widest text-navy uppercase">Las 4 estructuras del Día 5</p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {day5GrammarStructures.map((s, i) => (
            <div key={i} className="rounded-xl border border-blue/20 bg-white p-4">
              <p className="font-display text-sm font-extrabold text-blue">{s.formula}</p>
              <p className="mt-1 text-xs text-navy/80">{s.use}</p>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="read" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 sm:grid-cols-4">
          <TabsTrigger value="read" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><BookOpen className="h-4 w-4" /> Lecture</TabsTrigger>
          <TabsTrigger value="listen" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Volume2 className="h-4 w-4" /> Écoute</TabsTrigger>
          <TabsTrigger value="speak" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Mic className="h-4 w-4" /> Parler</TabsTrigger>
          <TabsTrigger value="write" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Pencil className="h-4 w-4" /> Écriture</TabsTrigger>
        </TabsList>
        <TabsContent value="read" className="mt-4"><ReadingComprehension texts={[day5ClesReadingText]} onAward={onAward} /></TabsContent>
        <TabsContent value="listen" className="mt-4"><ListeningMCGame items={day5ClesListeningMC} onAward={onAward} /></TabsContent>
        <TabsContent value="speak" className="mt-4"><SpeakingGame items={day5ClesSpeakingItems} dayId={5} section="cles" onAward={onAward} /></TabsContent>
        <TabsContent value="write" className="mt-4"><WritingGame items={day5ClesWritingItems} dayId={5} section="cles" onAward={onAward} /></TabsContent>
      </Tabs>
    </div>
  );
}

const DAY5_CRITERIA = [
  "Presentó la reserva con AU NOM DE + número de personas.",
  "Usó JE PRÉFÈRE A À B para elegir la mesa.",
  "Preguntó el plat du jour (Quel est le plat du jour ?).",
  "Eligió entre menu o carte y lo justificó.",
  "Pidió los tres platos usando COMME (entrée, plat, dessert/fromage).",
  "Usó JE PRÉFÈRE A À B para una preferencia de ingrediente.",
  "Pidió pan o agua con VOUS POUVEZ M'APPORTER.",
  "Preguntó QU'EST-CE QUI EST COMPRIS DANS LE MENU.",
  "Reaccionó al plato con ÇA A L'AIR + adjectif.",
  "Cerró la cena: pidió la cuenta, pagó y se despidió.",
];

function DefiLessonDay5({ onAward, onDone }: { onAward: (n?: number) => void; onDone: () => void }) {
  return (
    <StagedDefi
      dayId={5}
      title="Une soirée au Bistrot Liberté"
      subtitle="20h à Paris. Ta réserve est prête, la terrasse t'attend, le plat du jour sort déjà de la cuisine."
      eyebrow="Défi final · Ma première soirée au restaurant"
      avatar="🍷"
      steps={day5DefiSteps}
      criteria={DAY5_CRITERIA}
      onAward={onAward}
      onDone={onDone}
    />
  );
}

/* ============================================================
   DAY 6 LESSONS — Restaurant · Partie 2
   ============================================================ */

function IntroDay6() {
  return (
    <div className="space-y-5">
      <LiberteSpeak message="Bienvenue au Jour 6 ! Aujourd'hui tu retournes au restaurant — mais cette fois, avec des amis, des restrictions alimentaires et une addition à vérifier. Respire, tu es prêt." />
      <VideoBlock src={day6Videos.intro} title="🎬 Intro · Jour 6 · Retour au restaurant" />
    </div>
  );
}

function VocabLessonDay6({ onAward }: { onAward: (n?: number) => void }) {
  return (
    <div className="space-y-6">
      <LiberteSpeak message="30 mots pour manger avec restrictions, gestionar la cuenta y felicitar al chef. Explora les cartes, puis les 4 mini-jeux." />

      <VideoBlock src={day6Videos.vocab} title="📚 Vocabulaire — Jour 6" />

      <FlashGridDay6 />

      <FlashQuizGameDay6 onAward={onAward} />

      <div className="rounded-2xl border-2 border-dashed border-blue/30 bg-ice p-5">
        <p className="font-display text-lg font-extrabold text-navy">🎯 Pratique — 4 mini-jeux</p>
        <p className="text-sm text-muted-foreground">Lecture, écoute, parler, écriture. Une étoile par jeu.</p>
      </div>

      <Tabs defaultValue="read" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 sm:grid-cols-4">
          <TabsTrigger value="read" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><BookOpen className="h-4 w-4" /> Lecture</TabsTrigger>
          <TabsTrigger value="listen" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Volume2 className="h-4 w-4" /> Écoute</TabsTrigger>
          <TabsTrigger value="speak" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Mic className="h-4 w-4" /> Parler</TabsTrigger>
          <TabsTrigger value="write" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Pencil className="h-4 w-4" /> Écriture</TabsTrigger>
        </TabsList>
        <TabsContent value="read" className="mt-4"><ReadingComprehension texts={day6VocabReadingTexts} onAward={onAward} /></TabsContent>
        <TabsContent value="listen" className="mt-4"><ListeningMCGame items={day6VocabListeningMC} onAward={onAward} /></TabsContent>
        <TabsContent value="speak" className="mt-4"><SpeakingGame items={day6VocabSpeakingItems} dayId={6} section="vocab" onAward={onAward} /></TabsContent>
        <TabsContent value="write" className="mt-4"><WritingGame items={day6VocabWritingItems} dayId={6} section="vocab" onAward={onAward} /></TabsContent>
      </Tabs>
    </div>
  );
}

function FlashGridDay6() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const total = day6Vocabulary.length;
  const v = day6Vocabulary[index];
  const go = (delta: number) => { setFlipped(false); setIndex((i) => (i + delta + total) % total); };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-navy/70">
        <span>Carte {index + 1} / {total}</span>
        <button onClick={() => { setFlipped(false); setIndex(0); }} className="text-blue hover:underline">Recommencer</button>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button onClick={() => go(-1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sky/40 bg-white text-navy shadow-soft hover:bg-ice" aria-label="Précédent"><ArrowLeft className="h-5 w-5" /></button>
        <button onClick={() => setFlipped((f) => !f)} className="relative h-56 flex-1 perspective-[1000px]" aria-label={`Carte ${v.fr}`}>
          <div className={`absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-card p-6 shadow-card [backface-visibility:hidden]">
              <span className="text-5xl">{v.emoji}</span>
              <p className="text-center font-display text-2xl font-extrabold text-navy sm:text-3xl">{v.fr}</p>
              <p className="text-sm text-muted-foreground">{v.es}</p>
              <button onClick={(e) => { e.stopPropagation(); speakFr(v.fr); }} className="inline-flex items-center gap-2 rounded-full bg-blue/10 px-4 py-2 text-sm font-semibold text-blue hover:bg-blue/20"><Volume2 className="h-4 w-4" /> Écouter</button>
              <p className="text-[11px] text-muted-foreground">Touche la carte pour la retourner</p>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-gradient-blue p-6 text-white shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <p className="text-center font-display text-lg font-bold italic sm:text-2xl">"{v.example}"</p>
              <button onClick={(e) => { e.stopPropagation(); speakFr(v.example); }} className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30"><Volume2 className="h-4 w-4" /> Écouter</button>
            </div>
          </div>
        </button>
        <button onClick={() => go(1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sky/40 bg-white text-navy shadow-soft hover:bg-ice" aria-label="Suivant"><ArrowRight className="h-5 w-5" /></button>
      </div>
    </div>
  );
}

function FlashQuizGameDay6({ onAward }: { onAward: (n?: number) => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const total = day6FlashQuiz.length;
  const cur = day6FlashQuiz[i];

  if (done)
    return <ResultCard title="Flashcards terminées !" score={`${score} / ${total}`} message="Étoile débloquée." />;

  const choose = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const ok = idx === cur.answer;
    playTone(ok ? "ok" : "no");
    if (ok) setScore((s) => s + 1);
    setTimeout(() => {
      setPicked(null);
      if (i + 1 < total) setI(i + 1);
      else { setDone(true); onAward(1); }
    }, 1000);
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between text-xs font-semibold text-navy/70">
        <span>🃏 Flashcard {i + 1} / {total}</span>
        <span className="inline-flex items-center gap-1 text-navy">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {score}
        </span>
      </div>
      <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl bg-gradient-blue p-8 text-white">
        <span className="text-6xl">{cur.emoji}</span>
        <p className="font-display text-lg font-bold">{cur.concept}</p>
        <p className="text-xs text-white/70">¿Cómo se dice en français ?</p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {cur.options.map((o, idx) => {
          const isPicked = picked === idx;
          const isRight = picked !== null && idx === cur.answer;
          const isWrong = isPicked && idx !== cur.answer;
          return (
            <button
              key={idx}
              onClick={() => choose(idx)}
              disabled={picked !== null}
              className={`rounded-xl border-2 bg-white p-3 text-center text-sm font-semibold text-navy transition ${
                isRight ? "border-success bg-success/10" : isWrong ? "border-red bg-red/10" : "border-border hover:border-blue"
              }`}
            >
              {o}
              {isRight && <Check className="ml-1 inline h-4 w-4 text-success" />}
              {isWrong && <X className="ml-1 inline h-4 w-4 text-red" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ClesLessonDay6({ onAward }: { onAward: (n?: number) => void }) {
  return (
    <div className="space-y-6">
      <VideoBlock src={day6Videos.grammar} title="🗝️ Les clés de la Liberté — Jour 6 · Futur proche" />

      <div className="rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-ice to-white p-5 shadow-card">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-gold text-gold" />
          <p className="text-xs font-bold tracking-widest text-navy uppercase">Las 4 estructuras del Día 6</p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {day6GrammarStructures.map((s, i) => (
            <div key={i} className="rounded-xl border border-blue/20 bg-white p-4">
              <p className="font-display text-sm font-extrabold text-blue">{s.formula}</p>
              <p className="mt-1 text-xs text-navy/80">{s.use}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-red/30 bg-red/5 p-3 text-xs text-navy/80">
          <span className="font-bold text-red">⚠️ Error frecuente :</span> « Je vais prends le poulet » ❌ → « Je vais prendre le poulet » ✓ — aller siempre va con el infinitivo.
        </div>
      </div>

      <Tabs defaultValue="read" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 sm:grid-cols-4">
          <TabsTrigger value="read" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><BookOpen className="h-4 w-4" /> Lecture</TabsTrigger>
          <TabsTrigger value="listen" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Volume2 className="h-4 w-4" /> Écoute</TabsTrigger>
          <TabsTrigger value="speak" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Mic className="h-4 w-4" /> Parler</TabsTrigger>
          <TabsTrigger value="write" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Pencil className="h-4 w-4" /> Écriture</TabsTrigger>
        </TabsList>
        <TabsContent value="read" className="mt-4"><ReadingComprehension texts={[day6ClesReadingText]} onAward={onAward} /></TabsContent>
        <TabsContent value="listen" className="mt-4"><ListeningMCGame items={day6ClesListeningMC} onAward={onAward} /></TabsContent>
        <TabsContent value="speak" className="mt-4"><SpeakingGame items={day6ClesSpeakingItems} dayId={6} section="cles" onAward={onAward} /></TabsContent>
        <TabsContent value="write" className="mt-4"><WritingGame items={day6ClesWritingItems} dayId={6} section="cles" onAward={onAward} /></TabsContent>
      </Tabs>
    </div>
  );
}

const DAY6_CRITERIA = [
  "Anuncia una restricción alimentaria (végétarien / végane / allergie / sans gluten).",
  "Usa FUTUR PROCHE (aller + infinitif) al menos 2 veces.",
  "Usa JE VAIS PRENDRE + plato al pedir.",
  "Precisa la cuisson (à point / saignant) o pide un accompagnement.",
  "Señala una erreur dans l'addition con educación.",
  "Pide payer séparément o faire moitié-moitié.",
  "Se despide con COMPLIMENTS AU CHEF y BONNE SOIRÉE.",
  "Usa al menos 8 palabras del vocabulario del Día 6.",
];

function DefiLessonDay6({ onAward, onDone }: { onAward: (n?: number) => void; onDone: () => void }) {
  return (
    <StagedDefi
      dayId={6}
      title="Restaurant · Partie 2"
      subtitle="Cena en un restaurante parisino con amigos: restricciones, un error en la cuenta y el pago separado."
      eyebrow="Défi final · Reto entregable"
      avatar="🍽️"
      steps={day6DefiSteps}
      criteria={DAY6_CRITERIA}
      onAward={onAward}
      onDone={onDone}
    />
  );
}

/* ============================================================
   DAY 7 LESSONS — Supermarché · Partie 1
   ============================================================ */

function IntroDay7() {
  return (
    <div className="space-y-5">
      <LiberteSpeak message="Bienvenue au Jour 7 ! Aujourd'hui tu entres dans un supermarché francés por primera vez. Vas a saber exactamente cómo orientarte, preguntar por las secciones y encontrar lo que necesitas." />
      <VideoBlock src={day7Videos.intro} title="🎬 Intro · Jour 7 · Au supermarché" />
    </div>
  );
}

function VocabLessonDay7({ onAward }: { onAward: (n?: number) => void }) {
  return (
    <div className="space-y-6">
      <LiberteSpeak message="30 mots para moverte en un supermercado francés : rayons, promotions, produits frais et surgelés. Explora les cartes, puis les 4 mini-jeux." />

      <VideoBlock src={day7Videos.vocab} title="📚 Vocabulaire — Jour 7" />

      <FlashGridDay7 />

      <FlashQuizGameDay7 onAward={onAward} />

      <div className="rounded-2xl border-2 border-dashed border-blue/30 bg-ice p-5">
        <p className="font-display text-lg font-extrabold text-navy">🎯 Pratique — 4 mini-jeux</p>
        <p className="text-sm text-muted-foreground">Lecture, écoute, parler, écriture. Une étoile par jeu.</p>
      </div>

      <Tabs defaultValue="read" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 sm:grid-cols-4">
          <TabsTrigger value="read" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><BookOpen className="h-4 w-4" /> Lecture</TabsTrigger>
          <TabsTrigger value="listen" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Volume2 className="h-4 w-4" /> Écoute</TabsTrigger>
          <TabsTrigger value="speak" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Mic className="h-4 w-4" /> Parler</TabsTrigger>
          <TabsTrigger value="write" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Pencil className="h-4 w-4" /> Écriture</TabsTrigger>
        </TabsList>
        <TabsContent value="read" className="mt-4"><ReadingComprehension texts={day7VocabReadingTexts} onAward={onAward} /></TabsContent>
        <TabsContent value="listen" className="mt-4"><ListeningMCGame items={day7VocabListeningMC} onAward={onAward} /></TabsContent>
        <TabsContent value="speak" className="mt-4"><SpeakingGame items={day7VocabSpeakingItems} dayId={7} section="vocab" onAward={onAward} /></TabsContent>
        <TabsContent value="write" className="mt-4"><WritingGame items={day7VocabWritingItems} dayId={7} section="vocab" onAward={onAward} /></TabsContent>
      </Tabs>
    </div>
  );
}

function FlashGridDay7() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const total = day7Vocabulary.length;
  const v = day7Vocabulary[index];
  const go = (delta: number) => { setFlipped(false); setIndex((i) => (i + delta + total) % total); };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-navy/70">
        <span>Carte {index + 1} / {total}</span>
        <button onClick={() => { setFlipped(false); setIndex(0); }} className="text-blue hover:underline">Recommencer</button>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button onClick={() => go(-1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sky/40 bg-white text-navy shadow-soft hover:bg-ice" aria-label="Précédent"><ArrowLeft className="h-5 w-5" /></button>
        <button onClick={() => setFlipped((f) => !f)} className="relative h-56 flex-1 perspective-[1000px]" aria-label={`Carte ${v.fr}`}>
          <div className={`absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-card p-6 shadow-card [backface-visibility:hidden]">
              <span className="text-5xl">{v.emoji}</span>
              <p className="text-center font-display text-2xl font-extrabold text-navy sm:text-3xl">{v.fr}</p>
              <p className="text-sm text-muted-foreground">{v.es}</p>
              <button onClick={(e) => { e.stopPropagation(); speakFr(v.fr); }} className="inline-flex items-center gap-2 rounded-full bg-blue/10 px-4 py-2 text-sm font-semibold text-blue hover:bg-blue/20"><Volume2 className="h-4 w-4" /> Écouter</button>
              <p className="text-[11px] text-muted-foreground">Touche la carte pour la retourner</p>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-gradient-blue p-6 text-white shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <p className="text-center font-display text-lg font-bold italic sm:text-2xl">"{v.example}"</p>
              <button onClick={(e) => { e.stopPropagation(); speakFr(v.example); }} className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30"><Volume2 className="h-4 w-4" /> Écouter</button>
            </div>
          </div>
        </button>
        <button onClick={() => go(1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sky/40 bg-white text-navy shadow-soft hover:bg-ice" aria-label="Suivant"><ArrowRight className="h-5 w-5" /></button>
      </div>
    </div>
  );
}

function FlashQuizGameDay7({ onAward }: { onAward: (n?: number) => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const total = day7FlashQuiz.length;
  const cur = day7FlashQuiz[i];

  if (done)
    return <ResultCard title="Flashcards terminées !" score={`${score} / ${total}`} message="Étoile débloquée." />;

  const choose = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const ok = idx === cur.answer;
    playTone(ok ? "ok" : "no");
    if (ok) setScore((s) => s + 1);
    setTimeout(() => {
      setPicked(null);
      if (i + 1 < total) setI(i + 1);
      else { setDone(true); onAward(1); }
    }, 1000);
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between text-xs font-semibold text-navy/70">
        <span>🃏 Flashcard {i + 1} / {total}</span>
        <span className="inline-flex items-center gap-1 text-navy">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {score}
        </span>
      </div>
      <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl bg-gradient-blue p-8 text-white">
        <span className="text-6xl">{cur.emoji}</span>
        <p className="font-display text-lg font-bold">{cur.concept}</p>
        <p className="text-xs text-white/70">¿Cómo se dice en français ?</p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {cur.options.map((o, idx) => {
          const isPicked = picked === idx;
          const isRight = picked !== null && idx === cur.answer;
          const isWrong = isPicked && idx !== cur.answer;
          return (
            <button
              key={idx}
              onClick={() => choose(idx)}
              disabled={picked !== null}
              className={`rounded-xl border-2 bg-white p-3 text-center text-sm font-semibold text-navy transition ${
                isRight ? "border-success bg-success/10" : isWrong ? "border-red bg-red/10" : "border-border hover:border-blue"
              }`}
            >
              {o}
              {isRight && <Check className="ml-1 inline h-4 w-4 text-success" />}
              {isWrong && <X className="ml-1 inline h-4 w-4 text-red" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ClesLessonDay7({ onAward }: { onAward: (n?: number) => void }) {
  return (
    <div className="space-y-6">
      <VideoBlock src={day7Videos.grammar} title="🗝️ Les clés de la Liberté — Jour 7 · Il y a / Il n'y a pas de" />

      <div className="rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-ice to-white p-5 shadow-card">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-gold text-gold" />
          <p className="text-xs font-bold tracking-widest text-navy uppercase">Las 4 estructuras del Día 7</p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {day7GrammarStructures.map((s, i) => (
            <div key={i} className="rounded-xl border border-blue/20 bg-white p-4">
              <p className="font-display text-sm font-extrabold text-blue">{s.formula}</p>
              <p className="mt-1 text-xs text-navy/80">{s.use}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-red/30 bg-red/5 p-3 text-xs text-navy/80">
          <span className="font-bold text-red">⚠️ Error frecuente :</span> « Il n'y a pas du lait » ❌ → « Il n'y a pas de lait » ✓ — en negativo, el artículo desaparece y se convierte en « de » (o « d' » delante de vocal).
        </div>
      </div>

      <Tabs defaultValue="read" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 sm:grid-cols-4">
          <TabsTrigger value="read" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><BookOpen className="h-4 w-4" /> Lecture</TabsTrigger>
          <TabsTrigger value="listen" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Volume2 className="h-4 w-4" /> Écoute</TabsTrigger>
          <TabsTrigger value="speak" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Mic className="h-4 w-4" /> Parler</TabsTrigger>
          <TabsTrigger value="write" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Pencil className="h-4 w-4" /> Écriture</TabsTrigger>
        </TabsList>
        <TabsContent value="read" className="mt-4"><ReadingComprehension texts={[day7ClesReadingText]} onAward={onAward} /></TabsContent>
        <TabsContent value="listen" className="mt-4"><ListeningMCGame items={day7ClesListeningMC} onAward={onAward} /></TabsContent>
        <TabsContent value="speak" className="mt-4"><SpeakingGame items={day7ClesSpeakingItems} dayId={7} section="cles" onAward={onAward} /></TabsContent>
        <TabsContent value="write" className="mt-4"><WritingGame items={day7ClesWritingItems} dayId={7} section="cles" onAward={onAward} /></TabsContent>
      </Tabs>
    </div>
  );
}

const DAY7_CRITERIA = [
  "Saluda al empleado y usa una fórmula de cortesía (Bonjour / s'il vous plaît).",
  "Usa « Où se trouve… ? » al menos una vez para preguntar por una sección.",
  "Pregunta por 2 secciones diferentes del supermercado.",
  "Usa « Il y a… ? » al menos una vez.",
  "Usa « Il n'y a pas de… » al menos una vez.",
  "Menciona vocabulario del supermercado (rayon, allée, promotion, frais, surgelé, bio…).",
  "Agradece con « Merci » y se despide con « Bonne journée ».",
  "Usa al menos 8 palabras del vocabulario del Día 7.",
];

function DefiLessonDay7({ onAward, onDone }: { onAward: (n?: number) => void; onDone: () => void }) {
  return (
    <StagedDefi
      dayId={7}
      title="Supermarché · Partie 1"
      subtitle="Entras a un supermercado francés y preguntas dónde están 2 secciones diferentes, usando « Où se trouve… ? », « Il y a… ? » e « Il n'y a pas de… »."
      eyebrow="Défi final · Reto entregable"
      avatar="🛒"
      steps={day7DefiSteps}
      criteria={DAY7_CRITERIA}
      onAward={onAward}
      onDone={onDone}
    />
  );
}

/* ============================================================
   DAY 8 LESSONS — Faire les courses
   ============================================================ */

function IntroDay8() {
  return (
    <div className="space-y-5">
      <LiberteSpeak message="Jour 8 ! Aujourd'hui tu prépares la compra semanal completa : liste, secciones, partitivos y la estructura clave « je dois + infinitif »." />
      <VideoBlock src={day8Videos.intro} title="🎬 Intro · Jour 8 · Faire les courses" />
    </div>
  );
}

function VocabLessonDay8({ onAward }: { onAward: (n?: number) => void }) {
  return (
    <div className="space-y-6">
      <LiberteSpeak message="30 palabras para hacer la compra completa : productos frescos, higiene, bebidas y la fórmula mágica « Je dois acheter… »." />

      <VideoBlock src={day8Videos.vocab} title="📚 Vocabulaire — Jour 8" />

      <FlashGridDay8 />

      <FlashQuizGameDay8 onAward={onAward} />

      <div className="rounded-2xl border-2 border-dashed border-blue/30 bg-ice p-5">
        <p className="font-display text-lg font-extrabold text-navy">🎯 Pratique — 4 mini-jeux</p>
        <p className="text-sm text-muted-foreground">Lecture, écoute, parler, écriture. Une étoile par jeu.</p>
      </div>

      <Tabs defaultValue="read" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 sm:grid-cols-4">
          <TabsTrigger value="read" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><BookOpen className="h-4 w-4" /> Lecture</TabsTrigger>
          <TabsTrigger value="listen" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Volume2 className="h-4 w-4" /> Écoute</TabsTrigger>
          <TabsTrigger value="speak" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Mic className="h-4 w-4" /> Parler</TabsTrigger>
          <TabsTrigger value="write" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Pencil className="h-4 w-4" /> Écriture</TabsTrigger>
        </TabsList>
        <TabsContent value="read" className="mt-4"><ReadingComprehension texts={day8VocabReadingTexts} onAward={onAward} /></TabsContent>
        <TabsContent value="listen" className="mt-4"><ListeningMCGame items={day8VocabListeningMC} onAward={onAward} /></TabsContent>
        <TabsContent value="speak" className="mt-4"><SpeakingGame items={day8VocabSpeakingItems} dayId={8} section="vocab" onAward={onAward} /></TabsContent>
        <TabsContent value="write" className="mt-4"><WritingGame items={day8VocabWritingItems} dayId={8} section="vocab" onAward={onAward} /></TabsContent>
      </Tabs>
    </div>
  );
}

function FlashGridDay8() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const total = day8Vocabulary.length;
  const v = day8Vocabulary[index];
  const go = (delta: number) => { setFlipped(false); setIndex((i) => (i + delta + total) % total); };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-navy/70">
        <span>Carte {index + 1} / {total}</span>
        <button onClick={() => { setFlipped(false); setIndex(0); }} className="text-blue hover:underline">Recommencer</button>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button onClick={() => go(-1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sky/40 bg-white text-navy shadow-soft hover:bg-ice" aria-label="Précédent"><ArrowLeft className="h-5 w-5" /></button>
        <button onClick={() => setFlipped((f) => !f)} className="relative h-56 flex-1 perspective-[1000px]" aria-label={`Carte ${v.fr}`}>
          <div className={`absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-card p-6 shadow-card [backface-visibility:hidden]">
              <span className="text-5xl">{v.emoji}</span>
              <p className="text-center font-display text-2xl font-extrabold text-navy sm:text-3xl">{v.fr}</p>
              <p className="text-sm text-muted-foreground">{v.es}</p>
              <button onClick={(e) => { e.stopPropagation(); speakFr(v.fr); }} className="inline-flex items-center gap-2 rounded-full bg-blue/10 px-4 py-2 text-sm font-semibold text-blue hover:bg-blue/20"><Volume2 className="h-4 w-4" /> Écouter</button>
              <p className="text-[11px] text-muted-foreground">Touche la carte pour la retourner</p>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-gradient-blue p-6 text-white shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <p className="text-center font-display text-lg font-bold italic sm:text-2xl">"{v.example}"</p>
              <button onClick={(e) => { e.stopPropagation(); speakFr(v.example); }} className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30"><Volume2 className="h-4 w-4" /> Écouter</button>
            </div>
          </div>
        </button>
        <button onClick={() => go(1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sky/40 bg-white text-navy shadow-soft hover:bg-ice" aria-label="Suivant"><ArrowRight className="h-5 w-5" /></button>
      </div>
    </div>
  );
}

function FlashQuizGameDay8({ onAward }: { onAward: (n?: number) => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const total = day8FlashQuiz.length;
  const cur = day8FlashQuiz[i];

  if (done)
    return <ResultCard title="Flashcards terminées !" score={`${score} / ${total}`} message="Étoile débloquée." />;

  const choose = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const ok = idx === cur.answer;
    playTone(ok ? "ok" : "no");
    if (ok) setScore((s) => s + 1);
    setTimeout(() => {
      setPicked(null);
      if (i + 1 < total) setI(i + 1);
      else { setDone(true); onAward(1); }
    }, 1000);
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between text-xs font-semibold text-navy/70">
        <span>🃏 Flashcard {i + 1} / {total}</span>
        <span className="inline-flex items-center gap-1 text-navy">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {score}
        </span>
      </div>
      <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl bg-gradient-blue p-8 text-white">
        <span className="text-6xl">{cur.emoji}</span>
        <p className="font-display text-lg font-bold">{cur.concept}</p>
        <p className="text-xs text-white/70">Choisis la bonne forme.</p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {cur.options.map((o, idx) => {
          const isPicked = picked === idx;
          const isRight = picked !== null && idx === cur.answer;
          const isWrong = isPicked && idx !== cur.answer;
          return (
            <button
              key={idx}
              onClick={() => choose(idx)}
              disabled={picked !== null}
              className={`rounded-xl border-2 bg-white p-3 text-center text-sm font-semibold text-navy transition ${
                isRight ? "border-success bg-success/10" : isWrong ? "border-red bg-red/10" : "border-border hover:border-blue"
              }`}
            >
              {o}
              {isRight && <Check className="ml-1 inline h-4 w-4 text-success" />}
              {isWrong && <X className="ml-1 inline h-4 w-4 text-red" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ClesLessonDay8({ onAward }: { onAward: (n?: number) => void }) {
  return (
    <div className="space-y-6">
      <VideoBlock src={day8Videos.grammar} title="🗝️ Les clés de la Liberté — Jour 8 · Devoir + infinitif" />

      <div className="rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-ice to-white p-5 shadow-card">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-gold text-gold" />
          <p className="text-xs font-bold tracking-widest text-navy uppercase">Les clés du Jour 8</p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {day8GrammarStructures.map((s, i) => (
            <div key={i} className="rounded-xl border border-blue/20 bg-white p-4">
              <p className="font-display text-sm font-extrabold text-blue">{s.formula}</p>
              <p className="mt-1 text-xs text-navy/80">{s.use}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-red/30 bg-red/5 p-3 text-xs text-navy/80">
          <span className="font-bold text-red">⚠️ Attention :</span> « devoir » siempre va seguido de infinitivo — nunca de un sustantivo directamente. « Je dois du pain » ❌ → « Je dois acheter du pain » ✓.
        </div>
      </div>

      <Tabs defaultValue="read" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 sm:grid-cols-4">
          <TabsTrigger value="read" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><BookOpen className="h-4 w-4" /> Lecture</TabsTrigger>
          <TabsTrigger value="listen" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Volume2 className="h-4 w-4" /> Écoute</TabsTrigger>
          <TabsTrigger value="speak" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Mic className="h-4 w-4" /> Parler</TabsTrigger>
          <TabsTrigger value="write" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Pencil className="h-4 w-4" /> Écriture</TabsTrigger>
        </TabsList>
        <TabsContent value="read" className="mt-4"><ReadingComprehension texts={[day8ClesReadingText]} onAward={onAward} /></TabsContent>
        <TabsContent value="listen" className="mt-4"><ListeningMCGame items={day8ClesListeningMC} onAward={onAward} /></TabsContent>
        <TabsContent value="speak" className="mt-4"><SpeakingGame items={day8ClesSpeakingItems} dayId={8} section="cles" onAward={onAward} /></TabsContent>
        <TabsContent value="write" className="mt-4"><WritingGame items={day8ClesWritingItems} dayId={8} section="cles" onAward={onAward} /></TabsContent>
      </Tabs>
    </div>
  );
}

const DAY8_CRITERIA = [
  "Saluda al empleado con « Bonjour » y muestra cortesía.",
  "Usa « Je dois acheter… » al menos 2 veces con partitivos correctos.",
  "Menciona al menos 6 productos de secciones diferentes (laitiers, boulangerie, boucherie, hygiène, boissons…).",
  "Usa correctamente los partitivos: du / de la / des / de l'.",
  "Incluye al menos un producto de higiene y una bebida.",
  "Usa « nous devons » o « vous devez » al menos una vez.",
  "Agradece con « Merci » y se despide con « Bonne journée ».",
  "Usa al menos 10 palabras del vocabulario del Día 8.",
];

function DefiLessonDay8({ onAward, onDone }: { onAward: (n?: number) => void; onDone: () => void }) {
  return (
    <StagedDefi
      dayId={8}
      title="Faire les courses"
      subtitle="Haz la compra semanal completa usando devoir + infinitivo y partitivos correctos con productos de varias secciones."
      eyebrow="Défi final · Reto entregable"
      avatar="🛒"
      steps={day8DefiSteps}
      criteria={DAY8_CRITERIA}
      onAward={onAward}
      onDone={onDone}
    />
  );
}

/* ==================== DAY 9 · Le métro & les transports ==================== */

function IntroDay9() {
  return (
    <div className="space-y-5">
      <LiberteSpeak message="Jour 9 ! El metro de París es uno de los más usados del mundo. Hoy vas a dominarlo : billete, línea, andén y las preposiciones en / à / par. Respira. Je suis avec toi." />
      <VideoBlock src={day9Videos.intro} title="🎬 Intro · Jour 9 · Le métro de Paris" />
    </div>
  );
}

function VocabLessonDay9({ onAward }: { onAward: (n?: number) => void }) {
  return (
    <div className="space-y-6">
      <LiberteSpeak message="30 palabras para moverte en el metro : líneas, direcciones, billetes, andenes y horarios." />

      <VideoBlock src={day9Videos.vocab} title="📚 Vocabulaire — Jour 9" />

      <FlashGridDay9 />

      <FlashQuizGameDay9 onAward={onAward} />

      <div className="rounded-2xl border-2 border-dashed border-blue/30 bg-ice p-5">
        <p className="font-display text-lg font-extrabold text-navy">🎯 Pratique — 4 mini-jeux</p>
        <p className="text-sm text-muted-foreground">Lecture, écoute, parler, écriture. Une étoile par jeu.</p>
      </div>

      <Tabs defaultValue="read" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 sm:grid-cols-4">
          <TabsTrigger value="read" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><BookOpen className="h-4 w-4" /> Lecture</TabsTrigger>
          <TabsTrigger value="listen" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Volume2 className="h-4 w-4" /> Écoute</TabsTrigger>
          <TabsTrigger value="speak" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Mic className="h-4 w-4" /> Parler</TabsTrigger>
          <TabsTrigger value="write" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Pencil className="h-4 w-4" /> Écriture</TabsTrigger>
        </TabsList>
        <TabsContent value="read" className="mt-4"><ReadingComprehension texts={day9VocabReadingTexts} onAward={onAward} /></TabsContent>
        <TabsContent value="listen" className="mt-4"><ListeningMCGame items={day9VocabListeningMC} onAward={onAward} /></TabsContent>
        <TabsContent value="speak" className="mt-4"><SpeakingGame items={day9VocabSpeakingItems} dayId={9} section="vocab" onAward={onAward} /></TabsContent>
        <TabsContent value="write" className="mt-4"><WritingGame items={day9VocabWritingItems} dayId={9} section="vocab" onAward={onAward} /></TabsContent>
      </Tabs>
    </div>
  );
}

function FlashGridDay9() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const total = day9Vocabulary.length;
  const v = day9Vocabulary[index];
  const go = (delta: number) => { setFlipped(false); setIndex((i) => (i + delta + total) % total); };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-navy/70">
        <span>Carte {index + 1} / {total}</span>
        <button onClick={() => { setFlipped(false); setIndex(0); }} className="text-blue hover:underline">Recommencer</button>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button onClick={() => go(-1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sky/40 bg-white text-navy shadow-soft hover:bg-ice" aria-label="Précédent"><ArrowLeft className="h-5 w-5" /></button>
        <button onClick={() => setFlipped((f) => !f)} className="relative h-56 flex-1 perspective-[1000px]" aria-label={`Carte ${v.fr}`}>
          <div className={`absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-card p-6 shadow-card [backface-visibility:hidden]">
              <span className="text-5xl">{v.emoji}</span>
              <p className="text-center font-display text-2xl font-extrabold text-navy sm:text-3xl">{v.fr}</p>
              <p className="text-sm text-muted-foreground">{v.es}</p>
              <button onClick={(e) => { e.stopPropagation(); speakFr(v.fr); }} className="inline-flex items-center gap-2 rounded-full bg-blue/10 px-4 py-2 text-sm font-semibold text-blue hover:bg-blue/20"><Volume2 className="h-4 w-4" /> Écouter</button>
              <p className="text-[11px] text-muted-foreground">Touche la carte pour la retourner</p>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-gradient-blue p-6 text-white shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <p className="text-center font-display text-lg font-bold italic sm:text-2xl">"{v.example}"</p>
              <button onClick={(e) => { e.stopPropagation(); speakFr(v.example); }} className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30"><Volume2 className="h-4 w-4" /> Écouter</button>
            </div>
          </div>
        </button>
        <button onClick={() => go(1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sky/40 bg-white text-navy shadow-soft hover:bg-ice" aria-label="Suivant"><ArrowRight className="h-5 w-5" /></button>
      </div>
    </div>
  );
}

function FlashQuizGameDay9({ onAward }: { onAward: (n?: number) => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const total = day9FlashQuiz.length;
  const cur = day9FlashQuiz[i];

  if (done)
    return <ResultCard title="Flashcards terminées !" score={`${score} / ${total}`} message="Étoile débloquée." />;

  const choose = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const ok = idx === cur.answer;
    playTone(ok ? "ok" : "no");
    if (ok) setScore((s) => s + 1);
    setTimeout(() => {
      setPicked(null);
      if (i + 1 < total) setI(i + 1);
      else { setDone(true); onAward(1); }
    }, 1000);
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between text-xs font-semibold text-navy/70">
        <span>🃏 Flashcard {i + 1} / {total}</span>
        <span className="inline-flex items-center gap-1 text-navy">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {score}
        </span>
      </div>
      <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl bg-gradient-blue p-8 text-white">
        <span className="text-6xl">{cur.emoji}</span>
        <p className="font-display text-lg font-bold">{cur.concept}</p>
        <p className="text-xs text-white/70">Choisis la bonne réponse.</p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {cur.options.map((o, idx) => {
          const isPicked = picked === idx;
          const isRight = picked !== null && idx === cur.answer;
          const isWrong = isPicked && idx !== cur.answer;
          return (
            <button
              key={idx}
              onClick={() => choose(idx)}
              disabled={picked !== null}
              className={`rounded-xl border-2 bg-white p-3 text-center text-sm font-semibold text-navy transition ${
                isRight ? "border-success bg-success/10" : isWrong ? "border-red bg-red/10" : "border-border hover:border-blue"
              }`}
            >
              {o}
              {isRight && <Check className="ml-1 inline h-4 w-4 text-success" />}
              {isWrong && <X className="ml-1 inline h-4 w-4 text-red" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ClesLessonDay9({ onAward }: { onAward: (n?: number) => void }) {
  return (
    <div className="space-y-6">
      <VideoBlock src={day9Videos.grammar} title="🗝️ Les clés de la Liberté — Jour 9 · Prépositions de transport" />

      <div className="rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-ice to-white p-5 shadow-card">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-gold text-gold" />
          <p className="text-xs font-bold tracking-widest text-navy uppercase">Les clés du Jour 9</p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {day9GrammarStructures.map((s, i) => (
            <div key={i} className="rounded-xl border border-blue/20 bg-white p-4">
              <p className="font-display text-sm font-extrabold text-blue">{s.formula}</p>
              <p className="mt-1 text-xs text-navy/80">{s.use}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-red/30 bg-red/5 p-3 text-xs text-navy/80">
          <span className="font-bold text-red">⚠️ Attention :</span> « en pied » ❌ · « en vélo » ❌ → siempre « à pied » ✓ · « à vélo » ✓.
        </div>
      </div>

      <Tabs defaultValue="read" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 sm:grid-cols-4">
          <TabsTrigger value="read" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><BookOpen className="h-4 w-4" /> Lecture</TabsTrigger>
          <TabsTrigger value="listen" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Volume2 className="h-4 w-4" /> Écoute</TabsTrigger>
          <TabsTrigger value="speak" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Mic className="h-4 w-4" /> Parler</TabsTrigger>
          <TabsTrigger value="write" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Pencil className="h-4 w-4" /> Écriture</TabsTrigger>
        </TabsList>
        <TabsContent value="read" className="mt-4"><ReadingComprehension texts={[day9ClesReadingText]} onAward={onAward} /></TabsContent>
        <TabsContent value="listen" className="mt-4"><ListeningMCGame items={day9ClesListeningMC} onAward={onAward} /></TabsContent>
        <TabsContent value="speak" className="mt-4"><SpeakingGame items={day9ClesSpeakingItems} dayId={9} section="cles" onAward={onAward} /></TabsContent>
        <TabsContent value="write" className="mt-4"><WritingGame items={day9ClesWritingItems} dayId={9} section="cles" onAward={onAward} /></TabsContent>
      </Tabs>
    </div>
  );
}

const DAY9_CRITERIA = [
  "Saluda al taquillero con « Bonjour » y muestra cortesía.",
  "Pide correctamente un billete usando « aller simple » o « aller-retour ».",
  "Usa las preposiciones en / à / par correctamente al menos 2 veces.",
  "Pregunta por la línea y la dirección para llegar a un destino.",
  "Menciona al menos una correspondencia o un transbordo.",
  "Confirma si el trayecto es « direct » o requiere correspondencia.",
  "Menciona la validación del ticket (« valider »).",
  "Agradece con « Merci » y se despide con « Bonne journée ».",
];

function DefiLessonDay9({ onAward, onDone }: { onAward: (n?: number) => void; onDone: () => void }) {
  return (
    <StagedDefi
      dayId={9}
      title="Au guichet du métro"
      subtitle="Compra un billete y pregunta por la línea y la dirección para llegar a tu destino, usando en / à / par correctamente."
      eyebrow="Défi final · Reto entregable"
      avatar="🚇"
      steps={day9DefiSteps}
      criteria={DAY9_CRITERIA}
      onAward={onAward}
      onDone={onDone}
    />
  );
}

function IntroDay10() {
  return (
    <div className="space-y-5">
      <LiberteSpeak message="Jour 10 ! Hoy vas a tomar tu primer taxi en francés y a pedir indicaciones en la calle. Después de esto, nada te da miedo. On y va !" />
      <VideoBlock src={day10Videos.intro} title="🎬 Intro · Jour 10 · Taxi & ville à pied" />
    </div>
  );
}

function VocabLessonDay10({ onAward }: { onAward: (n?: number) => void }) {
  return (
    <div className="space-y-6">
      <LiberteSpeak message="30 palabras para moverte en taxi y a pie por la ciudad : trayecto, tarifa, indicaciones y verbos de movimiento." />

      <VideoBlock src={day10Videos.vocab} title="📚 Vocabulaire — Jour 10" />

      <FlashGridDay10 />

      <FlashQuizGameDay10 onAward={onAward} />

      <div className="rounded-2xl border-2 border-dashed border-blue/30 bg-ice p-5">
        <p className="font-display text-lg font-extrabold text-navy">🎯 Pratique — 4 mini-jeux</p>
        <p className="text-sm text-muted-foreground">Lecture, écoute, parler, écriture. Une étoile par jeu.</p>
      </div>

      <Tabs defaultValue="read" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 sm:grid-cols-4">
          <TabsTrigger value="read" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><BookOpen className="h-4 w-4" /> Lecture</TabsTrigger>
          <TabsTrigger value="listen" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Volume2 className="h-4 w-4" /> Écoute</TabsTrigger>
          <TabsTrigger value="speak" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Mic className="h-4 w-4" /> Parler</TabsTrigger>
          <TabsTrigger value="write" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Pencil className="h-4 w-4" /> Écriture</TabsTrigger>
        </TabsList>
        <TabsContent value="read" className="mt-4"><ReadingComprehension texts={day10VocabReadingTexts} onAward={onAward} /></TabsContent>
        <TabsContent value="listen" className="mt-4"><ListeningMCGame items={day10VocabListeningMC} onAward={onAward} /></TabsContent>
        <TabsContent value="speak" className="mt-4"><SpeakingGame items={day10VocabSpeakingItems} dayId={10} section="vocab" onAward={onAward} /></TabsContent>
        <TabsContent value="write" className="mt-4"><WritingGame items={day10VocabWritingItems} dayId={10} section="vocab" onAward={onAward} /></TabsContent>
      </Tabs>
    </div>
  );
}

function FlashGridDay10() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const total = day10Vocabulary.length;
  const v = day10Vocabulary[index];
  const go = (delta: number) => { setFlipped(false); setIndex((i) => (i + delta + total) % total); };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-navy/70">
        <span>Carte {index + 1} / {total}</span>
        <button onClick={() => { setFlipped(false); setIndex(0); }} className="text-blue hover:underline">Recommencer</button>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button onClick={() => go(-1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sky/40 bg-white text-navy shadow-soft hover:bg-ice" aria-label="Précédent"><ArrowLeft className="h-5 w-5" /></button>
        <button onClick={() => setFlipped((f) => !f)} className="relative h-56 flex-1 perspective-[1000px]" aria-label={`Carte ${v.fr}`}>
          <div className={`absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-card p-6 shadow-card [backface-visibility:hidden]">
              <span className="text-5xl">{v.emoji}</span>
              <p className="text-center font-display text-2xl font-extrabold text-navy sm:text-3xl">{v.fr}</p>
              <p className="text-sm text-muted-foreground">{v.es}</p>
              <button onClick={(e) => { e.stopPropagation(); speakFr(v.fr); }} className="inline-flex items-center gap-2 rounded-full bg-blue/10 px-4 py-2 text-sm font-semibold text-blue hover:bg-blue/20"><Volume2 className="h-4 w-4" /> Écouter</button>
              <p className="text-[11px] text-muted-foreground">Touche la carte pour la retourner</p>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-gradient-blue p-6 text-white shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <p className="text-center font-display text-lg font-bold italic sm:text-2xl">"{v.example}"</p>
              <button onClick={(e) => { e.stopPropagation(); speakFr(v.example); }} className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30"><Volume2 className="h-4 w-4" /> Écouter</button>
            </div>
          </div>
        </button>
        <button onClick={() => go(1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sky/40 bg-white text-navy shadow-soft hover:bg-ice" aria-label="Suivant"><ArrowRight className="h-5 w-5" /></button>
      </div>
    </div>
  );
}

function FlashQuizGameDay10({ onAward }: { onAward: (n?: number) => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const total = day10FlashQuiz.length;
  const cur = day10FlashQuiz[i];

  if (done)
    return <ResultCard title="Flashcards terminées !" score={`${score} / ${total}`} message="Étoile débloquée." />;

  const choose = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const ok = idx === cur.answer;
    playTone(ok ? "ok" : "no");
    if (ok) setScore((s) => s + 1);
    setTimeout(() => {
      setPicked(null);
      if (i + 1 < total) setI(i + 1);
      else { setDone(true); onAward(1); }
    }, 1000);
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between text-xs font-semibold text-navy/70">
        <span>🃏 Flashcard {i + 1} / {total}</span>
        <span className="inline-flex items-center gap-1 text-navy">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {score}
        </span>
      </div>
      <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl bg-gradient-blue p-8 text-white">
        <span className="text-6xl">{cur.emoji}</span>
        <p className="font-display text-lg font-bold">{cur.concept}</p>
        <p className="text-xs text-white/70">Choisis la bonne réponse.</p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {cur.options.map((o, idx) => {
          const isPicked = picked === idx;
          const isRight = picked !== null && idx === cur.answer;
          const isWrong = isPicked && idx !== cur.answer;
          return (
            <button
              key={idx}
              onClick={() => choose(idx)}
              disabled={picked !== null}
              className={`rounded-xl border-2 bg-white p-3 text-center text-sm font-semibold text-navy transition ${
                isRight ? "border-success bg-success/10" : isWrong ? "border-red bg-red/10" : "border-border hover:border-blue"
              }`}
            >
              {o}
              {isRight && <Check className="ml-1 inline h-4 w-4 text-success" />}
              {isWrong && <X className="ml-1 inline h-4 w-4 text-red" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ClesLessonDay10({ onAward }: { onAward: (n?: number) => void }) {
  return (
    <div className="space-y-6">
      <VideoBlock src={day10Videos.grammar} title="🗝️ Les clés de la Liberté — Jour 10 · Prendre + transport & questions" />

      <div className="rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-ice to-white p-5 shadow-card">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-gold text-gold" />
          <p className="text-xs font-bold tracking-widest text-navy uppercase">Les clés du Jour 10</p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {day10GrammarStructures.map((s, i) => (
            <div key={i} className="rounded-xl border border-blue/20 bg-white p-4">
              <p className="font-display text-sm font-extrabold text-blue">{s.formula}</p>
              <p className="mt-1 text-xs text-navy/80">{s.use}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-red/30 bg-red/5 p-3 text-xs text-navy/80">
          <span className="font-bold text-red">⚠️ Attention :</span> « je prends en bus » ❌ → « je prends le bus » ✓.
        </div>
      </div>

      <Tabs defaultValue="read" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1 sm:grid-cols-4">
          <TabsTrigger value="read" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><BookOpen className="h-4 w-4" /> Lecture</TabsTrigger>
          <TabsTrigger value="listen" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Volume2 className="h-4 w-4" /> Écoute</TabsTrigger>
          <TabsTrigger value="speak" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Mic className="h-4 w-4" /> Parler</TabsTrigger>
          <TabsTrigger value="write" className="flex flex-col gap-1 py-2 text-xs sm:flex-row sm:text-sm"><Pencil className="h-4 w-4" /> Écriture</TabsTrigger>
        </TabsList>
        <TabsContent value="read" className="mt-4"><ReadingComprehension texts={[day10ClesReadingText]} onAward={onAward} /></TabsContent>
        <TabsContent value="listen" className="mt-4"><ListeningMCGame items={day10ClesListeningMC} onAward={onAward} /></TabsContent>
        <TabsContent value="speak" className="mt-4"><SpeakingGame items={day10ClesSpeakingItems} dayId={10} section="cles" onAward={onAward} /></TabsContent>
        <TabsContent value="write" className="mt-4"><WritingGame items={day10ClesWritingItems} dayId={10} section="cles" onAward={onAward} /></TabsContent>
      </Tabs>
    </div>
  );
}

const DAY10_CRITERIA = [
  "Saluda al chofer con « Bonjour » y muestra cortesía.",
  "Da tu destino usando « Je voudrais aller à… ».",
  "Usa « prendre + le/la/l' + transport » correctamente al menos una vez.",
  "Pregunta por la duración del trayecto (« la durée » o « combien de temps »).",
  "Pregunta por la tarifa (« tarif », « prix » o « c'est combien »).",
  "Pide detenerte con « Arrêtez-vous ici » o descender con « Je descends ici ».",
  "Menciona una segunda opción de transporte (à pied, métro, bus…).",
  "Agradece con « Merci » y se despide con « Bonne journée ».",
];

function DefiLessonDay10({ onAward, onDone }: { onAward: (n?: number) => void; onDone: () => void }) {
  return (
    <StagedDefi
      dayId={10}
      title="En taxi à Paris"
      subtitle="Toma un taxi : da la dirección, pregunta la duración y el precio, y explica un trayecto con 2 medios de transporte."
      eyebrow="Défi final · Reto entregable · ¡Fin de Semana 2!"
      avatar="🚕"
      steps={day10DefiSteps}
      criteria={DAY10_CRITERIA}
      onAward={onAward}
      onDone={onDone}
    />
  );
}
