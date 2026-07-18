import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Eye, EyeOff, Volume2, Mic, Zap, Scale, Search, Hand, Play, Pause, RotateCcw } from "lucide-react";
import eiffelBg from "@/assets/paris-eiffel-bg.jpg";
import logo from "@/assets/liberte-logo-full.png.asset.json";
import frigoVide from "@/assets/clase1-frigo-vide.jpg";
import frigoPlein from "@/assets/clase1-frigo-plein.jpg";

export const Route = createFileRoute("/clasesenvivo/m1c1")({
  head: () => ({
    meta: [
      { title: "Clase #1 — Le Frigo Vide · Liberté" },
      { name: "description", content: "Clase #1 ampliada: quiz éclair, le frigo vide y traducciones bidireccionales." },
    ],
  }),
  component: Clase1,
});

// Brand tokens
const NAVY = "#3D5589";
const CREAM = "#FAF7F2";
const BLUE = "#73ACDB";
const SKY = "#9BCBEF";
const RED = "#C44536";
const GOLD = "#D4A24C";

function Slide({ children, kicker }: { children: ReactNode; kicker?: string }) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4 sm:px-10 py-8 sm:py-14 text-center">
      {kicker && (
        <p className="mb-3 text-[11px] sm:text-sm font-bold uppercase tracking-[0.35em]" style={{ color: SKY }}>
          {kicker}
        </p>
      )}
      <div className="w-full max-w-6xl">{children}</div>
    </div>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl border border-white/60 ${className}`}>
      {children}
    </div>
  );
}

function SlideTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-[var(--font-display)] font-extrabold text-4xl sm:text-6xl md:text-7xl leading-[0.95] tracking-tight text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.35)]">
      {children}
    </h1>
  );
}

function SlideH2({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-[var(--font-display)] font-extrabold text-3xl sm:text-5xl leading-tight text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.35)] mb-6">
      {children}
    </h2>
  );
}

function Pill({ children, bg = RED }: { children: ReactNode; bg?: string }) {
  return (
    <span className="inline-block px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-widest text-white shadow-md" style={{ background: bg }}>
      {children}
    </span>
  );
}

// Quiz item with reveal
function QuizItem({
  n,
  question,
  answer,
  open,
  onToggle,
}: {
  n: number;
  question: ReactNode;
  answer: ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="p-4 sm:p-5 text-left">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 shrink-0 rounded-full grid place-items-center text-white font-extrabold text-sm" style={{ background: NAVY }}>
          {n}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-semibold leading-snug" style={{ color: NAVY }}>{question}</p>
          <button
            onClick={onToggle}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white transition hover:opacity-90"
            style={{ background: open ? "#6b7280" : BLUE }}
          >
            {open ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {open ? "Cacher" : "Voir la réponse"}
          </button>
          {open && (
            <div
              className="mt-3 rounded-lg px-3 py-2 text-sm sm:text-base font-bold leading-snug border-l-4"
              style={{ background: `${GOLD}22`, borderColor: GOLD, color: RED }}
            >
              {answer}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function QuizBlock({
  title,
  items,
  intro,
}: {
  title: string;
  intro?: ReactNode;
  items: { q: ReactNode; a: ReactNode }[];
}) {
  const [openMap, setOpenMap] = useState<Record<number, boolean>>({});
  const anyOpen = Object.values(openMap).some(Boolean);
  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
        <Pill bg={RED}>{title}</Pill>
        <button
          onClick={() => setOpenMap({})}
          disabled={!anyOpen}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-white/20 hover:bg-white/30 transition disabled:opacity-40"
        >
          <EyeOff className="h-3 w-3" /> Cacher tout
        </button>
      </div>
      {intro && <div className="mb-4 text-white/90 text-sm sm:text-base italic">{intro}</div>}
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((it, idx) => (
          <QuizItem
            key={idx}
            n={idx + 1}
            question={it.q}
            answer={it.a}
            open={!!openMap[idx]}
            onToggle={() => setOpenMap((m) => ({ ...m, [idx]: !m[idx] }))}
          />
        ))}
      </div>
    </>
  );
}

// Reveal card for translations
function RevealCard({ label, hidden, reveal }: { label: string; hidden: ReactNode; reveal: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="p-6 sm:p-8 text-left" >
        <div className="text-sm sm:text-base leading-relaxed font-medium" style={{ color: NAVY }}>
          {hidden}
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white transition hover:opacity-90"
          style={{ background: open ? "#6b7280" : BLUE }}
        >
          {open ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {open ? "Cacher la traduction" : label}
        </button>
        {open && (
          <div
            className="mt-4 rounded-xl px-4 py-4 text-sm sm:text-base leading-relaxed font-semibold border-l-4"
            style={{ background: `${GOLD}22`, borderColor: GOLD, color: RED }}
          >
            {reveal}
          </div>
        )}
      </Card>
    </div>
  );
}

// Countdown timer
function Timer({ minutes = 5 }: { minutes?: number }) {
  const [secs, setSecs] = useState(minutes * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (secs <= 0) {
      setRunning(false);
      return;
    }
    const id = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [running, secs]);

  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");

  return (
    <div className="inline-flex flex-col items-center gap-3">
      <div
        className="font-[var(--font-display)] font-extrabold tabular-nums text-white px-8 py-4 rounded-2xl shadow-2xl text-5xl sm:text-6xl"
        style={{ background: `linear-gradient(135deg, ${NAVY}, ${BLUE})` }}
      >
        {m}:{s}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md hover:opacity-90 transition"
          style={{ background: running ? RED : BLUE }}
        >
          {running ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Démarrer</>}
        </button>
        <button
          onClick={() => { setRunning(false); setSecs(minutes * 60); }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md hover:opacity-90 transition bg-white/20"
        >
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
      </div>
    </div>
  );
}

function Clase1() {
  const slides: ReactNode[] = useMemo(() => [
    // 1 — Portada
    <Slide key="s1">
      <p className="text-lg sm:text-2xl italic mb-3" style={{ color: CREAM }}>Bienvenue !</p>
      <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.5em] mb-6" style={{ color: SKY }}>Clase #1</p>
      <SlideTitle>LE FRIGO<br />VIDE</SlideTitle>
      <div className="mx-auto mt-8 h-1 w-24 rounded-full" style={{ background: BLUE }} />
      <p className="mt-8 text-xs sm:text-sm uppercase tracking-[0.35em]" style={{ color: CREAM }}>
        Semaine 1 · LIBERTÉ Instituto de Francés
      </p>
    </Slide>,

    // 2 — Check-in
    <Slide key="s2" kicker="Check-in">
      <SlideH2>« Comment ça va aujourd’hui ? »</SlideH2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { e: "😄", t: "Ça va très bien !" },
          { e: "🙂", t: "Ça va bien" },
          { e: "😐", t: "Comme ci, comme ça" },
          { e: "😴", t: "Je suis fatigué(e)" },
        ].map((c) => (
          <Card key={c.t} className="p-5 flex flex-col items-center">
            <div className="text-5xl sm:text-6xl mb-2">{c.e}</div>
            <p className="font-bold text-sm sm:text-base" style={{ color: NAVY }}>{c.t}</p>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-sm italic" style={{ color: CREAM }}>Un café, un croissant… et on commence ! ☕🥐</p>
    </Slide>,

    // 3 — Presentación quiz
    <Slide key="s3" kicker="Prêt·e·s ?">
      <div className="flex items-center justify-center gap-4 mb-2">
        <Zap className="h-12 w-12 sm:h-16 sm:w-16" style={{ color: GOLD }} strokeWidth={2.5} />
        <SlideTitle>LE QUIZ ÉCLAIR</SlideTitle>
      </div>
      <p className="mt-4 text-lg sm:text-2xl italic" style={{ color: CREAM }}>
        Ustedes ya saben más de lo que creen. Vamos a comprobarlo.
      </p>
      <div className="mt-8 grid sm:grid-cols-3 gap-4 text-left">
        {[
          "Respuesta rápida, sin miedo",
          "Equivocarse suma",
          "En français, s’il vous plaît !",
        ].map((r, i) => (
          <Card key={r} className="p-5">
            <div className="h-9 w-9 rounded-full grid place-items-center text-white font-extrabold mb-2" style={{ background: i === 1 ? RED : NAVY }}>
              {i + 1}
            </div>
            <p className="font-bold text-base" style={{ color: NAVY }}>{r}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    // 4 — Quiz A Conjugaison
    <Slide key="s4" kicker="Quiz · Bloc A">
      <SlideH2>Conjugaison</SlideH2>
      <QuizBlock
        title="Bloc A"
        items={[
          { q: <>Conjuga <b>ÊTRE</b> completo, de memoria.</>, a: "je suis · tu es · il/elle est · nous sommes · vous êtes · ils/elles sont" },
          { q: <>« Elle ___ deux sœurs » <i>(avoir)</i></>, a: "elle a" },
          { q: <>Conjuga <b>ALLER</b> en singular.</>, a: "je vais · tu vas · il/elle va" },
          { q: <>« Nous ___ français » <i>(parler)</i></>, a: "nous parlons" },
          { q: <>« Ils ___ le dîner » <i>(finir)</i></>, a: "ils finissent" },
          { q: <>Seguidas : « yo voy · yo tengo · yo soy »</>, a: "je vais · j’ai · je suis" },
        ]}
      />
    </Slide>,

    // 5 — Quiz B Traduction
    <Slide key="s5" kicker="Quiz · Bloc B">
      <SlideH2>Traduction express · ES → FR</SlideH2>
      <QuizBlock
        title="Bloc B"
        items={[
          { q: "« Nosotros vamos al mercado. »", a: "Nous allons au marché." },
          { q: "« Ella es doctora y trabaja en un hospital. »", a: "Elle est médecin et elle travaille dans un hôpital." },
          { q: "« No me gusta el pescado. »", a: "Je n’aime pas le poisson." },
          { q: "« Hay una farmacia cerca de mi casa. »", a: "Il y a une pharmacie près de chez moi." },
          { q: "« Mi hermana tiene 25 años. »", a: "Ma sœur a vingt-cinq ans." },
          { q: "« Me encanta cocinar los domingos. »", a: "J’adore cuisiner le dimanche." },
        ]}
      />
    </Slide>,

    // 6 — Quiz C Questions & Négation
    <Slide key="s6" kicker="Quiz · Bloc C">
      <SlideH2>Questions & Négation</SlideH2>
      <QuizBlock
        title="Bloc C"
        items={[
          { q: <>Convierte en pregunta : « Tu parles français. »</>, a: "Est-ce que tu parles français ?" },
          { q: <>Pregunta la edad de manera <b>FORMAL</b>.</>, a: "Quel âge avez-vous ?" },
          { q: <>Niega : « J’ai des tomates. »</>, a: "Je n’ai pas DE tomates." },
          { q: <>« Tu n’aimes pas le café ? » — y SÍ te gusta…</>, a: "Si, j’aime le café !" },
          { q: <>« ¿Dónde vives? »</>, a: "Tu habites où ? / Où est-ce que tu habites ?" },
        ]}
      />
    </Slide>,

    // 7 — Quiz D Vocabulaire en phrases
    <Slide key="s7" kicker="Quiz · Bloc D">
      <SlideH2>Vocabulaire en phrases</SlideH2>
      <QuizBlock
        title="Bloc D"
        items={[
          { q: <>Frase completa con color : <b>la banana</b>.</>, a: "La banane est jaune." },
          { q: <>« Le chat est ___ la table » <i>(debajo)</i></>, a: "sous" },
          { q: <>Conector : « J’aime le café ___ je n’aime pas le thé. »</>, a: "mais" },
          { q: <>« Él es cocinero. Ella es profesora. »</>, a: "Il est cuisinier. Elle est professeure." },
          { q: <>« la mano y los ojos »</>, a: "la main, les yeux" },
          { q: <>« Aujourd’hui c’est lundi. Demain, c’est… ? »</>, a: "mardi" },
        ]}
      />
      <p className="mt-4 text-4xl">🐈‍⬛ 🪑</p>
    </Slide>,

    // 8 — Quiz E Compréhension orale
    <Slide key="s8" kicker="Quiz · Bloc E">
      <div className="flex items-center justify-center gap-4 mb-2">
        <Volume2 className="h-12 w-12 sm:h-14 sm:w-14" style={{ color: GOLD }} strokeWidth={2.5} />
        <SlideH2>Compréhension orale</SlideH2>
      </div>
      <p className="text-lg sm:text-2xl italic mb-6" style={{ color: CREAM }}>Écoutez bien…</p>
      <QuizBlock
        title="Bloc E"
        intro={<p>La profesora lee en voz alta. Los alumnos responden.</p>}
        items={[
          { q: "¿Por qué va Sophie al supermercado ?", a: "Parce qu’il n’y a pas de lait chez elle." },
          { q: "¿Cómo es Pierre y cuál es su profesión ?", a: "Il est grand, brun, sympathique ; il est boulanger." },
          { q: "Consigne en direct : escribir en el chat…", a: "Le numéro 12 + son plat préféré." },
          { q: "¿Qué comen y qué NO beben ?", a: "Ils mangent du pain avec du fromage ; ils ne boivent pas de vin." },
        ]}
      />
    </Slide>,

    // 9 — Quiz F Production
    <Slide key="s9" kicker="Quiz · Bloc F">
      <div className="flex items-center justify-center gap-4 mb-2">
        <Mic className="h-12 w-12 sm:h-14 sm:w-14" style={{ color: GOLD }} strokeWidth={2.5} />
        <SlideH2>Production !</SlideH2>
      </div>
      <div className="grid md:grid-cols-3 gap-5 text-left mt-4">
        {[
          { t: "Présente-toi en 5 phrases", s: "Nombre · edad · ciudad · profesión · un gusto" },
          { t: "Décris un membre de ta famille", s: "En 3 phrases" },
          { t: "Décris ta cuisine", s: "Il y a…, un color, algo que adoras" },
        ].map((c, i) => (
          <Card key={c.t} className="p-6 flex flex-col">
            <div className="h-10 w-10 rounded-full grid place-items-center text-white font-extrabold mb-3" style={{ background: [BLUE, NAVY, RED][i] }}>
              {i + 1}
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold mb-1" style={{ color: NAVY }}>« {c.t} »</h3>
            <p className="text-sm text-slate-600">{c.s}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    // 10 — Dinámica puente
    <Slide key="s10" kicker="Dynamique">
      <SlideH2>« Chez moi, il y a toujours… »</SlideH2>
      <p className="text-lg sm:text-2xl italic mb-6" style={{ color: CREAM }}>Una cosa que NUNCA falta en tu cocina.</p>
      <Card className="p-6 sm:p-8">
        <p className="text-lg sm:text-2xl font-bold leading-snug" style={{ color: NAVY }}>
          Exemple : <span style={{ color: RED }}>« Chez moi, il y a toujours du café, des œufs et du fromage. »</span>
        </p>
        <p className="mt-4 text-3xl sm:text-4xl">☕ 🥚 🧀</p>
      </Card>
    </Slide>,

    // 11 — Le frigo vide (historia)
    <Slide key="s11" kicker="Situation critique">
      <SlideH2>Le frigo vide</SlideH2>
      <div className="grid md:grid-cols-2 gap-6 items-center text-left">
        <Card className="p-6 sm:p-8">
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: NAVY }}>
            Imaginez : il est <strong>20h00</strong>, vous rentrez du travail, vous êtes fatigués et vous avez{" "}
            <strong style={{ color: RED }}>une faim de loup</strong>. Vous ouvrez le frigo et…{" "}
            <strong style={{ color: RED }}>c’est la crise !</strong>
            <br /><br />
            Il n’y a rien. C’est la situation critique.
          </p>
          <p className="mt-4 text-sm italic border-l-2 pl-3" style={{ borderColor: RED, color: NAVY }}>
            <b style={{ color: RED }}>« une faim de loup »</b> = un hambre de lobo 🐺
          </p>
        </Card>
        <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white/70">
          <img src={frigoVide} alt="Frigo vide" className="w-full h-64 sm:h-80 object-cover" loading="lazy" />
        </div>
      </div>
    </Slide>,

    // 12 — Observation
    <Slide key="s12" kicker="Étape 1">
      <SlideTitle>Qu’est-ce qu’il y a ?</SlideTitle>
      <p className="mt-6 text-xl sm:text-3xl italic" style={{ color: CREAM }}>
        Di SOLO lo que ves, con « Il y a… » o « Il reste… »
      </p>
      <div className="mt-10 flex justify-center gap-3 flex-wrap">
        {["👀", "🤔", "🥖", "🧀", "🥚"].map((e, i) => (
          <span key={i} className="grid place-items-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-white/95 text-2xl sm:text-3xl shadow-lg">
            {e}
          </span>
        ))}
      </div>
    </Slide>,

    // 13 — Foto del frigo
    <Slide key="s13" kicker="Observation">
      <div className="grid md:grid-cols-2 gap-6 items-center text-left">
        <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white/70 order-2 md:order-1">
          <img src={frigoPlein} alt="Frigo plein" className="w-full h-72 sm:h-96 object-cover" loading="lazy" />
        </div>
        <Card className="p-6 sm:p-8 order-1 md:order-2">
          <p className="text-sm sm:text-base leading-relaxed mb-4" style={{ color: NAVY }}>
            Regardez bien la photo. Ne me dites pas ce que vous voulez acheter, dites-moi seulement ce qui est <strong>dans le frigo maintenant</strong>.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1.5 rounded-full text-sm font-semibold text-white" style={{ background: BLUE }}>Il y a…</span>
            <span className="px-3 py-1.5 rounded-full text-sm font-semibold text-white" style={{ background: NAVY }}>Il reste…</span>
          </div>
          <p className="text-sm italic" style={{ color: NAVY }}>
            Exemple : <span className="font-semibold">« Il y a un yaourt et un oignon. »</span>
          </p>
        </Card>
      </div>
    </Slide>,

    // 14 — Inventaire & Solution
    <Slide key="s14" kicker="Inventaire & Solution">
      <SlideH2>Les restes</SlideH2>
      <div className="grid sm:grid-cols-3 gap-4 text-left">
        {[
          { icon: "🍶", t: "Des bouteilles", s: "(sauces ou condiments)" },
          { icon: "🥚", t: "Des œufs", s: "" },
          { icon: "🧀", t: "Des produits laitiers", s: "" },
        ].map((it) => (
          <Card key={it.t} className="p-5">
            <div className="text-4xl mb-2">{it.icon}</div>
            <p className="font-bold text-lg" style={{ color: NAVY }}>{it.t}</p>
            {it.s && <p className="text-sm text-slate-500">{it.s}</p>}
          </Card>
        ))}
      </div>
      <div className="mt-8 rounded-2xl p-6 text-left flex items-center gap-6" style={{ background: `linear-gradient(135deg, ${NAVY}, ${BLUE})` }}>
        <div className="text-6xl">🍳</div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] font-bold mb-2 text-white/80">L’idée du dîner</p>
          <p className="text-white text-lg sm:text-xl">
            On peut faire un <strong>riz au lait</strong> ou une <strong>omelette</strong> très simple.
          </p>
        </div>
      </div>
    </Slide>,

    // 15 — Quantités
    <Slide key="s15" kicker="Focus grammatical">
      <SlideH2>Les quantités</SlideH2>
      <p className="italic mb-6" style={{ color: CREAM }}>La structure magique</p>
      <Card className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-center gap-3 text-lg sm:text-2xl font-bold" style={{ color: NAVY }}>
          <span className="px-4 py-2 rounded-xl" style={{ background: `${BLUE}22` }}>Quantité</span>
          <span style={{ color: RED }}>+</span>
          <span className="px-4 py-2 rounded-xl text-white" style={{ background: BLUE }}>DE</span>
          <span style={{ color: RED }}>+</span>
          <span className="px-4 py-2 rounded-xl" style={{ background: `${BLUE}22` }}>Nom</span>
        </div>
      </Card>
      <div className="mt-6 grid sm:grid-cols-2 gap-3 text-left">
        {[
          { e: "🥛", t: "Un litre de lait" },
          { e: "🍪", t: "Un paquet de biscuits" },
          { e: "🧀", t: "500 grammes de fromage" },
          { e: "💧", t: "Une bouteille d’eau" },
        ].map((ex) => (
          <div key={ex.t} className="rounded-xl bg-white/95 px-4 py-3 shadow-md border border-white/60 flex items-center gap-3">
            <span className="text-2xl">{ex.e}</span>
            <span className="font-semibold" style={{ color: NAVY }}>{ex.t}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-xl px-4 py-3 inline-block" style={{ background: `${RED}` }}>
        <p className="text-white text-sm sm:text-base font-bold">
          ⚠️ Después de la cantidad, SIEMPRE « <u>de</u> » — nunca « un litre <s>du</s> lait ».
        </p>
      </div>
    </Slide>,

    // 16 — Outils linguistiques
    <Slide key="s16" kicker="Outils linguistiques">
      <SlideH2>Trois expressions clés</SlideH2>
      <div className="grid md:grid-cols-3 gap-5 text-left">
        {[
          { icon: <Hand className="h-6 w-6 text-white" />, title: "Je voudrais…", sub: "La forme polie pour commander.", ex: "« Je voudrais un kilo de carottes, s’il vous plaît. »", bg: BLUE },
          { icon: <Search className="h-6 w-6 text-white" />, title: "Il me faut…", sub: "Pour exprimer la nécessité.", ex: "« Il me faut du beurre pour ma recette. »", bg: NAVY },
          { icon: <Scale className="h-6 w-6 text-white" />, title: "C’est combien ?", sub: "Pour demander le prix.", ex: "« Ça coûte combien, les tomates ? »", bg: RED },
        ].map((c) => (
          <Card key={c.title} className="p-6 flex flex-col">
            <div className="h-10 w-10 rounded-full grid place-items-center mb-3" style={{ background: c.bg }}>{c.icon}</div>
            <h3 className="text-xl font-extrabold mb-1" style={{ color: NAVY }}>{c.title}</h3>
            <p className="text-sm text-slate-600 mb-3">{c.sub}</p>
            <p className="mt-auto text-sm italic border-l-2 pl-3" style={{ borderColor: BLUE, color: NAVY }}>{c.ex}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    // 17 — Activité en binômes
    <Slide key="s17" kicker="Activité en binômes">
      <SlideH2>Votre liste de courses idéale</SlideH2>
      <div className="grid md:grid-cols-2 gap-6 items-center">
        <Card className="p-6 sm:p-8 text-left">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🛒</span>
            <Pill bg={RED}>5 minutes</Pill>
          </div>
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: NAVY }}>
            En <strong>binômes</strong>, préparez votre <strong style={{ color: BLUE }}>liste de courses idéale</strong> :
            <strong> 5 articles indispensables</strong> pour votre dîner.
          </p>
          <div className="mt-5 rounded-xl p-4" style={{ background: `${RED}15` }}>
            <p className="text-sm font-semibold" style={{ color: RED }}>
              ⚠️ Décidez les quantités <u>ensemble</u> !
            </p>
          </div>
        </Card>
        <div className="flex justify-center">
          <Timer minutes={5} />
        </div>
      </div>
    </Slide>,

    // 18 — Foto de apoyo
    <Slide key="s18" kicker="Support visuel">
      <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white/70 max-w-4xl mx-auto">
        <img src={frigoPlein} alt="Frigo plein — support" className="w-full h-[60vh] object-cover" />
      </div>
      <p className="mt-4 text-sm sm:text-base italic" style={{ color: CREAM }}>
        Utilisez cette image pour composer votre liste.
      </p>
    </Slide>,

    // 19 — Le Traducteur
    <Slide key="s19" kicker="Dernière mission">
      <SlideTitle>Le Traducteur · La Traductrice</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl italic" style={{ color: CREAM }}>
        Traducir un texto real… en las DOS direcciones.
      </p>
      <div className="mt-8 flex items-center justify-center gap-6 text-5xl sm:text-6xl">
        <span>🇫🇷</span>
        <span style={{ color: GOLD }}>⇄</span>
        <span>🇪🇸</span>
      </div>
      <Card className="mt-8 p-5 max-w-2xl mx-auto">
        <p className="text-base sm:text-lg font-bold" style={{ color: NAVY }}>
          « Se celebra la <span style={{ color: RED }}>idea comprendida</span>, no la palabra exacta. »
        </p>
      </Card>
    </Slide>,

    // 20 — Traduction FR → ES
    <Slide key="s20" kicker="Traduction 1 · FR → ES">
      <SlideH2>Lisez ce texte…</SlideH2>
      <RevealCard
        label="Voir la traduction"
        hidden={
          <p>
            « Il est 20 heures. Marie rentre du travail et elle a <b style={{ color: RED }}>une faim de loup</b>. Elle ouvre le frigo :
            il y a <b>deux œufs</b>, <b>un peu de fromage</b> et <b>une bouteille de lait</b>. Il n’y a <b>pas de pain</b>.
            Marie prépare une omelette et, pour demain, elle écrit sa liste de courses :{" "}
            <b>un kilo de tomates</b>, <b>500 grammes de riz</b> et <b>trois baguettes</b>. »
          </p>
        }
        reveal={
          <p>
            « Son las 8 de la noche. Marie vuelve del trabajo y tiene un hambre de lobo. Abre el refrigerador:
            hay dos huevos, un poco de queso y una botella de leche. No hay pan. Marie prepara una omelette y,
            para mañana, escribe su lista de compras: un kilo de tomates, 500 gramos de arroz y tres baguettes. »
          </p>
        }
      />
    </Slide>,

    // 21 — Traduction ES → FR
    <Slide key="s21" kicker="Traduction 2 · ES → FR">
      <SlideH2>Traduisez en français…</SlideH2>
      <RevealCard
        label="Voir la traduction"
        hidden={
          <p>
            « Buenas noches. Tengo hambre, pero mi refrigerador está vacío. No hay leche y no hay huevos.
            Mañana voy al mercado. En mi lista hay: un litro de leche, un paquete de galletas y dos kilos de manzanas.
            ¡Me encanta el mercado! »
          </p>
        }
        reveal={
          <>
            <p>
              « Bonsoir. J’ai faim, mais mon frigo est vide. Il n’y a <b>pas de lait</b> et il n’y a pas d’œufs.
              Demain, je vais au marché. Sur ma liste, il y a : <b>un litre de lait</b>, un paquet de biscuits et deux kilos de pommes.
              J’adore le marché ! »
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill bg={RED}>pas DE lait</Pill>
              <Pill bg={RED}>un litre DE lait</Pill>
              <Pill bg={RED}>¡Te atreviste !</Pill>
            </div>
          </>
        }
      />
    </Slide>,

    // 22 — Récap
    <Slide key="s22" kicker="Récap">
      <SlideH2>Les 3 bijoux du jour</SlideH2>
      <div className="grid md:grid-cols-3 gap-5 text-left">
        {[
          { icon: <Search className="h-6 w-6 text-white" />, t: "IL Y A", s: "Para decir lo que hay.", bg: BLUE },
          { icon: <Scale className="h-6 w-6 text-white" />, t: "QUANTITÉ + DE + NOM", s: "Un kilo de tomates.", bg: NAVY },
          { icon: <Hand className="h-6 w-6 text-white" />, t: "JE VOUDRAIS", s: "Pedir con cortesía.", bg: RED },
        ].map((c, i) => (
          <Card key={c.t} className="p-6 flex flex-col">
            <div className="h-11 w-11 rounded-full grid place-items-center mb-3" style={{ background: c.bg }}>{c.icon}</div>
            <span className="text-xs font-extrabold uppercase tracking-widest mb-1" style={{ color: GOLD }}>Bijou {i + 1}</span>
            <h3 className="text-xl font-extrabold mb-1" style={{ color: NAVY }}>{c.t}</h3>
            <p className="text-sm text-slate-600">{c.s}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    // 23 — Cierre
    <Slide key="s23" kicker="À bientôt !">
      <SlideTitle>« Chez moi, il y a…<br /><span style={{ color: GOLD }}>DU COURAGE !</span> »</SlideTitle>
      <Card className="mt-8 p-6 max-w-2xl mx-auto">
        <p className="text-sm uppercase tracking-[0.3em] font-bold mb-2" style={{ color: RED }}>Ta mission cette semaine</p>
        <p className="text-lg sm:text-xl font-bold" style={{ color: NAVY }}>
          Completa el <span style={{ color: BLUE }}>Día 1</span> en la plataforma.
        </p>
      </Card>
      <p className="mt-8 text-2xl sm:text-4xl font-extrabold text-white">Merci ! À bientôt ! 🗼</p>
    </Slide>,
  ], []);

  const [i, setI] = useState(0);
  const total = slides.length;

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
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(180deg, oklch(0.42 0.075 265 / 0.78) 0%, oklch(0.32 0.08 265 / 0.9) 60%, oklch(0.28 0.08 265 / 0.95) 100%), url(${eiffelBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div className="min-h-screen flex items-center justify-center pb-28 pt-6">
        {slides[i]}
      </div>

      <img
        src={logo.url}
        alt="Liberté · Instituto de Francés"
        className="fixed bottom-3 right-3 h-9 sm:h-12 w-auto opacity-95 drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] bg-white/90 rounded-lg px-2 py-1"
      />

      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 rounded-full px-2.5 sm:px-3 py-2 shadow-2xl backdrop-blur-md max-w-[92vw]"
        style={{ background: "rgba(61,85,137,0.9)" }}
      >
        <button
          onClick={prev}
          disabled={i === 0}
          aria-label="Précédent"
          className="h-9 w-9 sm:h-10 sm:w-10 rounded-full grid place-items-center text-white transition disabled:opacity-30 hover:bg-white/15 shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-white/95 text-xs sm:text-sm font-bold tabular-nums px-2 min-w-[4.5rem] text-center">
          {i + 1} / {total}
        </span>
        <button
          onClick={next}
          disabled={i === total - 1}
          aria-label="Suivant"
          className="h-9 w-9 sm:h-10 sm:w-10 rounded-full grid place-items-center text-white transition disabled:opacity-30 hover:bg-white/15 shrink-0"
          style={{ background: i === total - 1 ? "transparent" : BLUE }}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
