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

export const Route = createFileRoute("/clasesenvivo/m1c2")({
  head: () => ({
    meta: [
      { title: "Clase M1C2 — Paris et le Restaurant · Liberté" },
      {
        name: "description",
        content: "L'Art du Service : gérer une commande complexe au restaurant.",
      },
    ],
  }),
  component: M1C2,
});

function M1C2() {
  const slides: ReactNode[] = [
    // 1 · Portada
    <Slide key="1">
      <Pill>Semaine 1 · Mois 1</Pill>
      <p className="text-lg sm:text-2xl italic text-white/90 mb-3">🗼</p>
      <SlideTitle>PARIS</SlideTitle>
      <p className="mt-6 text-xl sm:text-3xl font-bold text-white">
        L'Art du Service et de la Négociation
      </p>
      <p className="mt-3 text-lg sm:text-2xl text-white/90">Le Client Difficile</p>
      <p className="mt-4 text-base sm:text-lg text-white/80 max-w-3xl mx-auto">
        Objectif : gérer des commandes complexes au restaurant.
      </p>
    </Slide>,

    // 2 · Check-in
    <Slide key="2" kicker="Check-in">
      <SlideH2>Quel est votre niveau d'énergie aujourd'hui ?</SlideH2>
      <div className="grid grid-cols-2 gap-4">
        {[
          ["☕☕☕", "Plein d'énergie !"],
          ["☕☕", "Ça va, je suis prêt(e)"],
          ["☕", "J'ai besoin d'un café..."],
          ["🫗", "Batterie faible"],
        ].map(([e, t]) => (
          <Card key={t} className="p-5 text-center">
            <div className="text-4xl sm:text-5xl">{e}</div>
            <p className="mt-2 font-extrabold text-sm sm:text-base" style={{ color: NAVY }}>
              « {t} »
            </p>
          </Card>
        ))}
      </div>
    </Slide>,

    // 3 · Intro repaso
    <Slide key="3" kicker="⏪ Retour en arrière">
      <SlideH2>La Classe 1</SlideH2>
      <p className="text-lg sm:text-xl text-white/95 max-w-3xl mx-auto">
        Avant d'aller au restaurant, revisemos qué quedó en nuestro refrigerador. 🥖🧀
      </p>
    </Slide>,

    // 4 · Repaso interactivo
    <QuizSlide key="4" kicker="Repaso interactivo" title="¿Qué significa o qué verbo falta?">
      <Reveal q="Le fromage et le pain" a="El queso y el pan" />
      <Reveal q="J'ai faim et j'ai soif" a="Tengo hambre y tengo sed" />
      <Reveal q="Nous _____ au supermarché (Aller)" a="allons" />
      <Reveal q="Tu _____ un bon étudiant ? (Être)" a="es" />
    </QuizSlide>,

    // 5 · Intro nuevo tema
    <Slide key="5" kicker="I. Salutations et Courtoisie">
      <SlideH2>Le premier contact avec le serveur</SlideH2>
      <div className="text-8xl mt-4">🤵🚪</div>
    </Slide>,

    // 6 · Étiquette
    <QuizSlide key="6" kicker="L'étiquette au Restaurant" title="La politesse avant tout">
      <Reveal q={<>« Bonjour » ou « Bonsoir » dès l'arrivée.</>} a="Al llegar, siempre saludar." />
      <Reveal q={<>« S'il vous plaît » à la fin de chaque commande.</>} a="« Por favor » al final de cada pedido." />
      <Reveal q={<>« Merci » pour chaque geste du serveur.</>} a="« Gracias » por cada gesto del mesero." />
      <Reveal q={<>« L'addition, s'il vous plaît » pour payer.</>} a="« La cuenta, por favor » para pagar." />
    </QuizSlide>,

    // 7 · Frases útiles dos columnas
    <Slide key="7" kicker="Qu'est-ce que je prends ?">
      <SlideH2>Demander conseil · Prendre une décision</SlideH2>
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-5 text-left">
          <p className="font-extrabold mb-3" style={{ color: RED }}>
            Demander conseil
          </p>
          <Reveal q="Qu'est-ce que vous recommandez ?" a="¿Qué recomienda?" />
          <Reveal q="Quelle est la spécialité de la maison ?" a="¿Cuál es la especialidad?" />
          <Reveal q="Qu'est-ce que vous avez comme boissons ?" a="¿Qué tienen de bebidas?" />
        </Card>
        <Card className="p-5 text-left">
          <p className="font-extrabold mb-3" style={{ color: BLUE }}>
            Prendre une décision
          </p>
          <Reveal q="Je vais prendre le menu à 25€." a="Voy a pedir el menú de 25€." />
          <Reveal q="Pour moi, ce sera le confit de canard." a="Para mí, será el confit de pato." />
        </Card>
      </div>
    </Slide>,

    // 8 · Gramática artículos
    <Slide key="8" kicker="📌 Point Grammaire">
      <SlideH2>Les Articles Définis : ¿Específico o general?</SlideH2>
      <Card className="p-6 text-left">
        <ul className="space-y-2 text-base sm:text-xl" style={{ color: NAVY }}>
          <li>
            <b style={{ color: RED }}>LE</b> menu <span className="text-sm text-slate-500">· masc. sing.</span>
          </li>
          <li>
            <b style={{ color: RED }}>LA</b> table <span className="text-sm text-slate-500">· fém. sing.</span>
          </li>
          <li>
            <b style={{ color: RED }}>L'</b>addition <span className="text-sm text-slate-500">· devant voyelle/h muet</span>
          </li>
          <li>
            <b style={{ color: RED }}>LES</b> boissons <span className="text-sm text-slate-500">· pluriel</span>
          </li>
        </ul>
        <p className="mt-4 italic text-sm sm:text-base" style={{ color: BLUE }}>
          Règle d'or : En francés NO nos comemos los artículos. Siempre acompañan al sustantivo.
        </p>
      </Card>
    </Slide>,

    // 9 · Práctica artículos
    <QuizSlide key="9" kicker="Pratique" title="Complète avec LE, LA, L' ou LES">
      <Reveal q="___ serveur est très sympa" a="Le" />
      <Reveal q="___ spécialité de la maison" a="La" />
      <Reveal q="___ eau minérale" a="L'" />
      <Reveal q="___ chaises du café" a="Les" />
    </QuizSlide>,

    // 10 · Gramática verbos -ER
    <Slide key="10" kicker="⚙️ La machine des verbes (-ER)">
      <SlideH2>Verbe COMMANDER</SlideH2>
      <Card className="p-6 text-left">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-base sm:text-xl" style={{ color: NAVY }}>
          <p>Je command<b style={{ color: RED }}>e</b></p>
          <p>Nous command<b style={{ color: RED }}>ons</b></p>
          <p>Tu command<b style={{ color: RED }}>es</b></p>
          <p>Vous command<b style={{ color: RED }}>ez</b></p>
          <p>Il/Elle command<b style={{ color: RED }}>e</b></p>
          <p>Ils/Elles command<b style={{ color: RED }}>ent</b></p>
        </div>
        <p className="mt-4 italic text-sm sm:text-base" style={{ color: BLUE }}>
          ⚠️ Las terminaciones <b>-e, -es, -ent</b> NO se pronuncian. Suenan igual.
        </p>
      </Card>
    </Slide>,

    // 11 · Práctica conjugación
    <QuizSlide key="11" kicker="¡Tu turno!" title="Conjuga COMMANDER">
      <Reveal q="Je _____ un expresso" a="commande" />
      <Reveal q="Nous _____ deux thés" a="commandons" />
      <Reveal q="Ils _____ un dessert" a="commandent" />
      <Reveal q="Vous _____ la spécialité ?" a="commandez" />
    </QuizSlide>,

    // 12 · Cierre
    <Slide key="12">
      <SlideTitle>Merci 🇫🇷</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white/90">
        Prêt(e) pour votre premier restaurant à Paris ?
      </p>
    </Slide>,
    // === Un petit plus ===
    <Slide key="plus-divider">
      <Pill>Un petit plus</Pill>
      <SlideTitle>Un petit plus :</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white/90">Matériel complémentaire de la classe.</p>
    </Slide>,

    <Slide key="plus-1">
      <Pill>Semaine 1 · Mois 1</Pill>
      <p className="text-lg sm:text-2xl italic text-white/90 mb-3">🗼 PARIS</p>
      <SlideTitle>L'Art du Service</SlideTitle>
      <p className="mt-6 text-xl sm:text-3xl font-bold text-white">Le Client Difficile</p>
      <p className="mt-4 text-base sm:text-lg text-white/90 max-w-3xl mx-auto">
        Objectif : gérer des commandes complexes au restaurant.
      </p>
    </Slide>,

    <Slide key="plus-2" kicker="I. Salutations et Courtoisie">
      <SlideH2>Le premier contact avec le serveur</SlideH2>
      <Card className="p-8 text-left">
        <p className="text-lg sm:text-2xl leading-relaxed" style={{ color: NAVY }}>
          En France, le service commence toujours par un échange poli. Un simple
          <b> « Bonjour »</b> ou <b>« Bonsoir »</b> ouvre la porte d'un service chaleureux.
        </p>
      </Card>
    </Slide>,

    <Slide key="plus-3" kicker="L'étiquette au Restaurant">
      <SlideH2>La politesse avant tout</SlideH2>
      <Card className="p-6 sm:p-8 text-left">
        <ul className="space-y-3 text-base sm:text-xl" style={{ color: NAVY }}>
          <li>👋 <b>« Bonjour »</b> ou <b>« Bonsoir »</b> dès l'arrivée.</li>
          <li>🙏 <b>« S'il vous plaît »</b> à la fin de chaque commande.</li>
          <li>💐 <b>« Merci »</b> pour chaque geste du serveur.</li>
          <li>🧾 <b>« L'addition, s'il vous plaît »</b> pour payer.</li>
        </ul>
      </Card>
      <p className="mt-4 text-white/80 italic text-sm">La courtoisie est la clé d'un bon service.</p>
    </Slide>,

    <Slide key="plus-4" kicker="Qu'est-ce que je prends ?">
      <SlideH2>Demander & Décider</SlideH2>
      <div className="grid md:grid-cols-2 gap-5 text-left">
        <Card className="p-6">
          <p className="font-extrabold text-lg mb-3" style={{ color: RED }}>Demander conseil</p>
          <ul className="space-y-2 text-base sm:text-lg" style={{ color: NAVY }}>
            <li>« Qu'est-ce que vous recommandez ? »</li>
            <li>« Quelle est la spécialité de la maison ? »</li>
            <li>« Qu'est-ce que vous avez comme boissons ? »</li>
          </ul>
        </Card>
        <Card className="p-6">
          <p className="font-extrabold text-lg mb-3" style={{ color: BLUE }}>Prendre une décision</p>
          <ul className="space-y-2 text-base sm:text-lg" style={{ color: NAVY }}>
            <li>« Je vais prendre le menu à 25€. »</li>
            <li>« Pour moi, ce sera le confit de canard. »</li>
            <li>« Comme cuisson, je préfère à point. »</li>
          </ul>
        </Card>
      </div>
    </Slide>,

    <Slide key="plus-5" kicker="Mon plat préféré">
      <SlideH2>Le Bœuf Bourguignon</SlideH2>
      <div className="grid md:grid-cols-[220px_1fr] gap-6 items-center">
        <div className="mx-auto w-40 h-40 sm:w-52 sm:h-52 rounded-full shadow-2xl grid place-items-center text-7xl"
             style={{ background: "linear-gradient(135deg,#C44536,#8B2E23)" }}>
          🍲
        </div>
        <Card className="p-6 text-left">
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: NAVY }}>
            C'est mon plat préféré car il représente la tradition française. Sa
            <b> sauce riche au vin rouge</b>, sa <b>viande tendre</b> qui fond dans la bouche,
            et ses <b>arômes de carottes et d'oignons</b>. Un plat réconfortant et authentique.
          </p>
        </Card>
      </div>
    </Slide>,

    <Slide key="plus-6" kicker="Les Habitudes Françaises">
      <div className="flex flex-col items-center">
        <p className="font-[var(--font-display)] font-black text-white text-8xl sm:text-9xl leading-none">2,5h</p>
        <p className="mt-3 text-white/90 uppercase tracking-widest text-sm font-bold">Temps moyen d'un dîner</p>
        <Card className="p-6 mt-6 text-left max-w-3xl">
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: NAVY }}>
            <b>Prendre son temps.</b> En France, manger est une expérience sociale.
            On ne se presse pas. Le serveur attendra souvent votre signal pour apporter l'addition.
          </p>
        </Card>
      </div>
    </Slide>,

    <Slide key="plus-7" kicker="Menu">
      <SlideH2>« L'Étoile Noire »</SlideH2>
      <Card className="overflow-hidden text-left">
        <table className="w-full text-sm sm:text-base">
          <thead style={{ background: NAVY, color: "white" }}>
            <tr>
              <th className="p-3 text-left">Catégorie</th>
              <th className="p-3 text-left">Plat</th>
              <th className="p-3 text-left hidden sm:table-cell">Description</th>
              <th className="p-3 text-right">Prix</th>
            </tr>
          </thead>
          <tbody style={{ color: NAVY }}>
            {[
              ["Entrée", "Soupe à l'oignon", "Gratinée au fromage", "9,50 €"],
              ["Plat", "Bœuf Bourguignon", "Mijoté au vin rouge, purée", "24,00 €"],
              ["Plat", "Poisson du Marché", "Selon arrivage, légumes vapeur", "21,00 €"],
              ["Dessert", "Crème Brûlée", "Vanille Bourbon", "8,50 €"],
            ].map((r, idx) => (
              <tr key={idx} className="border-t border-slate-200">
                <td className="p-3 font-bold">{r[0]}</td>
                <td className="p-3">{r[1]}</td>
                <td className="p-3 hidden sm:table-cell text-slate-600">{r[2]}</td>
                <td className="p-3 text-right font-extrabold" style={{ color: RED }}>{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Slide>,

    <Slide key="plus-8" kicker="Restrictions Alimentaires">
      <SlideH2>Bien informer le serveur</SlideH2>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: "🥗", title: "Végétarien", txt: "Pas de viande ni de poisson." },
          { icon: "🌾", title: "Sans Gluten", txt: "Attention aux pâtes et au pain." },
          { icon: "❤️", title: "Allergies", txt: "Signaler tout ingrédient à éviter." },
        ].map((b) => (
          <Card key={b.title} className="p-5 text-center">
            <div className="text-5xl mb-2">{b.icon}</div>
            <p className="font-extrabold text-lg" style={{ color: NAVY }}>{b.title}</p>
            <p className="text-sm mt-1 text-slate-600">{b.txt}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    <Slide key="plus-9" kicker="Demandes et Substitutions">
      <SlideH2>Négocier son plat</SlideH2>
      <Card className="p-6 text-left">
        <ul className="space-y-3 text-base sm:text-lg" style={{ color: NAVY }}>
          <li>🔁 <b>Substituer :</b> « Est-ce que je peux avoir des légumes à la place des frites ? »</li>
          <li>🚫 <b>Enlever :</b> « Je voudrais la salade, mais sans oignons, s'il vous plaît. »</li>
          <li>✏️ <b>Modifier :</b> « Serait-il possible de mettre la sauce à part ? »</li>
          <li>❓ <b>Vérifier :</b> « Quel type de fromage utilisez-vous dans ce plat ? »</li>
        </ul>
      </Card>
    </Slide>,

    <Slide key="plus-10" kicker="Scénario">
      <SlideH2>Le Client Difficile</SlideH2>
      <Card className="p-6 text-left">
        <p className="font-extrabold mb-2" style={{ color: RED }}>Votre Mission</p>
        <p className="text-base sm:text-lg leading-relaxed mb-4" style={{ color: NAVY }}>
          Vous êtes un client très exigeant. Vous avez une <b>allergie aux produits laitiers</b>,
          vous <b>n'aimez pas le poivre</b>, et vous voulez <b>changer l'accompagnement</b> du plat principal.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl" style={{ background: "#EDF3FA", color: NAVY }}>
            <p className="font-bold">🧑‍🍳 Serveur patient</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: "#FCE9E5", color: RED }}>
            <p className="font-bold">🙋 Client indécis</p>
          </div>
        </div>
      </Card>
    </Slide>,

    <Slide key="plus-11">
      <SlideTitle>Questions ?</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white/90">
        Pratiquez ces phrases chez vous pour votre prochain voyage en France !
      </p>
      <p className="mt-8 text-white/80">Merci pour votre participation. 🇫🇷</p>
    </Slide>,

  ];

  return <SlideDeck slides={slides} />;
}
