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

export const Route = createFileRoute("/clasesenvivo/m1c4")({
  head: () => ({
    meta: [
      { title: "Clase M1C4 — La Course au Supermarché · Liberté" },
      {
        name: "description",
        content: "Le but et l'efficacité : exprimer le pourquoi de nos actions.",
      },
    ],
  }),
  component: M1C4,
});

function M1C4() {
  const slides: ReactNode[] = [
    <Slide key="1">
      <Pill>Semaine 2 · Mois 1</Pill>
      <p className="text-lg sm:text-2xl italic text-white/90 mb-3">🗼🛒</p>
      <SlideTitle>PARIS : La Course au Supermarché</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white">Le but et l'efficacité</p>
      <p className="mt-3 text-base sm:text-lg text-white/85 max-w-3xl mx-auto">
        Objectif : exprimer le but de nos actions et faire des achats.
      </p>
    </Slide>,

    <Slide key="2" kicker="Check-in · Le panier">
      <SlideH2>Quel est l'état de votre panier aujourd'hui ?</SlideH2>
      <div className="grid grid-cols-2 gap-4">
        {[
          ["🛒", "Plein (d'énergie)"],
          ["🧺", "À moitié plein"],
          ["🛍️", "Prêt pour les courses"],
          ["🫙", "Vide (batterie faible)"],
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

    <QuizSlide key="3" kicker="⏪ Retour en arrière · Le GPS Humain" title="Avant d'entrer au supermarché…">
      <Reveal q={<>¿Cómo se dice « Gire a la izquierda »&nbsp;?</>} a="Tournez à gauche." />
      <Reveal q="« Continúe todo recto »" a="Continuez tout droit." />
      <Reveal q="Futur Proche : Je _____ (aller) prendre le métro" a="vais" />
      <Reveal q="Futur Proche : Nous _____ (aller) traverser la rue" a="allons" />
    </QuizSlide>,

    <Slide key="4" kicker="Introduction">
      <SlideTitle>Pourquoi y aller ?</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white/90 max-w-3xl mx-auto">
        Aujourd'hui, nous apprenons à exprimer <b>le but</b> de nos actions.
      </p>
      <div className="text-8xl mt-6">❓📓</div>
    </Slide>,

    <Slide key="5" kicker="📌 Point Grammaire">
      <SlideH2>Pour + Infinitif</SlideH2>
      <Card className="p-6 text-left">
        <p className="text-base sm:text-xl leading-relaxed" style={{ color: NAVY }}>
          On utilise <b style={{ color: RED }}>POUR</b> suivi d'un verbe à l'infinitif pour
          expliquer <b>l'objectif ou le but</b> de notre déplacement.
        </p>
        <p className="mt-4 text-lg sm:text-2xl" style={{ color: BLUE }}>
          « Je vais à la boulangerie… »
        </p>
      </Card>
    </Slide>,

    <QuizSlide key="6" kicker="Les exemples" title="Je vais à la boulangerie…">
      <Reveal q="…pour acheter du pain frais." a="…para comprar pan fresco." />
      <Reveal q="…pour prendre des croissants." a="…para llevar croissants." />
      <Reveal q="…pour demander le prix des gâteaux." a="…para preguntar el precio." />
    </QuizSlide>,

    <Slide key="7" kicker="Vocabulaire">
      <SlideH2>La liste de courses 📝</SlideH2>
      <div className="grid sm:grid-cols-3 gap-4 text-left">
        <Card className="p-5">
          <p className="font-extrabold" style={{ color: RED }}>
            🥩 Produits frais
          </p>
          <p className="text-sm sm:text-base mt-1" style={{ color: NAVY }}>
            Fruits, légumes, viande.
          </p>
        </Card>
        <Card className="p-5">
          <p className="font-extrabold" style={{ color: BLUE }}>
            🍚 Produits secs
          </p>
          <p className="text-sm sm:text-base mt-1" style={{ color: NAVY }}>
            Riz, pâtes, farine.
          </p>
        </Card>
        <Card className="p-5">
          <p className="font-extrabold" style={{ color: NAVY }}>
            🧼 Produits d'entretien
          </p>
          <p className="text-sm sm:text-base mt-1" style={{ color: NAVY }}>
            Savon, lessive.
          </p>
        </Card>
      </div>
    </Slide>,

    <QuizSlide key="8" kicker="Les rayons essentiels" title="Traduisez">
      <Reveal
        q="La Crémerie : pour acheter du lait, du beurre, des œufs, du yaourt."
        a="Para comprar leche, mantequilla, huevos y yogur."
      />
      <Reveal
        q="Fruits & Légumes : pour trouver des produits frais et de saison."
        a="Para encontrar productos frescos y de temporada."
      />
    </QuizSlide>,

    <QuizSlide key="9" kicker="Pratique finale" title="Complète la phrase">
      <Reveal q="Je vais à la crémerie pour… (comprar leche)" a="acheter du lait." />
      <Reveal q="Je vais au supermarché pour… (encontrar arroz)" a="trouver du riz." />
      <Reveal q="Je vais au rayon Fruits & Légumes pour… (tomar manzanas)" a="prendre des pommes." />
    </QuizSlide>,

    <Slide key="10">
      <SlideTitle>Bonnes courses ! 🛒</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white/90">Des questions ?</p>
    </Slide>,
    // === Un petit plus ===
    <Slide key="plus-divider">
      <Pill>Un petit plus</Pill>
      <SlideTitle>Un petit plus :</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white/90">Matériel complémentaire de la classe.</p>
    </Slide>,

    <Slide key="plus-1">
      <Pill>Semaine 2 · Mois 1</Pill>
      <p className="text-lg sm:text-2xl italic text-white/90 mb-3">🗼 PARIS</p>
      <SlideTitle>La Course au Supermarché</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white">Le but et l'efficacité 🛒</p>
    </Slide>,

    <Slide key="plus-2" kicker="Pourquoi y aller ?">
      <SlideH2>Aujourd'hui, on exprime le BUT de nos actions</SlideH2>
      <div className="text-8xl mt-4">🎯</div>
    </Slide>,

    <Slide key="plus-3" kicker="Grammaire · Pour + Infinitif">
      <SlideH2>La Structure</SlideH2>
      <Card className="p-6 text-left">
        <p className="text-base sm:text-lg leading-relaxed" style={{ color: NAVY }}>
          On utilise <b style={{ color: RED }}>POUR</b> suivi d'un verbe à l'infinitif pour
          expliquer <b>l'objectif</b> ou <b>le but</b> de notre déplacement.
        </p>
        <p className="mt-4 text-lg sm:text-2xl font-bold" style={{ color: BLUE }}>
          « Je vais à la boulangerie… »
        </p>
      </Card>
    </Slide>,

    <Slide key="plus-4" kicker="Grammaire · Pour + Infinitif">
      <SlideH2>Les Exemples</SlideH2>
      <Card className="p-6 text-left">
        <ul className="space-y-3 text-base sm:text-xl" style={{ color: NAVY }}>
          <li>🥐 …<b>pour acheter</b> du pain frais.</li>
          <li>🥨 …<b>pour prendre</b> des croissants.</li>
          <li>💶 …<b>pour demander</b> le prix des gâteaux.</li>
        </ul>
      </Card>
    </Slide>,

    <Slide key="plus-5" kicker="Vos habitudes d'achat">
      <SlideH2>La liste de courses 📝</SlideH2>
      <Card className="p-6 text-left">
        <ul className="space-y-2 text-base sm:text-lg" style={{ color: NAVY }}>
          <li>🥬 <b>Produits frais :</b> fruits, légumes, viande.</li>
          <li>🌾 <b>Produits secs :</b> riz, pâtes, farine.</li>
          <li>🧼 <b>Produits d'entretien :</b> savon, lessive.</li>
        </ul>
      </Card>
    </Slide>,

    <Slide key="plus-6" kicker="Les rayons essentiels">
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-5 text-left">
          <div className="h-32 rounded-xl grid place-items-center text-6xl mb-3"
               style={{ background: "linear-gradient(135deg,#FCE9E5,#F0A090)" }}>🧀</div>
          <p className="font-extrabold" style={{ color: NAVY }}>La Crémerie</p>
          <p className="text-sm mt-1 text-slate-600">
            …pour acheter du lait, du beurre, des œufs et du yaourt.
          </p>
        </Card>
        <Card className="p-5 text-left">
          <div className="h-32 rounded-xl grid place-items-center text-6xl mb-3"
               style={{ background: "linear-gradient(135deg,#E3F1DE,#9BCBEF)" }}>🥦</div>
          <p className="font-extrabold" style={{ color: NAVY }}>Fruits & Légumes</p>
          <p className="text-sm mt-1 text-slate-600">
            …pour trouver des produits frais et de saison.
          </p>
        </Card>
      </div>
    </Slide>,

    <Slide key="plus-7" kicker="Lieux & Buts">
      <Card className="overflow-x-auto text-left">
        <table className="w-full text-sm sm:text-base">
          <thead style={{ background: NAVY, color: "white" }}>
            <tr>
              <th className="p-3 text-left">Lieu</th>
              <th className="p-3 text-left">Action / But</th>
              <th className="p-3 text-left">Exemple complet</th>
            </tr>
          </thead>
          <tbody style={{ color: NAVY }}>
            {[
              ["Le supermarché", "Faire les courses", "Je vais au supermarché pour faire les courses."],
              ["La caisse", "Payer les articles", "Je vais à la caisse pour payer mes pommes."],
              ["Le parking", "Garer la voiture", "Je vais au parking pour garer ma voiture."],
              ["Le rayon épicerie", "Trouver du sel", "Je vais au rayon épicerie pour trouver du sel."],
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

    <Slide key="plus-8" kicker="Le Défi">
      <SlideTitle>10 minutes chrono ⏱️</SlideTitle>
      <p className="mt-6 text-lg sm:text-xl text-white/90">
        Mise en situation réelle et obstacles dans les rayons.
      </p>
    </Slide>,

    <Slide key="plus-9" kicker="Navigation tactique">
      <SlideH2>Le Plan du Supermarché</SlideH2>
      <Card className="p-6 text-left">
        <p className="text-base sm:text-lg leading-relaxed" style={{ color: NAVY }}>
          Pour gagner du temps, il faut connaître le plan. Le <b>rayon boissons</b> est souvent
          à l'opposé de la <b>boulangerie</b> !
          <br /><br />
          <b style={{ color: RED }}>Activité :</b> guidez votre partenaire à travers les rayons
          pour trouver les 3 produits de votre liste le plus vite possible.
        </p>
      </Card>
    </Slide>,

    <Slide key="plus-10" kicker="Gestion des obstacles">
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          ["🛒", "Rayon encombré"],
          ["🛍️", "Caddie oublié"],
          ["📝", "Liste illisible"],
        ].map(([e, t]) => (
          <Card key={t} className="p-5 text-center">
            <div className="text-6xl">{e}</div>
            <p className="mt-2 font-extrabold" style={{ color: NAVY }}>{t}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    <Slide key="plus-11" kicker="Étapes de la mission">
      <div className="grid sm:grid-cols-4 gap-3 text-left">
        {[
          ["1", "Préparation", "écrire la liste"],
          ["2", "Courses", "trouver les produits"],
          ["3", "Caisse", "payer la facture"],
          ["4", "Cuisine", "rentrer et cuisiner"],
        ].map(([n, t, s]) => (
          <Card key={n} className="p-4">
            <div className="h-10 w-10 rounded-full grid place-items-center text-white font-black mb-2" style={{ background: RED }}>{n}</div>
            <p className="font-extrabold" style={{ color: NAVY }}>{t}</p>
            <p className="text-xs text-slate-500 mt-1">{s}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    <Slide key="plus-12">
      <SlideTitle>Questions ?</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white/90">Bonne chance pour votre course au supermarché ! 🛒</p>
      <p className="mt-4 text-white/80">Merci.</p>
    </Slide>,

  ];

  return <SlideDeck slides={slides} />;
}
