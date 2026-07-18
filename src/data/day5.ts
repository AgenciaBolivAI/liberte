// Day 5 — Le Bistrot Liberté. Vocab, videos, flashcards, roleplay.

export const day5Videos = {
  intro: "https://www.youtube.com/embed/qRovy6iPCrM",
  vocab: "https://www.youtube.com/embed/LXOCAM4T_nA",
  grammar: "https://www.youtube.com/embed/c8cpr_ouP6o",
};

export type Vocab5 = { fr: string; es: string; example: string; emoji: string };

export const day5Vocabulary: Vocab5[] = [
  { fr: "le menu", es: "el menú (precio fijo)", example: "Je prends le menu, s'il vous plaît — entrée, plat et dessert.", emoji: "📋" },
  { fr: "la carte", es: "la carta (à la carte)", example: "Vous pouvez m'apporter la carte, s'il vous plaît ?", emoji: "📖" },
  { fr: "une entrée", es: "una entrada / primer plato", example: "Comme entrée, je prends la salade verte.", emoji: "🥗" },
  { fr: "un plat principal", es: "un plato principal", example: "Comme plat principal, je voudrais le poulet.", emoji: "🍽️" },
  { fr: "un dessert", es: "un postre", example: "Comme dessert, je vais prendre la tarte du jour.", emoji: "🍰" },
  { fr: "une boisson", es: "una bebida", example: "Comme boisson, de l'eau plate, s'il vous plaît.", emoji: "🥤" },
  { fr: "une soupe", es: "una sopa", example: "Comme entrée, je voudrais une soupe à l'oignon.", emoji: "🍲" },
  { fr: "une salade", es: "una ensalada", example: "La salade niçoise, c'est la spécialité du bistrot.", emoji: "🥗" },
  { fr: "du poisson", es: "pescado", example: "Je préfère le poisson à la viande — vous avez du poisson ?", emoji: "🐟" },
  { fr: "de la viande", es: "carne", example: "Comme plat principal, je prends de la viande.", emoji: "🥩" },
  { fr: "du poulet", es: "pollo", example: "Le poulet rôti avec des légumes — c'est parfait !", emoji: "🍗" },
  { fr: "du riz", es: "arroz", example: "Avec du riz ou des pâtes ? Je préfère le riz.", emoji: "🍚" },
  { fr: "des pâtes", es: "pasta", example: "Des pâtes à la bolognaise, s'il vous plaît.", emoji: "🍝" },
  { fr: "des légumes", es: "verduras", example: "Je voudrais le poulet avec des légumes grillés.", emoji: "🥦" },
  { fr: "une sauce", es: "una salsa", example: "Quelle sauce accompagne le poisson ?", emoji: "🥫" },
  { fr: "du fromage", es: "queso", example: "Le fromage est compris dans le menu ?", emoji: "🧀" },
  { fr: "du pain", es: "pan", example: "Vous pouvez m'apporter du pain, s'il vous plaît ?", emoji: "🥖" },
  { fr: "une réservation", es: "una reserva", example: "J'ai une réservation au nom de García, pour deux personnes.", emoji: "📅" },
  { fr: "une table pour deux", es: "una mesa para dos", example: "Je voudrais réserver une table pour deux ce soir.", emoji: "🍽️" },
  { fr: "ce soir", es: "esta noche", example: "Vous avez une table disponible ce soir ?", emoji: "🌙" },
  { fr: "à midi", es: "al mediodía", example: "Je voudrais réserver pour à midi, s'il vous plaît.", emoji: "☀️" },
  { fr: "la terrasse", es: "la terraza", example: "Je préfère la terrasse à l'intérieur — il fait beau !", emoji: "🌿" },
  { fr: "l'intérieur", es: "el interior", example: "Vous préférez la terrasse ou l'intérieur ce soir ?", emoji: "🏠" },
  { fr: "disponible", es: "disponible", example: "Vous avez une table disponible pour ce soir ?", emoji: "🟢" },
  { fr: "complet", es: "completo / sin mesa", example: "Désolé, nous sommes complets ce soir.", emoji: "🚫" },
  { fr: "Je voudrais réserver.", es: "Quisiera reservar.", example: "Je voudrais réserver une table pour deux personnes, s'il vous plaît.", emoji: "📞" },
  { fr: "À quelle heure ?", es: "¿A qué hora?", example: "À quelle heure voulez-vous dîner ?", emoji: "🕗" },
  { fr: "Au nom de…", es: "A nombre de…", example: "J'ai réservé au nom de García.", emoji: "🪪" },
  { fr: "annuler", es: "cancelar", example: "Je voudrais annuler ma réservation de ce soir.", emoji: "❌" },
  { fr: "confirmer", es: "confirmar", example: "Je voudrais confirmer ma réservation pour demain soir.", emoji: "✅" },
];

export const day5AnchorPhrases = [
  { fr: "Je voudrais réserver une table pour deux personnes ce soir.", es: "Quisiera reservar una mesa para dos personas esta noche." },
  { fr: "J'ai une réservation au nom de García.", es: "Tengo una reserva a nombre de García." },
  { fr: "Je préfère la terrasse à l'intérieur.", es: "Prefiero la terraza al interior." },
  { fr: "Comme entrée, je prends la soupe.", es: "De entrada, tomo la sopa." },
  { fr: "Quel est le plat du jour ?", es: "¿Cuál es el plato del día?" },
  { fr: "Qu'est-ce qui est compris dans le menu ?", es: "¿Qué está incluido en el menú?" },
  { fr: "Vous pouvez m'apporter du pain ?", es: "¿Puede traerme pan?" },
];

export type FlashQuiz5 = { emoji: string; concept: string; options: string[]; answer: number };

export const day5FlashQuiz: FlashQuiz5[] = [
  { emoji: "📋", concept: "menú de precio fijo", options: ["le menu", "la carte", "une entrée"], answer: 0 },
  { emoji: "📖", concept: "carta (à la carte)", options: ["la carte", "le menu", "une réservation"], answer: 0 },
  { emoji: "🥗", concept: "entrada / primer plato", options: ["une entrée", "un plat principal", "un dessert"], answer: 0 },
  { emoji: "🍽️", concept: "plato principal", options: ["un plat principal", "une entrée", "une boisson"], answer: 0 },
  { emoji: "🍰", concept: "postre", options: ["un dessert", "une salade", "du fromage"], answer: 0 },
  { emoji: "🐟", concept: "pescado", options: ["du poisson", "de la viande", "du poulet"], answer: 0 },
  { emoji: "🥩", concept: "carne", options: ["de la viande", "du poulet", "du poisson"], answer: 0 },
  { emoji: "🍗", concept: "pollo", options: ["du poulet", "de la viande", "du poisson"], answer: 0 },
  { emoji: "🍚", concept: "arroz", options: ["du riz", "des pâtes", "des légumes"], answer: 0 },
  { emoji: "🍝", concept: "pasta", options: ["des pâtes", "du riz", "une salade"], answer: 0 },
  { emoji: "🥦", concept: "verduras", options: ["des légumes", "des pâtes", "une sauce"], answer: 0 },
  { emoji: "🧀", concept: "queso", options: ["du fromage", "du pain", "une sauce"], answer: 0 },
  { emoji: "🥖", concept: "pan", options: ["du pain", "du fromage", "une boisson"], answer: 0 },
  { emoji: "📅", concept: "reserva", options: ["une réservation", "l'intérieur", "la terrasse"], answer: 0 },
  { emoji: "🌿", concept: "terraza", options: ["la terrasse", "l'intérieur", "complet"], answer: 0 },
];

export const day5DefiSteps = [
  {
    serveur: "Bonsoir, madame ! Bienvenue au Bistrot Liberté. Vous avez une réservation ?",
    hint: "Preséntate con AU NOM DE + apellido y el número de personas.",
    example: "Bonsoir ! Oui, j'ai une réservation au nom de García, pour deux personnes.",
  },
  {
    serveur: "Parfait, madame García ! Vous préférez la terrasse ou l'intérieur ?",
    hint: "Usa JE PRÉFÈRE A À B para elegir la mesa.",
    example: "Je préfère la terrasse à l'intérieur, s'il vous plaît — il fait beau ce soir.",
  },
  {
    serveur: "Très bien ! Voici le menu et la carte. Vous avez besoin d'un moment ?",
    hint: "Pregunta cuál es el plat du jour.",
    example: "Merci ! Quel est le plat du jour ?",
  },
  {
    serveur: "Un filet de poisson avec des légumes grillés et une sauce au citron.",
    hint: "Elige entre menu o carte y explica brevemente la diferencia.",
    example: "Je prends le menu — c'est le prix fixe avec entrée, plat et dessert, non ?",
  },
  {
    serveur: "Exactement ! 28 euros. Qu'est-ce que vous prenez ?",
    hint: "Pide los tres platos usando COMME para cada uno.",
    example: "Comme entrée, la soupe. Comme plat principal, le poisson. Comme dessert, la tarte du jour.",
  },
  {
    serveur: "Excellent choix ! Le poisson ou la viande vous plaît davantage ?",
    hint: "Expresa una preferencia de ingrediente con JE PRÉFÈRE A À B.",
    example: "Je préfère le poisson à la viande — c'est plus léger.",
  },
  {
    serveur: "Je note tout ça. Vous voulez boire quelque chose en attendant ?",
    hint: "Pide pan y agua con VOUS POUVEZ M'APPORTER.",
    example: "Vous pouvez m'apporter du pain et de l'eau plate, s'il vous plaît ?",
  },
  {
    serveur: "Bien sûr, je vous apporte ça tout de suite !",
    hint: "Pregunta qué incluye el menú con QU'EST-CE QUI EST COMPRIS.",
    example: "Qu'est-ce qui est compris dans le menu ? Le fromage aussi ?",
  },
  {
    serveur: "Voilà votre plat — le poisson avec une sauce au citron.",
    hint: "Reacciona al plato con ÇA A L'AIR + adjectif.",
    example: "Ça a l'air délicieux ! Et ça sent tellement bon !",
  },
  {
    serveur: "Je vous laisse déguster ! Vous voulez la carte des desserts ?",
    hint: "Pide la cuenta, paga y despídete de Antoine.",
    example: "L'addition, s'il vous plaît. Merci beaucoup, Antoine. Bonne soirée !",
  },
];

export const day5GrammarStructures = [
  { formula: "COMME + entrée / plat / dessert + je prends", use: "Pedir con elegancia los tres platos del menú, uno por uno." },
  { formula: "JE PRÉFÈRE A À B", use: "Expresar preferencia entre dos opciones. Lo preferido primero, lo no preferido después de « à »." },
  { formula: "AU NOM DE + apellido · disponible / complet / annuler / confirmer", use: "Gestionar una reserva: llegar, confirmar o cancelar." },
  { formula: "Quel est le plat du jour ? · Qu'est-ce qui est compris ? · Vous pouvez m'apporter ?", use: "Las tres preguntas clave al serveur para brillar en el bistrot." },
];
