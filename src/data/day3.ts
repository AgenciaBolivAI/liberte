// Day 3 — La Boulangerie Liberté. Vocab list, video sources, flashcards, roleplay.

export const day3Videos = {
  intro: "https://www.youtube.com/embed/3ZZwP5411tM",
  vocab: "https://www.youtube.com/embed/lEMmJk8ajgY",
  grammar: "https://www.youtube.com/embed/kq6bgwNcTNk",
};

export type Vocab3 = { fr: string; es: string; example: string; emoji: string };

export const day3Vocabulary: Vocab3[] = [
  { fr: "une baguette", es: "una baguette", example: "Je voudrais une baguette bien cuite, s'il vous plaît.", emoji: "🥖" },
  { fr: "du pain", es: "pan", example: "Vous avez du pain frais ?", emoji: "🍞" },
  { fr: "du pain complet", es: "pan integral", example: "Je prends du pain complet, s'il vous plaît.", emoji: "🌾" },
  { fr: "du pain de campagne", es: "pan rústico / de campo", example: "Vous avez du pain de campagne frais ?", emoji: "🥯" },
  { fr: "une brioche", es: "una brioche", example: "Je voudrais une petite brioche — elle est fraîche ?", emoji: "🍥" },
  { fr: "une boulangerie", es: "una panadería", example: "La boulangerie est le coeur du quartier.", emoji: "🏪" },
  { fr: "le boulanger", es: "el panadero", example: "Le boulanger prépare le pain depuis cinq heures du matin.", emoji: "👨‍🍳" },
  { fr: "une viennoiserie", es: "bollería (croissants, etc.)", example: "Quelle belle vitrine de viennoiseries !", emoji: "🥐" },
  { fr: "le plateau", es: "la bandeja", example: "Sophie pose le pain sur le plateau.", emoji: "🍽️" },
  { fr: "croustillant(e)", es: "crujiente", example: "C'est croustillant ou moelleux ?", emoji: "✨" },
  { fr: "moelleux", es: "esponjoso / suave", example: "La brioche est vraiment moelleuse !", emoji: "☁️" },
  { fr: "frais / fraîche", es: "fresco / recién hecho", example: "Le pain est frais ? Il sort du four ?", emoji: "🌿" },
  { fr: "chaud", es: "caliente", example: "Le pain sort du four — il est encore chaud.", emoji: "🔥" },
  { fr: "bien cuit", es: "bien cocido", example: "Je voudrais une baguette bien cuite.", emoji: "🍞" },
  { fr: "doré", es: "dorado", example: "Regardez cette baguette — bien dorée, parfaite !", emoji: "🟡" },
  { fr: "une tranche", es: "una rebanada", example: "Je voudrais deux tranches de pain de campagne.", emoji: "🍞" },
  { fr: "tranché", es: "rebanado", example: "Je prends un demi-pain, tranché, s'il vous plaît.", emoji: "🔪" },
  { fr: "entier", es: "entero", example: "Je voudrais la baguette entière.", emoji: "🥖" },
  { fr: "un demi", es: "una mitad", example: "Un demi-pain, c'est parfait pour moi.", emoji: "½" },
  { fr: "un paquet", es: "un paquete", example: "Je prends un paquet de biscuits.", emoji: "📦" },
  { fr: "un sachet", es: "una bolsita", example: "Un sachet de graines, s'il vous plaît.", emoji: "🛍️" },
  { fr: "un quart", es: "un cuarto", example: "Un quart de baguette — juste un peu.", emoji: "¼" },
  { fr: "le prix", es: "el precio", example: "Quel est le prix de la brioche ?", emoji: "🏷️" },
  { fr: "combien coûte", es: "¿cuánto cuesta?", example: "Combien coûte le pain de campagne ?", emoji: "❓" },
  { fr: "la monnaie", es: "el cambio / la moneda", example: "Vous pouvez me rendre la monnaie ?", emoji: "💶" },
  { fr: "emporter", es: "llevar / para llevar", example: "Je vais emporter, s'il vous plaît.", emoji: "🛒" },
  { fr: "une commande", es: "un pedido", example: "J'ai une commande — une baguette et une brioche.", emoji: "📝" },
  { fr: "C'est tout ?", es: "¿Es todo?", example: "C'est tout ? — Oui, merci, c'est tout.", emoji: "✅" },
  { fr: "Autre chose ?", es: "¿Algo más?", example: "Autre chose ? — Non, c'est parfait, merci.", emoji: "➕" },
  { fr: "le ticket de caisse", es: "el ticket de caja", example: "Je peux avoir le ticket de caisse, s'il vous plaît ?", emoji: "🧾" },
];

export const day3AnchorPhrases = [
  { fr: "Je voudrais une baguette bien cuite, s'il vous plaît.", es: "Quisiera una baguette bien cocida, por favor." },
  { fr: "Vous avez du pain de campagne frais ?", es: "¿Tiene pan de campo fresco?" },
  { fr: "Je prends un demi-pain, tranché.", es: "Me llevo medio pan, rebanado." },
  { fr: "Combien coûte la brioche ?", es: "¿Cuánto cuesta la brioche?" },
  { fr: "C'est croustillant ou moelleux ?", es: "¿Es crujiente o esponjoso?" },
  { fr: "Je vais emporter, s'il vous plaît.", es: "Me lo llevo, por favor." },
  { fr: "C'est tout, merci ! Je peux avoir le ticket de caisse ?", es: "¡Es todo, gracias! ¿Puedo tener el ticket de caja?" },
];

export type FlashQuiz3 = { emoji: string; concept: string; options: string[]; answer: number };

export const day3FlashQuiz: FlashQuiz3[] = [
  { emoji: "🥖", concept: "baguette", options: ["une baguette", "du pain", "une brioche"], answer: 0 },
  { emoji: "🍞", concept: "barra de pan genérica", options: ["du pain", "une baguette", "du pain complet"], answer: 0 },
  { emoji: "🌾", concept: "pan integral (con semillas)", options: ["du pain complet", "du pain", "du pain de campagne"], answer: 0 },
  { emoji: "🥯", concept: "pan rústico / de campo", options: ["du pain de campagne", "du pain complet", "une baguette"], answer: 0 },
  { emoji: "🍥", concept: "brioche", options: ["une brioche", "une viennoiserie", "une baguette"], answer: 0 },
  { emoji: "🏪", concept: "fachada de panadería", options: ["une boulangerie", "le boulanger", "le plateau"], answer: 0 },
  { emoji: "👨‍🍳", concept: "panadero con delantal", options: ["le boulanger", "une boulangerie", "le plateau"], answer: 0 },
  { emoji: "🥐", concept: "croissant / bollería", options: ["une viennoiserie", "une brioche", "une baguette"], answer: 0 },
  { emoji: "🍽️", concept: "bandeja de madera", options: ["le plateau", "le boulanger", "une boulangerie"], answer: 0 },
  { emoji: "🍞", concept: "rebanada de pan", options: ["une tranche", "un quart", "un demi"], answer: 0 },
  { emoji: "📦", concept: "paquete / bolsa cerrada", options: ["un paquet", "un sachet", "un quart"], answer: 0 },
  { emoji: "🛍️", concept: "bolsita pequeña", options: ["un sachet", "un paquet", "une tranche"], answer: 0 },
  { emoji: "¼", concept: "un cuarto de baguette", options: ["un quart", "un demi", "une tranche"], answer: 0 },
  { emoji: "💶", concept: "monedas / cambio", options: ["la monnaie", "le prix", "le ticket de caisse"], answer: 0 },
  { emoji: "🧾", concept: "ticket / recibo", options: ["le ticket de caisse", "la monnaie", "le prix"], answer: 0 },
];

export const day3DefiSteps = [
  {
    serveur: "Bonjour ! Quelle belle matinée ! Le pain sort du four à l'instant — vous avez de la chance !",
    hint: "Saluda a Sophie y comenta el aroma del pan recién horneado.",
    example: "Bonjour Sophie ! Ça sent très bon ici — le pain est encore chaud !",
  },
  {
    serveur: "Alors, qu'est-ce que je vous sers aujourd'hui ?",
    hint: "Pide una baguette especificando cocción (bien cuite) y forma (entière/demi/tranché).",
    example: "Je voudrais une baguette entière, bien cuite, s'il vous plaît.",
  },
  {
    serveur: "Parfait ! Et avec ça ?",
    hint: "Pregunta por el pain de campagne — su textura (croustillant/moelleux) y frescura.",
    example: "Vous avez du pain de campagne frais ? C'est croustillant ou moelleux ?",
  },
  {
    serveur: "Oui, tout frais ! La croûte est croustillante, la mie est moelleuse.",
    hint: "Pregunta el precio con « Combien coûte… ».",
    example: "Combien coûte le pain de campagne ?",
  },
  {
    serveur: "Deux euros cinquante le pain entier.",
    hint: "Decide la cantidad y la forma (entier / demi / tranché).",
    example: "Je prends un demi-pain, tranché, s'il vous plaît.",
  },
  {
    serveur: "Très bien ! Regardez ces brioches — elles sont sorties du four il y a 10 minutes.",
    hint: "Descubre las brioches, pregunta el precio y compra una.",
    example: "Combien coûtent les brioches ? J'en prends une, s'il vous plaît.",
  },
  {
    serveur: "Autre chose avec ça ?",
    hint: "Cierra la compra: « C'est tout » + « emporter ».",
    example: "Non, c'est tout, merci. Je vais emporter.",
  },
  {
    serveur: "Ça fait 4 euros 20, s'il vous plaît.",
    hint: "Paga, pide el ticket de caisse y despídete.",
    example: "Voilà. Je peux avoir le ticket de caisse, s'il vous plaît ? Merci, bonne journée !",
  },
];

export const day3GrammarStructures = [
  { formula: "JE VOUDRAIS + cantidad + nombre + adjetivo", use: "Pedir con precisión: cantidad, producto y cómo se quiere." },
  { formula: "Adjetivos de textura (concordancia)", use: "croustillant/e · frais/fraîche · moelleux (invariable) · bien cuit/e." },
  { formula: "COMBIEN COÛTE / COMBIEN COÛTENT", use: "Preguntar el precio — singular: coûte · plural: coûtent." },
  { formula: "Cierre de compra", use: "C'est tout · Autre chose · emporter · ticket de caisse — cerrar como un parisino." },
];
