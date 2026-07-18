import { createFileRoute } from "@tanstack/react-router";
import {
  SlideDeck,
  Slide,
  Card,
  SlideTitle,
  SlideH2,
  Pill,
  NAVY,
  BLUE,
  SKY,
  RED,
  CREAM,
} from "@/components/SlideDeck";
import type { ReactNode } from "react";

export const Route = createFileRoute("/apoyoM1d11")({
  head: () => ({
    meta: [
      { title: "Apoyo M1 D11 · Les Directions — Liberté" },
      {
        name: "description",
        content: "Material de apoyo visual para la clase grabada del Día 11.",
      },
    ],
  }),
  component: ApoyoM1D11,
});

const AMBER = "#D97706";

function ApoyoM1D11() {
  const slides: ReactNode[] = [
    // 1 — PORTADA
    <Slide key="1">
      <Pill>Día 11 · Gramática</Pill>
      <h1 className="font-[var(--font-display)] font-extrabold text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-tight drop-shadow-[0_6px_20px_rgba(0,0,0,0.35)]">
        <span style={{ color: SKY }}>Les </span>
        <span className="text-white">Directions</span>
      </h1>
      <div
        className="mx-auto my-6 h-[3px] w-40 rounded-full"
        style={{ background: RED }}
      />
      <p className="text-lg sm:text-2xl" style={{ color: BLUE }}>
        L'impératif + les prépositions de lieu
      </p>
      <div className="text-7xl mt-6">🗺️🧭</div>
      <p className="mt-10 text-[11px] uppercase tracking-widest" style={{ color: SKY }}>
        Liberté™ · Mes 1: J'OSE · Semana 3
      </p>
    </Slide>,

    // 2 — INTRO
    <Slide key="2" kicker="Intro">
      <h2 className="font-[var(--font-display)] font-extrabold text-3xl sm:text-5xl text-white leading-tight drop-shadow-[0_4px_14px_rgba(0,0,0,0.35)]">
        ¿Se han perdido alguna vez<br />en una ciudad francesa?
      </h2>
      <div className="mx-auto my-6 h-[3px] w-40 rounded-full" style={{ background: RED }} />
      <p className="text-lg sm:text-2xl italic" style={{ color: SKY }}>
        Hoy dejamos de dar vueltas.<br />
        Aprendemos a dar indicaciones como un local.
      </p>
      <div className="text-7xl mt-6">🤷‍♀️🗺️</div>
    </Slide>,

    // 3 — DOS HERRAMIENTAS
    <Slide key="3">
      <SlideH2>Dos herramientas. Eso es todo.</SlideH2>
      <div className="mx-auto mb-8 h-[3px] w-40 rounded-full" style={{ background: BLUE }} />
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="rounded-[18px] p-8 text-white shadow-xl" style={{ background: RED }}>
          <div className="text-6xl mb-3">⚙️</div>
          <p className="text-2xl font-extrabold">EL MOTOR</p>
          <p className="italic mt-1">L'Impératif</p>
          <p className="text-sm mt-3 opacity-90">Tournez · Allez · Continuez</p>
        </div>
        <div className="rounded-[18px] p-8 text-white shadow-xl" style={{ background: BLUE }}>
          <div className="text-6xl mb-3">🗺️</div>
          <p className="text-2xl font-extrabold">EL MAPA</p>
          <p className="italic mt-1">Prépositions de lieu</p>
          <p className="text-sm mt-3 opacity-90">En face de · À côté de · Près de</p>
        </div>
      </div>
    </Slide>,

    // 4 — TÍTULO SECCIÓN EL MOTOR
    <Slide key="4">
      <div className="text-7xl">⚙️</div>
      <h1 className="mt-4 font-[var(--font-display)] font-extrabold text-5xl sm:text-7xl text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.35)]">
        El Motor
      </h1>
      <div className="mx-auto my-6 h-[3px] w-48 rounded-full" style={{ background: RED }} />
      <p className="text-xl sm:text-2xl italic" style={{ color: BLUE }}>
        L'Impératif de direction
      </p>
      <p className="mt-3 text-sm" style={{ color: SKY }}>
        Directo · Claro · Sin rodeos
      </p>
    </Slide>,

    // 5 — TABLA IMPÉRATIF
    <Slide key="5" kicker="L'Impératif (Vous)">
      <p className="text-sm italic mb-4" style={{ color: SKY }}>
        La misma conjugación del présent — sin el "vous"
      </p>
      <Card className="overflow-hidden text-left">
        <table className="w-full">
          <tbody>
            {[
              ["Tourner", "→ TOURNEZ", "Giren"],
              ["Aller", "→ ALLEZ", "Vayan"],
              ["Continuer", "→ CONTINUEZ", "Continúen"],
              ["Traverser", "→ TRAVERSEZ", "Crucen"],
              ["Prendre", "→ PRENEZ", "Tomen"],
            ].map((r, i) => (
              <tr
                key={i}
                style={{ background: i % 2 === 0 ? "#1E2F5C" : "#243A6E", color: "white" }}
              >
                <td className="p-3 sm:p-4 text-sm" style={{ color: SKY }}>
                  {r[0]}
                </td>
                <td className="p-3 sm:p-4 font-extrabold text-xl sm:text-2xl">{r[1]}</td>
                <td className="p-3 sm:p-4 italic text-xs sm:text-sm text-white/60">{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Slide>,

    // 6 — DRILL KINESTÉSICO
    <Slide key="6" kicker="¡Sigan mis instrucciones!">
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          ["⬅️", "TOURNEZ À GAUCHE", "Giren la cabeza"],
          ["⬆️", "ALLEZ TOUT DROIT", "Miren al frente"],
          ["➡️", "TOURNEZ À DROITE", "Giren la cabeza"],
        ].map(([e, t, s]) => (
          <Card key={t} className="p-6 text-center">
            <div className="text-5xl sm:text-6xl">{e}</div>
            <p className="mt-3 font-extrabold text-sm sm:text-base" style={{ color: NAVY }}>
              {t}
            </p>
            <p className="mt-2 text-xs italic text-slate-500">{s}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    // 7 — TÍTULO SECCIÓN EL MAPA
    <Slide key="7">
      <div className="text-7xl">🗺️</div>
      <h1 className="mt-4 font-[var(--font-display)] font-extrabold text-5xl sm:text-7xl text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.35)]">
        El Mapa
      </h1>
      <div className="mx-auto my-6 h-[3px] w-48 rounded-full" style={{ background: BLUE }} />
      <p className="text-xl sm:text-2xl italic" style={{ color: BLUE }}>
        Prépositions de lieu
      </p>
      <p className="mt-3 text-sm" style={{ color: SKY }}>
        ¿Dónde está el lugar?
      </p>
    </Slide>,

    // 8 — GROUPE 1
    <Slide key="8" kicker="Groupe 1 · Las básicas">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["📍", "À", "En / A"],
          ["🏛️", "Dans", "Dentro de"],
          ["🚶", "Sur", "Sobre"],
          ["⬇️", "Sous", "Debajo de"],
        ].map(([e, f, s]) => (
          <Card key={f} className="p-5 text-center">
            <div className="text-4xl">{e}</div>
            <p className="mt-2 font-extrabold text-2xl" style={{ color: NAVY }}>
              {f}
            </p>
            <p className="italic text-xs text-slate-500">{s}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    // 9 — GROUPE 2 (1/2)
    <Slide key="9" kicker="Groupe 2 · Posición relativa (1/2)">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["⬆️", "Devant", "Delante de"],
          ["⬇️", "Derrière", "Detrás de"],
          ["↔️", "À côté de", "Al lado de"],
          ["🔀", "En face de", "Enfrente de"],
        ].map(([e, f, s]) => (
          <Card key={f} className="p-5 text-center">
            <div className="text-4xl">{e}</div>
            <p className="mt-2 font-extrabold text-2xl" style={{ color: NAVY }}>
              {f}
            </p>
            <p className="italic text-xs text-slate-500">{s}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    // 10 — GROUPE 2 (2/2)
    <Slide key="10" kicker="Groupe 2 · Posición relativa (2/2)">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["📍", "Près de", "Cerca de"],
          ["🌍", "Loin de", "Lejos de"],
          ["⏸️", "Entre", "Entre"],
          ["🏁", "Au bout de", "Al final de"],
        ].map(([e, f, s]) => (
          <Card key={f} className="p-5 text-center">
            <div className="text-4xl">{e}</div>
            <p className="mt-2 font-extrabold text-2xl" style={{ color: NAVY }}>
              {f}
            </p>
            <p className="italic text-xs text-slate-500">{s}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    // 11 — MAPA
    <Slide key="11" kicker="Le Plan · Mapa interactivo">
      <div
        className="relative rounded-2xl overflow-hidden mx-auto shadow-2xl w-full"
        style={{ background: "#1A3060", aspectRatio: "16/10" }}
      >
        {/* Grid: 2 filas de bloques + 2 calles horizontales + 1 calle vertical */}
        <div
          className="absolute inset-0 grid gap-0"
          style={{
            gridTemplateRows: "1fr 44px 1fr 44px",
            gridTemplateColumns: "1fr 32px 1fr",
          }}
        >
          {/* Fila 1 · Bloques superiores */}
          <div className="p-3 sm:p-4">
            <div className="w-full h-full rounded-lg bg-white flex flex-col items-center justify-center gap-1 shadow-md">
              <span className="text-3xl sm:text-5xl leading-none">💊</span>
              <span className="text-[10px] sm:text-sm font-extrabold" style={{ color: NAVY }}>
                PHARMACIE
              </span>
            </div>
          </div>
          <div style={{ background: "#283D7A" }} />
          <div className="p-3 sm:p-4">
            <div className="w-full h-full rounded-lg bg-white flex flex-col items-center justify-center gap-1 shadow-md">
              <span className="text-3xl sm:text-5xl leading-none">🥖</span>
              <span className="text-[10px] sm:text-sm font-extrabold" style={{ color: NAVY }}>
                BOULANGERIE
              </span>
            </div>
          </div>

          {/* Calle horizontal 1 — RUE DE RIVOLI */}
          <div
            className="col-span-3 flex items-center justify-center text-[10px] sm:text-xs font-bold tracking-widest"
            style={{ background: "#283D7A", color: SKY }}
          >
            RUE DE RIVOLI
          </div>

          {/* Fila 2 · Bloques inferiores */}
          <div className="p-3 sm:p-4">
            <div className="w-full h-full rounded-lg bg-white flex flex-col items-center justify-center gap-1 shadow-md">
              <span className="text-3xl sm:text-5xl leading-none">☕</span>
              <span className="text-[10px] sm:text-sm font-extrabold" style={{ color: NAVY }}>
                CAFÉ
              </span>
            </div>
          </div>
          <div style={{ background: "#283D7A" }} />
          <div className="p-3 sm:p-4 relative">
            <div className="w-full h-full rounded-lg bg-white flex flex-col items-center justify-center gap-1 shadow-md">
              <span className="text-3xl sm:text-5xl leading-none">🏛️</span>
              <span className="text-[10px] sm:text-sm font-extrabold" style={{ color: NAVY }}>
                MAIRIE
              </span>
            </div>
          </div>

          {/* Calle horizontal 2 — BOULEVARD HAUSSMANN */}
          <div
            className="col-span-3 flex items-center justify-center text-[10px] sm:text-xs font-bold tracking-widest"
            style={{ background: "#283D7A", color: SKY }}
          >
            BOULEVARD HAUSSMANN
          </div>
        </div>

        {/* Marcador VOUS ÊTES ICI en la intersección central */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-1.5 text-[10px] sm:text-xs font-extrabold text-white shadow-xl whitespace-nowrap border-2 border-white z-10"
          style={{ background: RED }}
        >
          📍 VOUS ÊTES ICI
        </div>
      </div>
      <p className="mt-4 text-xs sm:text-sm italic" style={{ color: SKY }}>
        ¿Dónde queda la pharmacie? · ¿Y el café? · ¿Y la mairie?
      </p>
    </Slide>,

    // 12 — EJEMPLOS
    <Slide key="12" kicker="Combinamos · En contexto">
      <div className="space-y-3 text-left">
        {[
          ["🥖", "C'est en face de la boulangerie.", "Está enfrente de la panadería."],
          ["☕", "Le café est à côté du métro.", "El café está al lado del metro."],
          ["↔️", "La pharmacie est entre la banque et le café.", "La farmacia está entre el banco y el café."],
          ["📍", "C'est au bout de la rue — vous ne pouvez pas le manquer !", "¡Está al final de la calle — no pueden perdérselo!"],
        ].map(([e, f, s], i) => (
          <div
            key={i}
            className="rounded-xl p-4 flex items-center gap-4"
            style={{ background: "#1E2F5C" }}
          >
            <div className="text-3xl sm:text-4xl">{e}</div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm sm:text-base">{f}</p>
              <p className="italic text-xs sm:text-sm" style={{ color: SKY }}>
                {s}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Slide>,

    // 13 — EL ERROR DE ORO
    <Slide key="13">
      <span
        className="inline-block px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest text-white shadow-md mb-4"
        style={{ background: AMBER }}
      >
        El Error de Oro
      </span>
      <p className="text-base sm:text-lg italic mb-6" style={{ color: SKY }}>
        El error más común bajo presión:
      </p>
      <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-4 items-center">
        <div
          className="rounded-[18px] p-6 border-[3px]"
          style={{ background: "#1E2F5C", borderColor: BLUE }}
        >
          <div className="text-5xl sm:text-6xl">⬅️</div>
          <p className="mt-3 font-extrabold text-2xl sm:text-3xl text-white">À GAUCHE</p>
          <p className="italic text-base sm:text-lg mt-1" style={{ color: BLUE }}>
            Izquierda
          </p>
          <p className="text-xs mt-2 text-white/60">← la mano va a la izquierda</p>
        </div>
        <div className="font-extrabold text-xl sm:text-2xl" style={{ color: RED }}>
          VS
        </div>
        <div
          className="rounded-[18px] p-6 border-[3px]"
          style={{ background: "#1E2F5C", borderColor: RED }}
        >
          <div className="text-5xl sm:text-6xl">➡️</div>
          <p className="mt-3 font-extrabold text-2xl sm:text-3xl text-white">À DROITE</p>
          <p className="italic text-base sm:text-lg mt-1" style={{ color: RED }}>
            Derecha
          </p>
          <p className="text-xs mt-2 text-white/60">→ la mano va a la derecha</p>
        </div>
      </div>
    </Slide>,

    // 14 — TRUCO DEL GAUCHO
    <Slide key="14" kicker="Truco PNL 🧠">
      <p
        className="font-[var(--font-display)] font-extrabold text-white"
        style={{ fontSize: "clamp(48px, 8vw, 72px)" }}
      >
        GAUCHE
      </p>
      <div className="mx-auto my-4 h-[2px] w-40" style={{ background: RED }} />
      <p className="text-lg sm:text-xl italic" style={{ color: SKY }}>
        rima con
      </p>
      <p
        className="font-[var(--font-display)] font-extrabold mt-2"
        style={{ fontSize: "clamp(40px, 6vw, 56px)", color: BLUE }}
      >
        GAUCHO
      </p>
      <div className="mx-auto my-3 h-[1px] w-32" style={{ background: BLUE }} />
      <p className="text-sm sm:text-base italic" style={{ color: SKY }}>
        Un gaucho siempre está a la IZQUIERDA del campo.
      </p>
      <span
        className="inline-block mt-6 px-5 py-2 rounded-full text-sm sm:text-base font-extrabold text-white shadow-md"
        style={{ background: RED }}
      >
        GAUCHE = IZQUIERDA. Para siempre. ⬅️
      </span>
    </Slide>,

    // 15 — FRASE ANCLA
    <Slide key="15" kicker="Frase ancla del día">
      <p className="text-sm sm:text-base italic mb-4" style={{ color: SKY }}>
        ¡Levántate y repite 3 veces en voz alta!
      </p>
      <div
        className="rounded-[18px] p-8 border-2 mx-auto"
        style={{ background: "#1E2F5C", borderColor: BLUE }}
      >
        <p className="font-extrabold text-white text-xl sm:text-3xl leading-relaxed">
          "Tournez à gauche,<br />
          allez tout droit,<br />
          c'est en face de la pharmacie."
        </p>
      </div>
      <p className="mt-4 text-xs sm:text-sm italic text-white/60">
        ⬅️ tournez à gauche · ⬆️ allez tout droit · 🔀 en face de
      </p>
      <p className="mt-2 text-xs sm:text-sm" style={{ color: SKY }}>
        Cada vez más fuerte · Con el gesto en la mano
      </p>
    </Slide>,

    // 16 — RETO
    <Slide key="16" kicker="Reto de hoy">
      <h2 className="font-[var(--font-display)] font-extrabold text-2xl sm:text-4xl text-white leading-tight">
        ¿Dónde queda la cafetería<br />más cercana a tu casa?
      </h2>
      <div className="mx-auto my-5 h-[2px] w-40" style={{ background: RED }} />
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl p-5 border-2" style={{ background: "#1E2F5C", borderColor: BLUE }}>
          <p className="font-extrabold text-lg sm:text-xl" style={{ color: BLUE }}>
            C'est en face de...
          </p>
          <p className="italic text-xs sm:text-sm mt-1" style={{ color: SKY }}>
            enfrente de…
          </p>
        </div>
        <div className="rounded-xl p-5 border-2" style={{ background: "#1E2F5C", borderColor: BLUE }}>
          <p className="font-extrabold text-lg sm:text-xl" style={{ color: BLUE }}>
            À côté de...
          </p>
          <p className="italic text-xs sm:text-sm mt-1" style={{ color: SKY }}>
            al lado de…
          </p>
        </div>
      </div>
      <p className="mt-5 text-sm sm:text-base italic" style={{ color: SKY }}>
        ¡Escríbelo en la plataforma y te ayudo a corregir tu ruta!
      </p>
    </Slide>,

    // 17 — CIERRE
    <Slide key="17">
      <div className="text-7xl">🎉</div>
      <p
        className="mt-4 font-[var(--font-display)] font-extrabold text-white"
        style={{ fontSize: "clamp(32px, 5vw, 44px)", color: CREAM }}
      >
        Je suis fière de vous.
      </p>
      <div className="mx-auto my-5 h-[2px] w-40" style={{ background: RED }} />
      <p className="italic" style={{ fontSize: "clamp(22px, 3.5vw, 30px)", color: BLUE }}>
        Vous pouvez le faire.
      </p>
      <span
        className="inline-block mt-8 px-8 py-3 rounded-full font-extrabold text-white shadow-xl"
        style={{ background: RED, fontSize: "clamp(24px, 4vw, 36px)" }}
      >
        Allez !
      </span>
      <p className="mt-10 text-[11px] uppercase tracking-widest" style={{ color: SKY }}>
        Liberté™ · Día 11 · Les Directions
      </p>
    </Slide>,
  ];

  return <SlideDeck slides={slides} />;
}
