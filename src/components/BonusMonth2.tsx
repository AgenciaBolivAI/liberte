import { useState } from "react";
import { Check, Volume2, X } from "lucide-react";
import { speakFr } from "@/lib/speak";
import {
  GENDER_PLURALS,
  GENDER_QUIZ,
  GENDER_RULES,
  GENDER_TRAPS,
  MONTH2_EXPRESSIONS,
} from "@/data/bonusMonth2";

/**
 * The two BONUS MES 2 lessons, rendered under the teacher's video on the
 * «Petit plus» page. The video is Ale presenting; this is the material the
 * student comes back to — listenable, and in the gender case, playable.
 */

/** Bonus 1 — the 30 everyday expressions (dictionary 601-630). */
export function LifeExpressionsBonus() {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-extrabold text-navy">
        Les 30 expressions — à écouter et à répéter
      </h2>
      <p className="mt-1 text-sm text-navy/70">
        Ninguna academia te las enseña, pero los francófonos las usan todos los días. Toca el
        altavoz y repite en voz alta: la memoria aquí es emocional, no mecánica.
      </p>

      <ol className="mt-5 space-y-3">
        {MONTH2_EXPRESSIONS.map((e) => (
          <li
            key={e.id}
            className="rounded-2xl border border-border bg-white p-4 shadow-soft transition hover:border-blue/40"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-display text-lg font-extrabold text-navy">{e.fr}</p>
                <p className="text-sm text-navy/60">{e.es}</p>
              </div>
              <button
                onClick={() => speakFr(e.example)}
                aria-label={`Écouter : ${e.fr}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-blue/10 px-4 py-2 text-sm font-semibold text-blue hover:bg-blue/20"
              >
                <Volume2 className="h-4 w-4" /> Écouter
              </button>
            </div>
            <p className="mt-3 border-l-2 border-gold/60 pl-3 text-sm text-navy italic">
              {e.example}
            </p>
            <p className="pl-3 text-xs text-navy/50">{e.exampleEs}</p>
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-2xl border border-dashed border-gold/50 bg-gold/5 p-4 text-sm text-navy/80">
        🎯 <strong>Mini reto :</strong> graba 90 segundos contando tu día usando al menos 10 de
        estas expresiones. Natural, como si hablaras con un amigo francófono.
      </div>
    </section>
  );
}

/** Bonus 2 — gender endings + the closing 10-word intuition quiz. */
export function GenderRulesBonus() {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-extrabold text-navy">
        Le genre en français — les terminaisons qui te le disent
      </h2>
      <p className="mt-1 text-sm text-navy/70">
        El género no se memoriza palabra por palabra: se intuye por la terminación. Estas son las
        más fiables.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {GENDER_RULES.map((r) => (
          <div
            key={r.ending}
            className={`rounded-2xl border p-4 ${
              r.gender === "f" ? "border-pink-200 bg-pink-50/60" : "border-blue/30 bg-blue/5"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-base font-extrabold text-navy">{r.ending}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-widest uppercase ${
                  r.gender === "f" ? "bg-pink-500/15 text-pink-700" : "bg-blue/15 text-blue"
                }`}
              >
                {r.gender === "f" ? "féminin · la" : "masculin · le"}
              </span>
            </div>
            <p className="mt-2 text-sm text-navy/75">{r.examples.join(" · ")}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-white p-4 shadow-soft">
        <p className="text-xs font-bold tracking-widest text-blue uppercase">Le pluriel</p>
        <ul className="mt-2 space-y-1 text-sm text-navy/80">
          {GENDER_PLURALS.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>

      <div className="mt-3 rounded-2xl border border-dashed border-gold/50 bg-gold/5 p-4">
        <p className="text-xs font-bold tracking-widest text-navy uppercase">Attention</p>
        <ul className="mt-2 space-y-1.5 text-sm text-navy/80">
          {GENDER_TRAPS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      <GenderQuiz />
    </section>
  );
}

/** The 10-word quiz that closes the video: guess le or la, learn the rule. */
function GenderQuiz() {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<"f" | "m" | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const item = GENDER_QUIZ[idx];

  if (done) {
    return (
      <div className="mt-6 rounded-3xl border border-border bg-white p-6 text-center shadow-soft">
        <p className="font-display text-2xl font-extrabold text-navy">
          {score} / {GENDER_QUIZ.length}
        </p>
        <p className="mt-1 text-sm text-navy/70">
          {score >= 8
            ? "¡Tu intuición ya funciona! Sigue aprendiendo cada palabra con su artículo."
            : "La intuición se entrena. Vuelve a las terminaciones de arriba y repite el quiz."}
        </p>
        <button
          onClick={() => {
            setIdx(0);
            setPicked(null);
            setScore(0);
            setDone(false);
          }}
          className="mt-4 rounded-full bg-gradient-blue px-5 py-2.5 text-sm font-extrabold text-white shadow-card hover:brightness-105"
        >
          Recommencer
        </button>
      </div>
    );
  }

  const answered = picked !== null;
  const correct = picked === item.gender;

  return (
    <div className="mt-6 rounded-3xl border border-border bg-white p-6 shadow-soft">
      <p className="text-xs font-bold tracking-widest text-blue uppercase">
        Quiz · {idx + 1} / {GENDER_QUIZ.length}
      </p>
      <p className="mt-3 text-center font-display text-3xl font-extrabold text-navy">
        …{item.word}
      </p>
      <p className="mt-1 text-center text-sm text-navy/60">¿Masculino o femenino?</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {(["m", "f"] as const).map((g) => {
          const isPick = picked === g;
          const isRight = g === item.gender;
          return (
            <button
              key={g}
              disabled={answered}
              onClick={() => {
                setPicked(g);
                if (g === item.gender) setScore((s) => s + 1);
              }}
              className={`rounded-2xl border-2 px-4 py-4 font-display text-xl font-extrabold transition ${
                answered
                  ? isRight
                    ? "border-green-500 bg-green-50 text-green-700"
                    : isPick
                      ? "border-red-400 bg-red-50 text-red-600"
                      : "border-border bg-white text-navy/40"
                  : "border-border bg-white text-navy hover:border-blue hover:bg-blue/5"
              }`}
            >
              {g === "m" ? "LE" : "LA"} {item.word}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-4 rounded-2xl bg-ice p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-navy">
            {correct ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <X className="h-4 w-4 text-red-500" />
            )}
            {item.why}
          </p>
          <button
            onClick={() => {
              setPicked(null);
              if (idx + 1 < GENDER_QUIZ.length) setIdx(idx + 1);
              else setDone(true);
            }}
            className="mt-3 w-full rounded-full bg-gradient-blue px-5 py-2.5 text-sm font-extrabold text-white shadow-card hover:brightness-105"
          >
            {idx + 1 < GENDER_QUIZ.length ? "Suivant" : "Voir mon score"}
          </button>
        </div>
      )}
    </div>
  );
}
