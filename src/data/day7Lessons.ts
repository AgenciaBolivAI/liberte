// Day 7 — practice items (Vocab + Grammaire) for Supermarché · partie 1.

export { day7Videos, day7Vocabulary, day7FlashQuiz, day7DefiSteps, day7GrammarStructures } from "./day7";

/* ============================================================
   VOCAB — 4 mini-jeux
   ============================================================ */

export const day7VocabReadingTexts = [
  {
    title: "Texte · Au supermarché",
    text: `Camille entre dans un grand supermarché à Lyon. Elle prend un chariot et sort sa liste de courses. Elle cherche d'abord le rayon fromages, mais elle ne le trouve pas. Elle demande à un employé : « Excusez-moi, où se trouve le rayon fromages ? » L'employé répond : « C'est au fond du magasin, à gauche des surgelés. » Camille voit qu'il y a une promotion sur le camembert cette semaine — 30 % de réduction ! Elle regarde aussi la date de péremption avant d'acheter. À la caisse, elle demande un sac réutilisable, mais l'employée dit : « Il n'y a pas de sacs gratuits, ils coûtent 50 centimes. » Camille paie et part contente : elle a trouvé tous les produits de sa liste.`,
    questions: [
      {
        q: "¿Dónde está el rayon fromages?",
        options: [
          "A la derecha de la entrada.",
          "Al fondo del supermercado, a la izquierda de los congelados.",
          "Cerca de las cajas.",
        ],
        answer: 1,
      },
      {
        q: "¿Qué producto está en promoción esta semana?",
        options: ["El pan fresco", "El camembert", "Los productos bio"],
        answer: 1,
      },
      {
        q: "¿Qué le dice la empleada de la caja sobre las bolsas?",
        options: [
          "Que son gratis.",
          "Que no hay bolsas gratuitas, cuestan 50 céntimos.",
          "Que solo hay bolsas de papel.",
        ],
        answer: 1,
      },
    ],
  },
];

export const day7VocabListeningMC = [
  {
    audio: "Où se trouve le rayon fromages, s'il vous plaît ?",
    question: "¿Qué está preguntando el cliente?",
    options: ["Cuánto cuesta el queso", "Dónde está la sección de quesos", "Si hay queso fresco"],
    answer: 1,
  },
  {
    audio: "Il y a du pain frais aujourd'hui ?",
    question: "¿Qué quiere saber?",
    options: [
      "Si el pan es congelado.",
      "Si hay pan fresco hoy.",
      "Dónde está el pan.",
    ],
    answer: 1,
  },
  {
    audio: "Il n'y a pas de lait demi-écrémé.",
    question: "¿Qué acaba de decir?",
    options: [
      "Que hay leche semidesnatada.",
      "Que no hay leche semidesnatada.",
      "Que prefiere la leche entera.",
    ],
    answer: 1,
  },
  {
    audio: "Je cherche les produits surgelés.",
    question: "¿Qué está buscando?",
    options: ["Productos frescos", "Productos congelados", "Productos bio"],
    answer: 1,
  },
  {
    audio: "Il y a une promotion sur le camembert.",
    question: "¿Qué información da?",
    options: [
      "Que el camembert está agotado.",
      "Que hay una promoción sobre el camembert.",
      "Que el camembert es caro.",
    ],
    answer: 1,
  },
];

export const day7VocabSpeakingItems = [
  {
    situation: "Pregunta dónde está la sección de quesos usando « Où se trouve… ? ».",
    expected: "Où se trouve le rayon fromages, s'il vous plaît ?",
  },
  {
    situation: "Pregunta si hay pan fresco hoy.",
    expected: "Il y a du pain frais aujourd'hui ?",
  },
  {
    situation: "Di que no hay leche desnatada en el pasillo.",
    expected: "Il n'y a pas de lait demi-écrémé.",
  },
  {
    situation: "Explica que buscas los productos congelados.",
    expected: "Je cherche les produits surgelés.",
  },
  {
    situation: "Pregunta si hay promociones esta semana.",
    expected: "Il y a des promotions cette semaine ?",
  },
];

export const day7VocabWritingItems = [
  {
    prompt: "Traduce: '¿Dónde está la sección de quesos?'",
    answer: "Où se trouve le rayon fromages ?",
  },
  {
    prompt: "Completa: « ______ des promotions cette semaine ? »",
    answer: "Il y a",
  },
  {
    prompt: "Traduce: 'No hay pan fresco.'",
    answer: "Il n'y a pas de pain frais.",
  },
  {
    prompt: "Ordena: [ je / les / cherche / surgelés / produits ]",
    answer: "Je cherche les produits surgelés.",
  },
  {
    prompt: "Corrige: « Il n'y a pas du lait. »",
    answer: "Il n'y a pas de lait.",
  },
];

/* ============================================================
   GRAMMAIRE — Les clés de la Liberté (Día 7 · Il y a / Il n'y a pas de)
   ============================================================ */

export const day7ClesReadingText = {
  title: "Lecture · Il y a / Il n'y a pas de au supermarché",
  text: `Théo fait ses courses dans un supermarché près de chez lui. Il regarde sa liste : du pain, du lait, des œufs et du fromage. Au rayon boulangerie, il voit qu'il y a du pain frais ce matin. Super ! Au rayon crémerie, il cherche du lait demi-écrémé, mais il n'y a pas de lait demi-écrémé aujourd'hui — il prend du lait entier à la place. Ensuite, il va au rayon fromages : il y a une promotion sur le camembert. Il en prend deux. À la caisse, il demande un sac, mais la caissière répond : « Il n'y a pas de sacs gratuits, ils coûtent 50 centimes. » Théo sourit : « Pas de problème, j'ai mon sac réutilisable. »`,
  questions: [
    {
      q: "¿Qué estructura usa el texto para confirmar existencia?",
      options: [
        "« Je voudrais… »",
        "« Il y a… » + artículo + sustantivo.",
        "« Où se trouve… ? »",
      ],
      answer: 1,
    },
    {
      q: "¿Cómo se niega la existencia en francés?",
      options: [
        "« Il n'y a pas du + nom » (con artículo definido).",
        "« Il n'y a pas de + nom » (sin artículo).",
        "« Il n'y a pas des + nom ».",
      ],
      answer: 1,
    },
    {
      q: "¿Cuál es el error frecuente que hay que evitar?",
      options: [
        "« Il n'y a pas de lait » (✓) → « Il n'y a pas du lait » (❌).",
        "« Il y a du lait » (❌) → « Il y a de lait » (✓).",
        "« Il n'y a pas de lait » (❌) → « Il y a pas lait » (✓).",
      ],
      answer: 0,
    },
  ],
};

export const day7ClesListeningMC = [
  {
    audio: "Il y a du pain frais aujourd'hui.",
    question: "¿Qué estructura reconoces?",
    options: [
      "Il n'y a pas de + nom (negativo).",
      "Il y a + article + nom (afirmativo).",
      "Où se trouve + article + nom ?",
    ],
    answer: 1,
  },
  {
    audio: "Il n'y a pas de lait demi-écrémé.",
    question: "¿Cuál es la traducción correcta?",
    options: [
      "Hay leche semidesnatada.",
      "No hay leche semidesnatada.",
      "Prefiero la leche semidesnatada.",
    ],
    answer: 1,
  },
  {
    audio: "Il n'y a pas d'œufs bio.",
    question: "¿Por qué se dice « d' » y no « de » ?",
    options: [
      "Porque el sustantivo empieza por vocal.",
      "Porque es un error, debería ser « de ».",
      "Porque « œufs » es masculino.",
    ],
    answer: 0,
  },
  {
    audio: "Il y a des promotions cette semaine.",
    question: "¿Qué expresa esta frase?",
    options: [
      "Que no hay promociones esta semana.",
      "Que hay promociones esta semana.",
      "Que las promociones son caras.",
    ],
    answer: 1,
  },
  {
    audio: "Il n'y a pas du pain frais.",
    question: "Esta frase tiene un error. ¿Cuál?",
    options: [
      "Debería decir « Il n'y a pas de pain frais » — en negativo, el artículo desaparece.",
      "Debería decir « Il y a pas du pain frais ».",
      "Está correcta.",
    ],
    answer: 0,
  },
];

export const day7ClesSpeakingItems = [
  {
    situation: "Confirma que hay pan fresco hoy.",
    expected: "Il y a du pain frais aujourd'hui.",
  },
  {
    situation: "Niega la existencia de leche semidesnatada.",
    expected: "Il n'y a pas de lait demi-écrémé.",
  },
  {
    situation: "Confirma que hay promociones esta semana.",
    expected: "Il y a des promotions cette semaine.",
  },
  {
    situation: "Niega la existencia de huevos bio (¡atención a la elisión!).",
    expected: "Il n'y a pas d'œufs bio.",
  },
  {
    situation: "Pregunta si hay crema fresca.",
    expected: "Il y a de la crème fraîche ?",
  },
];

export const day7ClesWritingItems = [
  {
    prompt: "Transforma a negativo: « Il y a du pain. »",
    answer: "Il n'y a pas de pain.",
  },
  {
    prompt: "Transforma a negativo: « Il y a des œufs. »",
    answer: "Il n'y a pas d'œufs.",
  },
  {
    prompt: "Transforma a negativo: « Il y a de la crème. »",
    answer: "Il n'y a pas de crème.",
  },
  {
    prompt: "Corrige: « Il n'y a pas du lait. »",
    answer: "Il n'y a pas de lait.",
  },
  {
    prompt: "Completa el diálogo: « Client: ______ du pain frais aujourd'hui ? »",
    answer: "Il y a",
  },
];
