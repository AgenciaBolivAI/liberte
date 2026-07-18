import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import logo from "@/assets/liberte-logo-full.png.asset.json";

export const Route = createFileRoute("/clasesenvivo/taller1")({
  head: () => ({
    meta: [
      { title: "Taller 1 · Le Présent · Liberté" },
      {
        name: "description",
        content:
          "Taller de práctica: dominar las conjugaciones verbales en presente en francés.",
      },
    ],
  }),
  component: Taller1,
});

const NAVY = "#3D5589";
const CREAM = "#FAF7F2";
const RED = "#E63946";

// ---------- Primitives ----------

function SlideShell({
  bg,
  children,
}: {
  bg: "navy" | "cream";
  children: ReactNode;
}) {
  const isNavy = bg === "navy";
  return (
    <div
      className="w-full h-full flex items-center justify-center px-5 sm:px-12 py-10 sm:py-16"
      style={{
        background: isNavy ? NAVY : CREAM,
        color: isNavy ? CREAM : NAVY,
      }}
    >
      <div className="w-full max-w-5xl mx-auto text-center">{children}</div>
    </div>
  );
}

function Title({
  children,
  color,
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <h1
      className="font-[var(--font-display)] font-extrabold text-4xl sm:text-6xl md:text-7xl leading-[1] tracking-tight"
      style={{ color }}
    >
      {children}
    </h1>
  );
}

function H2({
  children,
  color,
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <h2
      className="font-[var(--font-display)] font-extrabold text-3xl sm:text-5xl leading-tight tracking-tight mb-6"
      style={{ color }}
    >
      {children}
    </h2>
  );
}

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl shadow-xl border p-5 sm:p-7 text-left ${className}`}
      style={{ background: CREAM, borderColor: "rgba(61,85,137,0.15)", color: NAVY }}
    >
      {children}
    </div>
  );
}

function RedBtn({
  onClick,
  children,
  size = "md",
}: {
  onClick: () => void;
  children: ReactNode;
  size?: "md" | "lg";
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full font-extrabold uppercase tracking-wider text-white shadow-lg hover:opacity-90 transition ${
        size === "lg" ? "px-7 py-3.5 text-base sm:text-lg" : "px-5 py-2.5 text-xs sm:text-sm"
      }`}
      style={{ background: RED }}
    >
      <Eye className="h-4 w-4" /> {children}
    </button>
  );
}

// Conjugation table cell
function Conj({ pron, verb, ending }: { pron: string; verb: string; ending: string }) {
  return (
    <div className="flex items-baseline gap-3 py-1.5">
      <span className="font-semibold w-16 sm:w-20 text-base sm:text-xl" style={{ color: NAVY }}>
        {pron}
      </span>
      <span className="font-extrabold text-xl sm:text-3xl" style={{ color: NAVY }}>
        {verb}
        <span style={{ color: RED }}>{ending}</span>
      </span>
    </div>
  );
}

// Reveal helper
function Revealer({
  label,
  children,
  size = "md",
}: {
  label: string;
  children: ReactNode;
  size?: "md" | "lg";
}) {
  const [show, setShow] = useState(false);
  if (show) return <>{children}</>;
  return <RedBtn onClick={() => setShow(true)} size={size}>{label}</RedBtn>;
}

// ---------- Slides ----------

function Slide1() {
  return (
    <SlideShell bg="navy">
      <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.35em] mb-6" style={{ color: CREAM, opacity: 0.75 }}>
        Taller 1 · Liberté
      </p>
      <Title color={CREAM}>Atelier de Pratique : Le Présent</Title>
      <p
        className="mt-8 text-xl sm:text-3xl font-extrabold"
        style={{ color: RED }}
      >
        Domina las conjugaciones verbales en francés
      </p>
    </SlideShell>
  );
}

function Slide2() {
  return (
    <SlideShell bg="cream">
      <H2 color={NAVY}>Los 3 Grupos de Verbos</H2>
      <p className="text-lg sm:text-2xl font-semibold mb-6" style={{ color: RED }}>
        El secreto para conjugar cualquier verbo regular
      </p>
      <p className="text-base sm:text-xl max-w-3xl mx-auto" style={{ color: NAVY }}>
        En francés, la mayoría de los verbos regulares se agrupan según la terminación de
        su infinitivo: <b>-ER</b>, <b>-IR</b> y <b>-RE</b>. Aprender sus terminaciones te
        permite conjugar <b>miles</b> de verbos.
      </p>
    </SlideShell>
  );
}

function GroupCard({
  group,
  endings,
}: {
  group: string;
  endings: string[];
}) {
  const pronouns = ["Je", "Tu", "Il/Elle", "Nous", "Vous", "Ils/Elles"];
  return (
    <Card className="flex-1">
      <p className="text-center font-[var(--font-display)] font-extrabold text-2xl sm:text-3xl mb-4" style={{ color: NAVY }}>
        Grupo {group}
      </p>
      <div className="space-y-1.5">
        {pronouns.map((p, i) => (
          <div key={p} className="flex items-baseline justify-between">
            <span className="font-semibold text-base sm:text-lg">{p}</span>
            <span className="font-extrabold text-lg sm:text-2xl" style={{ color: RED }}>
              {endings[i] || "—"}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Slide3() {
  return (
    <SlideShell bg="navy">
      <H2 color={CREAM}>Reglas de los 3 Grupos</H2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        <GroupCard group="-ER" endings={["-e", "-es", "-e", "-ons", "-ez", "-ent"]} />
        <GroupCard
          group="-IR"
          endings={["-is", "-is", "-it", "-issons", "-issez", "-issent"]}
        />
        <GroupCard group="-RE" endings={["-s", "-s", "—", "-ons", "-ez", "-ent"]} />
      </div>
    </SlideShell>
  );
}

function Slide4() {
  return (
    <SlideShell bg="cream">
      <H2 color={NAVY}>Ejemplo Grupo 1 : PARLER (Hablar)</H2>
      <div className="max-w-md mx-auto">
        <Card>
          <Conj pron="Je" verb="parl" ending="e" />
          <Conj pron="Tu" verb="parl" ending="es" />
          <Conj pron="Il/Elle" verb="parl" ending="e" />
          <Conj pron="Nous" verb="parl" ending="ons" />
          <Conj pron="Vous" verb="parl" ending="ez" />
          <Conj pron="Ils/Elles" verb="parl" ending="ent" />
        </Card>
      </div>
    </SlideShell>
  );
}

function Slide5() {
  return (
    <SlideShell bg="cream">
      <H2 color={NAVY}>Ejemplo Grupo 2 : FINIR (Terminar)</H2>
      <div className="max-w-md mx-auto">
        <Card>
          <Conj pron="Je" verb="fin" ending="is" />
          <Conj pron="Tu" verb="fin" ending="is" />
          <Conj pron="Il/Elle" verb="fin" ending="it" />
          <Conj pron="Nous" verb="fin" ending="issons" />
          <Conj pron="Vous" verb="fin" ending="issez" />
          <Conj pron="Ils/Elles" verb="fin" ending="issent" />
        </Card>
      </div>
    </SlideShell>
  );
}

function IrregularCard({
  verb,
  translation,
  rows,
}: {
  verb: string;
  translation: string;
  rows: [string, string][];
}) {
  return (
    <Card>
      <p className="text-center font-[var(--font-display)] font-extrabold text-2xl sm:text-3xl" style={{ color: NAVY }}>
        {verb}
      </p>
      <p className="text-center text-sm sm:text-base font-semibold mb-4" style={{ color: RED }}>
        {translation}
      </p>
      <div className="space-y-1.5">
        {rows.map(([p, v]) => (
          <div key={p} className="flex items-baseline justify-between">
            <span className="font-semibold text-base sm:text-lg" style={{ color: NAVY }}>
              {p}
            </span>
            <span className="font-extrabold text-xl sm:text-2xl" style={{ color: RED }}>
              {v}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Slide6() {
  return (
    <SlideShell bg="navy">
      <H2 color={CREAM}>Los Verbos Irregulares Clave</H2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <IrregularCard
          verb="ÊTRE"
          translation="Ser / Estar"
          rows={[
            ["Je", "suis"],
            ["Tu", "es"],
            ["Il/Elle", "est"],
            ["Nous", "sommes"],
            ["Vous", "êtes"],
            ["Ils/Elles", "sont"],
          ]}
        />
        <IrregularCard
          verb="AVOIR"
          translation="Tener"
          rows={[
            ["J'", "ai"],
            ["Tu", "as"],
            ["Il/Elle", "a"],
            ["Nous", "avons"],
            ["Vous", "avez"],
            ["Ils/Elles", "ont"],
          ]}
        />
      </div>
    </SlideShell>
  );
}

function Slide7() {
  return (
    <SlideShell bg="cream">
      <H2 color={NAVY}>La Négation</H2>
      <div
        className="mx-auto max-w-3xl rounded-2xl px-5 sm:px-8 py-6 sm:py-8 shadow-xl"
        style={{ background: NAVY }}
      >
        <p
          className="font-[var(--font-display)] font-extrabold text-3xl sm:text-5xl leading-tight"
          style={{ color: CREAM }}
        >
          Sujeto <span style={{ color: RED }}>+ NE +</span> Verbo{" "}
          <span style={{ color: RED }}>+ PAS</span>
        </p>
      </div>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="text-center">
          <p className="text-xl sm:text-3xl font-extrabold">
            Je <span style={{ color: RED }}>ne</span> parle{" "}
            <span style={{ color: RED }}>pas</span>
          </p>
          <p className="text-sm mt-2 opacity-70">No hablo</p>
        </Card>
        <Card className="text-center">
          <p className="text-xl sm:text-3xl font-extrabold">
            Tu <span style={{ color: RED }}>n'</span>as{" "}
            <span style={{ color: RED }}>pas</span>
          </p>
          <p className="text-sm mt-2 opacity-70">No tienes</p>
        </Card>
      </div>
    </SlideShell>
  );
}

function Slide8() {
  return (
    <SlideShell bg="navy">
      <Title color={CREAM}>¡Hora de Practicar! 🚀</Title>
      <p className="mt-8 text-xl sm:text-2xl" style={{ color: CREAM, opacity: 0.9 }}>
        5 Retos interactivos para el taller.
      </p>
      <p className="mt-2 text-lg sm:text-xl font-extrabold" style={{ color: RED }}>
        Haz clic para revelar las respuestas.
      </p>
    </SlideShell>
  );
}

// ------ Ejercicios ------

function Slide9() {
  const items = [
    { q: "Tu (manger) une pomme.", a: "Tu manges une pomme." },
    { q: "Nous (choisir) le film.", a: "Nous choisissons le film." },
    { q: "Elles (vendre) la maison.", a: "Elles vendent la maison." },
    { q: "Je (écouter) la radio.", a: "J'écoute la radio." },
  ];
  const [show, setShow] = useState(false);
  return (
    <SlideShell bg="cream">
      <H2 color={NAVY}>Reto 1 · Conjuga (Grupos Regulares)</H2>
      <div className="max-w-3xl mx-auto space-y-3">
        {items.map((it, i) => (
          <Card key={i}>
            <p className="text-lg sm:text-2xl font-semibold">
              {i + 1}. {it.q}
            </p>
            {show && (
              <p className="mt-2 text-lg sm:text-2xl font-extrabold" style={{ color: RED }}>
                → {it.a}
              </p>
            )}
          </Card>
        ))}
      </div>
      {!show && (
        <div className="mt-8">
          <RedBtn onClick={() => setShow(true)} size="lg">
            Revelar Respuestas
          </RedBtn>
        </div>
      )}
    </SlideShell>
  );
}

function IndividualReveal({ answer }: { answer: string }) {
  const [show, setShow] = useState(false);
  if (show)
    return (
      <span className="font-extrabold text-xl sm:text-3xl" style={{ color: RED }}>
        {answer}
      </span>
    );
  return (
    <button
      onClick={() => setShow(true)}
      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white shadow hover:opacity-90"
      style={{ background: RED }}
    >
      <Eye className="h-3.5 w-3.5" /> Ver
    </button>
  );
}

function Slide10() {
  const items = [
    { before: "Je ", verb: "(être)", after: " très content.", answer: "suis" },
    { before: "Vous ", verb: "(avoir)", after: " un chien.", answer: "avez" },
    { before: "Ils ", verb: "(être)", after: " au parc.", answer: "sont" },
  ];
  return (
    <SlideShell bg="navy">
      <H2 color={CREAM}>Reto 2 · Rellenar (Être & Avoir)</H2>
      <div className="max-w-3xl mx-auto space-y-3">
        {items.map((it, i) => (
          <Card key={i} className="flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="flex-1 text-lg sm:text-2xl font-semibold text-left">
              {i + 1}. {it.before}
              <span className="inline-block min-w-[80px] border-b-2 mx-1 align-middle" style={{ borderColor: NAVY }}>
                &nbsp;
              </span>{" "}
              <span className="text-sm opacity-70">{it.verb}</span>
              {it.after}
            </p>
            <IndividualReveal answer={it.answer} />
          </Card>
        ))}
      </div>
    </SlideShell>
  );
}

function Slide11() {
  const items = [
    { q: "Je suis grand.", a: "Je ne suis pas grand." },
    { q: "Tu aimes le chocolat.", a: "Tu n'aimes pas le chocolat." },
    { q: "Nous finissons le devoir.", a: "Nous ne finissons pas le devoir." },
  ];
  const [show, setShow] = useState(false);
  return (
    <SlideShell bg="cream">
      <H2 color={NAVY}>Reto 3 · Transforma a Negativo</H2>
      <div className="max-w-3xl mx-auto space-y-3">
        {items.map((it, i) => (
          <Card key={i}>
            <p className="text-lg sm:text-2xl font-semibold">
              {i + 1}. {it.q}
            </p>
            {show && (
              <p className="mt-2 text-lg sm:text-2xl font-extrabold" style={{ color: RED }}>
                → {it.a}
              </p>
            )}
          </Card>
        ))}
      </div>
      {!show && (
        <div className="mt-8">
          <RedBtn onClick={() => setShow(true)} size="lg">
            Mostrar Negaciones
          </RedBtn>
        </div>
      )}
    </SlideShell>
  );
}

function Slide12() {
  const pairs = [
    { p: "Nous", v: "parlons" },
    { p: "Ils", v: "choisissent" },
    { p: "Je", v: "vends" },
    { p: "Tu", v: "as" },
  ];
  const [show, setShow] = useState(false);
  return (
    <SlideShell bg="navy">
      <H2 color={CREAM}>Reto 4 · Une Pronombres y Verbos</H2>
      <div className="max-w-3xl mx-auto grid grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <p className="text-center font-bold uppercase tracking-widest text-xs mb-3" style={{ color: RED }}>
            Pronombres
          </p>
          <div className="space-y-2">
            {pairs.map((p) => (
              <p key={p.p} className="text-xl sm:text-3xl font-extrabold text-center">
                {p.p}
              </p>
            ))}
          </div>
        </Card>
        <Card>
          <p className="text-center font-bold uppercase tracking-widest text-xs mb-3" style={{ color: RED }}>
            Verbos
          </p>
          <div className="space-y-2">
            {(show
              ? pairs
              : [
                  { v: "parlons" },
                  { v: "choisissent" },
                  { v: "vends" },
                  { v: "as" },
                ].map((x, i) => ({ p: "", v: [pairs[2].v, pairs[3].v, pairs[0].v, pairs[1].v][i] }))
            ).map((p, i) => (
              <p
                key={i}
                className="text-xl sm:text-3xl font-extrabold text-center"
                style={{ color: show ? RED : NAVY }}
              >
                {p.v}
              </p>
            ))}
          </div>
        </Card>
      </div>
      <div className="mt-8">
        {!show ? (
          <RedBtn onClick={() => setShow(true)} size="lg">
            Resolver
          </RedBtn>
        ) : (
          <p className="text-base sm:text-lg font-semibold" style={{ color: CREAM }}>
            Cada pronombre está ahora frente a su verbo correcto.
          </p>
        )}
      </div>
    </SlideShell>
  );
}

function Slide13() {
  return (
    <SlideShell bg="cream">
      <H2 color={NAVY}>Le Grand Défi</H2>
      <Card className="max-w-3xl mx-auto text-center">
        <p className="text-lg sm:text-2xl font-semibold mb-2" style={{ color: NAVY }}>
          Traduce al francés:
        </p>
        <p className="text-2xl sm:text-4xl font-extrabold mb-6" style={{ color: NAVY }}>
          « Nosotros no comemos pizza. »
        </p>
        <Revealer label="Ver Solución" size="lg">
          <p className="text-2xl sm:text-4xl font-extrabold" style={{ color: RED }}>
            Nous ne mangeons pas de pizza.
          </p>
          <p className="mt-3 text-sm sm:text-base italic" style={{ color: NAVY, opacity: 0.75 }}>
            Nota: <b>manger</b> añade una <b>“e”</b> en la forma <b>nous</b> (mange
            <b>o</b>ns) para conservar el sonido suave.
          </p>
        </Revealer>
      </Card>
    </SlideShell>
  );
}

function Slide14() {
  return (
    <SlideShell bg="navy">
      <Title color={CREAM}>Félicitations ! 🎉</Title>
      <p
        className="mt-8 text-xl sm:text-3xl font-extrabold"
        style={{ color: RED }}
      >
        Fin del taller de práctica. ¡Excelente trabajo!
      </p>
    </SlideShell>
  );
}

// ---------- Deck ----------

function Taller1() {
  const slides = [
    <Slide1 key="1" />,
    <Slide2 key="2" />,
    <Slide3 key="3" />,
    <Slide4 key="4" />,
    <Slide5 key="5" />,
    <Slide6 key="6" />,
    <Slide7 key="7" />,
    <Slide8 key="8" />,
    <Slide9 key="9" />,
    <Slide10 key="10" />,
    <Slide11 key="11" />,
    <Slide12 key="12" />,
    <Slide13 key="13" />,
    <Slide14 key="14" />,
  ];
  const total = slides.length;
  const [i, setI] = useState(0);

  const next = useCallback(() => setI((v) => Math.min(v + 1, total - 1)), [total]);
  const prev = useCallback(() => setI((v) => Math.max(v - 1, 0)), []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [next, prev]);

  return (
    <div
      className="relative w-full min-h-screen overflow-hidden"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div key={i} className="min-h-screen w-full animate-in fade-in duration-500">
        {slides[i]}
      </div>

      {/* Logo bottom-right */}
      <img
        src={logo.url}
        alt="Liberté"
        className="fixed bottom-3 right-3 h-9 sm:h-12 w-auto opacity-95 drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] bg-white/90 rounded-lg px-2 py-1 z-20"
      />

      {/* Nav bar */}
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 rounded-full px-3 py-2 shadow-2xl backdrop-blur-md z-20"
        style={{ background: "rgba(61,85,137,0.95)" }}
      >
        <button
          onClick={prev}
          disabled={i === 0}
          aria-label="Anterior"
          className="inline-flex items-center gap-1 h-9 sm:h-10 px-3 rounded-full text-white text-xs sm:text-sm font-extrabold uppercase tracking-wider transition disabled:opacity-30 hover:bg-white/15"
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </button>
        <span className="text-white text-xs sm:text-sm font-extrabold tabular-nums px-2 min-w-[6rem] text-center">
          Slide {i + 1} de {total}
        </span>
        <button
          onClick={next}
          disabled={i === total - 1}
          aria-label="Siguiente"
          className="inline-flex items-center gap-1 h-9 sm:h-10 px-3 rounded-full text-white text-xs sm:text-sm font-extrabold uppercase tracking-wider transition disabled:opacity-30 hover:opacity-90"
          style={{ background: i === total - 1 ? "transparent" : RED }}
        >
          Siguiente <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
