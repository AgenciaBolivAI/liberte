import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsStaff } from "@/lib/use-staff";
import { RecordedClassesManager } from "@/components/RecordedClassesManager";
import { TopNav } from "@/components/TopNav";
import { Lock, ArrowRight, Play } from "lucide-react";
import eiffelBg from "@/assets/paris-eiffel-bg.jpg";

export const Route = createFileRoute("/clasesenvivo/")({
  head: () => ({
    meta: [
      { title: "Clases en Vivo · Liberté" },
      {
        name: "description",
        content:
          "Biblioteca de todas las clases en vivo del programa Liberté: 6 meses, 8 clases por mes y talleres inmersivos.",
      },
    ],
  }),
  component: ClasesEnVivoHub,
});

// Brand tokens
const NAVY = "#3D5589";
const CREAM = "#FAF7F2";
const BLUE = "#73ACDB";
const RED = "#C44536";

type ClassCard = {
  code: string;
  title: string;
  semaine: string;
  to?: string;
  cover: { grad: string; emoji: string };
  locked?: boolean;
};

const MES1_CLASSES: ClassCard[] = [
  {
    code: "M1C1",
    title: "Primera clase",
    semaine: "Semaine 1",
    to: "/clasesenvivo/m1c1",
    cover: { grad: "linear-gradient(135deg,#3D5589,#73ACDB)", emoji: "🥖" },
  },
  {
    code: "M1C2",
    title: "L'Art du Service : Le Client Difficile",
    semaine: "Semaine 1",
    to: "/clasesenvivo/m1c2",
    cover: { grad: "linear-gradient(135deg,#C44536,#E8846F)", emoji: "🍽️" },
  },
  {
    code: "M1C3",
    title: "Le GPS Humain : S'orienter avec Précision",
    semaine: "Semaine 2",
    to: "/clasesenvivo/m1c3",
    cover: { grad: "linear-gradient(135deg,#3D5589,#5A78B5)", emoji: "🗺️" },
  },
  {
    code: "M1C4",
    title: "La Course au Supermarché",
    semaine: "Semaine 2",
    to: "/clasesenvivo/m1c4",
    cover: { grad: "linear-gradient(135deg,#73ACDB,#B5D4EE)", emoji: "🛒" },
  },
  {
    code: "M1C5",
    title: "Le Diagnostic Médical",
    semaine: "Semaine 3",
    to: "/clasesenvivo/m1c5",
    cover: { grad: "linear-gradient(135deg,#5A78B5,#9BCBEF)", emoji: "🩺" },
  },
  {
    code: "M1C6",
    title: "Comparateur de Boutiques",
    semaine: "Semaine 3",
    to: "/clasesenvivo/m1c6",
    cover: { grad: "linear-gradient(135deg,#C44536,#F0A090)", emoji: "🛍️" },
  },
  {
    code: "M1C7",
    title: "Le Défi des 3 Repas",
    semaine: "Semaine 4",
    to: "/clasesenvivo/m1c7",
    cover: { grad: "linear-gradient(135deg,#3D5589,#C44536)", emoji: "🥐" },
  },
  {
    code: "M1C8",
    title: "J'OSE : Le Grand Final",
    semaine: "Semaine 4",
    to: "/clasesenvivo/m1c8",
    cover: { grad: "linear-gradient(135deg,#3D5589,#4BB1EC)", emoji: "🗼" },
  },
];

const MONTHS = [
  { id: 1, label: "MES 1 · J'OSE", unlocked: true },
  { id: 2, label: "MES 2 · JE VIS", unlocked: false },
  { id: 3, label: "MES 3 · JE CRÉE", unlocked: false },
  { id: 4, label: "MES 4 · JE PARLE", unlocked: false },
  { id: 5, label: "MES 5 · JE VOYAGE", unlocked: false },
  { id: 6, label: "MES 6 · JE SUIS LIBRE", unlocked: false },
];

const TALLERES: { code: string; title: string; to?: string; emoji: string }[] = [
  { code: "Taller 1", title: "Le Présent", to: "/clasesenvivo/taller1", emoji: "✍️" },
  { code: "Taller 2", title: "Próximamente", emoji: "🎯" },
  { code: "Taller 3", title: "Próximamente", emoji: "🎯" },
  { code: "Taller 4", title: "Próximamente", emoji: "🎯" },
];

type RecordedClass = {
  number: number;
  date: string;
  title: string;
  href?: string;
};

const RECORDED_CLASSES: RecordedClass[] = [
  {
    number: 1,
    date: "13 de julio",
    title: "Clase Europa #1",
    href: "https://fathom.video/share/puz62HVHjw4z5rxVtthvTD3BxmWnuvBZ",
  },
  {
    number: 1,
    date: "13 de julio",
    title: "Clase Latam #1",
    href: "https://fathom.video/share/mRN6oHue1g6c1Xy7B2RPowyaFPFdnKCA",
  },
  {
    number: 2,
    date: "15 de julio",
    title: "Clase Europa #2",
    href: "https://fathom.video/share/TiL-9or41myitN_bsuKuk9Q5XfKf4_zd",
  },
  { number: 2, date: "Próximamente", title: "Por confirmar" },
  { number: 3, date: "Próximamente", title: "Por confirmar" },
  { number: 3, date: "Próximamente", title: "Por confirmar" },
  { number: 4, date: "Próximamente", title: "Por confirmar" },
  { number: 4, date: "Próximamente", title: "Por confirmar" },
];

function Cover({ card }: { card: ClassCard }) {
  return (
    <div
      className="relative h-32 sm:h-36 w-full flex items-center justify-center overflow-hidden"
      style={{
        background: card.locked
          ? "linear-gradient(135deg,#9CA3AF,#D1D5DB)"
          : card.cover.grad,
      }}
    >
      <span
        className={`text-5xl sm:text-6xl drop-shadow-lg ${card.locked ? "opacity-40 grayscale" : ""}`}
      >
        {card.cover.emoji}
      </span>
      {card.locked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-11 w-11 rounded-full bg-white/90 grid place-items-center shadow-lg">
            <Lock className="h-5 w-5" style={{ color: NAVY }} />
          </div>
        </div>
      )}
    </div>
  );
}

function ClassTile({ card }: { card: ClassCard }) {
  const inner: ReactNode = (
    <div
      className={`group relative flex flex-col rounded-2xl overflow-hidden border shadow-md bg-white transition-all ${
        card.locked
          ? "opacity-80 cursor-not-allowed"
          : "hover:shadow-xl hover:-translate-y-1"
      }`}
      style={{ borderColor: "rgba(61,85,137,0.15)" }}
    >
      <Cover card={card} />
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
            style={{ background: card.locked ? "#9CA3AF" : NAVY }}
          >
            {card.code}
          </span>
          <span className="text-[11px] font-semibold" style={{ color: BLUE }}>
            {card.semaine}
          </span>
        </div>
        <h3
          className="text-sm sm:text-base font-extrabold leading-snug min-h-[2.5rem]"
          style={{ color: NAVY }}
        >
          {card.title}
        </h3>
        <div className="mt-auto pt-2">
          {card.locked ? (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
              style={{ color: "#6B7280" }}
            >
              <Lock className="h-3.5 w-3.5" /> Próximamente
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full text-white group-hover:gap-2 transition-all"
              style={{ background: RED }}
            >
              Entrar a la clase <ArrowRight className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (card.locked || !card.to) return inner;
  return (
    <Link to={card.to} className="block h-full">
      {inner}
    </Link>
  );
}

function RecordedClassTile({ cls }: { cls: RecordedClass }) {
  const active = Boolean(cls.href);
  const inner = (
    <div
      className={`flex flex-col rounded-2xl overflow-hidden border shadow-md bg-white transition-all ${
        active ? "hover:shadow-xl hover:-translate-y-1" : "opacity-80 cursor-not-allowed"
      }`}
      style={{ borderColor: "rgba(61,85,137,0.15)" }}
    >
      <div
        className="h-28 flex items-center justify-center"
        style={{
          background: active
            ? "linear-gradient(135deg,#3D5589,#73ACDB)"
            : "linear-gradient(135deg,#9CA3AF,#D1D5DB)",
        }}
      >
        <div className="h-12 w-12 rounded-full bg-white/90 grid place-items-center shadow-lg">
          {active ? (
            <Play className="h-5 w-5 fill-current" style={{ color: NAVY }} />
          ) : (
            <Lock className="h-5 w-5" style={{ color: NAVY }} />
          )}
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
            style={{ background: active ? RED : "#9CA3AF" }}
          >
            Clase {cls.number}
          </span>
          <span className="text-[11px] font-semibold" style={{ color: active ? BLUE : "#6B7280" }}>
            {cls.date}
          </span>
        </div>
        <h3
          className="text-sm sm:text-base font-extrabold leading-snug min-h-[2.5rem]"
          style={{ color: NAVY }}
        >
          {cls.title}
        </h3>
        <div className="mt-auto pt-2">
          {active ? (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full text-white group-hover:gap-2 transition-all"
              style={{ background: RED }}
            >
              Ver clase grabada <Play className="h-3.5 w-3.5 fill-current" />
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
              style={{ color: "#6B7280" }}
            >
              <Lock className="h-3.5 w-3.5" /> Próximamente
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (active) {
    return (
      <a
        href={cls.href}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full group"
      >
        {inner}
      </a>
    );
  }
  return inner;
}

function TallerTile({ item }: { item: (typeof TALLERES)[number] }) {
  const active = Boolean(item.to);
  const inner = (
    <div
      className={`relative rounded-2xl overflow-hidden border shadow-md bg-white transition-all ${
        active ? "hover:shadow-xl hover:-translate-y-1" : "opacity-80"
      }`}
      style={{ borderColor: "rgba(61,85,137,0.15)" }}
    >
      <div
        className="h-24 flex items-center justify-center"
        style={{
          background: active
            ? "linear-gradient(135deg,#3D5589,#C44536)"
            : "linear-gradient(135deg,#9CA3AF,#D1D5DB)",
        }}
      >
        {active ? (
          <span className="text-4xl drop-shadow-lg">{item.emoji}</span>
        ) : (
          <div className="h-11 w-11 rounded-full bg-white/90 grid place-items-center shadow-lg">
            <Lock className="h-5 w-5" style={{ color: NAVY }} />
          </div>
        )}
      </div>
      <div className="p-4 text-center">
        <p className="text-sm font-extrabold" style={{ color: NAVY }}>
          {item.code}
        </p>
        <p
          className="text-[11px] font-bold uppercase tracking-wider mt-1"
          style={{ color: active ? RED : "#6B7280" }}
        >
          {active ? item.title : "Próximamente"}
        </p>
      </div>
    </div>
  );
  if (!active || !item.to) return inner;
  return (
    <Link to={item.to} className="block h-full">
      {inner}
    </Link>
  );
}

function ClasesEnVivoHub() {
  const [month, setMonth] = useState(1);
  // DB-managed replays (admin panel «Clases grabadas»); hardcoded list is the
  // fallback until the table has rows.
  const [dbClasses, setDbClasses] = useState<RecordedClass[] | null>(null);
  const isStaff = useIsStaff();
  const loadRecorded = useCallback(() => {
    supabase
      .from("recorded_classes")
      .select("number, title, date_label, video_url, sort")
      .order("sort")
      .order("number")
      .then(({ data, error }) => {
        if (error || !data?.length) return;
        setDbClasses(
          data.map((r) => ({
            number: Number(r.number),
            date: String(r.date_label ?? ""),
            title: String(r.title),
            href: r.video_url ?? undefined,
          })),
        );
      });
  }, []);
  useEffect(() => {
    loadRecorded();
  }, [loadRecorded]);
  const recordedClasses = dbClasses ?? RECORDED_CLASSES;

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: `linear-gradient(180deg, ${CREAM} 0%, #F0EDE6 100%)`,
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Hero */}
      <TopNav />
      <header
        className="relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(180deg, oklch(0.42 0.075 265 / 0.78) 0%, oklch(0.32 0.08 265 / 0.9) 100%), url(${eiffelBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.35em] text-white/80 mb-2">
            Programa Liberté
          </p>
          <h1
            className="font-[var(--font-display)] font-extrabold text-4xl sm:text-6xl text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.35)]"
          >
            Clases en Vivo
          </h1>
          <p className="mt-3 text-base sm:text-lg text-white/90 max-w-2xl">
            Tus 2 clases semanales, siempre disponibles.
          </p>
        </div>
      </header>

      {/* Month tabs */}
      <nav className="max-w-6xl mx-auto px-4 sm:px-8 mt-6 sm:mt-8">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
          {MONTHS.map((m) => {
            const active = m.id === month;
            return (
              <button
                key={m.id}
                onClick={() => m.unlocked && setMonth(m.id)}
                disabled={!m.unlocked}
                className={`shrink-0 snap-start inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all border-2 ${
                  active
                    ? "text-white shadow-lg"
                    : m.unlocked
                      ? "bg-white hover:shadow-md"
                      : "bg-white/60 cursor-not-allowed"
                }`}
                style={{
                  background: active ? NAVY : undefined,
                  borderColor: active ? NAVY : "rgba(61,85,137,0.2)",
                  color: active ? "#fff" : m.unlocked ? NAVY : "#9CA3AF",
                }}
              >
                {!m.unlocked && <Lock className="h-3.5 w-3.5" />}
                {m.label}
                {!m.unlocked && (
                  <span className="text-[10px] font-bold opacity-70">Próximamente</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Classes grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-10">
        {month === 1 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {MES1_CLASSES.map((c) => (
              <ClassTile key={c.code} card={c} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed p-10 text-center" style={{ borderColor: "rgba(61,85,137,0.25)" }}>
            <Lock className="h-8 w-8 mx-auto mb-3" style={{ color: NAVY }} />
            <p className="text-lg font-extrabold" style={{ color: NAVY }}>Próximamente</p>
            <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
              Este mes se desbloqueará más adelante.
            </p>
          </div>
        )}
      </section>

      {/* Talleres */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 pb-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2
            className="font-[var(--font-display)] font-extrabold text-2xl sm:text-3xl"
            style={{ color: NAVY }}
          >
            Talleres Inmersivos
          </h2>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: BLUE }}>
            Bonus
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
          {TALLERES.map((t) => (
            <TallerTile key={t.code} item={t} />
          ))}
        </div>
      </section>

      {/* Clases grabadas */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 pb-16">
        <div className="flex items-baseline justify-between mb-4">
          <h2
            className="font-[var(--font-display)] font-extrabold text-2xl sm:text-3xl"
            style={{ color: NAVY }}
          >
            Clases grabadas:
          </h2>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: BLUE }}>
            Replay
          </span>
        </div>
        {isStaff && (
          <div className="mb-6">
            <RecordedClassesManager onChanged={loadRecorded} />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {recordedClasses.map((cls, i) => (
            <RecordedClassTile key={`${cls.number}-${cls.title}-${i}`} cls={cls} />
          ))}
        </div>
      </section>
    </div>
  );
}
