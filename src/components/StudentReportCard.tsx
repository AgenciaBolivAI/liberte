import { useState, type ReactNode } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { getStudentAIReport, type StudentReport, type StudentReportStats } from "@/lib/report.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/** Teacher-facing: on demand, generate a detailed AI report on how a student is
 *  doing — pace, strengths, frequent errors (said→corrected), pronunciation,
 *  AI-tutor activity, and a suggested message to send them. */
export function StudentReportCard({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ stats: StudentReportStats; report: StudentReport; hasData: boolean } | null>(null);

  async function generate() {
    setLoading(true);
    try {
      const res = await getStudentAIReport({ data: { userId } });
      setData(res as { stats: StudentReportStats; report: StudentReport; hasData: boolean });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo generar el informe");
    } finally {
      setLoading(false);
    }
  }

  const r = data?.report;

  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-navy">🧠 Informe IA del alumno</p>
        <Button onClick={() => void generate()} disabled={loading} size="sm" className="bg-gradient-blue text-white">
          {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
          {data ? "Actualizar" : "Generar"}
        </Button>
      </div>

      {loading && !data && (
        <p className="mt-3 text-xs text-muted-foreground">Analizando todo el rendimiento del alumno…</p>
      )}

      {data && (
        <div className="mt-3 space-y-3 text-navy">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <Stat label="Días" value={data.stats.daysCompleted} />
            <Stat label="Nota media" value={`${data.stats.avgDefiScore}/10`} />
            <Stat label="Estrellas" value={data.stats.totalStars} />
            <Stat label="Msgs tutor" value={data.stats.tutorMessages} />
            <Stat label="Correcc. IA" value={data.stats.tutorCorrections} />
            <Stat label="Sem. eval." value={data.stats.weeksEvaluated} />
          </div>

          {!data.hasData ? (
            <p className="text-xs text-muted-foreground">
              Este alumno aún no tiene actividad suficiente para un informe.
            </p>
          ) : r ? (
            <>
              {r.resumen && (
                <Section title="Resumen">
                  <p className="text-sm">{r.resumen}</p>
                </Section>
              )}
              {r.nivel && (
                <Section title="Nivel">
                  <p className="text-sm">{r.nivel}</p>
                </Section>
              )}
              <ListSection title="Fortalezas" items={r.fortalezas} />
              <ListSection title="Dificultades" items={r.dificultades} />
              {r.errores_frecuentes.length > 0 && (
                <Section title="Errores frecuentes">
                  <ul className="space-y-1">
                    {r.errores_frecuentes.map((e, i) => (
                      <li key={i} className="text-xs">
                        <b>{e.tipo}:</b> «{e.ejemplo}» → «{e.correccion}»
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
              <ListSection title="Pronunciación" items={r.pronunciacion} />
              {r.tutor_ia && (
                <Section title="Tutor de IA">
                  <p className="text-sm">{r.tutor_ia}</p>
                </Section>
              )}
              {r.ritmo && (
                <Section title="Ritmo">
                  <p className="text-sm">{r.ritmo}</p>
                </Section>
              )}
              <ListSection title="Recomendaciones" items={r.recomendaciones} />
              {r.mensaje_sugerido && (
                <Section title="Mensaje sugerido para el alumno">
                  <p className="text-sm italic text-navy/80">“{r.mensaje_sugerido}”</p>
                </Section>
              )}
            </>
          ) : null}
        </div>
      )}
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
  if (!items?.length) return null;
  return (
    <Section title={title}>
      <ul className="list-disc pl-4 text-xs">
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </Section>
  );
}
