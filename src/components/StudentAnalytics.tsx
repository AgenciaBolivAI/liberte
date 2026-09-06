import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Clock, Download, Loader2, Pencil, Star, TrendingUp } from "lucide-react";
import { getStudentAnalytics, overrideScore, type WeekAnalytics } from "@/lib/coach.functions";
import { generateWeeklyPdf, type WeeklyReportData } from "@/lib/weekPdf";
import { toast } from "sonner";

/**
 * Coach view: how a student is doing, EVERY week, without leaving the dashboard.
 * Previously a coach could only download a per-week PDF (and only week 2 had
 * one). The PDF export stays as a share/offline option — the dashboard is now
 * the primary surface.
 */

// Validated chart palette (matches AdminAnalytics).
const BLUE = "#2382C6";
const GOLD = "#B98A28";
const GREEN = "#2E8560";
const RED = "#C44536";

type Analytics = Awaited<ReturnType<typeof getStudentAnalytics>>;

const MONTH_NAME: Record<number, string> = {
  1: "J'OSE", 2: "JE COMPRENDS", 3: "JE M'EXPRIME", 4: "JE PARLE", 5: "JE VOYAGE", 6: "JE SUIS LIBRE",
};

const STATUS: Record<WeekAnalytics["status"], { label: string; cls: string }> = {
  pending: { label: "Sin empezar", cls: "bg-navy/5 text-navy/50" },
  in_progress: { label: "En curso", cls: "bg-blue/10 text-blue" },
  evaluated: { label: "Evaluada", cls: "bg-gold/15 text-gold-deep" },
  complete: { label: "Completa", cls: "bg-success/15 text-success" },
};

function scoreColor(n: number | null): string {
  if (n === null) return "var(--muted-foreground, #6b7280)";
  if (n >= 8.5) return GREEN;
  if (n >= 6) return GOLD;
  return RED;
}

/** "1h 25m" / "12 min" / "—" — coach-friendly time-on-task. */
function fmtTime(secs: number): string {
  if (!secs || secs < 60) return secs > 0 ? "<1 min" : "—";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

/** Small inline bar — avoids pulling a chart lib into the coach bundle. */
function Bar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy/10">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export function StudentAnalytics({ userId, weeks = 8 }: { userId: string; weeks?: number }) {
  const [data, setData] = useState<Analytics | null>(null);
  const [err, setErr] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const lastUserRef = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    // New student → spinner. Same student (override refresh) → keep the grid on-screen.
    if (lastUserRef.current !== userId) {
      setData(null);
      lastUserRef.current = userId;
    }
    setErr("");
    getStudentAnalytics({ data: { userId, weeks } })
      .then((d) => { if (alive) setData(d as Analytics); })
      .catch((e) => { if (alive) setErr(e instanceof Error ? e.message : "No se pudieron cargar las analíticas"); });
    return () => { alive = false; };
  }, [userId, weeks, reloadKey]);

  /** ✏️ Manual correction of a weekly grade (client #15: the AI grades too
   *  strict — the teacher has the final word). */
  async function editWeeklyScore(w: WeekAnalytics) {
    const raw = window.prompt(
      `Nueva nota de la Semana ${w.week} (0-10). La nota actual es ${w.weeklyScore?.toFixed(1) ?? "—"}.`,
      w.weeklyScore?.toFixed(1) ?? "",
    );
    if (raw === null) return;
    const score = Number(raw.replace(",", "."));
    if (!Number.isFinite(score) || score < 0 || score > 10) {
      toast.error("La nota debe estar entre 0 y 10");
      return;
    }
    try {
      await overrideScore({ data: { userId, kind: "weekly", targetId: w.week, score } });
      toast.success(`Nota de la Semana ${w.week} actualizada a ${score.toFixed(1)}/10`);
      setReloadKey((n) => n + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar la nota");
    }
  }

  if (err) {
    return <p className="rounded-2xl border border-red/30 bg-red/5 p-4 text-sm text-red">{err}</p>;
  }
  if (!data) {
    return (
      <div className="grid place-items-center rounded-3xl border border-border bg-white p-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue" />
      </div>
    );
  }

  const { totals, weeks: rows, profile } = data;
  const stalled = totals.daysSinceLastSeen !== null && totals.daysSinceLastSeen >= 7;
  const evaluated = rows.filter((w) => w.weeklyScore !== null);
  const avgWeekly = evaluated.length
    ? evaluated.reduce((s, w) => s + (w.weeklyScore ?? 0), 0) / evaluated.length
    : null;

  /** Optional export: the dashboard is the primary surface, but a coach can still
   *  hand a student (or a parent) a printable summary of any evaluated week. */
  function exportWeek(w: WeekAnalytics) {
    try {
      const s = w.testScores ?? {};
      // Week 2 stores a different shape (quiz/vocab/writing/roleplay as raw
      // points, not CO/CE/PE/PO out of 10). Map it instead of printing 0.0s.
      const isWeek2Shape = s.quiz !== undefined || s.vocab !== undefined;
      const pct = (v: number, max: number) => (max > 0 ? Math.round((v / max) * 100) / 10 : 0);
      const pick = (k: string) => {
        if (isWeek2Shape) {
          if (k === "CO") return pct(Number(s.quiz ?? 0), 40);
          if (k === "CE") return pct(Number(s.vocab ?? 0), 20);
          if (k === "PE") return pct(Number(s.writing ?? 0), 30);
          if (k === "PO") return pct(Number(s.roleplay ?? 0), 10);
        }
        return Number(s[k] ?? s[k.toLowerCase()] ?? 0);
      };
      const score = w.weeklyScore ?? 0;
      // The REAL evaluation written when the student took the weekly test.
      // This export used to ignore it and invent a summary from aggregates,
      // which made the PDF less accurate than the in-platform AI report.
      const ai = w.report;
      const aggregateSummary =
        `Semana ${w.week}: ${w.daysDone}/${w.daysTotal} días completados` +
        (w.defiAvg !== null ? `, media de los desafíos ${w.defiAvg.toFixed(1)}/10` : "") +
        (w.accuracy !== null ? `, ${w.accuracy}% de aciertos` : "") + ".";
      const report: WeeklyReportData = {
        studentName: profile?.full_name || profile?.email || "Alumno/a",
        weekNumber: w.week,
        monthLabel: `Mois ${w.month}: ${MONTH_NAME[w.month] ?? ""}`.trim(),
        daysCompleted: w.daysDone,
        daysTotal: w.daysTotal,
        weeklyScore: score,
        compScores: { CO: pick("CO"), CE: pick("CE"), PE: pick("PE"), PO: pick("PO") },
        strengths: ai?.strengths.length
          ? ai.strengths
          : w.accuracy !== null && w.accuracy >= 70
            ? [{ title: "Precisión en los ejercicios", example: `${w.accuracy}% de aciertos esta semana` }]
            : [],
        commonErrors: ai?.commonErrors ?? [],
        improvements: ai?.improvements.length ? ai.improvements : w.weakPoints,
        pronunciation: ai?.pronunciation ?? [],
        coachSummary: ai?.coachSummary
          ? `${ai.coachSummary}\n\n${aggregateSummary}`
          : aggregateSummary,
        verdict:
          ai?.verdictTitle
            ? { title: ai.verdictTitle, message: ai.verdictMessage }
            : score >= 8.5 ? { title: "EXCELLENCE", message: "Nivel muy sólido. ¡Seguimos!" }
            : score >= 6 ? { title: "TRÈS BIEN", message: "Buen avance; refuerza los puntos señalados." }
            : { title: "COURAGE", message: "Repasa los días de la semana y vuelve a intentarlo." },
      };
      generateWeeklyPdf(report).save(
        `liberte-semana-${w.week}-${(profile?.full_name || "alumno").replace(/\s+/g, "-").toLowerCase()}.pdf`,
      );
    } catch {
      toast.error("No se pudo generar el PDF de esta semana");
    }
  }

  return (
    <div className="space-y-4">
      {/* Headline numbers */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Días completados", value: `${totals.daysDone}`, icon: <TrendingUp className="h-4 w-4" style={{ color: BLUE }} /> },
          { label: "Estrellas", value: `${totals.stars}`, icon: <Star className="h-4 w-4" style={{ color: GOLD }} /> },
          { label: "Tests semanales", value: `${totals.weeklyTestsTaken}`, icon: null },
          { label: "Media semanal", value: avgWeekly === null ? "—" : `${avgWeekly.toFixed(1)}/10`, icon: null },
          { label: "Tiempo en la plataforma", value: fmtTime(totals.secondsSpent), icon: <Clock className="h-4 w-4" style={{ color: BLUE }} /> },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-white p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {c.icon} {c.label}
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold text-navy">{c.value}</p>
          </div>
        ))}
      </div>

      {stalled && (
        <p className="flex items-center gap-2 rounded-2xl border border-gold/40 bg-gold/10 p-3 text-sm text-navy">
          <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: GOLD }} />
          Sin actividad desde hace {totals.daysSinceLastSeen} días. Puede necesitar seguimiento.
        </p>
      )}

      {/* Per-week grid — the "evaluate every week" view */}
      <div className="overflow-x-auto rounded-3xl border border-border bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="p-3">Semana</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Días</th>
              <th className="p-3">Défis</th>
              <th className="p-3">Test semanal</th>
              <th className="p-3">Precisión</th>
              <th className="p-3">Tiempo</th>
              <th className="p-3">⭐</th>
              <th className="p-3">A reforzar</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.week} className="border-b border-border/60 last:border-0 align-top">
                <td className="p-3">
                  <span className="font-bold text-navy">S{w.week}</span>
                  <p className="text-[10px] text-muted-foreground">{MONTH_NAME[w.month] ?? `Mes ${w.month}`}</p>
                </td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS[w.status].cls}`}>
                    {STATUS[w.status].label}
                  </span>
                </td>
                <td className="p-3 w-28">
                  <span className="text-xs font-semibold text-navy">{w.daysDone}/{w.daysTotal}</span>
                  <Bar value={w.daysDone} max={w.daysTotal} color={BLUE} />
                </td>
                <td className="p-3 font-semibold" style={{ color: scoreColor(w.defiAvg) }}>
                  {w.defiAvg === null ? "—" : `${w.defiAvg.toFixed(1)}/10`}
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1">
                    <span className="font-extrabold" style={{ color: scoreColor(w.weeklyScore) }}>
                      {w.weeklyScore === null ? "—" : `${w.weeklyScore.toFixed(1)}/10`}
                    </span>
                    {w.weeklyScore !== null && (
                      <button
                        onClick={() => void editWeeklyScore(w)}
                        title="Corregir la nota manualmente"
                        className="rounded-full p-1 text-navy/50 transition hover:bg-navy/10 hover:text-navy"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </span>
                  {w.testScores && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {Object.entries(w.testScores).map(([k, v]) => `${k.toUpperCase()} ${v}`).join(" · ")}
                    </p>
                  )}
                </td>
                <td className="p-3 w-24">
                  {w.accuracy === null ? <span className="text-muted-foreground">—</span> : (
                    <>
                      <span className="text-xs font-semibold text-navy">{w.accuracy}%</span>
                      <Bar value={w.accuracy} color={w.accuracy >= 70 ? GREEN : w.accuracy >= 50 ? GOLD : RED} />
                    </>
                  )}
                </td>
                <td className="p-3 text-xs font-semibold text-navy">{fmtTime(w.secondsSpent)}</td>
                <td className="p-3 font-semibold text-navy">{w.stars || "—"}</td>
                <td className="p-3 max-w-[220px]">
                  {w.weakPoints.length ? (
                    <ul className="space-y-0.5 text-[11px] text-muted-foreground">
                      {w.weakPoints.map((p, i) => <li key={i}>• {p}</li>)}
                    </ul>
                  ) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="p-3">
                  {w.weeklyScore !== null && (
                    <button
                      onClick={() => exportWeek(w)}
                      title="Descargar PDF de esta semana"
                      className="rounded-full p-2 text-blue transition hover:bg-blue/10"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Los datos se actualizan en cuanto el alumno completa un día, un défi o el test semanal.
      </p>
    </div>
  );
}
