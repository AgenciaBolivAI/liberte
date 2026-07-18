// Day 5 — practice items (Vocab + Grammaire) for Le Bistrot Liberté.

export {
  day5Videos,
  day5Vocabulary,
  day5AnchorPhrases,
  day5FlashQuiz,
  day5DefiSteps,
  day5GrammarStructures,
} from "./day5";

/* ============================================================
   VOCAB — 4 mini-jeux
   ============================================================ */

export const day5VocabReadingTexts = [
  {
    title: "Texte · Camille réserve au Bistrot Liberté",
    text: `Camille appelle le Bistrot Liberté. Elle demande : « Je voudrais réserver une table pour deux personnes ce soir. Vous êtes complets ? » Antoine répond : « Non, nous avons une table disponible à 20h. Au nom de qui ? » Camille dit : « Au nom de Dupont. » Le soir, elle arrive. Antoine lui demande : « Vous préférez la terrasse ou l'intérieur ? » Camille répond : « La terrasse, s'il vous plaît. » Antoine lui apporte le menu et la carte. Il dit : « Le menu à 25 euros comprend une entrée, un plat principal et un dessert. » Camille choisit le menu. Comme entrée, elle prend une soupe. Comme plat, du poulet avec des légumes. Elle demande aussi : « Le fromage est compris dans le menu ? » Antoine répond : « Oui, madame ! »`,
    questions: [
      {
        q: "¿Cómo verifica Camille si hay mesa disponible al llamar?",
        options: [
          "Pregunta le plat du jour y la terrasse.",
          "Dice 'Je voudrais réserver' y pregunta si están complets.",
          "Pide confirmar su reserva anterior.",
        ],
        answer: 1,
      },
      {
        q: "¿Cuál es la diferencia entre le menu y la carte en este texto?",
        options: [
          "Le menu es más caro que la carte.",
          "Le menu es precio fijo (entrée + plat + dessert); la carte es a la carta.",
          "No hay diferencia — son sinónimos en francés.",
        ],
        answer: 1,
      },
      {
        q: "¿Qué pide Camille como plato principal?",
        options: [
          "Du poisson avec une sauce au citron.",
          "Des pâtes avec du fromage.",
          "Du poulet avec des légumes.",
        ],
        answer: 2,
      },
    ],
  },
];

export const day5VocabListeningMC = [
  {
    audio: "Je voudrais réserver une table pour deux personnes ce soir.",
    question: "¿Qué está haciendo la persona con esta frase?",
    options: [
      "Está cancelando una reserva para esta noche.",
      "Está reservando una mesa para dos personas esta noche.",
      "Está preguntando si el restaurante está completo.",
    ],
    answer: 1,
  },
  {
    audio: "Désolé, nous sommes complets ce soir.",
    question: "¿Qué le está informando el restaurante al cliente?",
    options: [
      "Que el menú está completo con todos los platos disponibles.",
      "Que no hay mesas disponibles esta noche.",
      "Que el cliente debe confirmar su reserva.",
    ],
    answer: 1,
  },
  {
    audio: "Comme entrée, je prends la soupe. Comme plat principal, le poulet.",
    question: "¿Qué estructura usa el cliente para hacer el pedido?",
    options: [
      "Je voudrais + nombre del plato.",
      "Comme + tipo de plato + je prends / nombre.",
      "Il reste + tipo de plato.",
    ],
    answer: 1,
  },
  {
    audio: "Je préfère la terrasse à l'intérieur — il fait beau ce soir !",
    question: "¿Dónde prefiere sentarse el cliente, y por qué?",
    options: [
      "En el interior, porque hace frío.",
      "En la terraza, porque hace buen tiempo.",
      "En la terraza, porque el interior está completo.",
    ],
    answer: 1,
  },
  {
    audio: "Le fromage est compris dans le menu ?",
    question: "¿Qué está preguntando el cliente al serveur?",
    options: [
      "Si el queso es casero.",
      "Si el queso está incluido en el precio fijo del menú.",
      "Si hay queso en el plato principal.",
    ],
    answer: 1,
  },
];

export const day5VocabSpeakingItems = [
  {
    situation: "Llamas al Bistrot Liberté. Diles que quieres reservar una mesa para dos personas esta noche.",
    expected: "Je voudrais réserver une table pour deux personnes ce soir, s'il vous plaît.",
  },
  {
    situation: "El restaurante te pregunta a nombre de quién. Dales tu apellido usando la expresión correcta.",
    expected: "Au nom de García, s'il vous plaît.",
  },
  {
    situation: "Antoine te pregunta dónde prefieres sentarte. Dile que prefieres la terraza al interior.",
    expected: "Je préfère la terrasse à l'intérieur, s'il vous plaît.",
  },
  {
    situation: "Pide los tres platos de una sola vez usando COMME para cada uno: soupe / poisson / dessert.",
    expected: "Comme entrée, je prends la soupe. Comme plat principal, le poisson. Comme dessert, la tarte du jour.",
  },
  {
    situation: "Durante la comida, pide a Antoine que te traiga pan y agua.",
    expected: "Vous pouvez m'apporter du pain et de l'eau, s'il vous plaît ?",
  },
];

export const day5VocabWritingItems = [
  {
    prompt: "Completa la frase para hacer una reserva: « Je voudrais ____ une table pour ____ personnes ____ soir. »",
    answer: "réserver / deux / ce",
  },
  {
    prompt: "¿Cómo le dices al restaurante a nombre de quién está la reserva? (Usa tu apellido o García.)",
    answer: "J'ai une réservation au nom de García.",
  },
  {
    prompt: "Escribe tu pedido completo de los tres platos usando COMME para cada uno.",
    answer: "Comme entrée, je prends la salade. Comme plat principal, je voudrais du poisson. Comme dessert, le fromage.",
  },
  {
    prompt: "Corrige: « Le menu est la liste de tous les plats du restaurant. » (Pista: definición correcta en francés.)",
    answer: "Non — le menu en France = prix fixe (entrée + plat + dessert). La liste de tous les plats s'appelle 'la carte'.",
  },
  {
    prompt: "Ordena: [ est compris / Le fromage / dans le menu / ? ]",
    answer: "Le fromage est compris dans le menu ?",
  },
];

/* ============================================================
   GRAMMAIRE — Les clés de la Liberté (Día 5)
   ============================================================ */

export const day5ClesReadingText = {
  title: "Lecture · Lucas dîne au Bistrot Liberté",
  text: `Lucas arrive au Bistrot Liberté. Il dit à Antoine : « Bonsoir ! J'ai une réservation au nom de Martin, pour deux personnes. » Antoine vérifie et répond : « Très bien, monsieur Martin ! Vous préférez la terrasse ou l'intérieur ? » Lucas : « Je préfère la terrasse à l'intérieur — il fait très beau ce soir. » Antoine leur apporte le menu. Lucas demande : « Quel est le plat du jour ? » Antoine répond : « Un filet de poisson avec une sauce au citron. » Lucas commande : « Comme entrée, je prends la soupe. Comme plat principal, le poisson, s'il vous plaît. Je préfère le poisson à la viande. Comme dessert — qu'est-ce qui est compris dans le menu ? » Antoine : « Le fromage ou un dessert sucré. » Lucas : « Alors le fromage, merci. Et vous pouvez m'apporter du pain ? »`,
  questions: [
    {
      q: "Lucas usa JE PRÉFÈRE A À B dos veces. ¿Cuáles son?",
      options: [
        "Je préfère la terrasse à l'intérieur + Je préfère le poisson à la viande.",
        "Je préfère le menu à la carte + Je préfère le fromage au dessert.",
        "Je préfère la soupe à la salade + Je préfère le pain au fromage.",
      ],
      answer: 0,
    },
    {
      q: "¿Qué estructura usa Lucas para el pedido completo de los tres platos?",
      options: [
        "Je voudrais + nombre del plato (tres veces).",
        "COMME + tipo de plato + je prends / nombre del plato.",
        "Il reste + tipo de plato + je vais essayer.",
      ],
      answer: 1,
    },
    {
      q: "¿Qué pregunta usa Lucas para saber qué incluye el menú?",
      options: [
        "Quel est le plat du jour ?",
        "Vous pouvez m'apporter le fromage ?",
        "Qu'est-ce qui est compris dans le menu ?",
      ],
      answer: 2,
    },
  ],
};

export const day5ClesListeningMC = [
  {
    audio: "Comme entrée, je prends la soupe. Comme plat principal, le poisson. Comme dessert, la tarte.",
    question: "¿Qué estructura usa el cliente para hacer el pedido completo?",
    options: [
      "Je voudrais + nombre del plato (para cada uno).",
      "COMME + tipo de plato + nombre del plato — para los tres cursos en orden.",
      "Il reste + tipo de plato — para verificar disponibilidad.",
    ],
    answer: 1,
  },
  {
    audio: "Je préfère le poisson à la viande.",
    question: "¿Qué significa esta frase y cuál es el orden de la estructura?",
    options: [
      "La persona prefiere la viande al poisson.",
      "La persona prefiere el poisson — lo que prefiere va primero, lo que prefiere menos va después de 'à'.",
      "La persona no tiene preferencia entre los dos.",
    ],
    answer: 1,
  },
  {
    audio: "J'ai une réservation au nom de Dupont, pour deux personnes.",
    question: "¿Qué dos datos esenciales da el cliente al llegar?",
    options: [
      "El menú elegido y la hora de llegada.",
      "El apellido de la reserva y el número de personas.",
      "La preferencia de mesa y el tipo de boisson.",
    ],
    answer: 1,
  },
  {
    audio: "Quel est le plat du jour ? Et qu'est-ce qui est compris dans le menu ?",
    question: "¿Para qué se usan estas dos preguntas?",
    options: [
      "Para preguntar el precio y pedir la cuenta.",
      "Para saber qué se recomienda ese día y qué incluye el precio fijo.",
      "Para cancelar la reserva y pedir otra mesa.",
    ],
    answer: 1,
  },
  {
    audio: "Vous pouvez m'apporter du pain et de l'eau plate, s'il vous plaît ?",
    question: "¿Qué estructura usa el cliente para pedir algo durante la comida?",
    options: [
      "Comme + nombre del producto.",
      "Il reste + artículo + nombre.",
      "Vous pouvez m'apporter + artículo + nombre.",
    ],
    answer: 2,
  },
];

export const day5ClesSpeakingItems = [
  {
    situation: "Antoine te pregunta 'Vous prenez le menu ou la carte ?' Responde que tomas el menú y pide los tres platos usando COMME.",
    expected: "Je prends le menu. Comme entrée, la salade. Comme plat principal, le poulet. Comme dessert, la tarte.",
  },
  {
    situation: "Antoine te pregunta si prefieres la terraza o el interior. Usa JE PRÉFÈRE A À B.",
    expected: "Je préfère la terrasse à l'intérieur, s'il vous plaît.",
  },
  {
    situation: "Llegas con reserva. Di tu nombre y el número de personas usando AU NOM DE.",
    expected: "J'ai une réservation au nom de García, pour deux personnes.",
  },
  {
    situation: "Quieres saber qué es el plato del día. Formula la pregunta correcta al serveur.",
    expected: "Quel est le plat du jour ?",
  },
  {
    situation: "Durante la comida necesitas pan y quieres saber qué incluye el menú. Haz las dos preguntas.",
    expected: "Vous pouvez m'apporter du pain ? Et qu'est-ce qui est compris dans le menu ?",
  },
];

export const day5ClesWritingItems = [
  {
    prompt: "Construye el pedido completo de una cena usando COMME para los tres cursos.",
    answer: "Comme entrée, je prends la soupe. Comme plat principal, du poisson avec des légumes. Comme dessert, le plateau de fromages.",
  },
  {
    prompt: "Expresa dos preferencias con JE PRÉFÈRE A À B: (a) poisson vs viande / (b) terrasse vs intérieur.",
    answer: "(a) Je préfère le poisson à la viande. / (b) Je préfère la terrasse à l'intérieur.",
  },
  {
    prompt: "Escribe la frase completa para presentarte con tu reserva al llegar: nombre García, 2 personas.",
    answer: "J'ai une réservation au nom de García, pour deux personnes.",
  },
  {
    prompt: "Corrige: « Je veux savoir le plat aujourd'hui. » (Usa la pregunta elegante del día.)",
    answer: "Quel est le plat du jour ?",
  },
  {
    prompt: "Ordena: [ je voudrais / Comme plat principal / le poulet / avec des légumes / , ]",
    answer: "Comme plat principal, je voudrais le poulet avec des légumes.",
  },
];
