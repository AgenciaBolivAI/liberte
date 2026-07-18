// Day 6 — Restaurante (partie 2). Vocab, video sources, flashcards, défi steps.

export const day6Videos = {
  gym: "https://www.youtube.com/embed/kLuB1ZDjkHg",
  intro: "https://www.youtube.com/embed/_VsjnJ126Fg",
  vocab: "https://www.youtube.com/embed/BZERw5kd5D8",
  grammar: "https://www.youtube.com/embed/7B1e_uBashI",
};

export type Vocab6 = { fr: string; es: string; example: string; emoji: string };

export const day6Vocabulary: Vocab6[] = [
  { fr: "végétarien", es: "vegetariano", example: "Je suis végétarien, je ne mange pas de viande.", emoji: "🥗" },
  { fr: "végane", es: "vegano", example: "Elle est végane — pas de produits animaux.", emoji: "🌱" },
  { fr: "une allergie", es: "una alergia", example: "J'ai une allergie aux fruits de mer.", emoji: "🤧" },
  { fr: "sans gluten", es: "sin gluten", example: "Vous avez un menu sans gluten ?", emoji: "🌾" },
  { fr: "épicé", es: "picante", example: "C'est épicé ? Je ne supporte pas le piment.", emoji: "🌶️" },
  { fr: "la cuisson", es: "el punto de cocción", example: "Quelle cuisson pour votre steak ?", emoji: "🍳" },
  { fr: "à point", es: "en su punto", example: "Je voudrais mon steak à point.", emoji: "🥩" },
  { fr: "saignant", es: "poco hecho", example: "Mon mari aime le steak saignant.", emoji: "🩸" },
  { fr: "le total", es: "el total", example: "Le total, c'est combien ?", emoji: "💰" },
  { fr: "service compris", es: "servicio incluido", example: "Le service est compris dans le prix.", emoji: "🤵" },
  { fr: "arrondir", es: "redondear", example: "Je peux arrondir à 20 euros ?", emoji: "🔄" },
  { fr: "partager", es: "compartir / dividir", example: "On peut partager l'addition ?", emoji: "🤝" },
  { fr: "séparément", es: "por separado", example: "On paie séparément, s'il vous plaît.", emoji: "✂️" },
  { fr: "une erreur", es: "un error", example: "Il y a une erreur dans l'addition.", emoji: "⚠️" },
  { fr: "le plat du jour", es: "el plato del día", example: "Quel est le plat du jour ?", emoji: "🍽️" },
  { fr: "le menu enfant", es: "el menú infantil", example: "Vous avez un menu enfant ?", emoji: "🧒" },
  { fr: "Je vais prendre…", es: "Voy a tomar…", example: "Je vais prendre le poulet rôti.", emoji: "🍗" },
  { fr: "Je prends…", es: "Tomo…", example: "Je prends la salade verte.", emoji: "🥬" },
  { fr: "Qu'est-ce qu'il y a dans ce plat ?", es: "¿Qué lleva este plato?", example: "Qu'est-ce qu'il y a dans ce plat ?", emoji: "❓" },
  { fr: "Vous avez quelque chose pour… ?", es: "¿Tiene algo para…?", example: "Vous avez quelque chose pour les végétariens ?", emoji: "🙋" },
  { fr: "C'est délicieux !", es: "¡Está delicioso!", example: "C'est délicieux, compliments au chef !", emoji: "😋" },
  { fr: "un accompagnement", es: "un acompañamiento", example: "Qu'est-ce qui vient en accompagnement ?", emoji: "🥔" },
  { fr: "une portion", es: "una porción", example: "C'est une grande portion ?", emoji: "🍚" },
  { fr: "par carte bancaire", es: "con tarjeta bancaria", example: "Je peux payer par carte bancaire ?", emoji: "💳" },
  { fr: "faire moitié-moitié", es: "pagar a medias", example: "On fait moitié-moitié ?", emoji: "➗" },
  { fr: "savourer", es: "saborear", example: "Prenez le temps de savourer ce plat.", emoji: "🥂" },
  { fr: "doux", es: "suave / sin picante", example: "Je préfère quelque chose de doux.", emoji: "🍯" },
  { fr: "copieux", es: "abundante", example: "Ce plat est très copieux.", emoji: "🍛" },
  { fr: "un supplément", es: "un extra", example: "Il y a un supplément pour la sauce ?", emoji: "➕" },
  { fr: "Compliments au chef !", es: "¡Mis felicitaciones al chef!", example: "Compliments au chef, c'était excellent !", emoji: "👨‍🍳" },
];

export type FlashQuiz6 = { emoji: string; concept: string; options: string[]; answer: number };

export const day6FlashQuiz: FlashQuiz6[] = [
  { emoji: "🥗", concept: "vegetariano", options: ["végétarien", "végane", "sans gluten"], answer: 0 },
  { emoji: "🌱", concept: "vegano (sin productos animales)", options: ["végétarien", "végane", "doux"], answer: 1 },
  { emoji: "🤧", concept: "alergia alimentaria", options: ["une allergie", "une erreur", "une portion"], answer: 0 },
  { emoji: "🌾", concept: "sin gluten", options: ["sans gluten", "épicé", "doux"], answer: 0 },
  { emoji: "🌶️", concept: "picante", options: ["doux", "épicé", "copieux"], answer: 1 },
  { emoji: "🥩", concept: "en su punto (cocción)", options: ["saignant", "à point", "épicé"], answer: 1 },
  { emoji: "🩸", concept: "poco hecho (rojo)", options: ["à point", "saignant", "doux"], answer: 1 },
  { emoji: "⚠️", concept: "error en la cuenta", options: ["une erreur", "une portion", "un supplément"], answer: 0 },
  { emoji: "✂️", concept: "pagar por separado", options: ["séparément", "arrondir", "partager"], answer: 0 },
  { emoji: "➗", concept: "pagar a medias", options: ["faire moitié-moitié", "partager", "arrondir"], answer: 0 },
  { emoji: "🍽️", concept: "plato del día", options: ["le plat du jour", "le menu enfant", "un supplément"], answer: 0 },
  { emoji: "🥔", concept: "acompañamiento", options: ["une portion", "un accompagnement", "un supplément"], answer: 1 },
  { emoji: "🍛", concept: "abundante", options: ["copieux", "doux", "épicé"], answer: 0 },
  { emoji: "💳", concept: "pago con tarjeta bancaria", options: ["par carte bancaire", "arrondir", "service compris"], answer: 0 },
  { emoji: "👨‍🍳", concept: "felicitar al chef", options: ["Compliments au chef !", "Bonne journée !", "C'est délicieux !"], answer: 0 },
];

// Défi entregable — Restaurant complet (reto par: día 6)
export const day6DefiSteps = [
  {
    serveur: "Bonjour ! Bienvenue. Vous avez une réservation ?",
    hint: "Explica que reservaste para el sábado a las 20h para 2 personas — usa futur proche si puedes.",
    example: "Bonjour ! Oui, j'ai réservé pour samedi à 20h — nous allons être deux.",
  },
  {
    serveur: "Parfait. Voici la carte. Vous avez choisi ?",
    hint: "Anuncia una restricción alimentaria (végétarien / végane / sans gluten / allergie) y pide una recomendación.",
    example: "Je suis végétarien. Vous avez quelque chose pour les végétariens ?",
  },
  {
    serveur: "Bien sûr, je vais vous recommander notre plat du jour.",
    hint: "Usa « Je vais prendre… » (futur proche) para pedir tu plato y precisar cuisson o accompagnement.",
    example: "Très bien, je vais prendre le plat du jour, avec des légumes en accompagnement.",
  },
  {
    serveur: "Voilà l'addition. Ça fait 48 euros.",
    hint: "Descubre un error en la cuenta y coméntalo con educación.",
    example: "Excusez-moi, je crois qu'il y a une erreur dans l'addition — vous avez compté deux desserts.",
  },
  {
    serveur: "Ah, vous avez raison, je corrige tout de suite. Comment vous payez ?",
    hint: "Pide pagar por separado o a medias, y despídete felicitando al chef.",
    example: "On va payer séparément, par carte bancaire. Compliments au chef, c'était délicieux !",
  },
];

// Grammar structures — Day 6
export const day6GrammarStructures = [
  { formula: "ALLER (conjugado) + INFINITIF = FUTUR PROCHE", use: "Expresar una acción muy próxima o una decisión: « Je vais prendre le poulet »." },
  { formula: "JE SUIS + adjectif alimentaire", use: "Anunciar una restricción: végétarien, végane, allergique, sans gluten." },
  { formula: "IL Y A UNE ERREUR + DANS + article + nom", use: "Señalar un error educadamente: « Il y a une erreur dans l'addition »." },
  { formula: "ON PEUT + INFINITIF", use: "Sugerir o pedir permiso: partager, payer séparément, faire moitié-moitié." },
];
