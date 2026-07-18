// Day 8 — Faire les courses (compra semanal completa). Devoir + infinitif.

export const day8Videos = {
  gym: "https://www.youtube.com/embed/AdJPOTR-CdU",
  intro: "https://www.youtube.com/embed/qBsZ3jlktfc",
  vocab: "https://www.youtube.com/embed/97T8e4slxr4",
  grammar: "https://www.youtube.com/embed/qBsZ3jlktfc",
};

export type Vocab8 = { fr: string; es: string; example: string; emoji: string };

export const day8Vocabulary: Vocab8[] = [
  { fr: "de la lessive", es: "detergente", example: "Je dois acheter de la lessive.", emoji: "🧺" },
  { fr: "du dentifrice", es: "pasta de dientes", example: "Il n'y a plus de dentifrice.", emoji: "🦷" },
  { fr: "du jambon", es: "jamón", example: "Je prends 200g de jambon.", emoji: "🥓" },
  { fr: "un yaourt", es: "un yogur", example: "Je voudrais des yaourts nature.", emoji: "🥛" },
  { fr: "de la crème", es: "nata / crema", example: "J'ai besoin de crème fraîche.", emoji: "🥛" },
  { fr: "des œufs", es: "huevos", example: "Une boîte de 6 œufs, s'il vous plaît.", emoji: "🥚" },
  { fr: "de la farine", es: "harina", example: "Je dois acheter de la farine pour la recette.", emoji: "🌾" },
  { fr: "de la moutarde", es: "mostaza", example: "Vous avez de la moutarde de Dijon ?", emoji: "🟡" },
  { fr: "du sel", es: "sal", example: "Je n'ai plus de sel à la maison.", emoji: "🧂" },
  { fr: "de l'huile", es: "aceite", example: "De l'huile d'olive, s'il vous plaît.", emoji: "🫒" },
  { fr: "du vinaigre", es: "vinagre", example: "Du vinaigre balsamique, c'est au rayon condiments.", emoji: "🧴" },
  { fr: "des biscuits", es: "galletas", example: "Je dois acheter des biscuits pour le goûter.", emoji: "🍪" },
  { fr: "des lentilles", es: "lentejas", example: "Des lentilles vertes, c'est très bon.", emoji: "🫘" },
  { fr: "des céréales", es: "cereales", example: "Je prends des céréales sans sucre.", emoji: "🥣" },
  { fr: "des fruits", es: "frutas", example: "Je dois acheter des fruits frais.", emoji: "🍎" },
  { fr: "des fruits secs", es: "frutos secos", example: "Des noix et des amandes, s'il vous plaît.", emoji: "🥜" },
  { fr: "de la dinde", es: "pavo", example: "Je voudrais de la dinde pour ce soir.", emoji: "🦃" },
  { fr: "des crevettes", es: "camarones / gambas", example: "Des crevettes fraîches, vous en avez ?", emoji: "🦐" },
  { fr: "de la charcuterie", es: "embutidos / fiambres", example: "Un peu de charcuterie variée, s'il vous plaît.", emoji: "🥩" },
  { fr: "un pack d'eau", es: "un pack de agua", example: "Je dois prendre un pack d'eau.", emoji: "💧" },
  { fr: "de l'eau", es: "agua", example: "De l'eau plate ou gazeuse ?", emoji: "🚰" },
  { fr: "du jus", es: "zumo / jugo", example: "Du jus d'orange sans sucre ajouté.", emoji: "🧃" },
  { fr: "de la bière", es: "cerveza", example: "De la bière artisanale, vous en avez ?", emoji: "🍺" },
  { fr: "du vin", es: "vino", example: "Du vin rouge de la région, s'il vous plaît.", emoji: "🍷" },
  { fr: "du savon", es: "jabón", example: "Je dois acheter du savon liquide.", emoji: "🧼" },
  { fr: "du shampooing", es: "champú", example: "Quel shampooing recommandez-vous ?", emoji: "🧴" },
  { fr: "du papier toilette", es: "papel higiénico", example: "Il n'y a plus de papier toilette à la maison !", emoji: "🧻" },
  { fr: "du nettoyant", es: "producto de limpieza", example: "Du nettoyant multi-surfaces, c'est pratique.", emoji: "🧽" },
  { fr: "Je dois acheter…", es: "Debo comprar…", example: "Je dois acheter du lait et des œufs.", emoji: "🛒" },
  { fr: "du soda", es: "refresco", example: "Je voudrais du soda, pas trop sucré.", emoji: "🥤" },
];

export type FlashQuiz8 = { emoji: string; concept: string; options: string[]; answer: number };

export const day8FlashQuiz: FlashQuiz8[] = [
  { emoji: "🥚", concept: "huevos (partitivo)", options: ["du œufs", "des œufs", "de l'œufs"], answer: 1 },
  { emoji: "🥛", concept: "leche (partitivo)", options: ["du lait", "de la lait", "des lait"], answer: 0 },
  { emoji: "🫒", concept: "aceite (partitivo)", options: ["du huile", "de la huile", "de l'huile"], answer: 2 },
  { emoji: "🌾", concept: "harina (partitivo)", options: ["du farine", "de la farine", "des farine"], answer: 1 },
  { emoji: "🍪", concept: "galletas (partitivo)", options: ["du biscuits", "de la biscuits", "des biscuits"], answer: 2 },
  { emoji: "🧂", concept: "sal (partitivo)", options: ["du sel", "de la sel", "des sel"], answer: 0 },
  { emoji: "🍷", concept: "vino (partitivo)", options: ["du vin", "de la vin", "des vin"], answer: 0 },
  { emoji: "🧻", concept: "papel higiénico", options: ["du papier toilette", "de la papier", "des papier"], answer: 0 },
  { emoji: "🛒", concept: "'Debo comprar…'", options: ["Je veux acheter", "Je dois acheter", "J'achète"], answer: 1 },
  { emoji: "🦃", concept: "pavo (partitivo)", options: ["du dinde", "de la dinde", "des dinde"], answer: 1 },
  { emoji: "🥩", concept: "embutidos (partitivo)", options: ["du charcuterie", "de la charcuterie", "des charcuterie"], answer: 1 },
  { emoji: "💧", concept: "un pack de agua", options: ["un pack de l'eau", "un pack d'eau", "un pack des eau"], answer: 1 },
];

// Défi entregable — Faire les courses (día par 8)
export const day8DefiSteps = [
  {
    serveur: "Bonjour ! Bienvenue. Vous cherchez quelque chose en particulier ?",
    hint: "Saluda y explica que debes hacer la compra semanal usando « Je dois faire les courses ».",
    example: "Bonjour ! Oui, je dois faire les courses de la semaine. J'ai une longue liste.",
  },
  {
    serveur: "Très bien ! Par quoi commencez-vous ?",
    hint: "Menciona 3 productos que debes comprar con « Je dois acheter… » + partitivos (du / de la / des / de l').",
    example: "Je dois acheter du lait, des œufs et de la farine pour une recette.",
  },
  {
    serveur: "Parfait. Il y a des promotions sur les produits laitiers cette semaine.",
    hint: "Añade 3 productos más (higiene o bebidas) usando « Je dois prendre… » + partitivos.",
    example: "Super ! Je dois aussi prendre du shampooing, du papier toilette et un pack d'eau.",
  },
  {
    serveur: "Vous voulez quelque chose au rayon boucherie ?",
    hint: "Pide carne o embutidos con partitivos correctos (de la dinde, du jambon, de la charcuterie…).",
    example: "Oui, je dois acheter de la dinde et un peu de charcuterie pour le pique-nique.",
  },
  {
    serveur: "Très bien. Passez à la caisse quand vous êtes prêt(e).",
    hint: "Agradece y despídete con « Merci » y « Bonne journée ».",
    example: "Merci beaucoup pour votre aide. Bonne journée !",
  },
];

// Grammar structures — Day 8 (Devoir + infinitif)
export const day8GrammarStructures = [
  { formula: "JE DOIS + INFINITIF = « Debo… »", use: "Expresar una obligación o necesidad: « Je dois acheter du lait. »" },
  { formula: "TU DOIS + INFINITIF", use: "« Tu dois valider ton ticket à la caisse. »" },
  { formula: "IL / ELLE DOIT + INFINITIF", use: "« Elle doit passer à la boulangerie. »" },
  { formula: "NOUS DEVONS · VOUS DEVEZ · ILS DOIVENT", use: "« Nous devons prendre du pain. » / « Vous devez payer à la caisse. »" },
];
