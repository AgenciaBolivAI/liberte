// Day 8 — practice items (Vocab + Grammaire) for Faire les courses.

export { day8Videos, day8Vocabulary, day8FlashQuiz, day8DefiSteps, day8GrammarStructures } from "./day8";

/* ============================================================
   VOCAB — 4 mini-jeux
   ============================================================ */

export const day8VocabReadingTexts = [
  {
    title: "Texte · Faire les courses",
    text: `Samedi matin, Julie prépare sa liste de courses pour toute la semaine. Elle regarde le frigo : il n'y a plus de lait, plus d'œufs et plus de beurre. Dans le placard, il n'y a plus de farine ni de sucre. Elle écrit : « Je dois acheter du lait, des œufs, de la farine, du beurre et du sucre. » Puis elle pense aux produits d'hygiène : elle doit aussi prendre du shampooing, du savon et du papier toilette. Au supermarché, elle voit qu'il y a une promotion sur la charcuterie : elle prend du jambon et un peu de dinde. Pour la fête du dimanche, elle achète aussi du vin rouge et un pack d'eau. À la caisse, elle paie 87 euros — sa liste était bien complète !`,
    questions: [
      {
        q: "¿Qué debe comprar Julie del frigo?",
        options: [
          "Solo leche y huevos.",
          "Leche, huevos y mantequilla.",
          "Solo mantequilla y harina.",
        ],
        answer: 1,
      },
      {
        q: "¿Qué productos de higiene añade a la lista?",
        options: [
          "Shampooing, savon y papier toilette.",
          "Solo shampooing y dentifrice.",
          "Nettoyant y lessive.",
        ],
        answer: 0,
      },
      {
        q: "¿Qué compra para la fiesta del domingo?",
        options: ["Del vino tinto y un pack de agua.", "Cerveza y zumo.", "Solo vino blanco."],
        answer: 0,
      },
    ],
  },
];

export const day8VocabListeningMC = [
  {
    audio: "Je dois acheter du lait et des œufs.",
    question: "¿Qué debe comprar la persona?",
    options: ["Leche y huevos.", "Leche y harina.", "Solo huevos."],
    answer: 0,
  },
  {
    audio: "Il n'y a plus de dentifrice à la maison.",
    question: "¿Qué falta en la casa?",
    options: ["Papel higiénico.", "Pasta de dientes.", "Jabón."],
    answer: 1,
  },
  {
    audio: "Je voudrais 200g de jambon, s'il vous plaît.",
    question: "¿Qué pide?",
    options: ["200g de pavo.", "200g de jamón.", "200g de charcutería."],
    answer: 1,
  },
  {
    audio: "Nous devons prendre un pack d'eau.",
    question: "¿Qué deben hacer?",
    options: ["Comprar un pack de agua.", "Comprar vino.", "Comprar zumo."],
    answer: 0,
  },
  {
    audio: "Vous devez passer à la caisse.",
    question: "¿Qué le indican al cliente?",
    options: ["Que debe pagar en caja.", "Que hay una promoción.", "Que debe salir por la puerta."],
    answer: 0,
  },
];

export const day8VocabSpeakingItems = [
  {
    situation: "Di que debes comprar leche y huevos.",
    expected: "Je dois acheter du lait et des œufs.",
  },
  {
    situation: "Pide 200g de jamón con cortesía.",
    expected: "Je voudrais 200g de jambon, s'il vous plaît.",
  },
  {
    situation: "Explica que debes tomar un pack de agua.",
    expected: "Je dois prendre un pack d'eau.",
  },
  {
    situation: "Di que ya no hay pasta de dientes en casa.",
    expected: "Il n'y a plus de dentifrice à la maison.",
  },
  {
    situation: "Di que debes comprar aceite de oliva.",
    expected: "Je dois acheter de l'huile d'olive.",
  },
];

export const day8VocabWritingItems = [
  {
    prompt: "Traduce: 'Debo comprar leche.'",
    answer: "Je dois acheter du lait.",
  },
  {
    prompt: "Completa: « Je dois acheter ______ œufs. » (partitivo)",
    answer: "des",
  },
  {
    prompt: "Completa: « Je dois acheter ______ farine. » (partitivo)",
    answer: "de la",
  },
  {
    prompt: "Completa: « Je dois acheter ______ huile d'olive. » (partitivo)",
    answer: "de l'",
  },
  {
    prompt: "Corrige: « Je dois acheter de pain. »",
    answer: "Je dois acheter du pain.",
  },
];

/* ============================================================
   GRAMMAIRE — Les clés de la Liberté (Día 8 · Devoir + infinitif)
   ============================================================ */

export const day8ClesReadingText = {
  title: "Lecture · Devoir + infinitif",
  text: `Le samedi, chez les Martin, tout le monde a une mission. « Papa, tu dois passer au supermarché », dit maman. « Nous devons acheter du lait, des œufs et de la farine pour le gâteau. » Papa répond : « D'accord, mais Léa doit venir avec moi — elle doit apprendre à faire les courses. » Léa proteste un peu, mais elle prend la liste. Au magasin, Papa explique : « Regarde bien les étiquettes. Tu dois vérifier la date de péremption et la marque. » À la caisse, Léa demande : « Je dois payer par carte ou en espèces ? » Papa sourit : « Comme tu veux — l'important, c'est que tu apprennes. »`,
  questions: [
    {
      q: "¿Qué estructura se usa para expresar una obligación en francés?",
      options: [
        "Vouloir + infinitivo.",
        "Devoir (conjugado) + infinitivo.",
        "Aller + infinitivo.",
      ],
      answer: 1,
    },
    {
      q: "¿Cómo se dice « Debemos comprar leche » en francés?",
      options: [
        "Nous voulons acheter du lait.",
        "Nous devons acheter du lait.",
        "Nous allons du lait.",
      ],
      answer: 1,
    },
    {
      q: "¿Cuál es el error frecuente que hay que evitar?",
      options: [
        "« Je dois acheter du pain » (✓) → « Je dois acheter de pain » (❌).",
        "« Je dois acheter du pain » (❌) → « Je dois acheter de pain » (✓).",
        "No se puede usar devoir con partitivos.",
      ],
      answer: 0,
    },
  ],
};

export const day8ClesListeningMC = [
  {
    audio: "Vous devez acheter des légumes.",
    question: "¿Qué estructura reconoces?",
    options: [
      "Vouloir + infinitivo.",
      "Devoir (conjugado) + infinitivo.",
      "Aller + infinitivo.",
    ],
    answer: 1,
  },
  {
    audio: "Il doit passer à la caisse.",
    question: "¿Qué debe hacer?",
    options: ["Debe salir del supermercado.", "Debe pasar por la caja.", "Debe pagar con tarjeta."],
    answer: 1,
  },
  {
    audio: "Nous devons prendre du lait.",
    question: "¿Cuál es la traducción correcta?",
    options: [
      "Queremos leche.",
      "Debemos tomar / comprar leche.",
      "Vamos a por leche.",
    ],
    answer: 1,
  },
  {
    audio: "Tu dois valider ton ticket.",
    question: "¿Qué indica la frase?",
    options: [
      "Que puedes validar el tique.",
      "Que debes validar el tique.",
      "Que ya has validado el tique.",
    ],
    answer: 1,
  },
  {
    audio: "Je dois acheter de pain.",
    question: "Esta frase tiene un error. ¿Cuál?",
    options: [
      "Debería decir « Je dois acheter du pain » — con partitivo « du ».",
      "Debería decir « Je dois du pain acheter ».",
      "Está correcta.",
    ],
    answer: 0,
  },
];

export const day8ClesSpeakingItems = [
  {
    situation: "Di « Debo comprar leche » con devoir + infinitivo.",
    expected: "Je dois acheter du lait.",
  },
  {
    situation: "Di « Debes pasar por la caja » (tú).",
    expected: "Tu dois passer à la caisse.",
  },
  {
    situation: "Di « Ella debe tomar / coger cereales ».",
    expected: "Elle doit prendre des céréales.",
  },
  {
    situation: "Di « Debemos comprar huevos ».",
    expected: "Nous devons acheter des œufs.",
  },
  {
    situation: "Di « Ustedes deben pagar en caja ».",
    expected: "Vous devez payer à la caisse.",
  },
];

export const day8ClesWritingItems = [
  {
    prompt: "Completa: « (vous) ______ acheter des légumes. »",
    answer: "devez",
  },
  {
    prompt: "Completa: « (il) ______ passer à la caisse. »",
    answer: "doit",
  },
  {
    prompt: "Completa: « (nous) ______ prendre du lait. »",
    answer: "devons",
  },
  {
    prompt: "Ordena: [ dois / je / acheter / lait / du ]",
    answer: "Je dois acheter du lait.",
  },
  {
    prompt: "Corrige: « Je dois acheter de pain. »",
    answer: "Je dois acheter du pain.",
  },
];
