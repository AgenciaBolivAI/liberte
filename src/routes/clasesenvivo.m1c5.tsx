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

export const Route = createFileRoute("/clasesenvivo/m1c5")({
  head: () => ({
    meta: [
      { title: "Clase M1C5 — Le Diagnostic Médical · Liberté" },
      {
        name: "description",
        content: "Réaliser une consultation et exprimer la douleur en français.",
      },
    ],
  }),
  component: M1C5,
});

function M1C5() {
  const slides: ReactNode[] = [
    <Slide key="1">
      <Pill>Semaine 3 · Mois 1</Pill>
      <p className="text-lg sm:text-2xl italic text-white/90 mb-3">🩺</p>
      <SlideTitle>PARIS : Le Diagnostic Médical</SlideTitle>
      <p className="mt-6 text-base sm:text-lg text-white/85 max-w-3xl mx-auto">
        Objectif : réaliser une consultation et exprimer la douleur.
      </p>
    </Slide>,

    <Slide key="2" kicker="Check-in">
      <SlideH2>Comment vous sentez-vous aujourd'hui ?</SlideH2>
      <div className="grid grid-cols-2 gap-4">
        {[
          ["🔋", "En pleine forme !"],
          ["😌", "Ça va bien, merci"],
          ["🥱", "Un peu fatigué(e)"],
          ["🤒", "Je suis malade"],
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

    <QuizSlide key="3" kicker="⏪ Retour · Le Supermarché" title="Traduisez">
      <Reveal q="Le rayon des fruits et légumes" a="El pasillo de frutas y verduras" />
      <Reveal q="Les produits d'entretien" a="Los productos de limpieza" />
      <Reveal q="La crémerie" a="La sección de lácteos" />
    </QuizSlide>,

    <QuizSlide key="4" kicker="⏪ Pratique · Pour + Infinitif" title="Le but">
      <Reveal q="Je vais à la boulangerie pour… (comprar pan)" a="acheter du pain." />
      <Reveal q="Je vais à la pharmacie pour… (comprar aspirina)" a="acheter de l'aspirine." />
    </QuizSlide>,

    <Slide key="5" kicker="Aïe ! Qu'est-ce qui ne va pas ?">
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          ["🦷", "J'ai mal aux dents"],
          ["🤢", "J'ai mal au ventre"],
          ["🤯", "J'ai mal à la tête"],
        ].map(([e, t]) => (
          <Card key={t} className="p-5 text-center">
            <div className="text-6xl">{e}</div>
            <p className="mt-2 font-extrabold" style={{ color: NAVY }}>
              {t}
            </p>
          </Card>
        ))}
      </div>
    </Slide>,

    <QuizSlide key="6" kicker="Le corps humain · La tête et le buste" title="Traduisez">
      <Reveal q="La tête / Le visage" a="La cabeza / El rostro" />
      <Reveal q="L'œil / Les yeux" a="El ojo / Los ojos" />
      <Reveal q="L'oreille" a="La oreja" />
      <Reveal q="Les dents / La gorge" a="Los dientes / La garganta" />
      <Reveal q="Le dos / Le ventre" a="La espalda / El vientre" />
    </QuizSlide>,

    <QuizSlide key="7" kicker="Le corps humain · Les membres" title="Traduisez">
      <Reveal q="Le bras" a="El brazo" />
      <Reveal q="La main / Les doigts" a="La mano / Los dedos" />
      <Reveal q="La jambe" a="La pierna" />
      <Reveal q="Le genou" a="La rodilla" />
      <Reveal q="Le pied" a="El pie" />
    </QuizSlide>,

    <Slide key="8" kicker="📌 Point Grammaire · Exprimer la douleur">
      <SlideH2>Avoir mal à…</SlideH2>
      <Card className="p-6 text-left">
        <p className="text-sm sm:text-base italic mb-3" style={{ color: BLUE }}>
          Sujet + AVOIR + mal + à + article + partie du corps
        </p>
        <ul className="space-y-2 text-base sm:text-lg" style={{ color: NAVY }}>
          <li>
            <b style={{ color: RED }}>À + LE = AU</b> — J'ai mal au bras
          </li>
          <li>
            <b style={{ color: RED }}>À + LA = À LA</b> — J'ai mal à la gorge
          </li>
          <li>
            <b style={{ color: RED }}>À + L'</b> — J'ai mal à l'oreille
          </li>
          <li>
            <b style={{ color: RED }}>À + LES = AUX</b> — J'ai mal aux dents
          </li>
        </ul>
      </Card>
    </Slide>,

    <QuizSlide key="9" kicker="Exercice 1" title="Où avez-vous mal ?">
      <Reveal q="J'ai mal ___ dos (le dos)" a="au" />
      <Reveal q="Il a mal ___ tête (la tête)" a="à la" />
      <Reveal q="Nous avons mal ___ yeux (les yeux)" a="aux" />
      <Reveal q="Elle a mal ___ estomac (l'estomac)" a="à l'" />
    </QuizSlide>,

    <QuizSlide key="10" kicker="Exercice 2" title="Le bon remède">
      <Reveal q="J'ai mal à la tête" a="Je prends une aspirine." />
      <Reveal q="J'ai mal à la gorge" a="Je bois un thé chaud." />
      <Reveal q="J'ai mal aux dents" a="Je vais chez le dentiste." />
      <Reveal q="J'ai mal au dos" a="Je me repose (je dors)." />
    </QuizSlide>,

    <Slide key="11" kicker="🩺 Jeu de rôle · La Consultation">
      <div className="grid sm:grid-cols-2 gap-4 text-left">
        <Card className="p-5">
          <p className="font-extrabold" style={{ color: RED }}>
            Le Médecin
          </p>
          <ul className="mt-2 space-y-1.5 text-sm sm:text-base" style={{ color: NAVY }}>
            <li>• Bonjour, asseyez-vous.</li>
            <li>• Qu'est-ce qui ne va pas ?</li>
            <li>• Où avez-vous mal exactement ?</li>
          </ul>
        </Card>
        <Card className="p-5">
          <p className="font-extrabold" style={{ color: BLUE }}>
            Le Patient
          </p>
          <ul className="mt-2 space-y-1.5 text-sm sm:text-base" style={{ color: NAVY }}>
            <li>• Bonjour docteur.</li>
            <li>• Je ne me sens pas bien…</li>
            <li>• J'ai très mal à…</li>
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
      <Pill>Semaine 3 · Mois 1</Pill>
      <p className="text-lg sm:text-2xl italic text-white/90 mb-3">🗼 PARIS</p>
      <SlideTitle>Le Diagnostic Médical</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white">Consultation & Ordonnance 🩺</p>
    </Slide>,

    <Slide key="plus-2" kicker="Aïe ! Qu'est-ce qui ne va pas ?">
      <SlideH2>Identifier le malaise</SlideH2>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          ["🦷", "J'ai mal aux dents"],
          ["🤯", "J'ai mal à la tête"],
          ["🤢", "J'ai mal au ventre"],
        ].map(([e, t]) => (
          <Card key={t} className="p-5 text-center">
            <div className="text-6xl">{e}</div>
            <p className="mt-2 font-extrabold" style={{ color: NAVY }}>{t}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    <Slide key="plus-3" kicker="Le Corps Humain">
      <SlideH2>Les parties essentielles</SlideH2>
      <Card className="p-6 text-left">
        <div className="grid sm:grid-cols-2 gap-2 text-base sm:text-lg" style={{ color: NAVY }}>
          <p>🧠 La tête / Le visage</p>
          <p>💪 Le bras / La main</p>
          <p>🫃 Le ventre / Le dos</p>
          <p>🦵 La jambe / Le pied</p>
          <p>👄 La gorge / Les dents</p>
          <p>👁️ Les yeux / Les oreilles</p>
        </div>
      </Card>
    </Slide>,

    <Slide key="plus-4" kicker="Grammaire · Avoir mal à…">
      <SlideH2>Sujet + avoir + mal + à + article</SlideH2>
      <Card className="p-6 text-left">
        <ul className="space-y-3 text-base sm:text-lg" style={{ color: NAVY }}>
          <li><b style={{ color: RED }}>À + LE = AU</b> — au bras</li>
          <li><b style={{ color: RED }}>À + LA = À LA</b> — à la gorge</li>
          <li><b style={{ color: RED }}>À + L'</b> — à l'oreille</li>
          <li><b style={{ color: RED }}>À + LES = AUX</b> — aux dents</li>
        </ul>
      </Card>
    </Slide>,

    <Slide key="plus-5" kicker="Symptômes et Malaises">
      <Card className="p-6 text-left">
        <ul className="space-y-2 text-base sm:text-lg" style={{ color: NAVY }}>
          <li>🌡️ J'ai <b>de la fièvre</b> (température élevée).</li>
          <li>😷 <b>Je tousse</b> (toux sèche ou grasse).</li>
          <li>🤧 <b>J'ai le nez qui coule</b> (enrhumé).</li>
          <li>😴 <b>Je suis fatigué(e)</b> (pas d'énergie).</li>
          <li>🤮 <b>J'ai des nausées</b> (envie de vomir).</li>
          <li>💫 <b>J'ai la tête qui tourne</b> (vertiges).</li>
        </ul>
      </Card>
    </Slide>,

    <Slide key="plus-6" kicker="Donner des conseils">
      <SlideH2>Il faut + infinitif</SlideH2>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          ["💊", "Médicaments", "Il faut prendre des comprimés ou du sirop."],
          ["🛏️", "Repos", "Il faut rester au lit et se reposer."],
          ["💧", "Hydratation", "Il faut boire de l'eau ou une tisane chaude."],
        ].map(([e, t, s]) => (
          <Card key={t} className="p-5 text-center">
            <div className="text-5xl">{e}</div>
            <p className="mt-2 font-extrabold" style={{ color: NAVY }}>{t}</p>
            <p className="text-sm text-slate-600 mt-1">{s}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    <Slide key="plus-7" kicker="Symptôme vs Remède">
      <Card className="overflow-x-auto text-left">
        <table className="w-full text-sm sm:text-base">
          <thead style={{ background: NAVY, color: "white" }}>
            <tr>
              <th className="p-3 text-left">Symptôme</th>
              <th className="p-3 text-left">Remède</th>
            </tr>
          </thead>
          <tbody style={{ color: NAVY }}>
            {[
              ["J'ai de la fièvre", "Il faut prendre du paracétamol et se reposer."],
              ["Je tousse", "Il faut prendre du sirop pour la toux."],
              ["J'ai mal à la gorge", "Il faut boire une tisane chaude avec du miel."],
              ["J'ai le nez qui coule", "Il faut se reposer et boire beaucoup d'eau."],
              ["J'ai mal à la tête", "Il faut prendre un comprimé et éviter les écrans."],
            ].map((r, i) => (
              <tr key={i} className="border-t border-slate-200">
                <td className="p-3 font-bold" style={{ color: RED }}>{r[0]}</td>
                <td className="p-3">{r[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Slide>,

    <Slide key="plus-8" kicker="Étapes clés de la consultation">
      <div className="grid sm:grid-cols-2 gap-3 text-left">
        {[
          ["👋 Accueil", "« Bonjour Docteur », « Asseyez-vous. »"],
          ["❓ Interrogatoire", "« Où avez-vous mal ? », « Depuis quand ? »"],
          ["🔍 Examen", "« Ouvrez la bouche », « Respirez fort. »"],
          ["📝 Diagnostic", "« C'est une grippe », « Voici l'ordonnance. »"],
        ].map(([t, s]) => (
          <Card key={t} className="p-5">
            <p className="font-extrabold text-lg" style={{ color: BLUE }}>{t}</p>
            <p className="mt-1 text-sm sm:text-base" style={{ color: NAVY }}>{s}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    <Slide key="plus-9" kicker="Activité Finale">
      <SlideH2>L'Ordonnance Médicale 📋</SlideH2>
      <Card className="p-6 text-left">
        <p className="text-base sm:text-lg leading-relaxed" style={{ color: NAVY }}>
          El médico llena el documento oficial para la farmacia con :
          <b> nombre del medicamento</b>, <b>dosis</b> y <b>duración</b>.
        </p>
        <p className="mt-4 font-bold" style={{ color: RED }}>
          Activité : rédige une ordonnance rapide pour ton/ta partenaire !
        </p>
      </Card>
    </Slide>,

    <Slide key="plus-10">
      <SlideTitle>Des questions ?</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white/90">C'est l'heure du jeu de rôle ! 🎭</p>
      <p className="mt-4 text-white/80">Merci pour votre attention !</p>
    </Slide>,

  ];

  return <SlideDeck slides={slides} />;
}
