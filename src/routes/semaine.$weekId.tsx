import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, Loader2, Mic, PartyPopper, Square, Volume2, Download, AlertCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { evaluateWeek, getCompletedDays, transcribeAudio, markWeeklyPdfGenerated, getMyWeeklyEvaluation } from "@/lib/week.functions";
import { generateWeeklyPdf, type WeeklyReportData } from "@/lib/weekPdf";
import { speakFr, stopFr } from "@/lib/speak";
import logo from "@/assets/liberte-logo.png.asset.json";

export const Route = createFileRoute("/semaine/$weekId")({
  head: ({ params }) => ({
    meta: [
      { title: `Le défi de la semaine ${params.weekId} · Liberté` },
      { name: "description", content: "Le défi de la semaine — celebración y balance del programa Liberté." },
    ],
  }),
  component: WeekPage,
});

/* ================= Content: Semaine 1 — 3 variantes ================= */

type Variant = {
  co: { audio: string; question: string; options: string[]; correct: number }[];
  ce: { text: string; items: { question: string; options: string[]; correct: number }[] };
  pe: { prompt: string }[];
  po: { prompt: string; expected?: string }[];
};

const VARIANTS: Variant[] = [
  {
    co: [
      { audio: "Bonjour, vous désirez ? — Je voudrais un café au lait et deux croissants, s'il vous plaît.", question: "¿Qué pide el cliente?", options: ["un té y una tarta", "un café con leche y 2 croissants", "dos cafés"], correct: 1 },
      { audio: "Sur place ou à emporter ?", question: "¿Qué pregunta el camarero?", options: ["si paga con tarjeta", "para aquí o para llevar", "si quiere azúcar"], correct: 1 },
      { audio: "Alors, ça fait sept euros cinquante.", question: "¿Cuánto debe pagar?", options: ["6,50 €", "7,50 €", "17 €"], correct: 1 },
    ],
    ce: {
      text: "MENU DU JOUR — 15 € : une entrée + un plat + un dessert. Les boissons ne sont pas comprises. Supplément fromage : 2 €. Fait maison !",
      items: [
        { question: "¿Qué incluye el menú?", options: ["entrada + plato + postre", "solo plato", "plato + bebida"], correct: 0 },
        { question: "¿Las bebidas están incluidas?", options: ["no", "sí", "solo el agua"], correct: 0 },
        { question: "¿Cuánto cuesta el suplemento de queso?", options: ["2 €", "15 €", "es gratis"], correct: 0 },
      ],
    },
    pe: [
      { prompt: "Escribe tu pedido completo con cortesía: una bebida + una comida + « s'il vous plaît »." },
      { prompt: "Haz esta frase más cortés en francés: « Je veux un thé. »" },
    ],
    po: [
      { prompt: "Lectura en voz alta (diagnóstico de pronunciación). Lee tal cual:", expected: "Je voudrais un croissant et une baguette, s'il vous plaît. L'addition, s'il vous plaît ! Un café sans sucre, avec un peu de lait." },
      { prompt: "Mini situación (30-45 seg): estás en una cafetería de París. Pide tu desayuno completo (bebida + comida + una modificación sans/avec) y pregunta cómo pagar." },
    ],
  },
  {
    co: [
      { audio: "Bonjour ! Un thé vert et une tarte aux pommes, s'il vous plaît.", question: "¿Qué pide el cliente?", options: ["un café y un croissant", "un té verde y una tarta de manzana", "un chocolate caliente"], correct: 1 },
      { audio: "Vous payez comment ? Par carte ou en espèces ?", question: "¿Qué pregunta el camarero?", options: ["cómo va a pagar", "si quiere hielo", "si es para llevar"], correct: 0 },
      { audio: "Ça fait douze euros vingt, s'il vous plaît.", question: "¿Cuánto debe pagar?", options: ["2,20 €", "12,20 €", "12 €"], correct: 1 },
    ],
    ce: {
      text: "CAFÉ LIBERTÉ — Petit déjeuner à 8 € : un café ou un thé + une viennoiserie + un jus d'orange. Ouvert du lundi au samedi, 7h-11h. Wifi gratuit.",
      items: [
        { question: "¿Cuánto cuesta el desayuno?", options: ["7 €", "8 €", "11 €"], correct: 1 },
        { question: "¿Qué incluye la bebida caliente?", options: ["café o té", "solo café", "chocolate"], correct: 0 },
        { question: "¿Está abierto el domingo?", options: ["sí", "no", "solo por la mañana"], correct: 1 },
      ],
    },
    pe: [
      { prompt: "Pide con cortesía en francés: un té con leche y sin azúcar, para llevar." },
      { prompt: "Haz esta frase más cortés en francés: « Donne-moi l'addition. »" },
    ],
    po: [
      { prompt: "Lectura en voz alta (diagnóstico de pronunciación). Lee tal cual:", expected: "Bonjour ! Je voudrais un thé avec du lait, sans sucre, s'il vous plaît. C'est pour emporter. Merci beaucoup !" },
      { prompt: "Mini situación (30-45 seg): entras en una boulangerie de París. Saluda, pide una baguette y dos croissants, pregunta el precio y despídete." },
    ],
  },
  {
    co: [
      { audio: "Bonjour, je voudrais un chocolat chaud et un pain au chocolat, s'il vous plaît.", question: "¿Qué pide el cliente?", options: ["un café y un croissant", "un chocolate caliente y un pain au chocolat", "un té y una tarta"], correct: 1 },
      { audio: "Avec du sucre ou sans sucre ?", question: "¿Qué pregunta el camarero?", options: ["con o sin azúcar", "grande o pequeño", "frío o caliente"], correct: 0 },
      { audio: "Ça fait cinq euros quatre-vingts.", question: "¿Cuánto debe pagar?", options: ["5,80 €", "4,80 €", "15,80 €"], correct: 0 },
    ],
    ce: {
      text: "BOULANGERIE DU COIN — Baguette tradition : 1,20 €. Croissant au beurre : 1,50 €. Pain au chocolat : 1,80 €. Fermé le mardi. Ouvert de 7h à 20h.",
      items: [
        { question: "¿Cuánto cuesta la baguette tradition?", options: ["1,20 €", "1,50 €", "2 €"], correct: 0 },
        { question: "¿Qué día está cerrada?", options: ["el lunes", "el martes", "el domingo"], correct: 1 },
        { question: "¿A qué hora abre?", options: ["a las 6h", "a las 7h", "a las 8h"], correct: 1 },
      ],
    },
    pe: [
      { prompt: "Escribe una frase cortés para pedir dos cafés y un vaso de agua." },
      { prompt: "Haz esta frase más cortés en francés: « Je veux payer par carte. »" },
    ],
    po: [
      { prompt: "Lectura en voz alta (diagnóstico de pronunciación). Lee tal cual:", expected: "Bonjour ! Je voudrais deux cafés et un pain au chocolat, s'il vous plaît. Sur place, merci. L'addition, s'il vous plaît !" },
      { prompt: "Mini situación (30-45 seg): estás en un café parisino con un amigo. Saluda, pide dos bebidas diferentes con una modificación (sans/avec) y pregunta si aceptan tarjeta." },
    ],
  },
];

function pickVariantIdx(weekNumber: number): number {
  const key = `liberte_week${weekNumber}_variant`;
  let idx = 0;
  if (typeof window !== "undefined") {
    const stored = window.sessionStorage.getItem(key);
    if (stored !== null) {
      idx = Number(stored);
    } else {
      idx = Math.floor(Math.random() * VARIANTS.length);
      window.sessionStorage.setItem(key, String(idx));
    }
  }
  return idx % VARIANTS.length;
}


/* ================= Page ================= */

function WeekPage() {
  const { weekId } = Route.useParams();
  const weekNumber = Number(weekId);
  const { user, loading, fullName, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [gateLoading, setGateLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [existing, setExisting] = useState<Awaited<ReturnType<typeof getMyWeeklyEvaluation>> | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      try {
        const [days, prev] = await Promise.all([
          getCompletedDays(),
          getMyWeeklyEvaluation({ data: { weekNumber } }),
        ]);
        const need = weekNumber === 1 ? 5 : 5;
        const ok = isAdmin || (weekNumber === 1 ? days.includes(need) : false);
        setUnlocked(ok);
        setExisting(prev);
      } catch {
        setUnlocked(isAdmin);
      } finally {
        setGateLoading(false);
      }
    })();
  }, [loading, user, weekNumber, isAdmin]);

  if (loading || gateLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1b3a]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <Link to="/liberte-log-in-983749824923465723" className="text-blue underline">Inicia sesión</Link>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <div className="rounded-3xl border-2 border-gold/40 bg-white p-8 text-center shadow-card">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-navy text-white">🎉</div>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-navy">Le défi de la semaine te espera</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Termina el <strong>Défi Final del Día 5</strong> para abrir <strong>Le défi de la semaine 1</strong> y celebrar tu progreso.
          </p>
          <Button onClick={() => navigate({ to: "/day/$dayId", params: { dayId: "5" } })} className="mt-6 bg-gradient-blue text-white">
            Ir al Día 5
          </Button>
        </div>
      </div>
    );
  }

  const studentName =
    (fullName && fullName.split(" ")[0]) ||
    (user?.email ? user.email.split("@")[0] : "Alumno");

  return <WeekTest weekNumber={weekNumber} studentName={fullName || studentName} previous={existing} />;
}

/* ================= Test flow ================= */

type Block = "intro" | "CO" | "CE" | "PE" | "PO" | "eval" | "result";

function WeekTest({ weekNumber, studentName, previous }: { weekNumber: number; studentName: string; previous: Awaited<ReturnType<typeof getMyWeeklyEvaluation>> | null }) {
  const { user } = useAuth();
  const [variantIdx, setVariantIdx] = useState(() => pickVariantIdx(weekNumber));
  const V = VARIANTS[variantIdx % VARIANTS.length];
  const [block, setBlock] = useState<Block>(previous ? "result" : "intro");
  const [coAnswers, setCoAnswers] = useState<number[]>(Array(V.co.length).fill(-1));
  const [ceAnswers, setCeAnswers] = useState<number[]>(Array(V.ce.items.length).fill(-1));
  const [peAnswers, setPeAnswers] = useState<string[]>(Array(V.pe.length).fill(""));
  const [, setPoTranscripts] = useState<string[]>(Array(V.po.length).fill(""));
  const [poBlobs, setPoBlobs] = useState<(Blob | null)[]>(Array(V.po.length).fill(null));
  const [evalRes, setEvalRes] = useState<Awaited<ReturnType<typeof evaluateWeek>> | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => () => { stopFr(); }, []);

  // Resume an in-progress test (answers + step + variant) from the DB so a
  // refresh or another device doesn't wipe the student's work. Audio
  // recordings can't be persisted this way, so PO re-records if needed.
  useEffect(() => {
    if (previous || !user) {
      setHydrated(true);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase
          .from("week_state")
          .select("state")
          .eq("user_id", user.id)
          .eq("week_number", weekNumber)
          .maybeSingle();
        if (!alive) return;
        const s = (data?.state ?? null) as Record<string, unknown> | null;
        if (s && typeof s === "object") {
          const savedIdx = typeof s.variantIdx === "number" ? s.variantIdx % VARIANTS.length : variantIdx;
          const NV = VARIANTS[savedIdx];
          const fitNum = (arr: unknown, len: number) =>
            Array.from({ length: len }, (_, i) => (Array.isArray(arr) && typeof arr[i] === "number" ? (arr[i] as number) : -1));
          const fitStr = (arr: unknown, len: number) =>
            Array.from({ length: len }, (_, i) => (Array.isArray(arr) && typeof arr[i] === "string" ? (arr[i] as string) : ""));
          setVariantIdx(savedIdx);
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(`liberte_week${weekNumber}_variant`, String(savedIdx));
          }
          setCoAnswers(fitNum(s.coAnswers, NV.co.length));
          setCeAnswers(fitNum(s.ceAnswers, NV.ce.items.length));
          setPeAnswers(fitStr(s.peAnswers, NV.pe.length));
          const blocks: Block[] = ["intro", "CO", "CE", "PE", "PO"];
          if (typeof s.block === "string" && blocks.includes(s.block as Block)) {
            setBlock(s.block as Block);
          } else if (s.block === "eval" || s.block === "result") {
            // Mid-eval snapshots can't resume into grading; back to the last step.
            setBlock("PO");
          }
        }
      } catch {
        // Table may not exist yet or fetch failed — start fresh.
      } finally {
        if (alive) setHydrated(true);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previous, user, weekNumber]);

  // Debounced autosave of the in-progress test.
  useEffect(() => {
    if (!hydrated || !user || previous || evalRes || block === "eval" || block === "result") return;
    const t = setTimeout(() => {
      void supabase.from("week_state").upsert(
        {
          user_id: user.id,
          week_number: weekNumber,
          state: { variantIdx, block, coAnswers, ceAnswers, peAnswers },
        },
        { onConflict: "user_id,week_number" },
      );
    }, 500);
    return () => clearTimeout(t);
  }, [hydrated, user, previous, evalRes, block, variantIdx, coAnswers, ceAnswers, peAnswers, weekNumber]);

  const percentByBlock: Record<Block, number> = { intro: 0, CO: 20, CE: 40, PE: 60, PO: 80, eval: 95, result: 100 };

  const submitAll = async () => {
    setBusy(true);
    setError("");
    try {
      setBusyMsg("Transcribiendo tus grabaciones…");
      const transcripts: string[] = [];
      for (let i = 0; i < V.po.length; i++) {
        const blob = poBlobs[i];
        if (!blob) throw new Error(`Falta grabar la tarea oral ${i + 1}`);
        setBusyMsg(`Transcribiendo audio ${i + 1} de ${V.po.length}…`);
        const b64 = await blobToBase64(blob);
        const r = await transcribeAudio({ data: { audioBase64: b64, mimeType: blob.type || "audio/webm" } });
        transcripts.push(r.text);
      }
      setPoTranscripts(transcripts);
      setBusyMsg("Evaluando tu semana con la profesora IA…");
      setBlock("eval");
      const res = await evaluateWeek({
        data: {
          weekNumber,
          co: {
            correct: coAnswers.reduce((a, ans, i) => a + (ans === V.co[i].correct ? 1 : 0), 0),
            total: V.co.length,
          },
          ce: {
            correct: ceAnswers.reduce((a, ans, i) => a + (ans === V.ce.items[i].correct ? 1 : 0), 0),
            total: V.ce.items.length,
          },
          pe: V.pe.map((p, i) => ({ prompt: p.prompt, response: peAnswers[i] })),
          po: V.po.map((p, i) => ({ prompt: p.prompt, expected: p.expected ?? "", transcript: transcripts[i] })),
        },
      });
      setEvalRes(res);
      setBlock("result");
      // The evaluation is saved server-side; drop the in-progress snapshot.
      if (user) {
        void supabase
          .from("week_state")
          .delete()
          .eq("user_id", user.id)
          .eq("week_number", weekNumber);
      }
      if (res.weeklyScore >= 8.5) fireConfetti();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      setBlock("PO");
    } finally {
      setBusy(false);
      setBusyMsg("");
    }
  };

  // Previous evaluation display shortcut
  const cachedEval = useMemo(() => {
    if (!previous) return null;
    const ai = previous.ai_report as unknown as WeeklyReportData & {
      verdict_key: string; verdict_title: string; verdict_message: string;
      strengths: { title: string; example: string }[];
      common_errors: { said: string; corrected: string; rule: string }[];
      improvements: string[]; pronunciation: { word: string; heard: string; target: string; tip: string }[];
      coach_summary: string;
    };
    return {
      weeklyScore: Number(previous.weekly_score),
      testScore: Number(previous.test_score),
      historyScore: 0,
      compScores: previous.test_scores as { CO: number; CE: number; PE: number; PO: number },
      report: {
        verdict_title: ai.verdict_title, verdict_message: ai.verdict_message,
        strengths: ai.strengths ?? [], common_errors: ai.common_errors ?? [],
        improvements: ai.improvements ?? [], pronunciation: ai.pronunciation ?? [],
        coach_summary: ai.coach_summary ?? "",
      },
      daysCompleted: 5,
    };
  }, [previous]);

  const shown = evalRes ?? cachedEval;

  return (
    <div className="min-h-screen bg-ice pb-20">
      <header className="sticky top-0 z-30 border-b border-border bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/liberte-plataforma-834798234728482934254-student" className="inline-flex items-center gap-1 text-xs font-semibold text-navy/70 hover:text-navy">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <img src={logo.url} alt="Liberté" className="h-9 w-auto" />
          <div className="text-xs font-bold text-navy">Semaine {weekNumber}</div>
        </div>
        <div className="h-1 w-full bg-ice">
          <div className="h-full bg-gradient-to-r from-blue to-gold transition-all" style={{ width: `${percentByBlock[block]}%` }} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {block === "intro" && (
          <div className="rounded-3xl border-2 border-gold/40 bg-white p-8 shadow-card">
            <p className="text-xs font-bold tracking-widest text-gold uppercase">🎉 Le défi de la semaine</p>
            <h1 className="mt-2 font-display text-4xl font-extrabold text-navy">Semaine {weekNumber} · Mois 1 : J'OSE 🗼</h1>
            <p className="mt-3 text-sm text-navy/80">
              ¡Bravo por llegar hasta aquí! Esta es tu <strong>fiesta de fin de semana</strong>: 4 mini retos cortos (10-12 min)
              para descubrir todo lo que ya sabes decir en francés. Al terminar recibirás tu <strong>nota semanal</strong>,
              tu <strong>veredicto cálido</strong> y podrás descargar tu <strong>informe PDF</strong> para tu coach.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-navy/90">
              <li>🔊 Reto 1 · Escucho — 3 audios</li>
              <li>📖 Reto 2 · Leo — 1 texto + 3 preguntas</li>
              <li>✍️ Reto 3 · Escribo — 2 tareas</li>
              <li>🎙️ Reto 4 · Hablo — 2 grabaciones</li>
            </ul>
            <Button onClick={() => setBlock("CO")} className="mt-6 bg-gradient-blue text-white font-extrabold">
              ¡Comenzar mi Fête! <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {block === "CO" && (
          <BlockCO items={V.co} answers={coAnswers} setAnswers={setCoAnswers} onNext={() => setBlock("CE")} />
        )}
        {block === "CE" && (
          <BlockCE text={V.ce.text} items={V.ce.items} answers={ceAnswers} setAnswers={setCeAnswers} onBack={() => setBlock("CO")} onNext={() => setBlock("PE")} />
        )}
        {block === "PE" && (
          <BlockPE items={V.pe} answers={peAnswers} setAnswers={setPeAnswers} onBack={() => setBlock("CE")} onNext={() => setBlock("PO")} />
        )}
        {block === "PO" && (
          <BlockPO
            items={V.po}
            blobs={poBlobs}
            setBlobs={setPoBlobs}
            onBack={() => setBlock("PE")}
            onSubmit={submitAll}
            busy={busy}
            error={error}
          />
        )}
        {block === "eval" && (
          <div className="rounded-3xl border border-border bg-white p-10 text-center shadow-card">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue" />
            <p className="mt-4 font-display text-lg font-extrabold text-navy">{busyMsg || "Preparando tu Fête…"}</p>
            <p className="mt-1 text-xs text-muted-foreground">Puede tardar un minuto — no cierres esta pestaña.</p>
          </div>
        )}
        {block === "result" && shown && (
          <ResultView data={shown} studentName={studentName} weekNumber={weekNumber} />
        )}
      </main>
    </div>
  );
}

/* ================= Blocks ================= */

type CoItem = Variant["co"][number];
type CeItem = Variant["ce"]["items"][number];
type PeItem = Variant["pe"][number];
type PoItem = Variant["po"][number];

function BlockCO({ items, answers, setAnswers, onNext }: { items: CoItem[]; answers: number[]; setAnswers: (a: number[]) => void; onNext: () => void }) {
  const [plays, setPlays] = useState<number[]>(Array(items.length).fill(0));
  const canPlay = (i: number) => plays[i] < 2;
  const doPlay = (i: number) => {
    if (!canPlay(i)) return;
    speakFr(items[i].audio);
    setPlays((p) => p.map((v, k) => (k === i ? v + 1 : v)));
  };
  const done = answers.every((a) => a >= 0);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Reto 1" title="🔊 Escucho" subtitle="Escucha (máx. 2 veces) y elige la respuesta." />
      {items.map((it, i) => (
        <div key={i} className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <button
              onClick={() => doPlay(i)}
              disabled={!canPlay(i)}
              className="grid h-12 w-12 place-items-center rounded-full bg-gradient-blue text-white disabled:opacity-40"
            >
              <Volume2 className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <p className="text-xs font-bold tracking-widest text-navy/60 uppercase">Audio {i + 1}</p>
              <p className="text-xs text-muted-foreground">Escuchas restantes: {2 - plays[i]}</p>
            </div>
          </div>
          <p className="mt-4 font-display text-base font-bold text-navy">{it.question}</p>
          <div className="mt-3 grid gap-2">
            {it.options.map((op, k) => (
              <button
                key={k}
                onClick={() => setAnswers(answers.map((a, x) => (x === i ? k : a)))}
                className={`rounded-xl border p-3 text-left text-sm transition ${
                  answers[i] === k ? "border-blue bg-blue/5 font-bold text-navy" : "border-border hover:border-blue/40"
                }`}
              >
                {op}
              </button>
            ))}
          </div>
        </div>
      ))}
      <NavButtons rightDisabled={!done} onNext={onNext} />
    </div>
  );
}

function BlockCE({ text, items, answers, setAnswers, onBack, onNext }: { text: string; items: CeItem[]; answers: number[]; setAnswers: (a: number[]) => void; onBack: () => void; onNext: () => void }) {
  const done = answers.every((a) => a >= 0);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Reto 2" title="📖 Leo" subtitle="Lee el texto y contesta las 3 preguntas." />
      <div className="rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-white to-ice p-6 shadow-soft">
        <p className="font-display text-base leading-relaxed text-navy">{text}</p>
      </div>
      {items.map((it, i) => (
        <div key={i} className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <p className="font-display text-base font-bold text-navy">{it.question}</p>
          <div className="mt-3 grid gap-2">
            {it.options.map((op, k) => (
              <button
                key={k}
                onClick={() => setAnswers(answers.map((a, x) => (x === i ? k : a)))}
                className={`rounded-xl border p-3 text-left text-sm transition ${
                  answers[i] === k ? "border-blue bg-blue/5 font-bold text-navy" : "border-border hover:border-blue/40"
                }`}
              >
                {op}
              </button>
            ))}
          </div>
        </div>
      ))}
      <NavButtons onBack={onBack} onNext={onNext} rightDisabled={!done} />
    </div>
  );
}

function BlockPE({ items, answers, setAnswers, onBack, onNext }: { items: PeItem[]; answers: string[]; setAnswers: (a: string[]) => void; onBack: () => void; onNext: () => void }) {
  const done = answers.every((a) => a.trim().length >= 3);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Reto 3" title="✍️ Escribo" subtitle="Escribe en francés. La IA corregirá tus dos frases al final." />
      {items.map((it, i) => (
        <div key={i} className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <p className="text-xs font-bold tracking-widest text-navy/60 uppercase">Tarea {i + 1}</p>
          <p className="mt-1 font-display text-base font-bold text-navy">{it.prompt}</p>
          <Input
            value={answers[i]}
            onChange={(e) => setAnswers(answers.map((v, x) => (x === i ? e.target.value : v)))}
            placeholder="Écris ta réponse en français…"
            className="mt-3"
          />
        </div>
      ))}
      <NavButtons onBack={onBack} onNext={onNext} rightDisabled={!done} />
    </div>
  );
}

function BlockPO({ items, blobs, setBlobs, onBack, onSubmit, busy, error }: {
  items: PoItem[];
  blobs: (Blob | null)[]; setBlobs: (b: (Blob | null)[]) => void;
  onBack: () => void; onSubmit: () => void; busy: boolean; error: string;
}) {
  const done = blobs.every(Boolean);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Reto 4" title="🎙️ Hablo" subtitle="Graba tus dos respuestas. La IA analizará tu pronunciación." />
      {items.map((it, i) => (
        <SpeakingItem
          key={i}
          index={i}
          prompt={it.prompt}

          expected={it.expected}
          blob={blobs[i]}
          onBlob={(b) => setBlobs(blobs.map((x, k) => (k === i ? b : x)))}
        />
      ))}
      {error && (
        <div className="rounded-2xl border border-red/40 bg-red/5 p-4 text-sm text-red">
          <AlertCircle className="mr-2 inline h-4 w-4" /> {error}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <Button variant="ghost" onClick={onBack} disabled={busy}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Volver
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!done || busy}
          className="bg-gradient-to-r from-gold to-[oklch(0.78_0.14_80)] text-navy font-extrabold shadow-card"
        >
          {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluando…</> : <>Terminar mi Fête <ArrowRight className="ml-2 h-4 w-4" /></>}
        </Button>
      </div>
    </div>
  );
}

function SpeakingItem({ index, prompt, expected, blob, onBlob }: {
  index: number; prompt: string; expected?: string; blob: Blob | null; onBlob: (b: Blob) => void;
}) {
  const [rec, setRec] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const r = new MediaRecorder(stream);
    chunksRef.current = [];
    r.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    r.onstop = () => {
      const b = new Blob(chunksRef.current, { type: r.mimeType || "audio/webm" });
      onBlob(b);
      stream.getTracks().forEach((t) => t.stop());
      setRec(false);
      recRef.current = null;
    };
    recRef.current = r;
    r.start();
    setRec(true);
  };
  const stop = () => recRef.current?.stop();

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
      <p className="text-xs font-bold tracking-widest text-navy/60 uppercase">Tarea oral {index + 1}</p>
      <p className="mt-1 font-display text-base font-bold text-navy">{prompt}</p>
      {expected && (
        <div className="mt-2 rounded-xl bg-ice p-3 text-sm italic text-navy/90">« {expected} »</div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={rec ? stop : start}
          className={`grid h-14 w-14 place-items-center rounded-full text-white shadow-card transition ${
            rec ? "bg-red animate-pulse" : blob ? "bg-gold text-navy" : "bg-gradient-blue hover:scale-105"
          }`}
        >
          {rec ? <Square className="h-6 w-6" /> : blob ? <Check className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>
        {url && <audio src={url} controls className="max-w-xs flex-1" />}
      </div>
    </div>
  );
}

/* ================= Result ================= */

function ResultView({ data, studentName, weekNumber }: {
  data: {
    weeklyScore: number; testScore: number; historyScore?: number;
    compScores: { CO: number; CE: number; PE: number; PO: number };
    daysCompleted: number;
    report: {
      verdict_title: string; verdict_message: string;
      strengths: { title: string; example: string }[];
      common_errors: { said: string; corrected: string; rule: string }[];
      improvements: string[];
      pronunciation: { word: string; heard: string; target: string; tip: string }[];
      coach_summary: string;
    };
  };
  studentName: string;
  weekNumber: number;
}) {
  const [downloading, setDownloading] = useState(false);
  const r = data.report;

  const download = async () => {
    setDownloading(true);
    try {
      const doc = generateWeeklyPdf({
        studentName,
        weekNumber,
        monthLabel: "Mois 1 : J'OSE",
        daysCompleted: data.daysCompleted,
        daysTotal: 5,
        weeklyScore: data.weeklyScore,
        compScores: data.compScores,
        strengths: r.strengths,
        commonErrors: r.common_errors,
        improvements: r.improvements,
        pronunciation: r.pronunciation,
        coachSummary: r.coach_summary,
        verdict: { title: r.verdict_title, message: r.verdict_message },
      });
      doc.save(`Liberte_Informe_Semana${weekNumber}_${studentName.replace(/\s+/g, "_")}.pdf`);
      try { await markWeeklyPdfGenerated({ data: { weekNumber } }); } catch { /* ignore */ }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-[oklch(0.32_0.08_265)] to-[oklch(0.42_0.09_265)] p-8 text-white shadow-card">
        <div className="flex items-center gap-2">
          <PartyPopper className="h-6 w-6 text-gold" />
          <p className="text-xs font-bold tracking-widest text-gold uppercase">Tu veredicto</p>
        </div>
        <h1 className="mt-2 font-display text-4xl font-extrabold">{r.verdict_title}</h1>
        <p className="mt-2 text-white/85">{r.verdict_message}</p>
        <div className="mt-5 flex items-baseline gap-2">
          <span className="font-display text-6xl font-extrabold text-gold">{data.weeklyScore.toFixed(1)}</span>
          <span className="text-lg text-white/80">/ 10</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {(["CO", "CE", "PE", "PO"] as const).map((k) => (
          <div key={k} className="rounded-2xl border border-border bg-white p-4 text-center shadow-soft">
            <p className="text-xs font-bold tracking-widest text-navy/60 uppercase">{k}</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-navy">{Number(data.compScores[k] ?? 0).toFixed(1)}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-success/30 bg-success/5 p-5">
        <p className="font-display text-lg font-extrabold text-success">✨ Mis puntos fuertes</p>
        <ul className="mt-2 space-y-2 text-sm text-navy/90">
          {r.strengths.map((s, i) => (
            <li key={i}><strong>{s.title}</strong> — <em className="text-navy/70">« {s.example} »</em></li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-red/30 bg-red/5 p-5">
        <p className="font-display text-lg font-extrabold text-red">⚠️ Errores comunes</p>
        <ul className="mt-2 space-y-3 text-sm">
          {r.common_errors.map((e, i) => (
            <li key={i} className="text-navy/90">
              <span className="text-muted-foreground">Dijo:</span> « {e.said} » <br />
              <span className="text-muted-foreground">→ Correcto:</span> <strong className="text-navy">« {e.corrected} »</strong>
              <div className="text-xs italic text-muted-foreground">Regla: {e.rule}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-blue/30 bg-blue/5 p-5">
        <p className="font-display text-lg font-extrabold text-blue">🎯 Dónde mejorar</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-navy/90">
          {r.improvements.map((im, i) => <li key={i}>{im}</li>)}
        </ul>
      </div>

      <div className="rounded-2xl border border-gold/40 bg-gold/10 p-5">
        <p className="font-display text-lg font-extrabold text-navy">🔊 Mi pronunciación</p>
        <ul className="mt-2 space-y-2 text-sm text-navy/90">
          {r.pronunciation.map((p, i) => (
            <li key={i}>
              <strong>{p.word}</strong> — sonó: <em>{p.heard}</em> · debe sonar: <em>{p.target}</em>
              <div className="text-xs text-muted-foreground">💡 {p.tip}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-3xl border-2 border-gold/40 bg-white p-6 text-center shadow-card">
        <p className="font-display text-lg font-extrabold text-navy">📄 Descarga tu informe semanal</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Envía este informe a tu Coach para continuar tu seguimiento personalizado.
        </p>
        <Button
          onClick={download}
          disabled={downloading}
          className="mt-4 bg-gradient-to-r from-gold to-[oklch(0.78_0.14_80)] text-navy font-extrabold shadow-card"
        >
          {downloading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando…</> : <><Download className="mr-2 h-4 w-4" /> Descargar mi informe Semanal</>}
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">
          Envíalo por WhatsApp a tu coach Alejandra Miranda: <strong className="text-navy">+591 72586663</strong>
        </p>
      </div>
    </div>
  );
}

/* ================= Helpers ================= */

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-navy to-blue-deep p-6 text-white shadow-card">
      <p className="text-xs font-bold tracking-widest text-gold uppercase">{eyebrow}</p>
      <h2 className="mt-1 font-display text-3xl font-extrabold">{title}</h2>
      <p className="mt-1 text-sm text-white/85">{subtitle}</p>
    </div>
  );
}

function NavButtons({ onBack, onNext, rightDisabled }: { onBack?: () => void; onNext: () => void; rightDisabled?: boolean }) {
  return (
    <div className="flex items-center justify-between pt-2">
      {onBack ? (
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" /> Volver</Button>
      ) : <span />}
      <Button onClick={onNext} disabled={rightDisabled} className="bg-gradient-blue text-white font-extrabold">
        Continuar <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || "");
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

function fireConfetti() {
  const end = Date.now() + 1500;
  const colors = ["#4BB1EC", "#3D5589", "#C9A84C", "#EDF8FC"];
  const frame = () => {
    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors });
}
