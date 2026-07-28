import { useEffect, useState } from "react";
import { Download, FileText, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { getStudentAnalytics } from "@/lib/coach.functions";
import { generateWeeklyPdf, type WeeklyReportData } from "@/lib/weekPdf";
import { toast } from "sonner";

/**
 * The teacher's copy of every weekly report — the thing the client could not
 * find ("me llegó el mensajito de que terminó el desafío, pero no sé dónde
 * verlo"). The panel used to list the week and the score as plain text with no
 * way to open or download anything; this shows the full report inline and
 * downloads the exact same PDF the student gets.
 */

const MONTH_NAME: Record<number, string> = {
  1: "J'OSE", 2: "JE COMPRENDS", 3: "JE CRÉE", 4: "JE PARLE", 5: "JE VOYAGE", 6: "JE SUIS LIBRE",
};

type Analytics = Awaited<ReturnType<typeof getStudentAnalytics>>;
type Week = Analytics["weeks"][number];

export function StudentWeeklyReports({ userId }: { userId: string }) {
  const [data, setData] = useState<Analytics | null>(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    setErr("");
    getStudentAnalytics({ data: { userId, weeks: 24 } })
      .then((d) => { if (alive) setData(d as Analytics); })
      .catch((e) => { if (alive) setErr(e instanceof Error ? e.message : "No se pudieron cargar los informes"); });
    return () => { alive = false; };
  }, [userId]);

  function buildPdfData(w: Week): WeeklyReportData {
    const s = w.testScores ?? {};
    // Week 2 stores raw points (quiz/40, vocab/20…), not CO/CE/PE/PO out of 10.
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
    const r = w.report;
    return {
      studentName: data?.profile?.full_name || data?.profile?.email || "Alumno/a",
      weekNumber: w.week,
      monthLabel: `Mois ${w.month}: ${MONTH_NAME[w.month] ?? ""}`.trim(),
      daysCompleted: w.daysDone,
      daysTotal: w.daysTotal,
      weeklyScore: score,
      compScores: { CO: pick("CO"), CE: pick("CE"), PE: pick("PE"), PO: pick("PO") },
      strengths: r?.strengths ?? [],
      commonErrors: r?.commonErrors ?? [],
      improvements: r?.improvements.length ? r.improvements : w.weakPoints,
      pronunciation: r?.pronunciation ?? [],
      coachSummary: r?.coachSummary || `Semana ${w.week}: ${w.daysDone}/${w.daysTotal} días completados.`,
      verdict: r?.verdictTitle
        ? { title: r.verdictTitle, message: r.verdictMessage }
        : score >= 8.5 ? { title: "EXCELLENCE", message: "Nivel muy sólido." }
        : score >= 6 ? { title: "TRÈS BIEN", message: "Buen avance." }
        : { title: "COURAGE", message: "Conviene repasar la semana." },
    };
  }

  function download(w: Week) {
    try {
      const name = (data?.profile?.full_name || "alumno").replace(/\s+/g, "-").toLowerCase();
      generateWeeklyPdf(buildPdfData(w)).save(`liberte-informe-semana${w.week}-${name}.pdf`);
    } catch {
      toast.error("No se pudo generar el PDF");
    }
  }

  const evaluated = (data?.weeks ?? []).filter((w) => w.weeklyScore !== null);

  return (
    <div className="rounded-3xl border border-blue/30 bg-blue/5 p-4 sm:p-5">
      <p className="flex items-center gap-2 font-display text-lg font-extrabold text-navy">
        <FileText className="h-5 w-5 text-blue" /> 📄 Informes semanales (PDF)
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        El informe de cada semana evaluada: ábrelo aquí o descarga el mismo PDF que recibe el alumno.
      </p>

      {err && <p className="mt-3 rounded-xl border border-red/30 bg-red/5 p-3 text-sm text-red">{err}</p>}
      {!data && !err && <Loader2 className="mt-3 h-5 w-5 animate-spin text-blue" />}

      {data && evaluated.length === 0 && (
        <p className="mt-3 rounded-xl bg-white px-3 py-2.5 text-sm text-navy">
          Este alumno todavía no ha completado ningún desafío semanal.
        </p>
      )}

      {data && evaluated.length > 0 && (
        <div className="mt-3 space-y-2">
          {evaluated.map((w) => {
            const isOpen = open === w.week;
            const r = w.report;
            return (
              <div key={w.week} className="rounded-2xl border border-border bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <button
                    onClick={() => setOpen(isOpen ? null : w.week)}
                    className="flex min-w-0 items-center gap-2 text-left"
                  >
                    {isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-navy/50" /> : <ChevronRight className="h-4 w-4 shrink-0 text-navy/50" />}
                    <span className="font-bold text-navy">Semana {w.week}</span>
                    <span className="truncate text-xs text-muted-foreground">{MONTH_NAME[w.month] ?? ""}</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-gradient-blue px-3 py-1 text-sm font-extrabold text-white">
                      {(w.weeklyScore ?? 0).toFixed(1)}/10
                    </span>
                    <button
                      onClick={() => download(w)}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue px-2.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                    >
                      <Download className="h-3.5 w-3.5" /> PDF
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="space-y-2 border-t border-border p-3 text-sm">
                    {r?.verdictTitle && (
                      <p className="font-display font-extrabold text-navy">{r.verdictTitle}</p>
                    )}
                    {r?.coachSummary && <p className="text-navy/85">{r.coachSummary}</p>}
                    {!!r?.strengths.length && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-success">Puntos fuertes</p>
                        <ul className="mt-0.5 list-disc pl-4 text-xs text-navy/90">
                          {r.strengths.map((x, i) => <li key={i}>{x.title}{x.example ? ` — « ${x.example} »` : ""}</li>)}
                        </ul>
                      </div>
                    )}
                    {!!r?.commonErrors.length && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-red">Errores comunes</p>
                        <ul className="mt-0.5 space-y-0.5 text-xs text-navy/90">
                          {r.commonErrors.map((e, i) => (
                            <li key={i}>« {e.said} » → <b>« {e.corrected} »</b>{e.rule ? ` · ${e.rule}` : ""}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {!!r?.pronunciation.length && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-blue">Pronunciación</p>
                        <ul className="mt-0.5 list-disc pl-4 text-xs text-navy/90">
                          {r.pronunciation.map((p, i) => (
                            <li key={i}>{p.word}{p.heard ? ` — sonó « ${p.heard} »` : ""}{p.target ? `, debe sonar « ${p.target} »` : ""}{p.tip ? ` · ${p.tip}` : ""}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {!!(r?.improvements.length || w.weakPoints.length) && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-navy/70">A reforzar</p>
                        <ul className="mt-0.5 list-disc pl-4 text-xs text-navy/90">
                          {(r?.improvements.length ? r.improvements : w.weakPoints).map((x, i) => <li key={i}>{x}</li>)}
                        </ul>
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      Días {w.daysDone}/{w.daysTotal}
                      {w.accuracy !== null ? ` · ${w.accuracy}% de aciertos` : ""}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
