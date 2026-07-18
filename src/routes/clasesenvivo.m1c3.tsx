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
  SKY,
} from "@/components/SlideDeck";
import type { ReactNode } from "react";

export const Route = createFileRoute("/clasesenvivo/m1c3")({
  head: () => ({
    meta: [
      { title: "Clase M1C3 — Paris et l'Orientation · Liberté" },
      {
        name: "description",
        content: "Le GPS Humain : comprendre et donner des directions en français.",
      },
    ],
  }),
  component: M1C3,
});

function M1C3() {
  const slides: ReactNode[] = [
    <Slide key="1">
      <Pill>Semaine 2 · Mois 1</Pill>
      <p className="text-lg sm:text-2xl italic text-white/90 mb-3">🗼</p>
      <SlideTitle>PARIS : Le GPS Humain</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white">S'orienter et diriger avec précision</p>
      <p className="mt-3 text-base sm:text-lg text-white/85 max-w-3xl mx-auto">
        Objectif : comprendre et donner des directions avec précision.
      </p>
    </Slide>,

    <Slide key="2" kicker="Check-in · Le point de départ">
      <SlideH2>Comment arrivez-vous au bureau chaque matin ?</SlideH2>
      <div className="grid grid-cols-2 gap-4">
        {[
          ["🚗", "En voiture"],
          ["🚇", "En métro / train"],
          ["🚌", "En bus"],
          ["🚶", "À pied"],
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

    <QuizSlide key="3" kicker="⏪ Retour en arrière · Le Restaurant" title="Vérifions l'addition d'hier">
      <Reveal q={<>¿Cómo se dice « La cuenta, por favor »&nbsp;?</>} a="L'addition, s'il vous plaît." />
      <Reveal q="Nous _____ (aller) au café" a="Nous allons au café." />
      <Reveal q="Je _____ (commander) un expresso" a="Je commande un expresso." />
    </QuizSlide>,

    <Slide key="4" kicker="📌 Point Grammaire · Le Temps">
      <SlideH2>Présent vs Futur Proche</SlideH2>
      <div className="grid sm:grid-cols-2 gap-4 text-left">
        <Card className="p-5">
          <p className="font-extrabold text-lg" style={{ color: RED }}>
            Le Présent · Maintenant
          </p>
          <p className="text-sm text-slate-600 mt-1">Sujet + Verbe conjugué</p>
          <p className="mt-3 text-base sm:text-lg" style={{ color: NAVY }}>
            <b>Je commande</b> un café.
          </p>
        </Card>
        <Card className="p-5">
          <p className="font-extrabold text-lg" style={{ color: BLUE }}>
            Le Futur Proche · Bientôt
          </p>
          <p className="text-sm text-slate-600 mt-1">Sujet + ALLER + Infinitif</p>
          <p className="mt-3 text-base sm:text-lg" style={{ color: NAVY }}>
            <b>Je vais commander</b> un café.
          </p>
        </Card>
      </div>
    </Slide>,

    <QuizSlide key="5" kicker="Pratique" title="Présent ➔ Futur Proche">
      <Reveal q="Je marche dans la rue." a="Je vais marcher dans la rue." />
      <Reveal q="Nous dînons au restaurant." a="Nous allons dîner au restaurant." />
      <Reveal q="Tu prends le métro ?" a="Tu vas prendre le métro ?" />
    </QuizSlide>,

    <Slide key="6" kicker="Routine Quotidienne">
      <SlideH2>Maison ➔ Bureau</SlideH2>
      <Card className="p-6 text-left">
        <p className="text-base sm:text-xl leading-relaxed" style={{ color: NAVY }}>
          Imaginez votre trajet habituel.
        </p>
        <ul className="mt-3 space-y-2 text-base sm:text-lg" style={{ color: NAVY }}>
          <li>• Quelles sont les rues principales ?</li>
          <li>• Quels sont les tournants cruciaux ?</li>
        </ul>
        <p className="mt-4 italic" style={{ color: BLUE }}>
          Aujourd'hui, on transforme ce trajet en commandes précises en français.
        </p>
      </Card>
    </Slide>,

    <Slide key="7" kicker="Vocabulaire · Verbes de Direction">
      <div className="grid sm:grid-cols-2 gap-4 text-left">
        {[
          ["↩️", "Tourner", "Changer de direction (à droite ou à gauche)."],
          ["➡️", "Continuer", "Maintenir la même direction sans s'arrêter."],
          ["🚸", "Traverser", "Passer d'un côté à l'autre de la rue."],
          ["🚇", "Prendre", "Choisir une rue ou une ligne spécifique."],
        ].map(([e, t, s]) => (
          <Card key={t} className="p-4">
            <p className="font-extrabold text-lg" style={{ color: RED }}>
              {e} {t}
            </p>
            <p className="text-sm sm:text-base mt-1" style={{ color: NAVY }}>
              {s}
            </p>
          </Card>
        ))}
      </div>
    </Slide>,

    <Slide key="8" kicker="Grammaire · L'Impératif">
      <SlideH2>3 Formes Essentielles</SlideH2>
      <div className="grid sm:grid-cols-3 gap-4 text-left">
        <Card className="p-5">
          <p className="font-extrabold" style={{ color: RED }}>
            TU · Familier
          </p>
          <p className="mt-2 text-base sm:text-lg" style={{ color: NAVY }}>
            Tourne à droite !
          </p>
        </Card>
        <Card className="p-5">
          <p className="font-extrabold" style={{ color: BLUE }}>
            NOUS · Suggestion
          </p>
          <p className="mt-2 text-base sm:text-lg" style={{ color: NAVY }}>
            Tournons ici !
          </p>
        </Card>
        <Card className="p-5">
          <p className="font-extrabold" style={{ color: NAVY }}>
            VOUS · Formel
          </p>
          <p className="mt-2 text-base sm:text-lg" style={{ color: NAVY }}>
            Tournez à gauche !
          </p>
        </Card>
      </div>
    </Slide>,

    <Slide key="9" kicker="Les outils du GPS">
      <SlideH2>Gauche · Droite</SlideH2>
      <div className="flex items-center justify-center gap-10 sm:gap-16 text-white text-3xl sm:text-6xl font-black">
        <div className="flex flex-col items-center">
          <span>⬅️</span>
          <span className="mt-2">À GAUCHE</span>
        </div>
        <div className="flex flex-col items-center">
          <span>➡️</span>
          <span className="mt-2">À DROITE</span>
        </div>
      </div>
    </Slide>,

    <Slide key="10" kicker="Style GPS vs Style Poli">
      <Card className="overflow-x-auto text-left">
        <table className="w-full text-sm sm:text-base">
          <thead style={{ background: NAVY, color: "white" }}>
            <tr>
              <th className="p-3 text-left">Situation</th>
              <th className="p-3 text-left">Commande directe</th>
              <th className="p-3 text-left">Demande polie</th>
            </tr>
          </thead>
          <tbody style={{ color: NAVY }}>
            {[
              ["Changer de rue", "Tournez à droite.", "Pourriez-vous tourner à droite ?"],
              ["Marcher longtemps", "Allez tout droit.", "Il faut aller tout droit sur 1 km."],
              ["Croiser un pont", "Traversez le pont.", "Vous pouvez traverser le pont."],
              ["Prendre le métro", "Prends la ligne 4.", "Je te conseille de prendre la ligne 4."],
            ].map((r, i) => (
              <tr key={i} className="border-t border-slate-200">
                <td className="p-3 font-bold">{r[0]}</td>
                <td className="p-3" style={{ color: RED }}>
                  {r[1]}
                </td>
                <td className="p-3" style={{ color: BLUE }}>
                  {r[2]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Slide>,

    <Slide key="11">
      <SlideTitle>À vous de guider !</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white/90">Merci et à la prochaine 🗺️</p>
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
      <SlideTitle>Le GPS Humain</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl font-bold text-white">S'orienter et Diriger avec Précision</p>
    </Slide>,

    <Slide key="plus-2" kicker="Le Point de Départ">
      <SlideH2>Comment arrivez-vous au bureau chaque matin ?</SlideH2>
      <div className="text-8xl mt-6">🚶‍♀️🇫🇷</div>
    </Slide>,

    <Slide key="plus-3" kicker="Routine Quotidienne">
      <SlideH2>Maison → Bureau</SlideH2>
      <Card className="p-6 text-left">
        <p className="text-base sm:text-lg leading-relaxed" style={{ color: NAVY }}>
          Imaginez votre trajet habituel. Quelles sont les <b>rues principales</b> ?
          Quels sont les <b>tournants cruciaux</b> ? Aujourd'hui, nous allons transformer ce trajet
          en une série de commandes précises en français.
        </p>
      </Card>
    </Slide>,

    <Slide key="plus-4" kicker="Les Verbes de Direction">
      <SlideH2>Le vocabulaire de base</SlideH2>
      <Card className="p-6 text-left">
        <ul className="space-y-3 text-base sm:text-lg" style={{ color: NAVY }}>
          <li>↪️ <b>Tourner</b> — changer de direction (à droite ou à gauche).</li>
          <li>➡️ <b>Continuer</b> — maintenir la même direction sans s'arrêter.</li>
          <li>🚸 <b>Traverser</b> — passer d'un côté à l'autre de la rue ou du pont.</li>
          <li>🛣️ <b>Prendre</b> — choisir une rue spécifique parmi plusieurs options.</li>
        </ul>
      </Card>
    </Slide>,

    <Slide key="plus-5" kicker="La Grammaire : L'Impératif">
      <SlideH2>3 Formes Essentielles</SlideH2>
      <p className="text-white/90 mb-4 text-sm sm:text-base">L'impératif exprime l'ordre ou le conseil sans pronom sujet.</p>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { t: "TU", ex: "« Tourne à droite ! »", n: "familier" },
          { t: "NOUS", ex: "« Tournons ici ! »", n: "suggestion" },
          { t: "VOUS", ex: "« Tournez à gauche ! »", n: "formel / pluriel" },
        ].map((c) => (
          <Card key={c.t} className="p-5 text-center">
            <p className="font-extrabold text-2xl" style={{ color: RED }}>{c.t}</p>
            <p className="mt-2 text-base sm:text-lg" style={{ color: NAVY }}>{c.ex}</p>
            <p className="text-xs uppercase tracking-wider text-slate-500 mt-2">{c.n}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    <Slide key="plus-6" kicker="Les Outils du GPS">
      <div className="flex items-center justify-center gap-8 text-white">
        <div className="text-center">
          <div className="text-8xl">⬅️</div>
          <p className="mt-2 font-extrabold text-2xl">GAUCHE</p>
        </div>
        <div className="text-6xl opacity-60">|</div>
        <div className="text-center">
          <div className="text-8xl">➡️</div>
          <p className="mt-2 font-extrabold text-2xl">DROITE</p>
        </div>
      </div>
    </Slide>,

    <Slide key="plus-7" kicker="Style GPS vs Style Poli">
      <Card className="overflow-x-auto text-left">
        <table className="w-full text-sm sm:text-base">
          <thead style={{ background: NAVY, color: "white" }}>
            <tr>
              <th className="p-3 text-left">Situation</th>
              <th className="p-3 text-left">GPS (direct)</th>
              <th className="p-3 text-left">Demande polie</th>
            </tr>
          </thead>
          <tbody style={{ color: NAVY }}>
            {[
              ["Changer de rue", "Tournez à droite.", "Pourriez-vous tourner à droite ?"],
              ["Marcher longtemps", "Allez tout droit.", "Il faut aller tout droit sur 1 km."],
              ["Traverser un pont", "Traversez le pont.", "Je vous prie de traverser le pont."],
              ["Arriver", "Arrêtez-vous ici.", "C'est ici, vous pouvez vous arrêter."],
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

    <Slide key="plus-8" kicker="L'Activité">
      <SlideTitle>Le GPS Vivant</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white/90">Prêts à guider votre partenaire dans les rues de Paris ?</p>
    </Slide>,

    <Slide key="plus-9" kicker="Exploration">
      <SlideH2>Le Marais 🗺️</SlideH2>
      <Card className="p-6">
        <div className="h-56 sm:h-72 rounded-xl grid place-items-center text-7xl"
             style={{ background: `linear-gradient(135deg, ${SKY}, ${BLUE})` }}>
          🗺️
        </div>
      </Card>
    </Slide>,

    <Slide key="plus-10" kicker="Un Quartier Historique">
      <Card className="p-6 text-left">
        <p className="text-base sm:text-lg leading-relaxed" style={{ color: NAVY }}>
          Voici un plan du Marais, à Paris. C'est un <b>labyrinthe de rues médiévales</b>,
          idéal pour notre exercice. Identifiez les points de repère : musées, parcs et stations de métro.
          <br /><br />
          <span style={{ color: RED }} className="font-bold">Votre mission commence maintenant.</span>
        </p>
      </Card>
    </Slide>,

    <Slide key="plus-11" kicker="Les Règles du Jeu">
      <div className="grid sm:grid-cols-2 gap-4 text-left">
        <Card className="p-6">
          <p className="font-extrabold text-xl mb-2" style={{ color: RED }}>🅰️ Le GPS</p>
          <p className="text-sm sm:text-base" style={{ color: NAVY }}>
            Vous avez la carte. Vous donnez des ordres impératifs clairs.
            Vous ne bougez que si la commande est correcte et précise !
          </p>
        </Card>
        <Card className="p-6">
          <p className="font-extrabold text-xl mb-2" style={{ color: BLUE }}>🅱️ Le Voyageur</p>
          <p className="text-sm sm:text-base" style={{ color: NAVY }}>
            Vous écoutez. Vous suivez les directions. Si la commande est floue, vous restez sur place !
          </p>
        </Card>
      </div>
    </Slide>,

    <Slide key="plus-12" kicker="Étapes de Navigation">
      <div className="grid sm:grid-cols-4 gap-3 text-left">
        {[
          ["1", "Définir le départ", "ex : Métro St-Paul"],
          ["2", "Utiliser l'impératif", "pour avancer"],
          ["3", "Corriger la route", "le GPS ajuste"],
          ["4", "Arrivée", "Place des Vosges"],
        ].map(([n, t, s]) => (
          <Card key={n} className="p-4">
            <div className="h-10 w-10 rounded-full grid place-items-center text-white font-black mb-2" style={{ background: RED }}>{n}</div>
            <p className="font-extrabold" style={{ color: NAVY }}>{t}</p>
            <p className="text-xs text-slate-500 mt-1">{s}</p>
          </Card>
        ))}
      </div>
    </Slide>,

    <Slide key="plus-13">
      <SlideTitle>Questions ?</SlideTitle>
      <p className="mt-6 text-lg sm:text-2xl text-white/90">Prêts pour le départ ? À vous de guider ! 🚦</p>
    </Slide>,

  ];

  return <SlideDeck slides={slides} />;
}
