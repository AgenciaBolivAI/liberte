// Day 4 — practice items (Vocab + Grammaire) for La Vitrine des Douceurs.

export {
  day4Videos,
  day4Vocabulary,
  day4AnchorPhrases,
  day4FlashQuiz,
  day4DefiSteps,
  day4GrammarStructures,
} from "./day4";

/* ============================================================
   VOCAB — 4 mini-jeux
   ============================================================ */

export const day4VocabReadingTexts = [
  {
    title: "Texte · Ana devant la vitrine",
    text: `Ana entre dans la boulangerie et regarde la vitrine. Elle voit des macarons colorés, des éclairs au chocolat et une belle tarte au citron. Elle dit : « Ça sent tellement bon ! Ça a l'air délicieux ! » Elle demande à Sophie : « Qu'est-ce que vous recommandez ? » Sophie répond : « Les éclairs sont très populaires — mais il en reste seulement deux. » Ana dit : « Vous pouvez me le faire goûter ? » Sophie lui donne un petit morceau. Ana sourit : « C'est incroyable ! Je vais essayer ça. Et c'est pour offrir — vous pouvez les mettre dans une boîte ? » Sophie répond : « Bien sûr, c'est un cadeau ! »`,
    questions: [
      {
        q: "¿Qué dice Ana cuando entra y huele el pan?",
        options: [
          "Il reste des éclairs ?",
          "Ça sent tellement bon ! Ça a l'air délicieux !",
          "C'est terminé ? Dommage !",
        ],
        answer: 1,
      },
      {
        q: "¿Por qué Sophie dice « il en reste seulement deux » ?",
        options: [
          "Porque los éclairs ya están agotados.",
          "Porque solo quedan dos éclairs disponibles.",
          "Porque los éclairs son los menos populares.",
        ],
        answer: 1,
      },
      {
        q: "¿Para qué quiere Ana la boîte?",
        options: [
          "Para llevar el pan sin que se aplaste.",
          "Para guardar los macarons en la nevera.",
          "Porque es para regalar — quiere una presentación especial.",
        ],
        answer: 2,
      },
    ],
  },
];

export const day4VocabListeningMC = [
  {
    audio: "Ça a l'air délicieux ! C'est quoi, ce gâteau ?",
    question: "¿Qué está expresando la cliente con estas dos frases?",
    options: [
      "Que ya conoce ese pastel y lo quiere comprar.",
      "Que el pastel parece delicioso y pregunta qué es.",
      "Que el pastel huele bien pero no quiere probarlo.",
    ],
    answer: 1,
  },
  {
    audio: "Il reste des éclairs au chocolat ? C'est terminé ?",
    question: "¿Qué está verificando la cliente?",
    options: [
      "Si los éclairs son caseros y cuánto cuestan.",
      "Si todavía quedan éclairs o si ya se agotaron.",
      "Si puede probar un éclair antes de comprar.",
    ],
    answer: 1,
  },
  {
    audio: "C'est pour offrir — vous pouvez le mettre dans une boîte ?",
    question: "¿Qué le pide la cliente a Sophie?",
    options: [
      "Que le deje probar el producto antes de decidir.",
      "Que el producto sea casero y fresco.",
      "Que lo empaque en una caja porque es un regalo.",
    ],
    answer: 2,
  },
  {
    audio: "Vous pouvez me le faire goûter ?",
    question: "¿Qué solicitud educada está haciendo la cliente?",
    options: [
      "Está pidiendo que le regalen el producto.",
      "Está pidiendo permiso para probar el producto antes de comprarlo.",
      "Está pidiendo el precio del producto.",
    ],
    answer: 1,
  },
  {
    audio: "La tarte au citron est disponible aujourd'hui seulement.",
    question: "¿Qué le está informando Sophie?",
    options: [
      "Que la tarta de limón siempre está disponible.",
      "Que la tarta de limón ya está agotada.",
      "Que la tarta de limón solo está disponible hoy — es una oportunidad especial.",
    ],
    answer: 2,
  },
];

export const day4VocabSpeakingItems = [
  {
    situation: "Entras a la boulangerie y el olor te impacta. Reacciona con las dos frases del día.",
    expected: "Ça sent tellement bon ! Ça a l'air délicieux !",
  },
  {
    situation: "Ves unos macarons pero no estás segura si quedan. Pregúntale a Sophie usando « Il reste ».",
    expected: "Il reste des macarons au citron ?",
  },
  {
    situation: "Sophie dice que el éclair au chocolat es muy popular. Pide probarlo antes de decidir.",
    expected: "Vous pouvez me le faire goûter ?",
  },
  {
    situation: "Compras seis macarons pero son un regalo. Pide una boîte.",
    expected: "C'est pour offrir — vous pouvez les mettre dans une boîte ?",
  },
  {
    situation: "Sophie te dice que la tarte au citron se agotó. Reacciona.",
    expected: "C'est terminé ? Dommage !",
  },
];

export const day4VocabWritingItems = [
  {
    prompt: "Completa: « ______ tellement bon ici ! ______ l'air délicieux ! »",
    answer: "Ça sent / Ça a",
  },
  { prompt: "Traduce: '¿Quedan éclairs de café?'", answer: "Il reste des éclairs au café ?" },
  {
    prompt: "Transforma en regalo: « Je voudrais six macarons. » Añade que es para regalar y quieres una caja.",
    answer: "Je voudrais six macarons — c'est pour offrir. Vous pouvez les mettre dans une boîte ?",
  },
  {
    prompt: "Corrige: « C'est finit ? Dommage ! » (adjetivo correcto para « agotado » en la boulangerie).",
    answer: "C'est terminé ? Dommage !",
  },
  {
    prompt: "Ordena: [ goûter / me le / Vous pouvez / ? / faire ]",
    answer: "Vous pouvez me le faire goûter ?",
  },
];

/* ============================================================
   GRAMMAIRE — Les clés de la Liberté (Día 4)
   ============================================================ */

export const day4ClesReadingText = {
  title: "Lecture · Isabelle devant la vitrine",
  text: `Isabelle entre dans la boulangerie. Elle regarde la vitrine et dit : « Oh ! Ça a l'air vraiment délicieux, ce mille-feuille ! » Sophie sourit : « Merci ! Il est très populaire. » Isabelle demande : « Il reste des éclairs au café ? » Sophie vérifie : « Non, désolée — c'est terminé pour les éclairs au café. Mais il reste des éclairs au chocolat ! » Isabelle dit : « Ça a l'air bon aussi. Vous pouvez me le faire goûter ? » Sophie lui donne un morceau. Isabelle : « C'est incroyable ! J'en prends deux. Et j'ai aussi besoin d'un cadeau pour mon amie — c'est pour offrir. Vous pouvez mettre les éclairs dans une boîte ? » Sophie : « Bien sûr ! Un joli cadeau parisien ! »`,
  questions: [
    {
      q: "Isabelle dice « Ça a l'air vraiment délicieux, ce mille-feuille ! ». ¿Por qué « délicieux » (masculino) ?",
      options: [
        "Con « ça a l'air » el adjetivo siempre va en masculino singular, sea cual sea el objeto.",
        "« Mille-feuille » siempre es masculino, por eso « délicieux ».",
        "Es un error — debería ser « délicieuse ».",
      ],
      answer: 0,
    },
    {
      q: "Sophie dice « C'est terminé pour les éclairs au café ». ¿Qué significa?",
      options: [
        "Que los éclairs de café no son populares.",
        "Que los éclairs de café ya se agotaron.",
        "Que los éclairs de café están disponibles solo los lunes.",
      ],
      answer: 1,
    },
    {
      q: "¿Qué logra Isabelle al decir « C'est pour offrir » ?",
      options: [
        "Consigue un descuento por comprar varios éclairs.",
        "Le indica a Sophie que quiere probar antes de comprar.",
        "Le indica a Sophie que es un regalo y quiere presentación especial.",
      ],
      answer: 2,
    },
  ],
};

export const day4ClesListeningMC = [
  {
    audio: "Ça a l'air délicieux, cette tarte ! Et ça a l'air frais aussi.",
    question: "El adjetivo es « délicieux » aunque « tarte » sea femenino. ¿Por qué?",
    options: [
      "Con « ça a l'air », el adjetivo es siempre masculino singular — regla fija.",
      "« Tarte » es masculino en francés.",
      "Es un error — debería ser « délicieuse ».",
    ],
    answer: 0,
  },
  {
    audio: "Il reste des macarons au chocolat ? — Non, c'est terminé !",
    question: "¿Qué estructuras usan cliente y boulangère?",
    options: [
      "« Je voudrais » para pedir y « non merci » para rechazar.",
      "« Il reste » para preguntar si queda; « c'est terminé » para confirmar que se agotó.",
      "« Combien coûte » para precio y « disponible » para confirmar.",
    ],
    answer: 1,
  },
  {
    audio: "C'est pour offrir — vous pouvez le mettre dans une boîte avec un ruban ?",
    question: "¿Qué dos elementos de presentación pide?",
    options: [
      "Une boîte y un ruban.",
      "Un cadeau y du papier.",
      "Une vitrine y un présentoir.",
    ],
    answer: 0,
  },
  {
    audio: "Vous pouvez me le faire goûter ? Je vais essayer ça !",
    question: "¿Cuál es la diferencia entre las dos expresiones?",
    options: [
      "Son sinónimas — significan lo mismo.",
      "« Vous pouvez me le faire goûter » = petición educada para probar; « Je vais essayer ça » = decisión de comprar después de probar.",
      "« Je vais essayer ça » es para preguntar el precio.",
    ],
    answer: 1,
  },
  {
    audio: "Il reste combien de macarons au citron ?",
    question: "¿Qué variante de « Il reste » usa el cliente?",
    options: [
      "Pregunta sí/no si quedan macarons de limón.",
      "Pregunta cuántos macarons de limón quedan — « combien » + il reste.",
      "Dice que ya no quedan macarons de limón.",
    ],
    answer: 1,
  },
];

export const day4ClesSpeakingItems = [
  {
    situation: "Ves un mille-feuille increíble en la vitrina. Exprésalo con ÇA A L'AIR + adjectif.",
    expected: "Ça a l'air délicieux, ce mille-feuille !",
  },
  {
    situation: "Pregunta si aún quedan tartas de manzana usando IL RESTE.",
    expected: "Il reste des tartes aux pommes ?",
  },
  {
    situation: "Sophie te dice que los chaussons aux pommes se agotaron. Reacciona.",
    expected: "C'est terminé ? Dommage !",
  },
  {
    situation: "Antes de comprar el éclair, pide probarlo de forma educada.",
    expected: "Vous pouvez me le faire goûter ?",
  },
  {
    situation: "Compras seis macarons para regalar — pide caja y cinta.",
    expected: "C'est pour offrir — vous pouvez les mettre dans une boîte avec un ruban ?",
  },
];

export const day4ClesWritingItems = [
  {
    prompt: "Mira una tarte au citron. Escribe una frase con ÇA A L'AIR + dos adjetivos.",
    answer: "Ça a l'air délicieux et frais, cette tarte au citron !",
  },
  {
    prompt: "Escribe dos versiones con IL RESTE: (a) ¿Quedan éclairs de chocolate? (b) ¿Cuántos macarons quedan?",
    answer: "(a) Il reste des éclairs au chocolat ? / (b) Il reste combien de macarons ?",
  },
  {
    prompt: "Construye: 6 macarons como regalo + boîte + ruban.",
    answer: "C'est pour offrir — je voudrais six macarons dans une boîte avec un ruban.",
  },
  {
    prompt: "Corrige: « Je veux tester le macaron avant d'acheter. » (Usa la estructura más educada del día.)",
    answer: "Vous pouvez me le faire goûter ?",
  },
  {
    prompt: "Ordena: [ Il reste / ? / des chaussons / — Non, / c'est terminé. / Dommage ! ]",
    answer: "Il reste des chaussons ? — Non, c'est terminé. Dommage !",
  },
];
