// Day 6 — practice items (Vocab + Grammaire) for Restaurant · partie 2.

export { day6Videos, day6Vocabulary, day6FlashQuiz, day6DefiSteps, day6GrammarStructures } from "./day6";

/* ============================================================
   VOCAB — 4 mini-jeux
   ============================================================ */

export const day6VocabReadingTexts = [
  {
    title: "Texte · Un dîner entre amis",
    text: `Léa et ses amis entrent dans un petit restaurant à Paris. Léa est végétarienne et son ami Paul a une allergie aux fruits de mer. Le serveur les accueille : « Bonsoir ! Voici la carte. » Léa demande : « Vous avez quelque chose pour les végétariens ? » Le serveur répond : « Oui, le plat du jour est un risotto aux légumes, et il est sans gluten aussi. » Paul demande : « Qu'est-ce qu'il y a dans ce plat ? » Le serveur explique. À la fin du dîner, Léa remarque une erreur dans l'addition : ils ont compté un dessert de trop. Le serveur corrige tout de suite. Ils décident de payer séparément par carte bancaire. Avant de partir, Léa dit : « C'était délicieux, compliments au chef ! »`,
    questions: [
      {
        q: "¿Qué restricción tiene Léa?",
        options: ["Es vegana", "Es vegetariana", "Es alérgica al gluten"],
        answer: 1,
      },
      {
        q: "¿Qué error hay en la cuenta?",
        options: [
          "Contaron un postre de más.",
          "Contaron dos platos de más.",
          "Cobraron el servicio dos veces.",
        ],
        answer: 0,
      },
      {
        q: "¿Cómo deciden pagar?",
        options: ["En efectivo", "A medias en efectivo", "Por separado con tarjeta bancaria"],
        answer: 2,
      },
    ],
  },
];

export const day6VocabListeningMC = [
  {
    audio: "Je suis végétarien, je ne mange pas de viande.",
    question: "¿Qué está anunciando el cliente?",
    options: ["Que es vegano", "Que es vegetariano", "Que tiene una alergia"],
    answer: 1,
  },
  {
    audio: "Il y a une erreur dans l'addition.",
    question: "¿Qué acaba de decir el cliente?",
    options: [
      "Que quiere pagar la cuenta.",
      "Que hay un error en la cuenta.",
      "Que quiere dividir la cuenta.",
    ],
    answer: 1,
  },
  {
    audio: "On peut payer séparément, s'il vous plaît ?",
    question: "¿Qué está pidiendo?",
    options: [
      "Pagar a medias.",
      "Pagar en efectivo.",
      "Pagar por separado.",
    ],
    answer: 2,
  },
  {
    audio: "Je voudrais mon steak à point.",
    question: "¿Qué cocción está pidiendo?",
    options: ["Poco hecho", "En su punto", "Muy hecho"],
    answer: 1,
  },
  {
    audio: "Vous avez quelque chose pour les végétariens ?",
    question: "¿Qué está preguntando?",
    options: [
      "Si el plato es picante.",
      "Si tienen algo apto para vegetarianos.",
      "Si hay menú infantil.",
    ],
    answer: 1,
  },
];

export const day6VocabSpeakingItems = [
  {
    situation: "Anuncia que eres vegetariano y pregunta si tienen algo para ti.",
    expected: "Je suis végétarien. Vous avez quelque chose pour les végétariens ?",
  },
  {
    situation: "Descubres un error en la cuenta. Díselo al camarero con educación.",
    expected: "Excusez-moi, il y a une erreur dans l'addition.",
  },
  {
    situation: "Pide pagar por separado con tarjeta bancaria.",
    expected: "On peut payer séparément, par carte bancaire ?",
  },
  {
    situation: "El camarero pregunta la cocción de tu steak. Pídelo en su punto.",
    expected: "Je voudrais mon steak à point, s'il vous plaît.",
  },
  {
    situation: "Al terminar, felicita al chef y despídete.",
    expected: "C'était délicieux, compliments au chef ! Bonne soirée !",
  },
];

export const day6VocabWritingItems = [
  {
    prompt: "Traduce: '¿Tienen un menú sin gluten?'",
    answer: "Vous avez un menu sans gluten ?",
  },
  {
    prompt: "Completa: « Il y a une ______ dans l'addition. »",
    answer: "erreur",
  },
  {
    prompt: "Traduce: 'Vamos a pagar por separado.'",
    answer: "On va payer séparément.",
  },
  {
    prompt: "Corrige: « Je veux mon steak saignant, à point. »",
    answer: "Je voudrais mon steak à point, s'il vous plaît.",
  },
  {
    prompt: "Ordena: [ pour / vous avez / les végétariens / quelque chose / ? ]",
    answer: "Vous avez quelque chose pour les végétariens ?",
  },
];

/* ============================================================
   GRAMMAIRE — Les clés de la Liberté (Día 6 · Futur proche)
   ============================================================ */

export const day6ClesReadingText = {
  title: "Lecture · Le futur proche au restaurant",
  text: `Antoine et Sophie sont au restaurant. Antoine regarde la carte et dit : « Je vais prendre le plat du jour — un risotto aux champignons. » Sophie répond : « Moi, je vais essayer le poulet rôti avec des légumes. » Le serveur arrive. Antoine ajoute : « Nous allons partager une bouteille d'eau plate. » À la fin du repas, Sophie remarque quelque chose : « Attends, il y a une erreur dans l'addition — ils ont compté un dessert de trop. » Antoine appelle le serveur : « Excusez-moi, on va vérifier l'addition ensemble ? » Le serveur corrige. Antoine sourit : « Merci ! On va payer séparément. » Sophie ajoute : « Je vais payer par carte bancaire. »`,
  questions: [
    {
      q: "¿Qué estructura usan Antoine y Sophie para anunciar sus decisiones inmediatas?",
      options: [
        "Je voudrais + sustantivo.",
        "Aller (conjugado) + infinitif — futur proche.",
        "Je préfère + sustantivo.",
      ],
      answer: 1,
    },
    {
      q: "¿Cómo se dice « Vamos a pagar por separado » en futur proche?",
      options: [
        "Nous payons séparément.",
        "On va payer séparément.",
        "On veut payer séparément.",
      ],
      answer: 1,
    },
    {
      q: "¿Cuál es el error frecuente que hay que evitar?",
      options: [
        "Je vais prends le poulet (❌) → je vais prendre le poulet (✓).",
        "Je vais prendre le poulet (❌) → je prends le poulet (✓).",
        "Je vais prendre le poulet (❌) → j'ai pris le poulet (✓).",
      ],
      answer: 0,
    },
  ],
};

export const day6ClesListeningMC = [
  {
    audio: "Je vais prendre le plat du jour.",
    question: "¿Qué tiempo verbal se usa?",
    options: [
      "Présent — acción actual.",
      "Futur proche — decisión inmediata.",
      "Passé composé — acción pasada.",
    ],
    answer: 1,
  },
  {
    audio: "On va payer séparément.",
    question: "¿Cuál es la traducción correcta?",
    options: [
      "Pagamos por separado (habitual).",
      "Vamos a pagar por separado.",
      "Pagamos a medias.",
    ],
    answer: 1,
  },
  {
    audio: "Elle va demander l'addition.",
    question: "¿Qué expresa esta frase?",
    options: [
      "Ella pidió la cuenta hace un rato.",
      "Ella va a pedir la cuenta (dentro de un momento).",
      "Ella siempre pide la cuenta.",
    ],
    answer: 1,
  },
  {
    audio: "Nous allons réserver une table pour samedi.",
    question: "¿Qué estructura reconoces?",
    options: [
      "Devoir + infinitif.",
      "Aller + infinitif (futur proche).",
      "Vouloir + infinitif.",
    ],
    answer: 1,
  },
  {
    audio: "Je vais prends le poulet rôti.",
    question: "Esta frase tiene un error. ¿Cuál?",
    options: [
      "Debería decir « Je prends prends ».",
      "Debería decir « Je vais prendre le poulet rôti » — aller siempre va con el infinitif.",
      "Está correcta.",
    ],
    answer: 1,
  },
];

export const day6ClesSpeakingItems = [
  {
    situation: "Anuncia con futur proche que vas a tomar el plato del día.",
    expected: "Je vais prendre le plat du jour, s'il vous plaît.",
  },
  {
    situation: "Di con futur proche que van a pagar por separado.",
    expected: "On va payer séparément.",
  },
  {
    situation: "Anuncia con futur proche que vas a reservar una mesa para el sábado.",
    expected: "Je vais réserver une table pour samedi.",
  },
  {
    situation: "Di con futur proche que vas a probar el postre casero.",
    expected: "Je vais essayer le dessert fait maison.",
  },
  {
    situation: "Anuncia con futur proche que van a compartir la cuenta.",
    expected: "On va partager l'addition.",
  },
];

export const day6ClesWritingItems = [
  {
    prompt: "Completa con futur proche: « Je ______ prendre le steak à point. »",
    answer: "vais",
  },
  {
    prompt: "Corrige el futur proche: « Elle va demande l'addition. »",
    answer: "Elle va demander l'addition.",
  },
  {
    prompt: "Traduce: 'Vamos a pagar por separado.'",
    answer: "On va payer séparément.",
  },
  {
    prompt: "Ordena: [ vais / je / commander / un / steak ]",
    answer: "Je vais commander un steak.",
  },
  {
    prompt: "Reescribe en futur proche: « Nous réservons une table pour deux. »",
    answer: "Nous allons réserver une table pour deux.",
  },
];
