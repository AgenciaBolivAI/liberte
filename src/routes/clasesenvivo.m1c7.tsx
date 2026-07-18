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

export const Route = createFileRoute("/clasesenvivo/m1c7")({
  head: () => ({
    meta: [
      { title: "Clase M1C7 — Le Défi des 3 Repas · Liberté" },
      {
        name: "description",
        content: "Ma routine quotidienne et alimentaire en français.",
      },
    ],
  }),
  component: M1C7,
});

function M1C7() {
  const slides: ReactNode[] = [
    <Slide key="1">
      <Pill>Semaine 4 · Mois 1</Pill>
      <p className="text-lg sm:text-2xl italic text-white/90 mb-3">🥐⏰</p>
      <SlideTitle>PARIS : Le Défi des 3 Repas</SlideTitle>
      <p className="mt-6 text-base sm:text-lg text-white/85 max-w-3xl mx-auto">
        Ma routine quotidienne et alimentaire.
      </p>
    </Slide>,

    <Slide key="2" kicker="Check-in · Énergie et Appétit">
      <SlideH2>Comment commencez-vous la journée ?</SlideH2>
      <div className="grid grid-cols-2 gap-4">
        {[
          ["🥐", "J'ai très faim !"],
          ["☕", "Juste un café"],
          ["🏃", "Plein d'énergie"],
          ["😴", "Retour au lit…"],
        ].map(([e, t]) => (
          <Card key={t} className="p-5 text-center">
            <div className="text-4xl sm:text-5xl">{e}</div>
            <p className="mt-2 font-extrabold text-sm sm:text-base" style={{ color: NAVY }}>
              {t}
            </p>
          </Card>
        ))}
      </div>
    </Slide>,

    <QuizSlide key="3" kicker="⏪ Retour · Comparatifs" title="Faites la comparaison !">
      <Reveal q="(➕ cher) La soie est ________ le coton." a="plus chère que" />
      <Reveal q="(🟰 élégant) Ce manteau est _________ l'autre." a="aussi élégant que" />
      <Reveal q="(➖ grand) Cette boutique est _________ la galerie." a="moins grande que" />
    </QuizSlide>,

    <QuizSlide key="4" kicker="⏪ Pratique · Démonstratifs" title="Lequel préférez-vous ?">
      <Reveal q="Je n'aime pas ___ pantalon." a="ce" />
      <Reveal q="Je préfère cette chemise, mais ________ est moins chère. (aquella)" a="celle-là" />
      <Reveal q="________ (Este de aquí) est mon favori." a="Celui-ci" />
    </QuizSlide>,

    <Slide key="5" kicker="Introduction">
      <SlideTitle>La Routine du Matin</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white/90 max-w-3xl mx-auto">
        Commencer la journée avec énergie et équilibre. ☀️
      </p>
    </Slide>,

    <Slide key="6" kicker="📌 Point Grammaire · Actions propres">
      <SlideH2>Les Verbes Pronominaux</SlideH2>
      <Card className="p-6 text-left">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-base sm:text-lg" style={{ color: NAVY }}>
          <p>Je <b style={{ color: RED }}>me</b> lève</p>
          <p>Nous <b style={{ color: RED }}>nous</b> réveillons</p>
          <p>Tu <b style={{ color: RED }}>te</b> laves</p>
          <p>Vous <b style={{ color: RED }}>vous</b> douchez</p>
          <p>Il/Elle <b style={{ color: RED }}>se</b> prépare</p>
          <p>Ils/Elles <b style={{ color: RED }}>se</b> brossent</p>
        </div>
      </Card>
    </Slide>,

    <Slide key="7" kicker="La règle d'or">
      <Card className="p-8 text-center">
        <p className="text-lg sm:text-2xl font-extrabold" style={{ color: NAVY }}>
          Le pronom se place <span style={{ color: RED }}>toujours avant</span> le verbe.
        </p>
        <p className="mt-4 italic text-base sm:text-lg" style={{ color: BLUE }}>
          Je <b>me</b> douche, je <b>me</b> brosse les dents.
        </p>
      </Card>
    </Slide>,

    <QuizSlide key="8" kicker="L'heure du réveil" title="La précision temporelle">
      <Reveal q="Je me lève à sept heures pile." a="Me levanto a las siete en punto." />
      <Reveal q="Puis, je me douche et je me brosse les dents…" a="Luego, me ducho y me cepillo los dientes…" />
      <Reveal q="…avant de prendre mon petit-déjeuner." a="…antes de tomar mi desayuno." />
    </QuizSlide>,

    <Slide key="9" kicker="💬 L'interview de routine">
      <Card className="p-6 text-left">
        <ul className="space-y-3 text-base sm:text-xl" style={{ color: NAVY }}>
          <li>• À quelle heure est-ce que tu te lèves ?</li>
          <li>• Comment est-ce que tu te prépares ?</li>
          <li>• À quelle heure est-ce que tu te couches ?</li>
        </ul>
      </Card>
    </Slide>,

    <Slide key="10" kicker="Transition">
      <SlideTitle>Le Défi des 3 Repas</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white/90 max-w-3xl mx-auto">
        Objectif : décrire son alimentation avec précision. 🍽️
      </p>
    </Slide>,

    <Slide key="11" kicker="📌 Point Grammaire · Les Quantités">
      <SlideH2>Les Articles Partitifs</SlideH2>
      <Card className="p-6 text-left">
        <ul className="space-y-2 text-base sm:text-lg" style={{ color: NAVY }}>
          <li>
            <b style={{ color: RED }}>DU</b> (masc.) — Je mange du pain, du fromage.
          </li>
          <li>
            <b style={{ color: RED }}>DE LA</b> (fém.) — Je bois de la soupe.
          </li>
          <li>
            <b style={{ color: RED }}>DE L'</b> (voy./h) — Je bois de l'eau.
          </li>
          <li>
            <b style={{ color: RED }}>DES</b> (pluriel) — Je mange des céréales.
          </li>
          <li>
            <b style={{ color: RED }}>DE / D'</b> (négation) — Je ne mange pas de viande.
          </li>
        </ul>
      </Card>
    </Slide>,

    <QuizSlide key="12" kicker="Pratique · Partitifs" title="Qu'est-ce que vous mangez ?">
      <Reveal q="Je mange ___ confiture (f)." a="de la" />
      <Reveal q="Il boit ___ café (m)." a="du" />
      <Reveal q="Nous prenons ___ croissants (pl)." a="des" />
      <Reveal q="Je ne bois pas ___ thé (nég)." a="de" />
    </QuizSlide>,

    <Slide key="13" kicker="Le Petit-Déjeuner">
      <SlideH2>Le début de la journée ☕</SlideH2>
      <Card className="p-6 text-left">
        <p className="text-base sm:text-lg mb-3" style={{ color: NAVY }}>
          Un moment tranquille avant le travail.
        </p>
        <p className="text-base sm:text-lg" style={{ color: NAVY }}>
          Au menu : <b style={{ color: RED }}>du café</b>, <b style={{ color: RED }}>des croissants</b>,{" "}
          <b style={{ color: RED }}>de la confiture</b> et <b style={{ color: RED }}>du jus d'orange</b>.
        </p>
      </Card>
    </Slide>,

    <Slide key="14" kicker="Les repas de la journée">
      <div className="grid sm:grid-cols-2 gap-4 text-left">
        <Card className="p-5">
          <p className="font-extrabold text-lg" style={{ color: RED }}>
            🥗 Le Déjeuner
          </p>
          <p className="mt-2 text-sm sm:text-base" style={{ color: NAVY }}>
            Une salade fraîche et saine, du poulet, de l'eau.
          </p>
        </Card>
        <Card className="p-5">
          <p className="font-extrabold text-lg" style={{ color: BLUE }}>
            🍲 Le Dîner
          </p>
          <p className="mt-2 text-sm sm:text-base" style={{ color: NAVY }}>
            Un repas chaud et convivial. De la soupe, du poisson, un verre de vin.
          </p>
        </Card>
      </div>
    </Slide>,

    <Slide key="15" kicker="🍽️ Jeu de rôle · Le Journal Alimentaire">
      <div className="grid sm:grid-cols-2 gap-4 text-left">
        <Card className="p-5">
          <p className="font-extrabold" style={{ color: RED }}>
            Le Nutritionniste
          </p>
          <ul className="mt-2 space-y-1.5 text-sm sm:text-base" style={{ color: NAVY }}>
            <li>• À quelle heure prenez-vous le petit-déjeuner ?</li>
            <li>• Qu'est-ce que vous mangez le matin ?</li>
            <li>• Buvez-vous de l'eau ?</li>
          </ul>
        </Card>
        <Card className="p-5">
          <p className="font-extrabold" style={{ color: BLUE }}>
            Le Patient
          </p>
          <ul className="mt-2 space-y-1.5 text-sm sm:text-base" style={{ color: NAVY }}>
            <li>• Je me lève à 7h et je prends le petit-déjeuner à 8h.</li>
            <li>• Je mange du pain, des œufs et je bois du café.</li>
          </ul>
        </Card>
      </div>
    </Slide>,
    // === Un petit plus ===
    <Slide key="plus-divider">
      <Pill>Un petit plus</Pill>
      <SlideTitle>Un petit plus :</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white/90">Matériel complémentaire de la classe.</p>
    </Slide>,

    <Slide key="plus-1">
      <Pill>Semaine 4 · Mois 1</Pill>
      <p className="text-lg sm:text-2xl italic text-white/90 mb-3">🗼 PARIS · LIBERTÉ</p>
      <SlideTitle>Le Défi des 3 Repas</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white">Ma Routine Quotidienne et Alimentaire</p>
    </Slide>,

    <Slide key="plus-2" kicker="La Routine du Matin">
      <SlideH2>Commencer la journée avec énergie</SlideH2>
      <div className="text-8xl mt-4">☀️☕</div>
    </Slide>,

    <Slide key="plus-3" kicker="Grammaire">
      <SlideH2>Les verbes pronominaux</SlideH2>
      <Card className="p-6 text-left">
        <p className="text-base sm:text-lg" style={{ color: NAVY }}>
          Acciones que hacemos sobre nosotros mismos :
        </p>
        <p className="mt-3 text-lg sm:text-2xl" style={{ color: RED }}>« Je me lève » · « Tu te laves »</p>
      </Card>
    </Slide>,

    <Slide key="plus-4" kicker="Le pronom réfléchi">
      <SlideH2>Toujours AVANT le verbe</SlideH2>
      <Card className="p-6 text-left">
        <div className="grid sm:grid-cols-2 gap-2 text-base sm:text-lg" style={{ color: NAVY }}>
          <p>je <b style={{ color: RED }}>me</b></p>
          <p>tu <b style={{ color: RED }}>te</b></p>
          <p>il/elle <b style={{ color: RED }}>se</b></p>
          <p>nous <b style={{ color: RED }}>nous</b></p>
          <p>vous <b style={{ color: RED }}>vous</b></p>
          <p>ils/elles <b style={{ color: RED }}>se</b></p>
        </div>
      </Card>
    </Slide>,

    <Slide key="plus-5" kicker="Questions Clés">
      <Card className="p-6 text-left">
        <ul className="space-y-3 text-base sm:text-lg" style={{ color: NAVY }}>
          <li>⏰ « À quelle heure est-ce que tu te lèves ? »</li>
          <li>🌙 « À quelle heure est-ce que tu te couches ? »</li>
          <li>🚿 « Comment est-ce que tu te prépares ? »</li>
        </ul>
      </Card>
    </Slide>,

    <Slide key="plus-6" kicker="L'Heure du Réveil">
      <div className="flex flex-col items-center">
        <p className="font-[var(--font-display)] font-black text-white text-8xl sm:text-9xl leading-none">7h</p>
        <p className="mt-3 text-white/90 text-base sm:text-lg">« Je me lève à sept heures pile. »</p>
      </div>
    </Slide>,

    <Slide key="plus-7" kicker="Ma routine matinale">
      <Card className="p-6 text-left">
        <p className="text-lg sm:text-2xl leading-relaxed" style={{ color: NAVY }}>
          « Puis, je <b style={{ color: RED }}>me douche</b> et je <b style={{ color: RED }}>me brosse les dents</b>
          avant de prendre mon petit-déjeuner. »
        </p>
      </Card>
    </Slide>,

    <Slide key="plus-8">
      <SlideTitle>Le Défi des 3 Repas</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white/90">Décrire son alimentation avec précision 🍽️</p>
    </Slide>,

    <Slide key="plus-9" kicker="Les Articles Partitifs">
      <Card className="p-6 text-left">
        <ul className="space-y-2 text-base sm:text-lg" style={{ color: NAVY }}>
          <li><b style={{ color: RED }}>DU</b> (masc.) — Je mange <b>du</b> pain et <b>du</b> fromage.</li>
          <li><b style={{ color: RED }}>DE LA</b> (fém.) — Je bois <b>de la</b> soupe.</li>
          <li><b style={{ color: RED }}>DE L'</b> (voyelle) — Je bois <b>de l'</b>eau.</li>
          <li><b style={{ color: RED }}>DES</b> (pluriel) — Je mange <b>des</b> céréales.</li>
          <li><b style={{ color: RED }}>DE / D'</b> (négation) — Je ne mange <b>pas de</b> viande.</li>
        </ul>
      </Card>
    </Slide>,

    <Slide key="plus-10" kicker="Le début de la journée">
      <SlideH2>Petit-déjeuner ☕🥐</SlideH2>
      <Card className="p-6 text-left">
        <p className="text-base sm:text-lg" style={{ color: NAVY }}>
          Café, croissant, confiture et jus d'orange — un moment tranquille avant le travail.
        </p>
      </Card>
    </Slide>,

    <Slide key="plus-11" kicker="Les Repas de la Journée">
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          ["☕", "Petit-déjeuner", "café et viennoiseries"],
          ["🥗", "Déjeuner", "salade fraîche et saine"],
          ["🍲", "Dîner", "repas chaud et convivial"],
        ].map(([e, t, s]) => (
          <Card key={t} className="p-5 text-center">
            <div className="text-5xl">{e}</div>
            <p className="mt-2 font-extrabold" style={{ color: NAVY }}>{t}</p>
            <p className="text-sm text-slate-600 mt-1">{s}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    <Slide key="plus-12" kicker="Vocabulaire Alimentaire">
      <Card className="overflow-x-auto text-left">
        <table className="w-full text-sm sm:text-base">
          <thead style={{ background: NAVY, color: "white" }}>
            <tr>
              <th className="p-3 text-left">Repas</th>
              <th className="p-3 text-left">Action</th>
              <th className="p-3 text-left">Aliments typiques</th>
            </tr>
          </thead>
          <tbody style={{ color: NAVY }}>
            {[
              ["Petit-déjeuner", "prendre", "café, croissant, confiture"],
              ["Déjeuner", "déjeuner", "salade, sandwich, tarte"],
              ["Goûter", "grignoter", "fruits, biscuits, chocolat"],
              ["Dîner", "dîner", "soupe, viande, légumes"],
            ].map((r, i) => (
              <tr key={i} className="border-t border-slate-200">
                <td className="p-3 font-bold">{r[0]}</td>
                <td className="p-3" style={{ color: RED }}>{r[1]}</td>
                <td className="p-3">{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Slide>,

    <Slide key="plus-13" kicker="Ma Journée Type">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["7h00", "Réveil"],
          ["12h30", "Déjeuner"],
          ["15h00", "Goûter"],
          ["20h00", "Dîner"],
        ].map(([t, s]) => (
          <Card key={t} className="p-4 text-center">
            <p className="font-black text-2xl" style={{ color: RED }}>{t}</p>
            <p className="text-sm mt-1" style={{ color: NAVY }}>{s}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    <Slide key="plus-14" kicker="L'HEURE">
      <SlideH2>« Il est… heure(s) »</SlideH2>
      <Card className="p-6 text-left">
        <p className="text-base sm:text-lg" style={{ color: NAVY }}>
          Estructura base : <b style={{ color: RED }}>« Il est »</b> (sin artículos) + « heure(s) » después del número.
        </p>
      </Card>
    </Slide>,

    <Slide key="plus-15" kicker="Fractions du temps">
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          [":15", "et quart"],
          [":30", "et demie"],
          [":45", "moins le quart"],
        ].map(([t, s]) => (
          <Card key={t} className="p-5 text-center">
            <p className="font-black text-3xl" style={{ color: RED }}>{t}</p>
            <p className="mt-2 text-base sm:text-lg" style={{ color: NAVY }}>{s}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    <Slide key="plus-16" kicker="L'usage de « moins »">
      <Card className="p-6 text-left">
        <p className="text-base sm:text-lg mb-3" style={{ color: NAVY }}>
          Después del minuto 30 se resta de la hora siguiente.
        </p>
        <ul className="space-y-2 text-base sm:text-lg" style={{ color: NAVY }}>
          <li><b>8h40</b> = « neuf heures <b style={{ color: RED }}>moins vingt</b> »</li>
          <li><b>8h50</b> = « neuf heures <b style={{ color: RED }}>moins dix</b> »</li>
        </ul>
      </Card>
    </Slide>,

    <Slide key="plus-17" kicker="Cas spéciaux !">
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-6 text-center">
          <div className="text-6xl">🕛</div>
          <p className="mt-2 font-extrabold" style={{ color: NAVY }}>12h00 = « Il est midi »</p>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-6xl">🌙</div>
          <p className="mt-2 font-extrabold" style={{ color: NAVY }}>00h00 = « Il est minuit »</p>
        </Card>
      </div>
    </Slide>,

    <Slide key="plus-18" kicker="Moments du jour">
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          ["🌅", "du matin"],
          ["🌤️", "de l'après-midi"],
          ["🌆", "du soir"],
        ].map(([e, t]) => (
          <Card key={t} className="p-5 text-center">
            <div className="text-5xl">{e}</div>
            <p className="mt-2 font-extrabold" style={{ color: NAVY }}>{t}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    <Slide key="plus-19">
      <SlideTitle>À vous de jouer !</SlideTitle>
      <p className="mt-6 text-base sm:text-xl text-white/90 max-w-3xl mx-auto">
        Comparte tu rutina alimentaria con tu compañero usando partitivos, verbos pronominales y las horas.
      </p>
    </Slide>,

    <Slide key="plus-20">
      <SlideTitle>Merci ! 🇫🇷</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white/90">Vos questions ?</p>
    </Slide>,

  ];

  return <SlideDeck slides={slides} />;
}
