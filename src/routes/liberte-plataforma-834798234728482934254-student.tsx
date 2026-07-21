import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Palmtree, Check, Sparkles, ArrowRight, Star } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { getWeeks } from "@/data/program";
import { useAdminPreview } from "@/lib/admin-preview";
import { AdminPreviewBanner } from "@/components/AdminPreviewBanner";
import { AuthPage } from "@/components/AuthPage";
import eiffelBg from "@/assets/paris-eiffel-bg.jpg";
import mois1 from "@/assets/mois1-jose.png.asset.json";
import mois2 from "@/assets/mois2-jevis.png.asset.json";
import mois3 from "@/assets/mois3-jecree.png.asset.json";
import mois4 from "@/assets/mois4-jeparle.png.asset.json";
import mois5 from "@/assets/mois5-jevoyage.png.asset.json";
import mois6 from "@/assets/mois6-jesuislibre.png.asset.json";
import bonVoyageBanner from "@/assets/bon-voyage-hero.png.asset.json";
import bonVoyageMobileBanner from "@/assets/bon-voyage-mobile-banner.png.asset.json";
import mascot from "@/assets/liberte-mascot.png.asset.json";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { weekOverride } from "@/lib/content-access";
import type { AccessOverride } from "@/lib/unlock";
import { useDayCompletions, useStars, TOTAL_WEEKS, DAYS_PER_WEEK, TOTAL_DAYS } from "@/lib/progress";
import { UpcomingClassPopup } from "@/components/UpcomingClassPopup";

const MONTH_COVERS = [mois1.url, mois2.url, mois3.url, mois4.url, mois5.url, mois6.url];

export const Route = createFileRoute("/liberte-plataforma-834798234728482934254-student")({
  head: () => ({
    meta: [
      { title: "Liberté — Instituto de Francés" },
      { name: "description", content: "Tu programa de 6 meses para hablar francés. Aprende día a día con Liberté." },
      { property: "og:title", content: "Liberté — Instituto de Francés" },
      { property: "og:description", content: "Aprende francés en 6 meses, día a día." },
    ],
  }),
  component: Home,
});

function Home() {
  const { loading, user, fullName } = useAuth();
  // "view as student": render the whole dashboard as the chosen student.
  const { bypassLocks, viewAsUserId, viewAsName } = useAdminPreview();
  const [overrides, setOverrides] = useState<number[]>([]);
  const [lockedWeeks, setLockedWeeks] = useState<number[]>([]);
  // Teacher-authored days (published): week → first authored day, so weeks 3+
  // become reachable as soon as the teacher publishes content for them.
  const [authoredStart, setAuthoredStart] = useState<Record<number, string>>({});
  useEffect(() => {
    let alive = true;
    supabase
      .from("authored_days")
      .select("day_id")
      .eq("status", "published")
      .then(({ data, error }) => {
        if (!alive || error) return;
        const byWeek: Record<number, string> = {};
        for (const r of data ?? []) {
          const d = Number(r.day_id);
          const w = Math.ceil(d / 5);
          if (!byWeek[w] || d < Number(byWeek[w])) byWeek[w] = String(d);
        }
        setAuthoredStart(byWeek);
      });
    return () => {
      alive = false;
    };
  }, []);
  const { stars: totalStars } = useStars(viewAsUserId);
  const {
    days: completedDayIds,
    weeksCompleted,
    percent: daysPercent,
    enrolledAt: viewedEnrolledAt,
  } = useDayCompletions(viewAsUserId);
  const dataUserId = viewAsUserId ?? user?.id ?? null;

  useEffect(() => {
    if (!dataUserId) return;
    let alive = true;
    Promise.all([
      supabase.from("week_unlocks").select("week_number").eq("user_id", dataUserId),
      supabase
        .from("content_access")
        .select("scope, target_type, target_id, access")
        .or(`scope.eq.global,user_id.eq.${dataUserId}`),
    ]).then(([wu, ca]) => {
      if (!alive) return; // a newer viewed-student switch already superseded this
      const fromDb = (wu.data ?? []).map((r) => r.week_number);
      // Admin day/week enable-disable overrides (empty pre-migration).
      const rows = (ca.error ? [] : (ca.data ?? [])) as AccessOverride[];
      const opened: number[] = [];
      const locked: number[] = [];
      for (let w = 1; w <= TOTAL_WEEKS; w++) {
        const a = weekOverride(w, rows);
        if (a === "open") opened.push(w);
        if (a === "locked") locked.push(w);
      }
      // Teacher mode unlocks all 24 weeks for content review. Students get
      // only what the coach granted in week_unlocks plus the time-based
      // schedule and any admin "open" override — minus admin "locked" weeks.
      const extras = bypassLocks
        ? Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1)
        : [1, 2];
      const open = new Set([...fromDb, ...extras, ...opened]);
      if (!bypassLocks) locked.forEach((w) => open.delete(w));
      setOverrides(Array.from(open));
      setLockedWeeks(bypassLocks ? [] : locked);
    });
    return () => {
      alive = false;
    };
  }, [dataUserId, bypassLocks]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "linear-gradient(135deg, #EDF8FC 0%, #F5F0E8 100%)" }}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#4FB2EA] border-t-transparent" />
      </div>
    );
  }
  if (!user) return <AuthPage />;

  const enrolledAt = viewedEnrolledAt ?? user.created_at;
  // Consider a week "completed" if it appears in weeksCompleted counter (first N weeks in order).
  const completedWeekNumbers = Array.from({ length: weeksCompleted }, (_, i) => i + 1);
  const base = getWeeks(enrolledAt, overrides, completedWeekNumbers);
  const { vacations, monthThemes } = base;
  // Force admin-locked weeks closed even if the calendar/time schedule opened
  // them, and make sure exactly one non-locked week stays "current".
  const lockedSet = new Set(lockedWeeks);
  let weeks = base.weeks;
  if (lockedSet.size) {
    weeks = weeks.map((w) =>
      lockedSet.has(w.globalIndex) ? { ...w, status: "locked-time" as const, isCurrent: false } : w,
    );
    if (!weeks.some((w) => w.isCurrent)) {
      const resume = weeks.find((w) => w.status === "active") ?? weeks.find((w) => w.status === "completed");
      if (resume) resume.isCurrent = true;
    }
  }
  const studentName =
    (viewAsName && viewAsName.split(" ")[0]) ||
    (fullName && fullName.split(" ")[0]) ||
    (user?.email ? user.email.split("@")[0] : "Marie");
  const currentWeek = weeks.find((w) => w.isCurrent) ?? weeks[0];
  // Real progress: fraction of the 120-day journey completed. Ensure at least 1%
  // once the student is on the active first week so the bar reflects real motion.
  const progressPct = Math.max(daysPercent, currentWeek ? Math.round((1 / (TOTAL_WEEKS * DAYS_PER_WEEK)) * 100) : 0);

  return (
    <div
      className="relative min-h-screen bg-cover bg-center md:bg-fixed"
      style={{
        backgroundImage: `linear-gradient(180deg, oklch(0.42 0.075 265 / 0.55) 0%, oklch(0.32 0.08 265 / 0.78) 60%, oklch(0.28 0.08 265 / 0.92) 100%), url(${eiffelBg})`,
      }}
    >
      <TopNav stars={totalStars} />
      <UpcomingClassPopup />


      <main className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
        <AdminPreviewBanner />
        {/* Greeting with mascot */}
        <div className="mb-6 flex items-center gap-4 text-white sm:mb-8 sm:gap-8">
          <img
            src={mascot.url}
            alt="Liberté mascot"
            className="h-28 w-28 shrink-0 animate-hero-fly object-contain drop-shadow-[0_10px_30px_rgba(79,178,234,0.35)] sm:h-44 sm:w-44 lg:h-56 lg:w-56"
          />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-widest text-sky uppercase sm:text-xs">
              Bienvenue au monde du français
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight sm:text-6xl">
              Bonjour, {studentName}
            </h1>
            <p className="mt-2 text-sm text-white/85 sm:text-base">
              Semaine {currentWeek.globalIndex} de ton voyage — Mois {currentWeek.monthIndex} · {currentWeek.monthName}
            </p>
          </div>
        </div>


        {/* Banner Bon voyage */}
        <div className="mb-6 overflow-hidden rounded-3xl border border-white/20 shadow-card sm:mb-8">
          <img
            src={bonVoyageMobileBanner.url}
            alt="Bon voyage — Liberté"
            className="block w-full object-cover sm:hidden"
          />
          <img
            src={bonVoyageBanner.url}
            alt="Bon voyage — Liberté"
            className="hidden w-full object-cover sm:block"
          />
        </div>

        {/* Progress bar */}
        <div className="mb-12 rounded-3xl border border-white/25 bg-white/10 p-5 text-white shadow-card backdrop-blur-2xl sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] tracking-widest text-sky uppercase">Progrès global</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <p className="font-display text-3xl font-extrabold leading-none sm:text-4xl">
                  {weeksCompleted}<span className="text-lg text-sky sm:text-2xl">/24</span>
                  <span className="ml-2 text-sm font-semibold text-white/70">semaines</span>
                </p>
                <p className="font-display text-2xl font-extrabold leading-none sm:text-3xl">
                  {completedDayIds.length}<span className="text-base text-sky sm:text-xl">/{TOTAL_DAYS}</span>
                  <span className="ml-2 text-sm font-semibold text-white/70">jours</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold">
                <Star className="h-4 w-4 fill-gold text-gold" /> {totalStars}
              </span>
              <Link
                to="/day/$dayId"
                params={{ dayId: "1" }}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-navy shadow-card transition hover:translate-y-[-1px] hover:bg-ice sm:px-5 sm:text-sm"
              >
                Entrer dans le Jour 1 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-gradient-to-r from-sky to-blue transition-all" style={{ width: `${Math.max(progressPct, 4)}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-white/70">
            <span>{progressPct}% du voyage</span>
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-sky" /> Semaine en cours · {currentWeek.monthName}
            </span>
          </div>
        </div>

        {/* 6 months */}
        <div className="space-y-10">
          {monthThemes.map((m, idx) => {
            const monthWeeks = weeks.filter((w) => w.monthIndex === idx + 1);
            const cover = MONTH_COVERS[idx];
            const hasCurrent = monthWeeks.some((w) => w.isCurrent);
            return (
              <section key={m.name}>
                <div className="mb-3 flex items-baseline gap-3 text-white">
                  <span className="font-display text-xs font-semibold tracking-widest text-sky uppercase">
                    Mois {idx + 1}
                  </span>
                  <h3 className="font-display text-xl font-extrabold sm:text-2xl">{m.name}</h3>
                  <span className="text-sm text-white/60">— {m.subtitle}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                  {monthWeeks.map((w) => (
                    <WeekCard
                      key={w.globalIndex}
                      w={w}
                      monthName={m.name}
                      cover={cover}
                      authoredStart={authoredStart[w.globalIndex]}
                    />
                  ))}
                </div>
                {idx < 5 && <RestWeekBar rest={vacations[idx]} nextMonth={idx + 2} />}
                {hasCurrent && <div className="sr-only">Semana actual</div>}
              </section>
            );
          })}
        </div>
      </main>

      <style>{`
        @keyframes hero-fly {
          0%,100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(-4deg); }
          50% { transform: translateY(-4px) rotate(2deg); }
          75% { transform: translateY(-12px) rotate(-2deg); }
        }
        .animate-hero-fly { animation: hero-fly 3.6s ease-in-out infinite; transform-origin: 60% 70%; }
        @keyframes hero-glow { 0%,100% { opacity: .55 } 50% { opacity: .9 } }
        .animate-hero-glow { animation: hero-glow 3.6s ease-in-out infinite; }
        @keyframes rest-glow {
          0%,100% { box-shadow: 0 0 0 0 oklch(0.85 0.14 90 / 0.5); }
          50%     { box-shadow: 0 0 0 10px oklch(0.85 0.14 90 / 0); }
        }
        .animate-rest-glow { animation: rest-glow 2.4s ease-in-out infinite; }
        @keyframes week-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 oklch(0.72 0.16 240 / 0.65), 0 10px 30px -10px oklch(0.55 0.20 240 / 0.55); }
          50%      { transform: scale(1.025); box-shadow: 0 0 0 14px oklch(0.72 0.16 240 / 0), 0 14px 40px -8px oklch(0.55 0.20 240 / 0.85); }
        }
        .animate-week-pulse { animation: week-pulse 2s ease-in-out infinite; }
        .week-glow-bg::before {
          content: "";
          position: absolute;
          inset: -18px;
          border-radius: 28px;
          background: radial-gradient(closest-side, oklch(0.72 0.18 240 / 0.55), transparent 70%);
          filter: blur(14px);
          z-index: -1;
          animation: week-glow-fade 2s ease-in-out infinite;
        }
        @keyframes week-glow-fade {
          0%, 100% { opacity: .55; }
          50%      { opacity: .95; }
        }
      `}</style>

    </div>
  );
}

// Weeks that actually have lesson content today. Anything beyond this is
// shown as "próximamente" instead of silently dumping the student on Day 1.
const WEEK_START_DAY: Record<number, string> = {
  1: "1",
  2: "6",
};
const LAST_WEEK_WITH_CONTENT = 2;

function WeekCard({
  w,
  monthName,
  cover,
  authoredStart,
}: {
  w: ReturnType<typeof getWeeks>["weeks"][number];
  monthName: string;
  cover: string;
  /** First published teacher-authored day of this week, if any. */
  authoredStart?: string;
}) {
  const isCompleted = w.status === "completed";
  const isCurrent = w.isCurrent;
  const isActive = w.status === "active" && !isCurrent;
  const isLocked = w.status === "locked-time";
  const startDay = WEEK_START_DAY[w.globalIndex] ?? authoredStart ?? "1";
  const hasContent = w.globalIndex <= LAST_WEEK_WITH_CONTENT || Boolean(authoredStart);

  const base =
    "group relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-2xl p-4 transition";

  // Unlocked by the calendar but not built yet — say so instead of sending the
  // student to Day 1 with no explanation.
  if (!hasContent && !isLocked) {
    return (
      <div
        className={`${base} border border-white/20 text-white/80`}
        style={{
          backgroundImage: `linear-gradient(180deg, oklch(0.28 0.06 250 / 0.80) 0%, oklch(0.20 0.06 250 / 0.88) 100%), url(${cover})`,
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
        }}
      >
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
            Semaine {w.weekIndexInMonth}
          </span>
          <Sparkles className="h-4 w-4 opacity-70" />
        </div>
        <div>
          <p className="font-display text-lg font-extrabold drop-shadow">{monthName}</p>
          <p className="text-[11px] text-white/75">Próximamente</p>
        </div>
      </div>
    );
  }

  // Current week — original photo, pulsing button with blue glow behind it
  if (isCurrent) {
    return (
      <div className="relative isolate week-glow-bg">
        <Link
          to="/day/$dayId"
          params={{ dayId: startDay }}
          className={`${base} animate-week-pulse relative border-2 border-sky/80 text-white shadow-card`}
          style={{
            backgroundImage: `url(${cover})`,
            backgroundSize: "cover",
            backgroundPosition: "center 30%",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-blue px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase shadow-soft">
              En cours
            </span>
            <Sparkles className="h-4 w-4 text-sky drop-shadow-[0_0_6px_rgba(155,203,239,0.9)]" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-white/90 drop-shadow">Semaine {w.weekIndexInMonth}</p>
            <p className="font-display text-lg font-extrabold drop-shadow">{monthName}</p>
          </div>
        </Link>
      </div>
    );
  }


  // Other unlocked but not current (either already completed or accessible).
  // An available week must look just as ENABLED as the current one — same bright
  // photo, no dimming tint. The current week is set apart only by its glow,
  // pulse and "En cours" badge, not by greying every other available week.
  if (isActive || isCompleted) {
    return (
      <Link
        to="/day/$dayId"
        params={{ dayId: startDay }}
        className={`${base} border border-sky/40 text-white shadow-card hover:translate-y-[-2px]`}
        style={{
          backgroundImage: `url(${cover})`,
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
        }}
      >
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase shadow-soft backdrop-blur-sm">
            Semaine {w.weekIndexInMonth}
          </span>
          {isCompleted ? (
            <Check className="h-4 w-4 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]" />
          ) : (
            <ArrowRight className="h-4 w-4 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]" />
          )}
        </div>
        <p className="font-display text-lg font-extrabold drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">{monthName}</p>
      </Link>
    );
  }

  // Locked — light blue tint only, colors of the photo still visible
  return (
    <div
      className={`${base} border border-white/15 text-white`}
        style={{
          backgroundImage: `linear-gradient(180deg, oklch(0.45 0.12 250 / 0.30) 0%, oklch(0.35 0.12 250 / 0.40) 100%), url(${cover})`,
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
        }}
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
          Semaine {w.weekIndexInMonth}
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
          <Lock className="h-3.5 w-3.5" />
        </span>
      </div>
      <div>
        <p className="font-display text-base font-bold opacity-90">{monthName}</p>
        {isLocked && (
          <p className="mt-1 text-[10px] font-semibold text-sky/90">
            {w.daysUntilUnlock > 0
              ? w.daysUntilUnlock === 1
                ? "Disponible dans 1 jour"
                : `Disponible dans ${w.daysUntilUnlock} jours`
              : "Bloqueado por tu profesor"}
          </p>
        )}
      </div>
    </div>
  );
}

function RestWeekBar({ rest, nextMonth }: { rest: { active: boolean; daysUntilUnlock: number }; nextMonth: number }) {
  return (
    <div
      className={`mt-4 rounded-2xl border px-4 py-3 text-white/85 backdrop-blur ${
        rest.active
          ? "animate-rest-glow border-gold/60 bg-gradient-to-r from-gold/25 via-gold/15 to-transparent"
          : "border-dashed border-white/25 bg-white/5"
      }`}
    >
      <div className="flex items-center gap-3">
        <Palmtree className={`h-5 w-5 ${rest.active ? "text-gold" : "text-sky"}`} />
        <div className="flex-1">
          <p className="text-xs font-semibold sm:text-sm">
            {rest.active
              ? `Semaine de repos — profite bien avant le Mois ${nextMonth} !`
              : `Semaine de repos avant le Mois ${nextMonth}`}
          </p>
          {!rest.active && (
            <p className="text-[10px] text-sky/90">
              {rest.daysUntilUnlock === 0
                ? "Bientôt disponible"
                : rest.daysUntilUnlock === 1
                ? "Disponible dans 1 jour"
                : `Disponible dans ${rest.daysUntilUnlock} jours`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
