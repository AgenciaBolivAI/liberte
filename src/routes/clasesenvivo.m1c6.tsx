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

export const Route = createFileRoute("/clasesenvivo/m1c6")({
  head: () => ({
    meta: [
      { title: "Clase M1C6 — Comparateur de Boutiques · Liberté" },
      {
        name: "description",
        content: "Comparer le style et la qualité comme un conseiller en image.",
      },
    ],
  }),
  component: M1C6,
});

function M1C6() {
  const slides: ReactNode[] = [
    <Slide key="1">
      <Pill>Semaine 3 · Mois 1</Pill>
      <p className="text-lg sm:text-2xl italic text-white/90 mb-3">🛍️</p>
      <SlideTitle>PARIS : Comparateur de Boutiques</SlideTitle>
      <p className="mt-6 text-base sm:text-lg text-white/85 max-w-3xl mx-auto">
        Maîtrisez l'art de comparer le style et la qualité comme un conseiller en image.
      </p>
    </Slide>,

    <Slide key="2" kicker="Check-in · Le Shopping">
      <SlideH2>Quel est votre style de shopping aujourd'hui ?</SlideH2>
      <div className="grid grid-cols-2 gap-4">
        {[
          ["💎", "Chasseur de luxe"],
          ["🏷️", "Chercheur de bonnes affaires"],
          ["👁️", "Lèche-vitrines"],
          ["🛋️", "Shopping en ligne"],
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

    <QuizSlide key="3" kicker="⏪ Retour · La Santé" title="Traduisez">
      <Reveal q="La tête et le dos" a="La cabeza y la espalda" />
      <Reveal q="L'œil et l'oreille" a="El ojo y la oreja" />
      <Reveal q="Le ventre et la jambe" a="El vientre y la pierna" />
    </QuizSlide>,

    <QuizSlide key="4" kicker="⏪ Pratique · Avoir mal à" title="Complète avec AU, À LA, À L', AUX">
      <Reveal q="J'ai mal ___ dents" a="aux" />
      <Reveal q="Il a mal ___ dos" a="au" />
      <Reveal q="Nous avons mal ___ gorge" a="à la" />
      <Reveal q="Elle a mal ___ estomac" a="à l'" />
    </QuizSlide>,

    <Slide key="5" kicker="Votre nouvel outil">
      <SlideTitle>La Comparaison</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white/90 max-w-3xl mx-auto">
        Pour choisir, il faut observer, évaluer et comparer avec précision.
      </p>
      <div className="text-8xl mt-6">🍋 vs 🍊</div>
    </Slide>,

    <QuizSlide key="6" kicker="Vocabulaire · Les Matières" title="La base du style">
      <Reveal q="En soie" a="De seda" />
      <Reveal q="En cachemire" a="De cachemira" />
      <Reveal q="En laine" a="De lana" />
      <Reveal q="En coton" a="De algodón" />
      <Reveal q="En cuir" a="De cuero" />
    </QuizSlide>,

    <QuizSlide key="7" kicker="Vocabulaire · Adjectifs de style" title="Décrire l'impact">
      <Reveal q="Élégant(e) / Sophistiqué(e)" a="Elegante / Sofisticado/a" />
      <Reveal q="Décontracté(e)" a="Casual / Relajado/a" />
      <Reveal q="Cher / Chère" a="Caro/a" />
      <Reveal q="Bon marché" a="Barato/a" />
      <Reveal q="Frappant(e)" a="Llamativo/a" />
    </QuizSlide>,

    <Slide key="8" kicker="📌 Point Grammaire · La Balance">
      <SlideH2>Les Comparatifs</SlideH2>
      <div className="grid sm:grid-cols-3 gap-4 text-left">
        <Card className="p-5">
          <p className="font-extrabold" style={{ color: RED }}>
            ➕ Plus… que
          </p>
          <p className="mt-2 text-sm sm:text-base" style={{ color: NAVY }}>
            plus élégant que
          </p>
        </Card>
        <Card className="p-5">
          <p className="font-extrabold" style={{ color: BLUE }}>
            ➖ Moins… que
          </p>
          <p className="mt-2 text-sm sm:text-base" style={{ color: NAVY }}>
            moins cher que
          </p>
        </Card>
        <Card className="p-5">
          <p className="font-extrabold" style={{ color: NAVY }}>
            🟰 Aussi… que
          </p>
          <p className="mt-2 text-sm sm:text-base" style={{ color: NAVY }}>
            aussi confortable que
          </p>
        </Card>
      </div>
    </Slide>,

    <QuizSlide key="9" kicker="Pratique · Comparatifs" title="Faites la comparaison !">
      <Reveal q="(➕ cher) La soie est ________ le coton." a="plus chère que" />
      <Reveal q="(🟰 élégant) Ce sac est _________ l'autre." a="aussi élégant que" />
      <Reveal q="(➖ grand) Cette boutique est _________ la galerie." a="moins grande que" />
    </QuizSlide>,

    <Slide key="10" kicker="📌 Grammaire · Adjectifs Démonstratifs">
      <SlideH2>Montrer du doigt</SlideH2>
      <Card className="p-6 text-left">
        <ul className="space-y-2 text-base sm:text-lg" style={{ color: NAVY }}>
          <li>
            <b style={{ color: RED }}>CE</b> pantalon <span className="text-sm text-slate-500">· masc.</span>
          </li>
          <li>
            <b style={{ color: RED }}>CET</b> anorak <span className="text-sm text-slate-500">· masc. + voyelle</span>
          </li>
          <li>
            <b style={{ color: RED }}>CETTE</b> robe <span className="text-sm text-slate-500">· fém.</span>
          </li>
          <li>
            <b style={{ color: RED }}>CES</b> chaussures <span className="text-sm text-slate-500">· pluriel</span>
          </li>
        </ul>
      </Card>
    </Slide>,

    <Slide key="11" kicker="📌 Grammaire · Pronoms Démonstratifs">
      <SlideH2>Lequel ? · ¿Cuál?</SlideH2>
      <Card className="p-6 text-left">
        <ul className="space-y-2 text-base sm:text-lg" style={{ color: NAVY }}>
          <li>
            <b style={{ color: RED }}>Celui-ci / Celle-ci</b> — Éste / Ésta (cerca)
          </li>
          <li>
            <b style={{ color: RED }}>Celui-là / Celle-là</b> — Aquél / Aquélla (lejos)
          </li>
        </ul>
        <p className="mt-4 italic" style={{ color: BLUE }}>
          Je préfère cette chemise, mais <b>celle-là</b> est moins chère.
        </p>
      </Card>
    </Slide>,

    <Slide key="12" kicker="Le duel">
      <SlideH2>Luxe vs Basique</SlideH2>
      <div className="grid sm:grid-cols-2 gap-4 text-left">
        <Card className="p-6">
          <p className="font-extrabold text-2xl" style={{ color: RED }}>
            ✨ Le Luxe
          </p>
          <p className="mt-2 text-sm sm:text-base" style={{ color: NAVY }}>
            Qualité supérieure, soie, cachemire, durabilité, investissement.
          </p>
        </Card>
        <Card className="p-6">
          <p className="font-extrabold text-2xl" style={{ color: BLUE }}>
            🧵 Le Basique
          </p>
          <p className="mt-2 text-sm sm:text-base" style={{ color: NAVY }}>
            Fonctionnalité, coton, polyester, usage quotidien, prix accessible.
          </p>
        </Card>
      </div>
    </Slide>,

    <QuizSlide key="13" kicker="Scénario 1 · Tenue de travail" title="Traduisez">
      <Reveal
        q="Cette chemise en soie est plus professionnelle que celle en polyester."
        a="Esta camisa de seda es más profesional que aquella de poliéster."
      />
      <Reveal
        q="Ce pantalon-ci est aussi confortable que celui-là."
        a="Este pantalón es tan cómodo como aquél."
      />
    </QuizSlide>,

    <QuizSlide key="14" kicker="Scénario 2 · Look de fête" title="Traduisez">
      <Reveal
        q="Cette robe rouge est plus frappante que celle-ci en noir."
        a="Este vestido rojo es más impactante que este negro."
      />
      <Reveal
        q="Ces chaussures sont plus élégantes, mais moins pratiques."
        a="Estos zapatos son más elegantes, pero menos prácticos."
      />
    </QuizSlide>,

    <Slide key="15" kicker="🛍️ Jeu de rôle · Le Personal Shopper">
      <div className="grid sm:grid-cols-2 gap-4 text-left">
        <Card className="p-5">
          <p className="font-extrabold" style={{ color: BLUE }}>
            Le Client
          </p>
          <ul className="mt-2 space-y-1.5 text-sm sm:text-base" style={{ color: NAVY }}>
            <li>• Je cherche une tenue pour une réunion.</li>
            <li>• Quel est le prix de cette veste ?</li>
            <li>• Je préfère celui-ci / celle-là.</li>
          </ul>
        </Card>
        <Card className="p-5">
          <p className="font-extrabold" style={{ color: RED }}>
            Le Conseiller
          </p>
          <ul className="mt-2 space-y-1.5 text-sm sm:text-base" style={{ color: NAVY }}>
            <li>• Je vous recommande ce tissu en laine.</li>
            <li>• C'est plus cher, mais la qualité est meilleure.</li>
            <li>• Cette option est aussi élégante que l'autre.</li>
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
      <SlideTitle>Comparateur de Boutiques</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white">Maîtrisez l'art de comparer style et qualité 🛍️</p>
    </Slide>,

    <Slide key="plus-2" kicker="Votre nouvel outil">
      <SlideH2>La Comparaison</SlideH2>
      <div className="text-8xl mt-4">🍋 &nbsp; vs &nbsp; 🍊</div>
      <p className="mt-6 text-white/90 text-base sm:text-lg">Comparer, c'est choisir en toute clarté.</p>
    </Slide>,

    <Slide key="plus-3" kicker="La Grammaire du Style">
      <div className="grid sm:grid-cols-3 gap-4 text-left">
        <Card className="p-5">
          <p className="font-extrabold" style={{ color: RED }}>Comparatifs</p>
          <p className="mt-2 text-sm sm:text-base" style={{ color: NAVY }}>plus… que · moins… que · aussi… que</p>
        </Card>
        <Card className="p-5">
          <p className="font-extrabold" style={{ color: RED }}>Démonstratifs</p>
          <p className="mt-2 text-sm sm:text-base" style={{ color: NAVY }}>ce / cette · celui-ci / celle-là</p>
        </Card>
        <Card className="p-5">
          <p className="font-extrabold" style={{ color: RED }}>Adjectifs</p>
          <p className="mt-2 text-sm sm:text-base" style={{ color: NAVY }}>élégant, décontracté, cher, bon marché, en soie, en laine</p>
        </Card>
      </div>
    </Slide>,

    <Slide key="plus-4" kicker="Deux univers">
      <div className="grid sm:grid-cols-2 gap-4 text-left">
        <Card className="p-6">
          <p className="font-extrabold text-2xl" style={{ color: RED }}>✨ Luxe</p>
          <p className="mt-2 text-sm sm:text-base" style={{ color: NAVY }}>qualité, soie, cachemire, durabilité.</p>
        </Card>
        <Card className="p-6">
          <p className="font-extrabold text-2xl" style={{ color: BLUE }}>🧵 Basique</p>
          <p className="mt-2 text-sm sm:text-base" style={{ color: NAVY }}>fonctionnalité, coton, polyester, prix accessible.</p>
        </Card>
      </div>
    </Slide>,

    <Slide key="plus-5" kicker="Tenue de Travail">
      <SlideH2>Le style professionnel 👔</SlideH2>
      <Card className="p-6 text-left">
        <p className="text-base sm:text-lg mb-2" style={{ color: NAVY }}>
          « Cette chemise en soie est <b style={{ color: RED }}>plus professionnelle que</b> celle en polyester. »
        </p>
        <p className="text-base sm:text-lg" style={{ color: NAVY }}>
          « Ce pantalon est <b style={{ color: RED }}>aussi confortable que</b> celui-là. »
        </p>
      </Card>
    </Slide>,

    <Slide key="plus-6" kicker="Look de Fête">
      <SlideH2>L'Impact 💃</SlideH2>
      <Card className="p-6 text-left">
        <p className="text-lg sm:text-2xl" style={{ color: NAVY }}>
          « Cette robe est <b style={{ color: RED }}>plus frappante que</b> celle-ci. »
        </p>
      </Card>
    </Slide>,

    <Slide key="plus-7" kicker="Styles de Chaussures">
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          ["👠", "Les talons", "plus élégants"],
          ["🥾", "Les bottes", "aussi polyvalentes que belles"],
          ["👟", "Les chaussures plates", "moins formelles"],
        ].map(([e, t, s]) => (
          <Card key={t} className="p-5 text-center">
            <div className="text-5xl">{e}</div>
            <p className="mt-2 font-extrabold" style={{ color: NAVY }}>{t}</p>
            <p className="text-sm text-slate-600 mt-1">{s}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    <Slide key="plus-8" kicker="Guide du Conseiller">
      <Card className="overflow-x-auto text-left">
        <table className="w-full text-sm sm:text-base">
          <thead style={{ background: NAVY, color: "white" }}>
            <tr>
              <th className="p-3 text-left">Vêtement</th>
              <th className="p-3 text-left">Option Luxe</th>
              <th className="p-3 text-left">Option Basique</th>
            </tr>
          </thead>
          <tbody style={{ color: NAVY }}>
            {[
              ["Blouse", "Soie, coupe cintrée", "Coton, coupe standard"],
              ["Costume", "Laine italienne, sur-mesure", "Polyester, prêt-à-porter"],
              ["Pantalon", "Laine fine, doublure", "Coton mélangé"],
            ].map((r, i) => (
              <tr key={i} className="border-t border-slate-200">
                <td className="p-3 font-bold">{r[0]}</td>
                <td className="p-3" style={{ color: RED }}>{r[1]}</td>
                <td className="p-3" style={{ color: BLUE }}>{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Slide>,

    <Slide key="plus-9" kicker="Le Pouvoir du Détail">
      <SlideH2>La qualité communique</SlideH2>
      <Card className="p-6 text-left">
        <p className="text-base sm:text-lg mb-4" style={{ color: NAVY }}>
          Durabilité : <b>Laine</b> ≫ <b>Polyester</b>
        </p>
        <div className="flex items-end gap-6 h-32">
          <div className="flex-1 rounded-t-xl" style={{ background: RED, height: "100%" }}>
            <p className="text-white text-center pt-2 font-bold">Laine</p>
          </div>
          <div className="flex-1 rounded-t-xl" style={{ background: BLUE, height: "40%" }}>
            <p className="text-white text-center pt-2 font-bold text-sm">Polyester</p>
          </div>
        </div>
      </Card>
    </Slide>,

    <Slide key="plus-10" kicker="Check-list du Conseiller">
      <Card className="p-6 text-left">
        <ul className="space-y-2 text-base sm:text-lg" style={{ color: NAVY }}>
          <li>✅ Vérifier les coutures</li>
          <li>✅ Comparer les tissus</li>
          <li>✅ Choisir des coupes intemporelles</li>
          <li>✅ Analyser le prix par utilisation</li>
        </ul>
      </Card>
    </Slide>,

    <Slide key="plus-11">
      <SlideTitle>À vous de pratiquer</SlideTitle>
      <p className="mt-6 text-base sm:text-xl text-white/90">
        ¿Qué prendas prefieres para el trabajo? ¿Y para una fiesta?
      </p>
      <Card className="p-5 text-left mt-6 max-w-2xl mx-auto">
        <p className="text-sm sm:text-base" style={{ color: NAVY }}>
          Estructuras sugeridas : <b>« Je préfère ce/cette… »</b> · <b>« C'est plus… que… »</b>.
        </p>
      </Card>
    </Slide>,

  ];

  return <SlideDeck slides={slides} />;
}
