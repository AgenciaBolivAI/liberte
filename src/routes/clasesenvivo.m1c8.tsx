import { createFileRoute } from "@tanstack/react-router";
import {
  SlideDeck,
  Slide,
  Card,
  SlideTitle,
  SlideH2,
  Pill,
  Reveal,
  QuizSlide,
  NAVY,
  BLUE,
  RED,
} from "@/components/SlideDeck";
import type { ReactNode } from "react";

export const Route = createFileRoute("/clasesenvivo/m1c8")({
  head: () => ({
    meta: [
      { title: "Clase M1C8 — J'OSE : Le Grand Final · Liberté" },
      {
        name: "description",
        content: "Révision intégrale du Mois 1 : J'OSE vivre en français.",
      },
    ],
  }),
  component: M1C8,
});

function M1C8() {
  const slides: ReactNode[] = [
    <Slide key="1">
      <Pill>Semaine 4 · Mois 1 · Grand Final</Pill>
      <p className="text-lg sm:text-2xl italic text-white/90 mb-3">🗼</p>
      <SlideTitle>LIBERTÉ · MOIS 1</SlideTitle>
      <p className="mt-6 text-xl sm:text-3xl font-bold text-white">Semaine 4 : J'OSE</p>
      <p className="mt-4 text-base sm:text-lg text-white/85 max-w-3xl mx-auto">
        « Une immersion ludique dans la langue française. »
      </p>
    </Slide>,

    <Slide key="2" kicker="Identité et Promesse">
      <SlideH2>J'OSE</SlideH2>
      <Card className="p-6 text-left">
        <p className="text-base sm:text-lg italic mb-3" style={{ color: NAVY }}>
          « Je me lance dans le français. C'est le moment de briser la barrière et de passer à
          l'action concrète. »
        </p>
        <p className="text-sm sm:text-base" style={{ color: RED }}>
          <b>Promesse du mois :</b> utiliser le français dans la vie réelle (commander, acheter,
          demander, se déplacer) sans revenir à l'espagnol.
        </p>
      </Card>
    </Slide>,

    <Slide key="3" kicker="Victoire émotionnelle">
      <Card className="p-8 text-center">
        <p
          className="text-2xl sm:text-3xl font-[var(--font-display)] italic leading-snug"
          style={{ color: NAVY }}
        >
          « Ya no me escondo.
          <br />
          Ya puedo salir al mundo y usar mi francés. »
        </p>
      </Card>
    </Slide>,

    <Slide key="4" kicker="Grammaire Nucléaire">
      <SlideH2>Ce que nous avons appris</SlideH2>
      <Card className="p-6 text-left">
        <ul className="space-y-2 text-sm sm:text-base" style={{ color: NAVY }}>
          <li>🎩 Conditionnel de politesse & futur proche</li>
          <li>🥖 Quantités & partitifs (de / du / de la / des)</li>
          <li>🚇 Prépositions de transport & impératif</li>
          <li>🛍️ Comparatifs & démonstratifs</li>
          <li>⏰ Verbes pronominaux & devoir + infinitif</li>
        </ul>
      </Card>
    </Slide>,

    <Slide key="5" kicker="Contextos de pratique">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          ["☕", "Café / Resto"],
          ["🥖", "Boulangerie"],
          ["🛒", "Supermarché"],
          ["🚇", "Transports"],
          ["💊", "Santé"],
        ].map(([e, t]) => (
          <Card key={t} className="p-4 text-center">
            <div className="text-3xl sm:text-4xl">{e}</div>
            <p className="mt-2 font-extrabold text-xs sm:text-sm" style={{ color: NAVY }}>
              {t}
            </p>
          </Card>
        ))}
      </div>
    </Slide>,

    <Slide key="6" kicker="Structure Quotidienne">
      <Card className="p-6 text-left">
        <p className="font-extrabold mb-2" style={{ color: RED }}>
          Flujo diario
        </p>
        <p className="text-sm sm:text-base mb-4" style={{ color: NAVY }}>
          Gym Cérébral ➔ Grammaire ➔ Vocabulaire ➔ Expressions
        </p>
        <p className="font-extrabold mb-2" style={{ color: BLUE }}>
          Herramientas
        </p>
        <p className="text-sm sm:text-base" style={{ color: NAVY }}>
          Prompt IA · Mini Défi · Livrable
        </p>
      </Card>
    </Slide>,

    <Slide key="7" kicker="Objectif DELF · Les 4 Compétences">
      <div className="grid grid-cols-2 gap-3 text-left">
        {[
          ["CO", "Écouter", "Compréhension Orale"],
          ["CE", "Lire", "Compréhension Écrite"],
          ["PO", "Parler", "Production Orale"],
          ["PE", "Écrire", "Production Écrite"],
        ].map(([k, t, s]) => (
          <Card key={k} className="p-4">
            <div className="flex items-baseline gap-3">
              <span className="font-black text-2xl sm:text-3xl" style={{ color: RED }}>
                {k}
              </span>
              <span className="font-extrabold text-sm sm:text-base" style={{ color: NAVY }}>
                {t}
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">{s}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    <QuizSlide key="8" kicker="🧠 Le Grand Quiz · Au Café" title="Politesse">
      <Reveal q="(Pedir un café educadamente) « ___ un café, s'il vous plaît. »" a="Je voudrais" />
      <Reveal q="(La cuenta) « ___, s'il vous plaît. »" a="L'addition" />
      <Reveal q="(¿Qué recomienda?) « Qu'est-ce que vous ___ ? »" a="recommandez" />
    </QuizSlide>,

    <QuizSlide key="9" kicker="🧠 Le Grand Quiz · Au Supermarché" title="Quantités & Partitifs">
      <Reveal q="Je mange ___ fromage et je bois ___ eau." a="du / de l'" />
      <Reveal q="Nous achetons ___ pommes." a="des" />
      <Reveal q="(Négatif) Je ne mange pas ___ viande." a="de" />
    </QuizSlide>,

    <QuizSlide key="10" kicker="🧠 Le Grand Quiz · L'Orientation" title="Le GPS & L'Impératif">
      <Reveal q="(Gire à gauche · formel) « ___ à gauche. »" a="Tournez" />
      <Reveal q="(Continuez tout droit · formel) « ___ tout droit. »" a="Continuez" />
      <Reveal q="(Cruza le pont · familier) « ___ le pont. »" a="Traverse" />
    </QuizSlide>,

    <QuizSlide key="11" kicker="🧠 Le Grand Quiz · Futur Proche" title="Aller + Infinitif">
      <Reveal q="Je ___ (manger) au restaurant ce soir." a="vais manger" />
      <Reveal q="Nous ___ (prendre) le métro." a="allons prendre" />
      <Reveal q="Tu ___ (voyager) à Paris ?" a="vas voyager" />
    </QuizSlide>,

    <QuizSlide key="12" kicker="🧠 Le Grand Quiz · Chez le Médecin" title="AU, À LA, À L', AUX">
      <Reveal q="J'ai mal ___ tête." a="à la" />
      <Reveal q="Il a mal ___ ventre." a="au" />
      <Reveal q="Nous avons mal ___ dents." a="aux" />
    </QuizSlide>,

    <QuizSlide key="13" kicker="🧠 Le Grand Quiz · Shopping" title="Les Comparatifs">
      <Reveal q="(➕ cher) La soie est ___ le coton." a="plus chère que" />
      <Reveal q="(🟰 élégant) Ce manteau est ___ l'autre." a="aussi élégant que" />
      <Reveal q="(➖ grand) Paris est ___ Tokyo." a="moins grande que" />
    </QuizSlide>,

    <QuizSlide key="14" kicker="🧠 Le Grand Quiz · Montrer du doigt" title="Les Démonstratifs">
      <Reveal q="Je préfère ___ (esta) robe." a="cette" />
      <Reveal q="J'aime ce sac, mais je préfère ___ (aquél)." a="celui-là" />
      <Reveal q="Regarde ___ (estos) pantalons !" a="ces" />
    </QuizSlide>,

    <QuizSlide key="15" kicker="🧠 Le Grand Quiz · La Routine" title="Verbes Pronominaux">
      <Reveal q="Le matin, je ___ (se lever) à 7h." a="me lève" />
      <Reveal q="Tu ___ (se doucher) rapidement." a="te douches" />
      <Reveal q="Nous ___ (se préparer) pour le travail." a="nous préparons" />
    </QuizSlide>,

    <QuizSlide key="16" kicker="📌 Nouveau · L'Obligation" title="Devoir + Infinitif">
      <Reveal q="Je ___ (devoir) travailler aujourd'hui." a="dois" />
      <Reveal q="Vous ___ (devoir) parler français." a="devez" />
      <Reveal q="Nous ___ (devoir) prendre le bus." a="devons" />
    </QuizSlide>,

    <Slide key="17" kicker="🎯 Défi 1">
      <SlideH2>Au Restaurant 🍽️</SlideH2>
      <Card className="p-6 text-left">
        <p className="text-base sm:text-lg" style={{ color: NAVY }}>
          <b style={{ color: RED }}>Mission :</b> un élève est le serveur, un autre le client.
          Commandez une entrée, un plat, une boisson et demandez l'addition poliment.
        </p>
      </Card>
    </Slide>,

    <Slide key="18" kicker="🎯 Défi 2">
      <SlideH2>À la Pharmacie 💊</SlideH2>
      <Card className="p-6 text-left">
        <p className="text-base sm:text-lg" style={{ color: NAVY }}>
          <b style={{ color: RED }}>Mission :</b> expliquez vos symptômes (3 parties du corps) et
          demandez un remède.
        </p>
      </Card>
    </Slide>,

    <Slide key="19" kicker="🎯 Défi 3">
      <SlideH2>Dans la Rue 🗺️</SlideH2>
      <Card className="p-6 text-left">
        <p className="text-base sm:text-lg" style={{ color: NAVY }}>
          <b style={{ color: RED }}>Mission :</b> demandez votre chemin pour aller à la Tour Eiffel
          et donnez 3 instructions (tourner, continuer, traverser).
        </p>
      </Card>
    </Slide>,

    <Slide key="20">
      <SlideTitle>Félicitations ! 🍾</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white/90 max-w-3xl mx-auto">
        Vous avez survécu à votre premier mois à Paris.
      </p>
      <Card className="p-5 mt-6 text-left max-w-2xl mx-auto">
        <p className="text-sm sm:text-base" style={{ color: NAVY }}>
          <b style={{ color: RED }}>Livrable final :</b> enregistre un audio d'une minute présentant
          ta routine, tes repas et une direction.
        </p>
      </Card>
    </Slide>,
    // === Un petit plus ===
    <Slide key="plus-divider">
      <Pill>Un petit plus</Pill>
      <SlideTitle>Un petit plus :</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white/90">Matériel complémentaire de la classe.</p>
    </Slide>,

    <Slide key="plus-1">
      <Pill>Semaine 4 · Mois 1 · Grand Final</Pill>
      <p className="text-lg sm:text-2xl italic text-white/90 mb-3">🗼 LIBERTÉ · MOIS 1</p>
      <SlideTitle>J'OSE</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white max-w-3xl mx-auto">
        « Une immersion ludique dans la langue française »
      </p>
    </Slide>,

    <Slide key="plus-2" kicker="Identité">
      <SlideH2>J'OSE me lancer en français</SlideH2>
      <Card className="p-6 text-left">
        <p className="text-base sm:text-lg italic mb-3" style={{ color: NAVY }}>
          « Je me lance dans le français. C'est le moment de briser la barrière et de passer à l'action concrète. »
        </p>
        <p className="text-sm sm:text-base" style={{ color: RED }}>
          <b>Promesse du mois :</b> utiliser le français dans la vie réelle (commander, acheter,
          demander, se déplacer) sans revenir à l'espagnol.
        </p>
      </Card>
    </Slide>,

    <Slide key="plus-3" kicker="Victoire émotionnelle">
      <Card className="p-8 text-center">
        <p className="text-2xl sm:text-3xl font-[var(--font-display)] italic leading-snug" style={{ color: NAVY }}>
          « Ya no me escondo.<br />Ya puedo salir al mundo y usar mi francés. »
        </p>
      </Card>
    </Slide>,

    <Slide key="plus-4" kicker="Grammaire Essentielle du Mois">
      <Card className="p-6 text-left">
        <ul className="space-y-2 text-sm sm:text-base" style={{ color: NAVY }}>
          <li>🎩 Conditionnel de politesse & futur proche</li>
          <li>🥖 Quantités & partitifs (de/du/de la/des)</li>
          <li>🚇 Prépositions de transport & impératif</li>
          <li>🛍️ Comparatifs & démonstratifs</li>
          <li>⏰ Verbes pronominaux & devoir + infinitif</li>
        </ul>
      </Card>
    </Slide>,

    <Slide key="plus-5" kicker="Contextes de pratique">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["☕", "Café / Resto"],
          ["🥐", "Boulangerie"],
          ["🛒", "Supermarché"],
          ["🚇", "Transports"],
        ].map(([e, t]) => (
          <Card key={t} className="p-5 text-center">
            <div className="text-4xl">{e}</div>
            <p className="mt-2 font-extrabold text-sm sm:text-base" style={{ color: NAVY }}>{t}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    <Slide key="plus-6" kicker="Structure Quotidienne">
      <Card className="p-6 text-left">
        <p className="font-extrabold mb-2" style={{ color: RED }}>Flujo diario</p>
        <p className="text-sm sm:text-base mb-4" style={{ color: NAVY }}>
          Gym Cérébral → Grammaire → Vocabulaire → Expressions
        </p>
        <p className="font-extrabold mb-2" style={{ color: BLUE }}>Herramientas</p>
        <p className="text-sm sm:text-base" style={{ color: NAVY }}>
          Prompt IA · Mini Défi · Livrable
        </p>
      </Card>
    </Slide>,

    <Slide key="plus-7" kicker="Les 4 Compétences DELF">
      <div className="grid sm:grid-cols-2 gap-3 text-left">
        {[
          ["CO", "Compréhension Orale", "commandes & instructions"],
          ["CE", "Compréhension Écrite", "menus, tickets, signes"],
          ["PO", "Production Orale", "roleplays quotidiens"],
          ["PE", "Production Écrite", "listes, itinéraires, symptômes"],
        ].map(([k, t, s]) => (
          <Card key={k} className="p-5">
            <div className="flex items-baseline gap-3">
              <span className="font-black text-3xl" style={{ color: RED }}>{k}</span>
              <span className="font-extrabold" style={{ color: NAVY }}>{t}</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{s}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    <Slide key="plus-8" kicker="Défi Final">
      <SlideH2>« J'ose vivre en français »</SlideH2>
      <Card className="p-6 text-left">
        <p className="text-base sm:text-lg" style={{ color: NAVY }}>
          <b style={{ color: RED }}>Mission :</b> réaliser <b>5 mini-situations réelles</b> et
          enregistrer un <b>audio/vidéo final de 3 à 5 minutes</b>.
        </p>
      </Card>
    </Slide>,

    <Slide key="plus-9">
      <SlideTitle>Merci 🇫🇷</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white/90 max-w-3xl mx-auto">
        « Avez-vous des questions sur ce premier mois ? »
      </p>
    </Slide>,

  ];

  return <SlideDeck slides={slides} />;
}
