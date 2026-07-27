import { useState, type ReactNode } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { getStudentAIReport, getMyAIReport, type StudentReport, type StudentReportStats } from "@/lib/report.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { aiText, aiTextList } from "@/lib/ai-text";

/** The AI report is visible to BOTH roles (client request 2026-07-26):
 *  - teacher card (Spanish, no cooldown) in the admin/coach panels;
 *  - student card «Mon rapport IA» (French chrome, 24h cooldown, no
 *    mensaje_sugerido — that section is the teacher's draft message and is
 *    stripped server-side) on /progress.
 *  Both render the SAME stored report through the shared body below. */

type ReportLabels = {
  title: string;
  generate: string;
  refresh: string;
  loading: string;
  noData: string;
  errorToast: string;
  stats: { days: string; avg: string; stars: string; tutorMsgs: string; corrections: string; weeks: string };
  sections: {
    resumen: string; nivel: string; fortalezas: string; dificultades: string;
    errores: string; pronunciacion: string; tutor: string; ritmo: string; recomendaciones: string;
    mensaje?: string; // absent = never render the suggested-message section
  };
};

const TEACHER_LABELS: ReportLabels = {
  title: "🧠 Informe IA del alumno",
  generate: "Generar",
  refresh: "Actualizar",
  loading: "Analizando todo el rendimiento del alumno…",
  noData: "Este alumno aún no tiene actividad suficiente para un informe.",
  errorToast: "No se pudo generar el informe",
  stats: { days: "Días", avg: "Nota media", stars: "Estrellas", tutorMsgs: "Msgs tutor", corrections: "Correcc. IA", weeks: "Sem. eval." },
  sections: {
    resumen: "Resumen", nivel: "Nivel", fortalezas: "Fortalezas", dificultades: "Dificultades",
    errores: "Errores frecuentes", pronunciacion: "Pronunciación", tutor: "Tutor de IA",
    ritmo: "Ritmo", recomendaciones: "Recomendaciones", mensaje: "Mensaje sugerido para el alumno",
  },
};

const STUDENT_LABELS: ReportLabels = {
  title: "🧠 Mon rapport IA",
  generate: "Générer mon rapport",
  refresh: "Actualiser",
  loading: "Analyse de toute ta progression…",
  noData: "Pas encore assez d'activité pour un rapport. Continue tes leçons ! 💪",
  errorToast: "Impossible de générer le rapport",
  stats: { days: "Jours", avg: "Note moyenne", stars: "Étoiles", tutorMsgs: "Msgs tuteur", corrections: "Correct. IA", weeks: "Sem. évaluées" },
  sections: {
    resumen: "Résumé", nivel: "Niveau", fortalezas: "Points forts", dificultades: "Difficultés",
    errores: "Erreurs fréquentes", pronunciacion: "Prononciation", tutor: "Tuteur IA",
    ritmo: "Rythme", recomendaciones: "Recommandations",
  },
};

type ReportData = { stats: StudentReportStats; report: StudentReport; hasData: boolean };

function ReportBody({ data, labels }: { data: ReportData; labels: ReportLabels }) {
  const r = data.report;
  const L = labels;
  return (
    <div className="mt-3 space-y-3 text-navy">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <Stat label={L.stats.days} value={data.stats.daysCompleted} />
        <Stat label={L.stats.avg} value={`${data.stats.avgDefiScore}/10`} />
        <Stat label={L.stats.stars} value={data.stats.totalStars} />
        <Stat label={L.stats.tutorMsgs} value={data.stats.tutorMessages} />
        <Stat label={L.stats.corrections} value={data.stats.tutorCorrections} />
        <Stat label={L.stats.weeks} value={data.stats.weeksEvaluated} />
      </div>

      {!data.hasData ? (
        <p className="text-xs text-muted-foreground">{L.noData}</p>
      ) : (
        <>
          {r.resumen && (
            <Section title={L.sections.resumen}>
              <p className="text-sm">{aiText(r.resumen)}</p>
            </Section>
          )}
          {r.nivel && (
            <Section title={L.sections.nivel}>
              <p className="text-sm">{aiText(r.nivel)}</p>
            </Section>
          )}
          <ListSection title={L.sections.fortalezas} items={r.fortalezas} />
          <ListSection title={L.sections.dificultades} items={r.dificultades} />
          {r.errores_frecuentes.length > 0 && (
            <Section title={L.sections.errores}>
              <ul className="space-y-1">
                {r.errores_frecuentes.map((e, i) => (
                  <li key={i} className="text-xs">
                    {aiText(e.tipo) && <b>{aiText(e.tipo)}: </b>}
                    «{aiText(e.ejemplo)}»
                    {aiText(e.correccion) && <> → «{aiText(e.correccion)}»</>}
                  </li>
                ))}
              </ul>
            </Section>
          )}
          <ListSection title={L.sections.pronunciacion} items={r.pronunciacion} />
          {r.tutor_ia && (
            <Section title={L.sections.tutor}>
              <p className="text-sm">{aiText(r.tutor_ia)}</p>
            </Section>
          )}
          {r.ritmo && (
            <Section title={L.sections.ritmo}>
              <p className="text-sm">{aiText(r.ritmo)}</p>
            </Section>
          )}
          <ListSection title={L.sections.recomendaciones} items={r.recomendaciones} />
          {L.sections.mensaje && r.mensaje_sugerido && (
            <Section title={L.sections.mensaje}>
              <p className="text-sm italic text-navy/80">“{aiText(r.mensaje_sugerido)}”</p>
            </Section>
          )}
        </>
      )}
    </div>
  );
}

/** Teacher-facing card (admin + coach panels). Spanish, regenerates freely. */
export function StudentReportCard({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);
  const L = TEACHER_LABELS;

  async function generate() {
    setLoading(true);
    try {
      const res = await getStudentAIReport({ data: { userId } });
      setData(res as ReportData);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : L.errorToast);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-navy">{L.title}</p>
        <Button onClick={() => void generate()} disabled={loading} size="sm" className="bg-gradient-blue text-white">
          {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
          {data ? L.refresh : L.generate}
        </Button>
      </div>
      {loading && !data && <p className="mt-3 text-xs text-muted-foreground">{L.loading}</p>}
      {data && <ReportBody data={data} labels={L} />}
    </div>
  );
}

/** Student-facing card on /progress. French chrome; the narrative itself is in
 *  Spanish like every AI feedback on the platform. Click-to-generate (no AI
 *  call on page mount); the server serves the stored report inside the 24h
 *  cooldown, so re-clicking is free. */
export function MyAIReportCard() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<(ReportData & { generatedAt: string | null; nextRefreshAt: string | null }) | null>(null);
  const L = STUDENT_LABELS;

  async function generate() {
    setLoading(true);
    try {
      const res = await getMyAIReport();
      setData(res as ReportData & { generatedAt: string | null; nextRefreshAt: string | null });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : L.errorToast);
    } finally {
      setLoading(false);
    }
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="mt-6 rounded-3xl border border-white/15 bg-card p-5 shadow-soft sm:mt-8 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-extrabold text-navy sm:text-xl">{L.title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Ton analyse complète : niveau, points forts, erreurs fréquentes et conseils — la même que voit ton professeur.
          </p>
        </div>
        <Button onClick={() => void generate()} disabled={loading} size="sm" className="bg-gradient-blue text-white">
          {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
          {data ? L.refresh : L.generate}
        </Button>
      </div>
      {loading && !data && <p className="mt-3 text-xs text-muted-foreground">{L.loading}</p>}
      {data?.generatedAt && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Rapport du {fmt(data.generatedAt)}
          {data.nextRefreshAt && new Date(data.nextRefreshAt) > new Date()
            ? ` · prochaine actualisation possible le ${fmt(data.nextRefreshAt)}`
            : ""}
        </p>
      )}
      {data && <ReportBody data={data} labels={L} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-ice p-2 text-center">
      <p className="font-display text-lg font-extrabold text-navy">{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-blue">{title}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  // Last line of defence: a cached/legacy payload can still carry objects, and
  // rendering one printed "[object Object]" (or crashes React outright).
  const lines = aiTextList(items, 20);
  if (!lines.length) return null;
  return (
    <Section title={title}>
      <ul className="list-disc pl-4 text-xs">
        {lines.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </Section>
  );
}
