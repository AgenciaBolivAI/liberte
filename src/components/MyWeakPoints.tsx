import { useEffect, useState } from "react";
import { AlertCircle, Target, TrendingUp } from "lucide-react";
import { myInsights, type Insights } from "@/lib/insights.functions";

const COMPETENCE_LABEL: Record<string, string> = {
  PO: "Production orale · hablar",
  PE: "Production écrite · escribir",
  CO: "Compréhension orale · escuchar",
  CE: "Compréhension écrite · leer",
};

/**
 * "Mes points à travailler" — shows the student the pattern across all their
 * graded answers, not just today's feedback. Answers the survey complaint
 * "no sé qué puedo mejorar… o si tengo el mismo error todo el tiempo".
 */
export function MyWeakPoints() {
  const [data, setData] = useState<Insights | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    myInsights()
      .then((d) => {
        if (alive) setData(d);
      })
      .catch(() => {
        // Never let this panel break the progress page.
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (failed) return null;

  if (!data) {
    return (
      <section className="mt-8 rounded-3xl border border-border bg-white p-6 shadow-soft">
        <p className="text-sm text-muted-foreground">Chargement…</p>
      </section>
    );
  }

  // Nothing graded yet: say so plainly instead of showing empty boxes.
  if (data.graded === 0) {
    return (
      <section className="mt-8 rounded-3xl border border-border bg-white p-6 shadow-soft">
        <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-navy sm:text-xl">
          <Target className="h-5 w-5 text-blue" /> Mes points à travailler
        </h2>
        <p className="mt-2 text-sm text-navy/70">
          Aquí verás tus errores que se repiten en cuanto completes tus primeros ejercicios
          corregidos. Cada respuesta hablada o escrita que envíes alimenta este panel.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-3xl border border-border bg-white p-6 shadow-soft">
      <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-navy sm:text-xl">
        <Target className="h-5 w-5 text-blue" /> Mes points à travailler
      </h2>
      <p className="mt-1 text-sm text-navy/70">
        Lo que la corrección detecta una y otra vez en tus {data.graded} respuestas evaluadas. Esto
        es exactamente lo que ve tu profesora.
      </p>

      {data.weakPoints.length > 0 ? (
        <ul className="mt-5 space-y-2">
          {data.weakPoints.map((w) => (
            <li
              key={w.label}
              className="flex items-start justify-between gap-3 rounded-2xl border border-gold/40 bg-gold/5 p-4"
            >
              <span className="flex items-start gap-2 text-sm text-navy">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                {w.label}
              </span>
              <span className="shrink-0 rounded-full bg-navy/10 px-3 py-1 text-xs font-extrabold text-navy">
                ×{w.times}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-2xl border border-dashed border-border p-4 text-sm text-navy/70">
          ✨ Ningún error se te repite todavía — vas corrigiendo sobre la marcha. ¡Sigue así!
        </p>
      )}

      {data.competences.length > 0 && (
        <>
          <h3 className="mt-7 flex items-center gap-2 font-display text-base font-extrabold text-navy">
            <TrendingUp className="h-4 w-4 text-blue" /> Par compétence
          </h3>
          <div className="mt-3 space-y-3">
            {data.competences.map((c) => (
              <div key={c.competence}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-navy">
                    {COMPETENCE_LABEL[c.competence] ?? c.competence}
                  </span>
                  <span className="text-navy/60">{c.accuracy}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-ice">
                  <div
                    className={`h-full rounded-full ${
                      c.accuracy >= 75
                        ? "bg-green-500"
                        : c.accuracy >= 50
                          ? "bg-gold"
                          : "bg-red-400"
                    }`}
                    style={{ width: `${Math.max(3, c.accuracy)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {data.recentCorrections.length > 0 && (
        <>
          <h3 className="mt-7 font-display text-base font-extrabold text-navy">
            Dernières corrections
          </h3>
          <ul className="mt-3 space-y-2">
            {data.recentCorrections.map((c, i) => (
              <li key={`${c.day}-${i}`} className="rounded-xl bg-ice p-3 text-sm text-navy/85">
                <span className="mr-2 text-xs font-bold text-blue">Jour {c.day}</span>
                {c.text}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
