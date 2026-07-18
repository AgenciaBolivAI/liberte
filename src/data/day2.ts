// Day 2 — Le Café (retour). Vocab list, video sources, flashcards, roleplay.

export const day2Videos = {
  intro: "https://www.youtube.com/embed/5CB2CDp5jyQ",
  vocab: "https://www.youtube.com/embed/dXwp3l-A0sA",
  grammar: "https://www.youtube.com/embed/j1M9IpH7I4E",
  bonus: "https://www.youtube.com/embed/85JLiLWPujo",
};

export type Vocab2 = { fr: string; es: string; example: string; emoji: string };

export const day2Vocabulary: Vocab2[] = [
  { fr: "un expresso", es: "un espresso", example: "Je voudrais un expresso, s'il vous plaît.", emoji: "☕" },
  { fr: "un cappuccino", es: "un capuchino", example: "Je prends un cappuccino avec du lait chaud.", emoji: "🥛" },
  { fr: "décaféiné", es: "descafeinado", example: "Je préfère un café décaféiné le soir.", emoji: "🌙" },
  { fr: "fort / léger", es: "fuerte / suave", example: "Pas trop fort — je préfère un café léger.", emoji: "💪" },
  { fr: "grand / petit", es: "grande / pequeño", example: "Un grand cappuccino, s'il vous plaît.", emoji: "📏" },
  { fr: "une bouteille", es: "una botella", example: "Une bouteille d'eau gazeuse, s'il vous plaît.", emoji: "🍾" },
  { fr: "de la glace", es: "hielo", example: "Je voudrais de la glace avec mon eau.", emoji: "🧊" },
  { fr: "une paille", es: "una pajita", example: "Est-ce que je peux avoir une paille ?", emoji: "🥤" },
  { fr: "un croissant", es: "un croissant", example: "Je vais essayer le croissant du jour.", emoji: "🥐" },
  { fr: "un pain au chocolat", es: "un pain au chocolat", example: "C'est fait maison, le pain au chocolat ?", emoji: "🍫" },
  { fr: "une tarte", es: "una tarta", example: "Je voudrais une part de tarte aux pommes.", emoji: "🥧" },
  { fr: "un gâteau", es: "un pastel", example: "Qu'est-ce que vous recommandez comme gâteau ?", emoji: "🍰" },
  { fr: "une part", es: "una porción", example: "Je vais essayer une part de gâteau, merci.", emoji: "🍽️" },
  { fr: "fait maison", es: "casero/a", example: "C'est fait maison ? C'est excellent !", emoji: "🏠" },
  { fr: "du jour", es: "del día", example: "C'est la spécialité du jour ?", emoji: "📅" },
  { fr: "la spécialité", es: "la especialidad", example: "Quelle est la spécialité du café ?", emoji: "⭐" },
  { fr: "recommander", es: "recomendar", example: "Qu'est-ce que vous recommandez ?", emoji: "👉" },
  { fr: "essayer", es: "probar", example: "Je vais essayer ça, merci !", emoji: "🧪" },
  { fr: "payer", es: "pagar", example: "Je peux payer maintenant ?", emoji: "💳" },
  { fr: "attendre", es: "esperar", example: "Je dois attendre longtemps ?", emoji: "⏳" },
  { fr: "le service", es: "el servicio", example: "Le service est compris ?", emoji: "🤵" },
  { fr: "le pourboire", es: "la propina", example: "Je laisse un pourboire — c'était délicieux !", emoji: "🪙" },
  { fr: "rendre la monnaie", es: "dar el cambio", example: "Vous pouvez me rendre la monnaie ?", emoji: "💶" },
  { fr: "un reçu", es: "un recibo", example: "Je peux avoir un reçu, s'il vous plaît ?", emoji: "🧾" },
  { fr: "une commande", es: "un pedido", example: "J'ai passé ma commande — merci !", emoji: "📝" },
  { fr: "Bonne journée !", es: "¡Buen día!", example: "Merci beaucoup ! Bonne journée !", emoji: "🌞" },
  { fr: "doux / sucré", es: "dulce / azucarado", example: "C'est sucré ? Je préfère quelque chose de doux.", emoji: "🍬" },
  { fr: "la formule", es: "el menú del día", example: "La formule du jour, c'est combien ?", emoji: "🍱" },
  { fr: "le terminal", es: "el terminal de pago", example: "Je peux utiliser le terminal, s'il vous plaît ?", emoji: "🖥️" },
  { fr: "savoureux", es: "sabroso", example: "C'est savoureux ! Vraiment délicieux.", emoji: "😋" },
];

// 15 flashcards: concept (emoji + Spanish) → 3 French options, one correct.
export type FlashQuiz = { emoji: string; concept: string; options: string[]; answer: number };

export const day2FlashQuiz: FlashQuiz[] = [
  { emoji: "☕", concept: "taza de espresso", options: ["un expresso", "un cappuccino", "une tarte"], answer: 0 },
  { emoji: "🥛", concept: "cappuccino con espuma", options: ["un cappuccino", "un expresso", "un croissant"], answer: 0 },
  { emoji: "🍾", concept: "botella de agua", options: ["une bouteille", "de la glace", "un reçu"], answer: 0 },
  { emoji: "🧊", concept: "cubitos de hielo", options: ["de la glace", "une paille", "le pourboire"], answer: 0 },
  { emoji: "🥤", concept: "pajita", options: ["une paille", "une bouteille", "un gâteau"], answer: 0 },
  { emoji: "🥐", concept: "croissant", options: ["un croissant", "un pain au chocolat", "une tarte"], answer: 0 },
  { emoji: "🍫", concept: "pain au chocolat", options: ["un pain au chocolat", "un croissant", "une part"], answer: 0 },
  { emoji: "🥧", concept: "tarta", options: ["une tarte", "un gâteau", "une part"], answer: 0 },
  { emoji: "🍰", concept: "pastel", options: ["un gâteau", "une tarte", "un croissant"], answer: 0 },
  { emoji: "🍽️", concept: "porción de pastel en un plato", options: ["une part", "un gâteau", "une tarte"], answer: 0 },
  { emoji: "🧾", concept: "recibo / ticket", options: ["un reçu", "une commande", "le terminal"], answer: 0 },
  { emoji: "📝", concept: "comanda / pedido en libreta", options: ["une commande", "un reçu", "le pourboire"], answer: 0 },
  { emoji: "🪙", concept: "moneda / propina", options: ["le pourboire", "le terminal", "un reçu"], answer: 0 },
  { emoji: "🖥️", concept: "datáfono / terminal de pago", options: ["le terminal", "le pourboire", "une commande"], answer: 0 },
  { emoji: "🍱", concept: "menú del día", options: ["la formule", "la spécialité", "du jour"], answer: 0 },
];

// Défi final — 8 momentos del roleplay con Marie (referencia visual)
export const day2DefiSteps = [
  {
    serveur: "Ah, bonjour ! Vous êtes de retour ! Votre table habituelle ?",
    hint: "Saluda a Marie con calidez y reconoce que ya es tu segundo día.",
    example: "Bonjour Marie ! Oui, avec plaisir. Merci de vous souvenir de moi !",
  },
  {
    serveur: "Alors, un café comme hier ?",
    hint: "Pide tu café indicando fort/léger y grand/petit.",
    example: "Je voudrais un grand café léger, s'il vous plaît.",
  },
  {
    serveur: "Et pour manger, quelque chose avec ?",
    hint: "Usa la estructura exacta del día para pedir una recomendación.",
    example: "Qu'est-ce que vous recommandez comme gâteau ?",
  },
  {
    serveur: "La tarte aux pommes du jour, elle est excellente !",
    hint: "Pregunta si es fait maison.",
    example: "C'est fait maison, la tarte ?",
  },
  {
    serveur: "Oui, tout est fait maison ici.",
    hint: "Decide probarla usando « Je vais essayer… ».",
    example: "Alors je vais essayer une part de tarte, s'il vous plaît.",
  },
  {
    serveur: "Voilà, madame. Bon appétit !",
    hint: "Comenta el sabor con « C'est + adjectif » (délicieux, savoureux, léger…).",
    example: "C'est délicieux ! C'est vraiment savoureux et léger.",
  },
  {
    serveur: "Content que ça vous plaise !",
    hint: "Pregunta si debes esperar mucho y si el servicio está incluido.",
    example: "Je dois attendre longtemps ? Et le service est compris ?",
  },
  {
    serveur: "Non, c'est prêt. Ça fait 8 euros 50.",
    hint: "Paga, pide el cambio o un reçu, y despídete con « Bonne journée ! ».",
    example: "Je paye par carte. Je peux avoir un reçu ? Merci ! Bonne journée !",
  },
];

// Grammar structures for Les clés — Day 2
export const day2GrammarStructures = [
  { formula: "JE PRÉFÈRE + sustantivo/adjetivo", use: "Expresar preferencias personales de forma natural y segura." },
  { formula: "QU'EST-CE QUE VOUS RECOMMANDEZ ? (+ comme + sustantivo)", use: "Pedir una recomendación al serveur, siendo específico." },
  { formula: "JE VAIS ESSAYER + sustantivo", use: 'Expresar una decisión inmediata ("voy a probar").' },
  { formula: "C'EST + adjectif", use: "Describir o preguntar sabor, origen o cualidad (fait maison, fort, savoureux…)." },
];
