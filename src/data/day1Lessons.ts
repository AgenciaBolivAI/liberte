// Day 1 — Le Café. Practice data for the vocabulary, grammar and défi lessons.

export { vocabulary, videos } from "./day1";

/* ============================================================
   VOCABULAIRE — Pratique (4 mini-jeux)
   ============================================================ */

/* ---------- LECTURE : 2 textes + compréhension ---------- */
export const vocabReadingTexts = [
  {
    title: "Texte 1 · Une table pour deux",
    text: `Bonjour ! Je m'appelle Marie. Aujourd'hui, je vais dans un petit café à Paris avec un ami. Il y a beaucoup de monde à l'intérieur, alors je ne veux pas aller au comptoir. Le serveur arrive et je lui dis : « Bonjour monsieur, je voudrais une table pour deux, s'il vous plaît ». Le serveur répond : « Oui, bien sûr ! » et nous apporte la carte. Je regarde la carte : je voudrais quelque chose de chaud. Je demande au serveur : « Je voudrais un chocolat chaud avec du sucre et un verre d'eau, s'il vous plaît ». Après, je demande l'addition. Ça fait 6 euros. Je paye par carte.`,
    questions: [
      {
        q: "Où Marie ne veut-elle pas s'asseoir ?",
        options: ["En terrasse", "Au comptoir", "Sur une chaise"],
        answer: 1,
      },
      {
        q: "Qu'est-ce que Marie demande au serveur avec son chocolat chaud ?",
        options: ["Un thé au citron", "Un jus d'orange", "Du sucre et un verre d'eau"],
        answer: 2,
      },
      {
        q: "Comment paye-t-elle la note ?",
        options: ["En espèces", "Par carte", "Elle ne paye pas"],
        answer: 1,
      },
    ],
  },
  {
    title: "Texte 2 · Un café à emporter",
    text: `Thomas est pressé ce matin. Il entre dans le café et marche directement vers le comptoir. Il salue le serveur : « Bonjour ! ». Le serveur lui demande : « C'est sur place ou à emporter ? ». Thomas répond : « À emporter, s'il vous plaît ! ». Thomas veut un grand café. Il dit : « Je voudrais un café avec du lait, mais sans sucre ». Le serveur prépare la boisson dans une grande tasse pour emporter. Thomas demande : « C'est combien, s'il vous plaît ? ». Le serveur répond : « Ça fait 3 euros 50 ». Thomas n'a pas de carte bancaire aujourd'hui, alors il dit : « Je paye en espèces, voici 4 euros ». Le serveur lui donne la monnaie et une serviette.`,
    questions: [
      {
        q: "Où va Thomas dans le café ?",
        options: ["En terrasse", "Au comptoir", "Il cherche une table pour deux"],
        answer: 1,
      },
      {
        q: "Comment Thomas veut-il son café ?",
        options: [
          "Avec du lait et sans sucre",
          "Chaud et avec beaucoup de sucre",
          "Froid et sans lait",
        ],
        answer: 0,
      },
      {
        q: "Comment Thomas paye-t-il sa boisson ?",
        options: ["Par carte", "Avec una aplicación", "En espèces"],
        answer: 2,
      },
    ],
  },
];

/* ---------- ÉCOUTE : 5 items ---------- */
export const vocabListeningMC = [
  {
    audio: "Un chocolat chaud, s'il vous plaît.",
    question: "¿Qué bebida ha pedido el cliente?",
    options: ["Un café", "Un thé au citron", "Un chocolat chaud"],
    answer: 2,
  },
  {
    audio: "Je paye en espèces.",
    question: "¿Cómo va a pagar el cliente?",
    options: ["Con tarjeta", "En efectivo", "No va a pagar"],
    answer: 1,
  },
  {
    audio: "C'est sur place ou à emporter ?",
    question: "¿Qué está preguntando el camarero?",
    options: [
      "Si quiere azúcar o leche",
      "Si es para tomar aquí o para llevar",
      "Cuánto cuesta el pedido",
    ],
    answer: 1,
  },
  {
    audio: "Un café avec du lait et sans sucre.",
    question: "¿Cómo quiere el café el cliente?",
    options: [
      "Con leche y sin azúcar",
      "Solo y con azúcar",
      "Con leche y con azúcar",
    ],
    answer: 0,
  },
  {
    audio: "L'addition, s'il vous plaît !",
    question: "¿Qué está pidiendo el cliente?",
    options: ["La carta", "Una servilleta", "La cuenta"],
    answer: 2,
  },
];

/* ---------- PARLER : 5 items ---------- */
export const vocabSpeakingItems = [
  {
    situation:
      "Entras al café y quieres pedir una mesa para dos personas de manera educada.",
    expected: "Une table pour deux, s'il vous plaît.",
  },
  {
    situation:
      "El camarero te trae el té, pero olvida la cuchara. Pídele una con educación.",
    expected: "Vous avez une cuillère ?",
  },
  {
    situation: "Quieres pedir un jugo de naranja fresco.",
    expected: "Je voudrais un jus d'orange frais.",
  },
  {
    situation:
      "Estás listo para irte y llamas al camarero para pedirle la cuenta.",
    expected: "L'addition, s'il vous plaît !",
  },
  {
    situation: "Quieres preguntarle al camarero cuánto cuesta el café.",
    expected: "C'est combien, le café ?",
  },
];

/* ---------- ÉCRITURE : 5 items ---------- */
export const vocabWritingItems = [
  {
    prompt: "Traduce al francés: « Una taza grande, por favor. »",
    answer: "Une grande tasse, s'il vous plaît.",
  },
  {
    prompt: "Traduce al francés: « ¿Puedo pagar con tarjeta? »",
    answer: "Je peux payer par carte ?",
  },
  {
    prompt: "Completa la palabra que falta: « Je préfère m'asseoir au ____ (la barra). »",
    answer: "comptoir",
  },
  {
    prompt: "Traduce al francés: « Para llevar, por favor. »",
    answer: "À emporter, s'il vous plaît.",
  },
  {
    prompt:
      "Corrige el error y escríbela de forma formal para el camarero: « Une eau plate, s'il te plaît. »",
    answer: "Une eau plate, s'il vous plaît.",
  },
];

/* ============================================================
   GRAMMAIRE — Les clés de la Liberté (Je voudrais)
   ============================================================ */

export const clesReadingText = {
  title: "Lecture · Politesse au café",
  text: `Un client entre dans la cafétéria. Il parle au serveur de manière très directe : « Je veux un café ». Le serveur est surpris parce que c'est un peu brusque. Un autre client arrive, sourit et utilise la formule correcte : « Bonjour ! Je voudrais une table pour deux, s'il vous plaît ». Le serveur répond avec joie. À la fin, le deuxième client dit poliment : « Je voudrais la note, s'il vous plaît ». C'est la forme parfaite, naturelle et éduquée en français.`,
  questions: [
    {
      q: "Pourquoi le serveur est-il surpris par le premier client ?",
      options: [
        "Parce qu'il a demandé un thé au citron.",
        "Parce que « Je veux » suena directo y puede resultar brusco con desconocidos.",
        "Parce qu'il veut payer en espèces.",
      ],
      answer: 1,
    },
    {
      q: "Quelle est la formule polie utilisée par le deuxième client pour demander une table ?",
      options: [
        "Je veux une table pour deux.",
        "Je peux avoir une table pour deux.",
        "Je voudrais une table pour deux.",
      ],
      answer: 2,
    },
    {
      q: 'Quelle est la structure exacte du "Conditionnel de Cortesía" ?',
      options: [
        "JE VEUX + sustantif",
        "JE VOUDRAIS + sustantif",
        "S'IL VOUS PLAÎT + verbe",
      ],
      answer: 1,
    },
  ],
};

export const clesListeningMC = [
  {
    audio: "Je voudrais un café, s'il vous plaît.",
    question: "¿Cómo suena el final de la palabra 'voudrais' que acabas de escuchar?",
    options: [
      "Se pronuncia la 's' final de forma fuerte.",
      "El sonido final es suave [vud-RE] y la 's' no se pronuncia.",
      "Suena igual que 'veux'.",
    ],
    answer: 1,
  },
  {
    audio: "Je veux la note.",
    question: "¿Cómo clasifica la lección esta estructura para hablar con un camarero?",
    options: ["Formal y educada.", "Informal / brusca.", "Perfecta y elegante."],
    answer: 1,
  },
  {
    audio: "Je voudrais payer par carte.",
    question: "¿Qué está expresando el cliente con este modo verbal?",
    options: [
      "Una orden directa.",
      "Un pedido con cortesía y educación.",
      "Una queja sobre el precio.",
    ],
    answer: 1,
  },
  {
    audio: "Je voudrais la note, s'il vous plaît.",
    question: "¿Qué elemento sigue inmediatamente a la palabra 'voudrais'?",
    options: [
      "Un verbo en infinitivo.",
      "Un sustantivo (la note).",
      "Una opción de pago.",
    ],
    answer: 1,
  },
  {
    audio: "Je veux un chocolat chaud.",
    question: "¿Cuál sería la forma correcta y recomendada para cambiar esta frase a un tono educado?",
    options: [
      "S'il vous plaît un chocolat chaud.",
      "Je voudrais un chocolat chaud, s'il vous plaît.",
      "Je peux un chocolat chaud.",
    ],
    answer: 1,
  },
];

export const clesSpeakingItems = [
  {
    situation:
      "Transforma « Je veux un café » a la forma cortés recomendada para desconocidos.",
    expected: "Je voudrais un café, s'il vous plaît.",
  },
  {
    situation:
      "Pide una mesa para dos personas usando el Conditionnel de Cortesía. Cuida la pronunciación de voudrais.",
    expected: "Je voudrais une table pour deux.",
  },
  {
    situation: "Pide la cuenta de forma educada utilizando 'la note'.",
    expected: "Je voudrais la note, s'il vous plaît.",
  },
  {
    situation: "Indica cortésmente que quieres pagar con tarjeta.",
    expected: "Je voudrais payer par carte.",
  },
  {
    situation: "Pide elegantemente 'algo caliente'.",
    expected: "Je voudrais quelque chose de chaud.",
  },
];

export const clesWritingItems = [
  {
    prompt: "Completa: « Je ____ un café, s'il vous plaît. »",
    answer: "voudrais",
  },
  {
    prompt: "Traduce: « Quisiera una mesa para dos. »",
    answer: "Je voudrais une table pour deux.",
  },
  {
    prompt: "Reescribe de forma educada: « Je veux la note. »",
    answer: "Je voudrais la note, s'il vous plaît.",
  },
  {
    prompt: "Completa: « Je ____ payer par carte. »",
    answer: "voudrais",
  },
  {
    prompt:
      "Ordena: ( s'il vous plaît. / un chocolat chaud, / Je voudrais )",
    answer: "Je voudrais un chocolat chaud, s'il vous plaît.",
  },
];

/* ============================================================
   DÉFI FINAL — Roleplay grabado con el camarero
   ============================================================ */

export const defiRoleplay = [
  {
    serveur: "Bonjour ! Bienvenue au café. C'est sur place ou à emporter ?",
    hint: "Di que es para llevar de forma cortés, y añade lo que quieras (ej. si estás apurado).",
    example: "À emporter, s'il vous plaît.",
    pauseSec: 5,
  },
  {
    serveur: "D'accord. Qu'est-ce que vous voulez boire aujourd'hui ?",
    hint: "Pide tu bebida favorita usando « Je voudrais + sustantivo » e indica si la quieres con o sin azúcar/leche.",
    example: "Je voudrais un café avec du lait, s'il vous plaît.",
    pauseSec: 8,
  },
  {
    serveur: "Très bien. Ça fait 3 euros 50 en total. Vous payez comment ?",
    hint: "Dile cómo vas a pagar (efectivo o tarjeta) y despídete deseando un buen día.",
    example: "Je paye par carte. Merci, bonne journée !",
    pauseSec: 6,
  },
];
