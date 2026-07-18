// Day 9 — practice items (Vocab + Grammaire) for Le métro & les transports publics.

export { day9Videos, day9Vocabulary, day9FlashQuiz, day9DefiSteps, day9GrammarStructures } from "./day9";

/* ============================================================
   VOCAB — 4 mini-jeux
   ============================================================ */

export const day9VocabReadingTexts = [
  {
    title: "Texte · Dans le métro parisien",
    text: `Voyageur : « Excusez-moi, pour aller à la Tour Eiffel, je dois prendre quelle ligne ? » Passager : « Prenez la ligne 6, direction Nation. Descendez à Bir-Hakeim. » Voyageur : « Je dois faire une correspondance ? » Passager : « Non, c'est direct depuis ici. Mais n'oubliez pas de valider votre ticket ! » Voyageur : « Merci beaucoup. C'est loin ? » Passager : « Non, c'est à 4 arrêts. Environ 8 minutes. »`,
    questions: [
      {
        q: "¿Qué línea debe tomar el viajero?",
        options: [
          "La línea 4, dirección Châtelet.",
          "La línea 6, dirección Nation.",
          "La línea 1, dirección Vincennes.",
        ],
        answer: 1,
      },
      {
        q: "¿Dónde debe bajar?",
        options: ["En Châtelet.", "En Nation.", "En Bir-Hakeim."],
        answer: 2,
      },
      {
        q: "¿Debe hacer un transbordo?",
        options: ["Sí, en Nation.", "No, es directo.", "Sí, en Bir-Hakeim."],
        answer: 1,
      },
    ],
  },
];

export const day9VocabListeningMC = [
  {
    audio: "Prenez la ligne 6, direction Nation.",
    question: "¿Qué línea y dirección debe tomar?",
    options: ["Ligne 6, direction Nation.", "Ligne 4, direction Châtelet.", "Ligne 1, direction Défense."],
    answer: 0,
  },
  {
    audio: "N'oubliez pas de valider votre ticket.",
    question: "¿Qué debe hacer con el ticket?",
    options: ["Comprarlo.", "Validarlo.", "Tirarlo."],
    answer: 1,
  },
  {
    audio: "Le prochain métro arrive dans 2 minutes.",
    question: "¿Cuándo llega el próximo metro?",
    options: ["En 2 minutos.", "En 10 minutos.", "En 20 minutos."],
    answer: 0,
  },
  {
    audio: "Un aller-retour Paris-Lyon, s'il vous plaît.",
    question: "¿Qué tipo de billete pide?",
    options: ["Un billete de ida.", "Un billete de ida y vuelta.", "Un abono mensual."],
    answer: 1,
  },
  {
    audio: "Il y a un retard de 10 minutes sur la ligne 4.",
    question: "¿Qué ocurre en la línea 4?",
    options: ["Una cancelación.", "Un retraso de 10 minutos.", "Un cambio de anden."],
    answer: 1,
  },
];

export const day9VocabSpeakingItems = [
  {
    situation: "Pide un billete de ida para Versailles con cortesía.",
    expected: "Je voudrais un aller simple pour Versailles, s'il vous plaît.",
  },
  {
    situation: "Pregunta qué línea tomar para ir a la Torre Eiffel.",
    expected: "Pour aller à la Tour Eiffel, je dois prendre quelle ligne ?",
  },
  {
    situation: "Di « No olvide validar su ticket ».",
    expected: "N'oubliez pas de valider votre ticket.",
  },
  {
    situation: "Di que vas al trabajo en metro.",
    expected: "Je vais au travail en métro.",
  },
  {
    situation: "Di « Está a 10 minutos a pie ».",
    expected: "C'est à 10 minutes à pied.",
  },
];

export const day9VocabWritingItems = [
  {
    prompt: "Traduce: 'Un billete de ida y vuelta, por favor.'",
    answer: "Un aller-retour, s'il vous plaît.",
  },
  {
    prompt: "Completa: « Je vais au travail ______ métro. »",
    answer: "en",
  },
  {
    prompt: "Completa: « Je rentre ______ pied — c'est proche. »",
    answer: "à",
  },
  {
    prompt: "Completa: « Il voyage ______ le train. »",
    answer: "par",
  },
  {
    prompt: "Corrige: « Je vais en pied. »",
    answer: "Je vais à pied.",
  },
];

/* ============================================================
   GRAMMAIRE — Les clés de la Liberté (Día 9 · en / à / par)
   ============================================================ */

export const day9ClesReadingText = {
  title: "Lecture · Prépositions de transport",
  text: `Marc habite à Paris et il utilise plusieurs moyens de transport chaque jour. Le matin, il va au travail en métro : c'est rapide et économique. Le midi, s'il fait beau, il rentre à pied pour déjeuner chez lui — c'est à 15 minutes. L'après-midi, quand il doit voir un client à l'autre bout de la ville, il prend un vélo en libre-service : il va donc à vélo. Le week-end, s'il rend visite à ses parents à Lyon, il voyage par le train — c'est confortable. Une fois par an, il part en vacances par avion. Marc dit toujours : « À pied, à vélo, en métro, par le train — chaque transport a son moment ! »`,
  questions: [
    {
      q: "¿Cómo va Marc al trabajo por la mañana?",
      options: ["À pied.", "En métro.", "En voiture."],
      answer: 1,
    },
    {
      q: "¿Qué preposición se usa con « vélo » y « pied »?",
      options: ["EN.", "PAR.", "À."],
      answer: 2,
    },
    {
      q: "¿Cómo viaja a Lyon los fines de semana?",
      options: ["Par le train.", "En bus.", "En voiture."],
      answer: 0,
    },
  ],
};

export const day9ClesListeningMC = [
  {
    audio: "Je vais au travail en métro.",
    question: "¿Qué preposición se usa con « métro »?",
    options: ["à", "en", "par"],
    answer: 1,
  },
  {
    audio: "C'est à 10 minutes à pied.",
    question: "¿Qué preposición se usa con « pied »?",
    options: ["à", "en", "par"],
    answer: 0,
  },
  {
    audio: "Il voyage par le train.",
    question: "¿Qué registro tiene esta frase?",
    options: ["Informal.", "Formal (reservas, textos).", "Incorrecta."],
    answer: 1,
  },
  {
    audio: "Elle va à l'école à vélo.",
    question: "¿Cuál es la traducción correcta?",
    options: ["Va en bicicleta a la escuela.", "Va en autobús a la escuela.", "Va a pie a la escuela."],
    answer: 0,
  },
  {
    audio: "Je vais en pied.",
    question: "Esta frase tiene un error. ¿Cuál?",
    options: [
      "Debería decir « à pied » — con « à », no « en ».",
      "Debería decir « par pied ».",
      "Está correcta.",
    ],
    answer: 0,
  },
];

export const day9ClesSpeakingItems = [
  {
    situation: "Di « Voy al trabajo en metro » con la preposición correcta.",
    expected: "Je vais au travail en métro.",
  },
  {
    situation: "Di « Vuelvo a pie, está cerca ».",
    expected: "Je rentre à pied, c'est proche.",
  },
  {
    situation: "Di « Él viaja en tren » en registro formal.",
    expected: "Il voyage par le train.",
  },
  {
    situation: "Di « Ella va a la escuela en bicicleta ».",
    expected: "Elle va à l'école à vélo.",
  },
  {
    situation: "Di « Voy en avión a Roma ».",
    expected: "Je vais à Rome en avion.",
  },
];

export const day9ClesWritingItems = [
  {
    prompt: "Completa: « Je vais au travail ______ métro. »",
    answer: "en",
  },
  {
    prompt: "Completa: « Je rentre ______ pied — c'est proche. »",
    answer: "à",
  },
  {
    prompt: "Completa: « Il voyage ______ le train. »",
    answer: "par",
  },
  {
    prompt: "Completa: « Elle va à l'école ______ vélo. »",
    answer: "à",
  },
  {
    prompt: "Corrige: « Je vais en pied. »",
    answer: "Je vais à pied.",
  },
];
