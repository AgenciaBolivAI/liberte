// Day 10 — Taxi & ville à pied. Verbe prendre + questions pratiques de ville.

export const day10Videos = {
  gym: "https://www.youtube.com/embed/AdJPOTR-CdU",
  intro: "https://www.youtube.com/embed/fycmcse3m3k",
  vocab: "https://www.youtube.com/embed/c4uIlcrd7Ys",
  grammar: "https://www.youtube.com/embed/Y668Yh83_jM",
};

export type Vocab10 = { fr: string; es: string; example: string; emoji: string };

export const day10Vocabulary: Vocab10[] = [
  { fr: "un taxi", es: "un taxi", example: "Je vais prendre un taxi — c'est trop loin.", emoji: "🚕" },
  { fr: "un chauffeur", es: "un conductor", example: "Le chauffeur est très sympathique.", emoji: "🧑‍✈️" },
  { fr: "une destination", es: "un destino", example: "Quelle est votre destination ?", emoji: "📍" },
  { fr: "un trajet", es: "un trayecto", example: "Le trajet dure environ 20 minutes.", emoji: "🛣️" },
  { fr: "la durée", es: "la duración", example: "Quelle est la durée du trajet ?", emoji: "⏱️" },
  { fr: "le tarif", es: "la tarifa", example: "Quel est le tarif pour l'aéroport ?", emoji: "💶" },
  { fr: "réserver", es: "reservar", example: "Je peux réserver un taxi en ligne ?", emoji: "📱" },
  { fr: "descendre", es: "bajar", example: "Je descends ici, s'il vous plaît.", emoji: "⬇️" },
  { fr: "monter", es: "subir", example: "Montez, je vous emmène.", emoji: "⬆️" },
  { fr: "s'arrêter", es: "detenerse", example: "Arrêtez-vous ici, s'il vous plaît.", emoji: "🛑" },
  { fr: "marcher", es: "caminar", example: "Je préfère marcher — c'est plus rapide.", emoji: "🚶" },
  { fr: "le trottoir", es: "la acera", example: "Restez sur le trottoir.", emoji: "🛤️" },
  { fr: "un passage clouté", es: "un paso de cebra", example: "Traversez au passage clouté.", emoji: "🦓" },
  { fr: "un feu rouge / vert", es: "un semáforo", example: "Attendez le feu vert.", emoji: "🚦" },
  { fr: "un carrefour", es: "un cruce", example: "Tournez à gauche au carrefour.", emoji: "🛣️" },
  { fr: "une rue", es: "una calle", example: "C'est dans la rue de Rivoli.", emoji: "🏙️" },
  { fr: "une avenue", es: "una avenida", example: "L'hôtel est sur l'avenue des Champs-Élysées.", emoji: "🌳" },
  { fr: "un boulevard", es: "un bulevar", example: "Prenez le boulevard Haussmann.", emoji: "🏛️" },
  { fr: "Excusez-moi…", es: "Disculpe…", example: "Excusez-moi, je cherche la gare.", emoji: "🙋" },
  { fr: "Pour aller à…", es: "Para ir a…", example: "Pour aller à la gare, s'il vous plaît ?", emoji: "➡️" },
  { fr: "C'est loin ?", es: "¿Está lejos?", example: "C'est loin d'ici ?", emoji: "❓" },
  { fr: "C'est proche.", es: "Está cerca.", example: "Non, c'est très proche — 5 minutes à pied.", emoji: "📏" },
  { fr: "Je dois changer ?", es: "¿Debo cambiar?", example: "Je dois changer de ligne ou c'est direct ?", emoji: "🔁" },
  { fr: "Où est la sortie ?", es: "¿Dónde está la salida?", example: "Où est la sortie du métro ?", emoji: "🚪" },
  { fr: "Prenez la ligne…", es: "Tome la línea…", example: "Prenez la ligne 1 jusqu'à la Défense.", emoji: "🚇" },
  { fr: "en voiture", es: "en coche", example: "Je préfère aller en voiture.", emoji: "🚗" },
  { fr: "par le train", es: "en tren (formal)", example: "Le meilleur c'est d'y aller par le train.", emoji: "🚆" },
  { fr: "un compteur", es: "un taxímetro", example: "Regardez le compteur — c'est 12 euros.", emoji: "🧮" },
  { fr: "un piéton", es: "un peatón", example: "Les piétons ont la priorité ici.", emoji: "🚶‍♀️" },
  { fr: "un tunnel", es: "un túnel", example: "On passe par un tunnel sous la Seine.", emoji: "🕳️" },
];

export type FlashQuiz10 = { emoji: string; concept: string; options: string[]; answer: number };

export const day10FlashQuiz: FlashQuiz10[] = [
  { emoji: "🚕", concept: "'Voy a tomar un taxi'", options: ["Je prends en taxi", "Je prends le taxi", "Je prends à taxi"], answer: 1 },
  { emoji: "🚇", concept: "'Tomo el metro'", options: ["Je prends en métro", "Je prends le métro", "Je prends par métro"], answer: 1 },
  { emoji: "🚶", concept: "'A 10 minutos a pie'", options: ["à 10 minutes en pied", "à 10 minutes à pied", "à 10 minutes par pied"], answer: 1 },
  { emoji: "❓", concept: "'¿Está lejos de aquí?'", options: ["C'est proche d'ici ?", "C'est loin d'ici ?", "C'est où d'ici ?"], answer: 1 },
  { emoji: "🛑", concept: "'Deténgase aquí, por favor'", options: ["Descendez ici, s'il vous plaît", "Arrêtez-vous ici, s'il vous plaît", "Montez ici, s'il vous plaît"], answer: 1 },
  { emoji: "💶", concept: "'la tarifa'", options: ["le trajet", "le tarif", "le compteur"], answer: 1 },
  { emoji: "🧮", concept: "'el taxímetro'", options: ["le trajet", "le compteur", "le tarif"], answer: 1 },
  { emoji: "🦓", concept: "'un paso de cebra'", options: ["un carrefour", "un passage clouté", "un boulevard"], answer: 1 },
  { emoji: "🚦", concept: "'esperar el semáforo verde'", options: ["attendre le feu rouge", "attendre le feu vert", "attendre le trottoir"], answer: 1 },
  { emoji: "🛣️", concept: "'un trayecto'", options: ["une durée", "un trajet", "un tarif"], answer: 1 },
  { emoji: "➡️", concept: "'Para ir a la estación'", options: ["Pour aller à la gare", "Pour arriver la gare", "À aller la gare"], answer: 0 },
  { emoji: "🚗", concept: "'en coche'", options: ["à voiture", "en voiture", "par voiture"], answer: 1 },
];

// Défi entregable — Taxi (día par 10)
export const day10DefiSteps = [
  {
    serveur: "Bonjour ! Montez, s'il vous plaît. Quelle est votre destination ?",
    hint: "Da tu destino usando « Je voudrais aller à… ».",
    example: "Bonjour ! Je voudrais aller à la gare du Nord, s'il vous plaît.",
  },
  {
    serveur: "Très bien. On y va.",
    hint: "Pregunta la duración del trayecto.",
    example: "Quelle est la durée du trajet, s'il vous plaît ?",
  },
  {
    serveur: "Environ 20 minutes selon le trafic.",
    hint: "Pregunta el tarif o precio aproximado.",
    example: "Et quel est le tarif approximatif ?",
  },
  {
    serveur: "Entre 15 et 20 euros. Regardez le compteur.",
    hint: "Pide bajarte al llegar con « Arrêtez-vous ici ».",
    example: "Parfait. Arrêtez-vous ici, s'il vous plaît.",
  },
  {
    serveur: "Voilà, ça fait 17 euros. Bonne journée !",
    hint: "Paga y despídete con cortesía.",
    example: "Merci beaucoup. Voici 20 euros. Bonne journée !",
  },
];

// Grammar structures — Day 10 (Prendre + transport + questions pratiques)
export const day10GrammarStructures = [
  { formula: "PRENDRE + LE/LA/L' + TRANSPORT", use: "Je prends le métro · le bus · le taxi · le train · l'avion." },
  { formula: "⚠️ ERREUR À ÉVITER", use: "« Je prends en bus » ❌ → « Je prends le bus » ✓." },
  { formula: "POUR ALLER À… ?", use: "Pregunta clave para pedir indicaciones : Pour aller à la gare, s'il vous plaît ?" },
  { formula: "C'EST LOIN ? / C'EST À COMBIEN DE MINUTES ?", use: "Pregunta la distancia o el tiempo : C'est loin ? · C'est à 10 minutes à pied." },
];
