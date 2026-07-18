// Day 10 — practice items (Vocab + Grammaire) for Taxi & ville à pied.

export { day10Videos, day10Vocabulary, day10FlashQuiz, day10DefiSteps, day10GrammarStructures } from "./day10";

/* ============================================================
   VOCAB — 4 mini-jeux
   ============================================================ */

export const day10VocabReadingTexts = [
  {
    title: "Texte · En taxi à Paris",
    text: `Passager : « Bonjour, je voudrais aller à la gare du Nord, s'il vous plaît. » Chauffeur : « Bonjour ! Montez. Le trajet dure environ 20 minutes selon le trafic. » Passager : « C'est combien, à peu près ? » Chauffeur : « Entre 15 et 20 euros. Regardez le compteur. » Passager : « D'accord. Est-ce qu'on peut passer par les grands boulevards ? » Chauffeur : « Bien sûr. Vous êtes en visite à Paris ? » Passager : « Oui, c'est ma première fois. C'est magnifique ! » Chauffeur : « On arrive. Voilà la gare du Nord. Ça fait 17 euros. »`,
    questions: [
      {
        q: "¿Cuánto dura el trayecto?",
        options: ["Unos 10 minutos.", "Unos 20 minutos.", "Unos 45 minutos."],
        answer: 1,
      },
      {
        q: "¿Cuánto cuesta el taxi al final?",
        options: ["15 euros.", "17 euros.", "20 euros."],
        answer: 1,
      },
      {
        q: "¿Por dónde pide pasar el pasajero?",
        options: ["Por los grandes bulevares.", "Por el túnel.", "Por la autopista."],
        answer: 0,
      },
    ],
  },
];

export const day10VocabListeningMC = [
  {
    audio: "Quelle est votre destination ?",
    question: "¿Qué pregunta el chofer?",
    options: ["Cuál es su destino.", "Cuál es su nombre.", "Cuánto tiempo tiene."],
    answer: 0,
  },
  {
    audio: "Arrêtez-vous ici, s'il vous plaît.",
    question: "¿Qué pide el pasajero?",
    options: ["Que acelere.", "Que se detenga aquí.", "Que dé la vuelta."],
    answer: 1,
  },
  {
    audio: "Le trajet dure environ 20 minutes.",
    question: "¿Cuánto dura el trayecto?",
    options: ["10 minutos.", "20 minutos.", "45 minutos."],
    answer: 1,
  },
  {
    audio: "Regardez le compteur — c'est 12 euros.",
    question: "¿Qué debe mirar el pasajero?",
    options: ["El GPS.", "El taxímetro.", "El reloj."],
    answer: 1,
  },
  {
    audio: "C'est à 5 minutes à pied.",
    question: "¿A qué distancia está?",
    options: ["A 5 minutos en taxi.", "A 5 minutos a pie.", "A 5 minutos en metro."],
    answer: 1,
  },
];

export const day10VocabSpeakingItems = [
  {
    situation: "Pide ir a la Torre Eiffel en taxi con cortesía.",
    expected: "Bonjour, je voudrais aller à la Tour Eiffel, s'il vous plaît.",
  },
  {
    situation: "Pregunta cuánto dura el trayecto.",
    expected: "Quelle est la durée du trajet ?",
  },
  {
    situation: "Pregunta la tarifa aproximada.",
    expected: "Quel est le tarif approximatif ?",
  },
  {
    situation: "Pide al chofer que se detenga aquí.",
    expected: "Arrêtez-vous ici, s'il vous plaît.",
  },
  {
    situation: "Pregunta para ir a la estación con cortesía.",
    expected: "Excusez-moi, pour aller à la gare, s'il vous plaît ?",
  },
];

export const day10VocabWritingItems = [
  {
    prompt: "Traduce: 'Yo tomo el metro cada mañana.'",
    answer: "Je prends le métro chaque matin.",
  },
  {
    prompt: "Completa: « Je prends ______ taxi. »",
    answer: "le",
  },
  {
    prompt: "Traduce: '¿Está lejos de aquí?'",
    answer: "C'est loin d'ici ?",
  },
  {
    prompt: "Traduce: 'Deténgase aquí, por favor.'",
    answer: "Arrêtez-vous ici, s'il vous plaît.",
  },
  {
    prompt: "Corrige: « Je prends en bus. »",
    answer: "Je prends le bus.",
  },
];

/* ============================================================
   GRAMMAIRE — Les clés de la Liberté (Día 10 · Prendre + questions)
   ============================================================ */

export const day10ClesReadingText = {
  title: "Lecture · Verbe prendre + questions pratiques",
  text: `À Paris, Sophie utilise différents moyens de transport selon la situation. Le matin, elle prend le métro pour aller au travail — c'est rapide et pas cher. Le midi, elle marche : « Il fait beau, je préfère aller à pied. » Quand elle est pressée ou qu'il pleut, elle prend un taxi. Elle dit toujours au chauffeur : « Bonjour, je voudrais aller à… , s'il vous plaît. Quelle est la durée du trajet ? » Le week-end, quand elle rend visite à ses parents, elle prend le train — c'est confortable. Pour trouver un lieu qu'elle ne connaît pas, elle demande : « Excusez-moi, pour aller à la gare, s'il vous plaît ? C'est loin d'ici ? » Sa règle d'or : jamais dire « je prends en bus » — toujours « je prends le bus » !`,
  questions: [
    {
      q: "¿Cómo va Sophie al trabajo por la mañana?",
      options: ["Elle prend le taxi.", "Elle prend le métro.", "Elle va à pied."],
      answer: 1,
    },
    {
      q: "¿Cuál es la forma correcta con « prendre »?",
      options: ["Je prends en bus.", "Je prends le bus.", "Je prends à bus."],
      answer: 1,
    },
    {
      q: "¿Qué pregunta clave usa para pedir indicaciones?",
      options: ["« Où est le bus ? »", "« Pour aller à… , s'il vous plaît ? »", "« C'est combien ? »"],
      answer: 1,
    },
  ],
};

export const day10ClesListeningMC = [
  {
    audio: "Je prends le métro chaque matin.",
    question: "¿Qué estructura se usa?",
    options: ["prendre + en + transport", "prendre + le/la/l' + transport", "prendre + à + transport"],
    answer: 1,
  },
  {
    audio: "Pour aller à la gare, s'il vous plaît ?",
    question: "¿Qué pide el hablante?",
    options: ["Indicaciones para ir a la estación.", "El precio del tren.", "La hora de salida."],
    answer: 0,
  },
  {
    audio: "C'est loin d'ici ?",
    question: "¿Qué pregunta?",
    options: ["Si es caro.", "Si está lejos.", "Si es directo."],
    answer: 1,
  },
  {
    audio: "Je prends le taxi.",
    question: "¿Es correcta la frase?",
    options: ["Sí, es correcta.", "No, debería ser « je prends en taxi ».", "No, debería ser « je prends à taxi »."],
    answer: 0,
  },
  {
    audio: "Je prends en bus.",
    question: "Esta frase tiene un error. ¿Cuál?",
    options: [
      "Debería decir « je prends le bus ».",
      "Debería decir « je prends à bus ».",
      "Está correcta.",
    ],
    answer: 0,
  },
];

export const day10ClesSpeakingItems = [
  {
    situation: "Di « Yo tomo el metro cada mañana ».",
    expected: "Je prends le métro chaque matin.",
  },
  {
    situation: "Pregunta « Para ir a la Torre Eiffel, por favor ».",
    expected: "Pour aller à la Tour Eiffel, s'il vous plaît ?",
  },
  {
    situation: "Pregunta si está lejos de aquí.",
    expected: "C'est loin d'ici ?",
  },
  {
    situation: "Di « Tomo el taxi porque llueve ».",
    expected: "Je prends le taxi parce qu'il pleut.",
  },
  {
    situation: "Pregunta « ¿Debo cambiar de línea? ».",
    expected: "Je dois changer de ligne ?",
  },
];

export const day10ClesWritingItems = [
  {
    prompt: "Completa: « Je prends ______ métro. »",
    answer: "le",
  },
  {
    prompt: "Completa: « Je prends ______ taxi. »",
    answer: "le",
  },
  {
    prompt: "Ordena: « aller / pour / la gare / ? »",
    answer: "Pour aller à la gare ?",
  },
  {
    prompt: "Ordena: « loin / c'est / d'ici / ? »",
    answer: "C'est loin d'ici ?",
  },
  {
    prompt: "Corrige: « Je prends en bus. »",
    answer: "Je prends le bus.",
  },
];
