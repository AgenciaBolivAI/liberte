import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopNav } from "@/components/TopNav";
import parisBg from "@/assets/paris-map-bg.jpg";
import { Star, Flame, Trophy, Calendar, FileText, Download } from "lucide-react";
import { useStars, useDayCompletions, TOTAL_DAYS, TOTAL_WEEKS } from "@/lib/progress";
import { useAdminPreview } from "@/lib/admin-preview";
import { AdminPreviewBanner } from "@/components/AdminPreviewBanner";
import { useAuth } from "@/lib/auth-context";
import { getMyWeeklyEvaluations } from "@/lib/week.functions";
import { generateWeeklyPdf, type WeeklyReportData } from "@/lib/weekPdf";
import { toast } from "sonner";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Mon progrès — Liberté" }] }),
  component: ProgressPage,
});

function ProgressPage() {
  // "view as student": show the chosen student's progress (read-only).
  const { viewAsUserId } = useAdminPreview();
  const { stars } = useStars(viewAsUserId);
  const { days, weeksCompleted, percent, streak } = useDayCompletions(viewAsUserId);

  const stats = [
    {
      icon: Star,
      label: "Étoiles",
      value: String(stars),
      sub: stars === 0 ? "Commence à compléter des leçons" : "Continue comme ça !",
    },
    {
      icon: Flame,
      label: "Série",
      value: `${streak} jour${streak === 1 ? "" : "s"}`,
      sub: streak === 0 ? "Commence aujourd’hui !" : "Jours consécutifs",
    },
    {
      icon: Calendar,
      label: "Jours complétés",
      value: `${days.length} / ${TOTAL_DAYS}`,
      sub: `Mois ${Math.min(6, Math.floor(days.length / 20) + 1)} · en cours`,
    },
    {
      icon: Trophy,
      label: "Semaines terminées",
      value: `${weeksCompleted} / ${TOTAL_WEEKS}`,
      sub: weeksCompleted === 0 ? "En route" : "Bravo !",
    },
  ];

  const rewards: Array<[string, string]> = [
    ["Compléter le Défi d’un jour", "+2 ⭐"],
    ["Marquer le jour comme terminé", "+2 ⭐ bonus"],
    ["Compléter une semaine entière (5 jours)", "= 20 ⭐ cumulées"],
    ["Compléter le défi de la semaine (final)", "+3 ⭐"],
    ["À la fin du mois, le classement mensuel est généré avec les étoiles", "🏆"],
  ];

  return (
    <div
      className="relative min-h-screen bg-cover bg-center md:bg-fixed"
      style={{
        backgroundImage: `linear-gradient(180deg, oklch(0.42 0.075 265 / 0.78) 0%, oklch(0.32 0.08 265 / 0.90) 100%), url(${parisBg})`,
      }}
    >
      <TopNav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <AdminPreviewBanner />
        <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl">⭐ Mon progrès</h1>
        <p className="mt-1 text-sm text-white/80 sm:text-base">Regarde tout le chemin parcouru.</p>

        {/* Real progress bar */}
        <div className="mt-6 rounded-3xl border border-white/25 bg-white/10 p-5 text-white shadow-card backdrop-blur-2xl sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[10px] tracking-widest text-sky uppercase">Progrès global</p>
            <p className="font-display text-lg font-extrabold">{percent}%</p>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-gradient-to-r from-sky to-blue transition-all" style={{ width: `${Math.max(percent, 2)}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-white/70">
            {days.length} sur {TOTAL_DAYS} jours complétés dans ton voyage de 6 mois
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-3xl border border-white/15 bg-card p-4 shadow-soft sm:p-5">
              <s.icon className="h-6 w-6 text-blue" />
              <p className="mt-3 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase sm:text-xs">{s.label}</p>
              <p className="font-display text-2xl font-extrabold text-navy sm:text-3xl">{s.value}</p>
              <p className="text-[11px] text-muted-foreground sm:text-xs">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* #5 / #12: every past weekly report, always findable + downloadable */}
        {!viewAsUserId && <MyReports />}

        <div className="mt-6 rounded-3xl border border-white/15 bg-card p-5 shadow-soft sm:mt-8 sm:p-6">
          <h2 className="font-display text-lg font-extrabold text-navy sm:text-xl">Comment gagner des étoiles</h2>
          <p className="mt-1 text-xs text-muted-foreground">Elles sont attribuées automatiquement au fil de ta progression.</p>
          <div className="mt-4 grid gap-2">
            {rewards.map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-3 rounded-xl bg-ice px-3 py-2.5 sm:px-4">
                <span className="text-sm text-navy">{k}</span>
                <span className="shrink-0 font-display font-bold text-blue">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------- Mes rapports (client #5/#12: weekly reports were only visible on
 * the one-time result screen; now every evaluated week is listed here with its
 * grade and a PDF download) ---------- */

type EvalRow = {
  week_number: number;
  weekly_score: number | null;
  test_score: number | null;
  test_scores: Record<string, unknown> | null;
  ai_report: Record<string, unknown> | null;
  created_at: string | null;
};

const MONTH_THEMES = ["J'OSE 🗼", "JE COMPRENDS 📞", "JE CRÉE ✍️", "JE PARLE 🗣️", "JE VOYAGE ✈️", "JE SUIS LIBRE 🕊️"];
function monthLabelForWeek(weekNumber: number): string {
  const m = Math.max(1, Math.ceil(weekNumber / 4));
  return `Mois ${m} : ${MONTH_THEMES[m - 1] ?? ""}`.trim();
}

function MyReports() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<EvalRow[] | null>(null);

  useEffect(() => {
    let alive = true;
    getMyWeeklyEvaluations()
      .then((data) => { if (alive) setRows((data ?? []) as EvalRow[]); })
      .catch(() => { if (alive) setRows([]); });
    return () => { alive = false; };
  }, []);

  function downloadPdf(row: EvalRow) {
    try {
      const r = (row.ai_report ?? {}) as {
        verdict_title?: string; verdict_message?: string;
        strengths?: { title: string; example: string }[];
        common_errors?: { said: string; corrected: string; rule: string }[];
        improvements?: string[];
        pronunciation?: { word: string; heard: string; target: string; tip: string }[];
        coach_summary?: string;
        competence_scores?: { CO?: number; CE?: number; PE?: number; PO?: number };
      };
      const s = (row.test_scores ?? {}) as Record<string, number>;
      // Week-2 rows store raw points (quiz/40, vocab/20…) instead of CO/CE/PE/PO.
      const isWeek2Shape = s.quiz !== undefined || s.vocab !== undefined;
      const comp = r.competence_scores ?? {};
      const pct = (v: number, max: number) => (max > 0 ? Math.round((v / max) * 100) / 10 : 0);
      const pick = (k: "CO" | "CE" | "PE" | "PO") => {
        if (comp[k] !== undefined) return Number(comp[k]);
        if (isWeek2Shape) {
          if (k === "CO") return pct(Number(s.quiz ?? 0), 40);
          if (k === "CE") return pct(Number(s.vocab ?? 0), 20);
          if (k === "PE") return pct(Number(s.writing ?? 0), 30);
          if (k === "PO") return pct(Number(s.roleplay ?? 0), 10);
        }
        return Number(s[k] ?? s[k.toLowerCase()] ?? 0);
      };
      const score = Number(row.weekly_score ?? 0);
      const report: WeeklyReportData = {
        studentName: profile?.full_name || profile?.email || "Élève",
        weekNumber: row.week_number,
        monthLabel: monthLabelForWeek(row.week_number),
        daysCompleted: 5,
        daysTotal: 5,
        weeklyScore: score,
        compScores: { CO: pick("CO"), CE: pick("CE"), PE: pick("PE"), PO: pick("PO") },
        strengths: Array.isArray(r.strengths) ? r.strengths : [],
        commonErrors: Array.isArray(r.common_errors) ? r.common_errors : [],
        improvements: Array.isArray(r.improvements) ? r.improvements : [],
        pronunciation: Array.isArray(r.pronunciation) ? r.pronunciation : [],
        coachSummary: String(r.coach_summary ?? ""),
        verdict: {
          title: r.verdict_title || (score >= 8.5 ? "EXCELLENCE" : score >= 6 ? "TRÈS BIEN" : "COURAGE"),
          message: String(r.verdict_message ?? ""),
        },
      };
      generateWeeklyPdf(report).save(`Liberte_Rapport_Semaine${row.week_number}.pdf`);
    } catch {
      toast.error("Impossible de générer le PDF de cette semaine");
    }
  }

  return (
    <div className="mt-6 rounded-3xl border border-white/15 bg-card p-5 shadow-soft sm:mt-8 sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-navy sm:text-xl">
        <FileText className="h-5 w-5 text-blue" /> 📄 Mes rapports hebdomadaires
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Chaque semaine évaluée génère un rapport avec ta note — consulte-le ou télécharge le PDF ici.
      </p>
      {rows === null ? (
        <p className="mt-4 text-sm text-muted-foreground">Chargement…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 rounded-xl bg-ice px-4 py-3 text-sm text-navy">
          Aucun rapport pour l'instant. Termine le défi d'une semaine pour recevoir ton premier rapport. 💪
        </p>
      ) : (
        <div className="mt-4 grid gap-2">
          {rows.map((row) => {
            const score = Number(row.weekly_score ?? 0);
            const date = row.created_at
              ? new Date(row.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
              : "";
            return (
              <div key={row.week_number} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ice px-3 py-2.5 sm:px-4">
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-navy">Semaine {row.week_number} · {monthLabelForWeek(row.week_number)}</p>
                  <p className="text-[11px] text-muted-foreground">{date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 font-display text-sm font-extrabold ${score >= 6 ? "bg-blue/10 text-blue" : "bg-gold/15 text-navy"}`}>
                    {score.toFixed(1)}/10
                  </span>
                  {row.week_number === 2 ? (
                    <Link
                      to="/defi-semaine2"
                      className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-navy transition hover:bg-white/70"
                    >
                      Voir
                    </Link>
                  ) : (
                    <Link
                      to="/semaine/$weekId"
                      params={{ weekId: String(row.week_number) }}
                      className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-navy transition hover:bg-white/70"
                    >
                      Voir
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => downloadPdf(row)}
                    className="flex items-center gap-1 rounded-lg bg-blue px-2.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                  >
                    <Download className="h-3.5 w-3.5" /> PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
