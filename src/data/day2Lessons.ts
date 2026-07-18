// Day 2 — practice items (Vocab + Grammaire) for Le Café · retour.

export { day2Videos, day2Vocabulary, day2FlashQuiz, day2DefiSteps, day2GrammarStructures } from "./day2";

/* ============================================================
   VOCAB — 4 mini-jeux
   ============================================================ */

export const day2VocabReadingTexts = [
  {
    title: "Texte · Clara et le gâteau du jour",
    text: `Clara entre dans le café. Elle regarde la vitrine et voit des croissants, des pains au chocolat et un gâteau au chocolat. Elle demande au serveur : « C'est fait maison, le gâteau ? » Le serveur répond : « Oui, c'est la spécialité du jour ! » Clara sourit et dit : « Je vais essayer une part, s'il vous plaît. » Elle commande aussi une bouteille d'eau avec de la glace. À la fin, elle demande : « Le service est compris ? » Le serveur répond : « Oui, madame. Bonne journée ! »`,
    questions: [
      {
        q: "¿Qué pregunta Clara sobre el gâteau?",
        options: ["Si es la especialidad de la semana.", "Si es fait maison.", "Si es grand o petit."],
        answer: 1,
      },
      {
        q: "¿Qué decide hacer Clara después de escuchar al serveur?",
        options: ["Pedir un cappuccino.", "Preguntar el precio.", "Essayer une part de gâteau."],
        answer: 2,
      },
      {
        q: "¿Qué pide Clara además del gâteau?",
        options: [
          "Un croissant et un café décaféiné.",
          "Une bouteille d'eau avec de la glace.",
          "Un pain au chocolat et une paille.",
        ],
        answer: 1,
      },
    ],
  },
];

export const day2VocabListeningMC = [
  {
    audio: "Je voudrais un expresso, pas trop fort.",
    question: "¿Qué tipo de café está pidiendo esta persona?",
    options: [
      "Un café muy fuerte e intenso.",
      "Un espresso suave, sin demasiada intensidad.",
      "Un cappuccino con leche.",
    ],
    answer: 1,
  },
  {
    audio: "C'est fait maison, la tarte ?",
    question: "¿Qué está preguntando el cliente?",
    options: ["Si la tarta es del día.", "Si la tarta es casera.", "Si la tarta es dulce o suave."],
    answer: 1,
  },
  {
    audio: "Je vais essayer une part de gâteau du jour.",
    question: "¿Qué está expresando el cliente?",
    options: [
      "Que ya probó el pastel y le gustó.",
      "Que quiere probar una porción del pastel del día.",
      "Que prefiere no comer postre hoy.",
    ],
    answer: 1,
  },
  {
    audio: "Vous pouvez me rendre la monnaie, s'il vous plaît ?",
    question: "¿Qué está pidiendo el cliente?",
    options: ["Un recibo para su pedido.", "El terminal de pago.", "El cambio de su pago."],
    answer: 2,
  },
  {
    audio: "Le service est compris ?",
    question: "¿Sobre qué está preguntando?",
    options: [
      "Si el Wi-Fi está incluido.",
      "Si la propina ya está incluida en la cuenta.",
      "Si puede pedir más café sin costo.",
    ],
    answer: 1,
  },
];

export const day2VocabSpeakingItems = [
  {
    situation: "El camarero pregunta si quieres tu café fort o léger. Respóndele que lo prefieres léger.",
    expected: "Je préfère un café léger.",
  },
  {
    situation: "Ves un gâteau delicioso y quieres saber si es casero.",
    expected: "C'est fait maison, le gâteau ?",
  },
  {
    situation: "Decides pedir una porción de tarta, de manera educada.",
    expected: "Je voudrais une part de tarte, s'il vous plaît.",
  },
  {
    situation: "Quieres asegurarte de que el servicio está incluido.",
    expected: "Le service est compris ?",
  },
  {
    situation: "Al salir, despídete del camarero de forma natural.",
    expected: "Merci beaucoup ! Bonne journée !",
  },
];

export const day2VocabWritingItems = [
  { prompt: "Completa: « Je voudrais un café ______ — pas trop fort. »", answer: "léger" },
  { prompt: "Traduce: '¿Es casero el croissant?'", answer: "C'est fait maison, le croissant ?" },
  {
    prompt: "Corrige: « Je vais manger une morceau de tarte. »",
    answer: "Je vais essayer une part de tarte.",
  },
  {
    prompt: "Completa: « Vous pouvez me ______ ______, s'il vous plaît ? »",
    answer: "rendre la monnaie",
  },
  {
    prompt: "Ordena: [ du jour / C'est / la spécialité / ? ]",
    answer: "C'est la spécialité du jour ?",
  },
];

/* ============================================================
   GRAMMAIRE — Les clés de la Liberté (Día 2)
   ============================================================ */

export const day2ClesReadingText = {
  title: "Lecture · Sophie et la tarte aux pommes",
  text: `Sophie entre dans le café et s'assoit. Le serveur arrive. Sophie lui demande : « Qu'est-ce que vous recommandez comme gâteau aujourd'hui ? » Le serveur répond avec enthousiasme : « La tarte aux pommes — c'est fait maison ! » Sophie demande : « C'est sucré ? » Le serveur dit : « Non, c'est doux et savoureux ! » Sophie sourit : « Parfait ! Je préfère quelque chose de léger. Je vais essayer une part de tarte, s'il vous plaît. » Après, elle dit : « C'est vraiment savoureux ! Vous pouvez me rendre la monnaie ? Et je peux avoir un reçu ? » Le serveur répond : « Bien sûr ! Bonne journée, madame ! »`,
  questions: [
    {
      q: "¿Qué estructura usa Sophie para pedir una recomendación?",
      options: [
        "Je voudrais + sustantivo.",
        "Qu'est-ce que vous recommandez + comme + sustantivo.",
        "Je préfère + adjetivo.",
      ],
      answer: 1,
    },
    {
      q: "¿Qué estructura usa para expresar que va a probar la tarta?",
      options: [
        "Je préfère une part de tarte.",
        "Je voudrais essayer la tarte.",
        "Je vais essayer une part de tarte.",
      ],
      answer: 2,
    },
    {
      q: "¿Qué estructura usa para describir que el sabor es muy bueno?",
      options: [
        "Je préfère + adjectif.",
        "C'est + adjectif (savoureux).",
        "Qu'est-ce que + adjectif.",
      ],
      answer: 1,
    },
  ],
};

export const day2ClesListeningMC = [
  {
    audio: "Je préfère un café léger, pas trop fort.",
    question: "¿Qué estructura usa?",
    options: [
      "Je voudrais + sustantivo (Día 1).",
      "Je préfère + adjetivo.",
      "Je vais essayer + sustantivo.",
    ],
    answer: 1,
  },
  {
    audio: "Qu'est-ce que vous recommandez comme gâteau ?",
    question: "¿Para qué se usa?",
    options: [
      "Para pedir algo educadamente.",
      "Para pedir una recomendación al serveur.",
      "Para describir el sabor.",
    ],
    answer: 1,
  },
  {
    audio: "Je vais essayer le croissant du jour.",
    question: "¿Qué indica « Je vais + infinitif » ?",
    options: [
      "Una acción que ya ocurrió.",
      "Una preferencia habitual.",
      "Una decisión o intención inmediata.",
    ],
    answer: 2,
  },
  {
    audio: "C'est fait maison ? C'est savoureux ?",
    question: "¿Qué estructura se usa?",
    options: [
      "C'est + adjectif / expression.",
      "Je préfère + adjectif.",
      "Qu'est-ce que + verbe.",
    ],
    answer: 0,
  },
  {
    audio: "Je préfère un grand cappuccino, s'il vous plaît.",
    question: "¿Qué adjetivo de tamaño usa?",
    options: ["léger", "décaféiné", "grand"],
    answer: 2,
  },
];

export const day2ClesSpeakingItems = [
  {
    situation: "El serveur pregunta qué café prefieres (suave y pequeño), usando JE PRÉFÈRE.",
    expected: "Je préfère un café léger et petit.",
  },
  {
    situation: "Hay varios pasteles y no sabes cuál elegir. Pide una recomendación.",
    expected: "Qu'est-ce que vous recommandez comme gâteau ?",
  },
  {
    situation: "El serveur recomienda la tarte du jour. Acepta y dile que la probarás (JE VAIS ESSAYER).",
    expected: "Je vais essayer une part de tarte du jour, s'il vous plaît.",
  },
  {
    situation: "Pruebas el croissant y está delicioso. Dilo con C'EST + adjectif.",
    expected: "C'est délicieux ! C'est vraiment savoureux !",
  },
  {
    situation: "Antes de pagar, pregunta si el servicio está incluido.",
    expected: "Le service est compris ?",
  },
];

export const day2ClesWritingItems = [
  { prompt: "Completa: « Je ______ un café décaféiné, pas trop fort. »", answer: "préfère" },
  { prompt: "Escribe: '¿Qué café recomienda?'", answer: "Qu'est-ce que vous recommandez comme café ?" },
  {
    prompt: "Transforma con JE VAIS ESSAYER: 'Quiero probar una porción del gâteau du jour.'",
    answer: "Je vais essayer une part de gâteau du jour.",
  },
  {
    prompt: "Corrige: « C'est bon ? C'est une spécialité de la maison ? »",
    answer: "C'est bon ? C'est fait maison ?",
  },
  {
    prompt: "Ordena: [ recommandez / Qu'est-ce que / comme tarte / vous / ? ]",
    answer: "Qu'est-ce que vous recommandez comme tarte ?",
  },
];
