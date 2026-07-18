// Day 3 — practice items (Vocab + Grammaire) for La Boulangerie Liberté.

export {
  day3Videos,
  day3Vocabulary,
  day3AnchorPhrases,
  day3FlashQuiz,
  day3DefiSteps,
  day3GrammarStructures,
} from "./day3";

/* ============================================================
   VOCAB — 4 mini-jeux
   ============================================================ */

export const day3VocabReadingTexts = [
  {
    title: "Texte · Lucie à la boulangerie",
    text: `Lucie entre dans la boulangerie. Elle voit des baguettes bien dorées dans la vitrine. Elle demande à Sophie, la boulangère : « Vous avez du pain de campagne frais ? » Sophie répond : « Oui ! Il sort du four — il est encore chaud et croustillant ! » Lucie demande : « Combien coûte le pain entier ? » Sophie dit : « Deux euros cinquante. » Lucie réfléchit : « Je prends un demi-pain, tranché, s'il vous plaît. » Sophie prépare la commande et demande : « Autre chose ? » Lucie ajoute : « Une petite brioche, s'il vous plaît. C'est tout ! » Elle paye et demande le ticket de caisse. « Merci ! Je vais emporter. Bonne journée ! »`,
    questions: [
      {
        q: "¿Cómo describe Sophie el pan de campagne?",
        options: [
          "Frío y esponjoso.",
          "Aún caliente y crujiente, recién salido del horno.",
          "Dorado pero muy bien cocido.",
        ],
        answer: 1,
      },
      {
        q: "¿Qué cantidad de pan elige Lucie?",
        options: ["Un pain entier.", "Dos tranches de pan.", "Un demi-pain, tranché."],
        answer: 2,
      },
      {
        q: "¿Qué pide Lucie además del pan?",
        options: [
          "Une baguette bien cuite.",
          "Une petite brioche.",
          "Un paquet de biscuits.",
        ],
        answer: 1,
      },
    ],
  },
];

export const day3VocabListeningMC = [
  {
    audio: "Je voudrais une baguette bien cuite, s'il vous plaît.",
    question: "¿Qué cocción pide?",
    options: [
      "Pálida y suave.",
      "Bien cocida, más oscura y crujiente.",
      "A medio cocer.",
    ],
    answer: 1,
  },
  {
    audio: "C'est croustillant ou moelleux, le pain de campagne ?",
    question: "¿Sobre qué pregunta?",
    options: [
      "Precio y tamaño.",
      "Si es para llevar.",
      "La textura — crujiente o esponjosa.",
    ],
    answer: 2,
  },
  {
    audio: "Je prends un demi-pain, tranché.",
    question: "¿Qué cantidad y presentación pide?",
    options: [
      "Pan entero sin rebanar.",
      "Una rebanada sola.",
      "La mitad del pan, cortado en rebanadas.",
    ],
    answer: 2,
  },
  {
    audio: "Combien coûtent les brioches ?",
    question: "¿Por qué « coûtent » y no « coûte » ?",
    options: [
      "Es un error.",
      "« Coûtent » (plural) para las brioches.",
      "Depende solo del artículo.",
    ],
    answer: 1,
  },
  {
    audio: "C'est tout, merci ! Je vais emporter.",
    question: "¿Qué comunica el cliente?",
    options: [
      "Que no quiere nada más y se lleva el pedido.",
      "Que quiere más pan y comerá ahí.",
      "Que quiere el ticket y el cambio.",
    ],
    answer: 0,
  },
];

export const day3VocabSpeakingItems = [
  {
    situation: "Ves unas baguettes perfectas. Pregunta si tienen alguna bien cocida.",
    expected: "Vous avez une baguette bien cuite ?",
  },
  {
    situation: "Sophie te muestra el pain de campagne. Pregunta si es crujiente o esponjoso.",
    expected: "C'est croustillant ou moelleux ?",
  },
  {
    situation: "El pain de campagne cuesta 2,50 el entero. Decide llevar la mitad, rebanado.",
    expected: "Je prends un demi-pain, tranché, s'il vous plaît.",
  },
  {
    situation: "Quieres saber cuánto cuesta la brioche.",
    expected: "Combien coûte la brioche ?",
  },
  {
    situation: "Ya tienes todo. Dile que es todo y que te lo llevas.",
    expected: "C'est tout, merci ! Je vais emporter.",
  },
];

export const day3VocabWritingItems = [
  { prompt: "Completa: « La baguette est ______ — elle est parfaite ! » (crujiente)", answer: "croustillante" },
  { prompt: "Traduce: '¿Cuánto cuesta el pan de campo?'", answer: "Combien coûte le pain de campagne ?" },
  {
    prompt: "Escribe cómo pides media baguette rebanada, educadamente.",
    answer: "Je voudrais un demi-pain, tranché, s'il vous plaît.",
  },
  {
    prompt: "Responde a « Autre chose ? » que no, que es todo y te lo llevas.",
    answer: "Non, c'est tout, merci ! Je vais emporter.",
  },
  {
    prompt: "Ordena: [ le ticket / Je peux avoir / de caisse / ? ]",
    answer: "Je peux avoir le ticket de caisse ?",
  },
];

/* ============================================================
   GRAMMAIRE — Les clés de la Liberté (Día 3)
   ============================================================ */

export const day3ClesReadingText = {
  title: "Lecture · Marc à la boulangerie",
  text: `Marc entre dans la boulangerie. Il demande : « Combien coûte la baguette tradition ? » Sophie répond : « Un euro vingt. » Marc dit : « Je voudrais deux baguettes bien cuites, s'il vous plaît. » Sophie demande : « Entières ou tranchées ? » Marc : « Entières, merci. Et vous avez du pain de campagne ? C'est croustillant ? » Sophie : « Oui — la croûte est croustillante mais la mie est moelleuse. » Marc : « Parfait ! Je prends un demi-pain, tranché. » Sophie sourit : « Autre chose ? » Marc : « Non, c'est tout. Je vais emporter. Je peux avoir le ticket de caisse, s'il vous plaît ? »`,
  questions: [
    {
      q: "¿Qué estructura usa Marc para pedir las baguettes con precisión?",
      options: [
        "Je prends + nombre.",
        "Je voudrais + cantidad + nombre + adjetivo.",
        "Vous avez + nombre + adjetivo.",
      ],
      answer: 1,
    },
    {
      q: "Sophie dice « croustillante » con -e final. ¿Por qué?",
      options: ["Es invariable.", "Porque « la croûte » es femenino.", "Es un error."],
      answer: 1,
    },
    {
      q: "¿Qué tres expresiones usa Marc para cerrar la compra?",
      options: [
        "C'est tout · emporter · ticket de caisse.",
        "Autre chose · combien coûte · bonne journée.",
        "C'est tout · je préfère · merci.",
      ],
      answer: 0,
    },
  ],
};

export const day3ClesListeningMC = [
  {
    audio: "Je voudrais un demi-pain de campagne, tranché, s'il vous plaît.",
    question: "¿Qué elementos incluye?",
    options: [
      "Solo el nombre — falta cantidad.",
      "Cantidad + nombre + forma — pedido completo.",
      "Solo el adjetivo de textura.",
    ],
    answer: 1,
  },
  {
    audio: "Combien coûtent les brioches ? Et combien coûte le pain entier ?",
    question: "¿Por qué el cambio « coûtent » / « coûte » ?",
    options: [
      "Es un error.",
      "Depende del número: plural « coûtent », singular « coûte ».",
      "Depende solo del artículo.",
    ],
    answer: 1,
  },
  {
    audio: "Une baguette croustillante et un pain moelleux, s'il vous plaît.",
    question: "¿Diferencia de concordancia?",
    options: [
      "Ninguna, ambos invariables.",
      "« Croustillante » concuerda con « baguette » (femenino); « moelleux » no cambia.",
      "Ambos concuerdan igual.",
    ],
    answer: 1,
  },
  {
    audio: "C'est tout, merci. Je vais emporter.",
    question: "¿Qué confirma el cliente?",
    options: [
      "Que quiere algo más y pagará con tarjeta.",
      "Que el pedido está completo y se lo lleva.",
      "Que quiere el ticket y volverá mañana.",
    ],
    answer: 1,
  },
  {
    audio: "Autre chose ? — Non, c'est parfait, merci !",
    question: "¿Función de « Autre chose ? » ?",
    options: [
      "Decir « buen provecho ».",
      "Preguntar si pagará ahora.",
      "Preguntar si el cliente quiere algo más antes de cerrar.",
    ],
    answer: 2,
  },
];

export const day3ClesSpeakingItems = [
  {
    situation: "Pide una baguette bien cocida y entera (JE VOUDRAIS + cantidad + nombre + adjetivo).",
    expected: "Je voudrais une baguette entière, bien cuite, s'il vous plaît.",
  },
  {
    situation: "Pregunta si el pain de campagne es crujiente (concordancia con « pain », masculino).",
    expected: "C'est croustillant, le pain de campagne ?",
  },
  {
    situation: "Pregunta el precio de varias brioches (plural).",
    expected: "Combien coûtent les brioches ?",
  },
  {
    situation: "Pregunta el precio de una sola baguette tradition (singular).",
    expected: "Combien coûte la baguette tradition ?",
  },
  {
    situation: "Cierra la compra: es todo, te lo llevas, pide el ticket.",
    expected: "C'est tout, merci. Je vais emporter. Je peux avoir le ticket de caisse ?",
  },
];

export const day3ClesWritingItems = [
  {
    prompt: "Construye: JE VOUDRAIS + un demi + pain de campagne + tranché.",
    answer: "Je voudrais un demi-pain de campagne, tranché, s'il vous plaît.",
  },
  { prompt: "Forma correcta: « Une baguette ______ (croustillant). »", answer: "croustillante" },
  {
    prompt: "Escribe precio singular y plural para brioche.",
    answer: "Combien coûte la brioche ? / Combien coûtent les brioches ?",
  },
  {
    prompt: "Corrige: « Je voudrais un pain frais et croustillant. C'est tout, je vais rester ici. »",
    answer: "Je voudrais un pain frais et croustillant. C'est tout, je vais emporter.",
  },
  {
    prompt: "Ordena: [ le ticket / Je peux avoir / Merci ! / Je vais emporter. / de caisse ? ]",
    answer: "Je vais emporter. Merci ! Je peux avoir le ticket de caisse ?",
  },
];
