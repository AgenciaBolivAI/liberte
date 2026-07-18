// Day 4 — La Vitrine des Douceurs. Vocab list, video sources, flashcards, roleplay.

export const day4Videos = {
  intro: "https://www.youtube.com/embed/Okka8zphDIY",
  vocab: "https://www.youtube.com/embed/lEMmJk8ajgY",
  grammar: "https://www.youtube.com/embed/MohQ5rC4RNg",
};

export type Vocab4 = { fr: string; es: string; example: string; emoji: string };

export const day4Vocabulary: Vocab4[] = [
  { fr: "une tarte aux pommes", es: "una tarta de manzana", example: "Ça a l'air délicieux, cette tarte aux pommes !", emoji: "🥧" },
  { fr: "une tarte au citron", es: "una tarta de limón", example: "Il reste une part de tarte au citron ?", emoji: "🍋" },
  { fr: "un éclair", es: "un éclair", example: "Il reste des éclairs au chocolat ?", emoji: "🍫" },
  { fr: "un macaron", es: "un macaron", example: "Je voudrais six macarons au citron, s'il vous plaît.", emoji: "🌈" },
  { fr: "un chausson aux pommes", es: "una empanadilla de manzana", example: "Le chausson aux pommes, c'est fait maison ?", emoji: "🥟" },
  { fr: "un cookie", es: "una galleta", example: "Je prends un cookie au chocolat, s'il vous plaît.", emoji: "🍪" },
  { fr: "un mille-feuille", es: "un milhojas", example: "Le mille-feuille, c'est notre spécialité du samedi.", emoji: "🍰" },
  { fr: "un financier", es: "un financier (pastelito de almendra)", example: "Les financiers sont moelleux et délicieux.", emoji: "🍯" },
  { fr: "de la confiture", es: "mermelada", example: "Je voudrais du pain avec de la confiture, s'il vous plaît.", emoji: "🍓" },
  { fr: "du miel", es: "miel", example: "Et avec du miel ? Vous en avez ?", emoji: "🍯" },
  { fr: "du beurre", es: "mantequilla", example: "Une tartine de pain avec du beurre — c'est parfait !", emoji: "🧈" },
  { fr: "fourré", es: "relleno", example: "C'est fourré à la crème ? Je vais essayer ça !", emoji: "🥮" },
  { fr: "enrobé", es: "bañado / cubierto", example: "L'éclair est enrobé de chocolat noir.", emoji: "🍫" },
  { fr: "la vitrine", es: "el escaparate / la vitrina", example: "Regardez ce qu'il y a dans la vitrine !", emoji: "🪟" },
  { fr: "une boîte", es: "una caja", example: "Vous pouvez les mettre dans une boîte ?", emoji: "📦" },
  { fr: "un cadeau", es: "un regalo", example: "C'est un cadeau — vous pouvez emballer ?", emoji: "🎁" },
  { fr: "le présentoir", es: "el expositor", example: "Sophie arrange les macarons sur le présentoir.", emoji: "🍽️" },
  { fr: "offrir", es: "regalar / ofrecer", example: "C'est pour offrir — je voudrais une belle présentation.", emoji: "💝" },
  { fr: "goûter", es: "probar / saborear", example: "Je peux goûter avant de décider ?", emoji: "👅" },
  { fr: "déguster", es: "degustar", example: "Prenez le temps de déguster — c'est fait maison.", emoji: "😋" },
  { fr: "Qu'est-ce que vous recommandez ?", es: "¿Qué recomienda usted?", example: "Qu'est-ce que vous recommandez comme tarte ?", emoji: "❓" },
  { fr: "Quelle est la spécialité ?", es: "¿Cuál es la especialidad?", example: "Quelle est la spécialité de la maison ?", emoji: "⭐" },
  { fr: "C'est fait maison ?", es: "¿Es casero?", example: "L'éclair au chocolat, c'est fait maison ?", emoji: "🏠" },
  { fr: "Il reste…", es: "Queda(n)…", example: "Il reste des macarons au citron ?", emoji: "🔎" },
  { fr: "Je vais essayer ça.", es: "Voy a probar eso.", example: "Ça a l'air délicieux — je vais essayer ça !", emoji: "✅" },
  { fr: "Ça a l'air délicieux.", es: "Parece delicioso.", example: "Ça a l'air délicieux ! C'est quoi, ce gâteau ?", emoji: "😍" },
  { fr: "Ça sent bon !", es: "¡Huele bien!", example: "Ça sent tellement bon ici !", emoji: "👃" },
  { fr: "populaire", es: "popular", example: "L'éclair est très populaire — il part vite !", emoji: "🔥" },
  { fr: "disponible", es: "disponible", example: "La tarte au citron est disponible aujourd'hui seulement.", emoji: "🟢" },
  { fr: "terminé", es: "agotado / acabado", example: "C'est terminé ? Dommage ! Je reviendrai demain.", emoji: "🚫" },
];

export const day4AnchorPhrases = [
  { fr: "Qu'est-ce que vous recommandez comme tarte ?", es: "¿Qué tarta recomienda?" },
  { fr: "Ça a l'air délicieux ! C'est quoi, ce gâteau ?", es: "¡Parece delicioso! ¿Qué es ese pastel?" },
  { fr: "Il reste des éclairs au chocolat ?", es: "¿Quedan éclairs de chocolate?" },
  { fr: "C'est terminé ? Dommage !", es: "¿Se agotó? ¡Qué lástima!" },
  { fr: "Vous pouvez me le faire goûter ?", es: "¿Puede dejarme probarlo?" },
  { fr: "C'est pour offrir — vous pouvez le mettre dans une boîte ?", es: "Es para regalar — ¿puede ponerlo en una caja?" },
  { fr: "Ça sent tellement bon ici !", es: "¡Huele increíblemente bien aquí!" },
];

export type FlashQuiz4 = { emoji: string; concept: string; options: string[]; answer: number };

export const day4FlashQuiz: FlashQuiz4[] = [
  { emoji: "🥧", concept: "tarta de manzana", options: ["une tarte aux pommes", "un chausson aux pommes", "un mille-feuille"], answer: 0 },
  { emoji: "🍋", concept: "tarta de limón", options: ["une tarte au citron", "un macaron", "un financier"], answer: 0 },
  { emoji: "🍫", concept: "éclair de chocolate", options: ["un éclair", "un cookie", "un mille-feuille"], answer: 0 },
  { emoji: "🌈", concept: "macaron colorido", options: ["un macaron", "un financier", "un cookie"], answer: 0 },
  { emoji: "🥟", concept: "empanadilla de manzana", options: ["un chausson aux pommes", "une tarte aux pommes", "un éclair"], answer: 0 },
  { emoji: "🍪", concept: "galleta", options: ["un cookie", "un financier", "un macaron"], answer: 0 },
  { emoji: "🍰", concept: "milhojas", options: ["un mille-feuille", "un financier", "un éclair"], answer: 0 },
  { emoji: "🍓", concept: "mermelada", options: ["de la confiture", "du miel", "du beurre"], answer: 0 },
  { emoji: "🍯", concept: "miel", options: ["du miel", "de la confiture", "du beurre"], answer: 0 },
  { emoji: "🧈", concept: "mantequilla", options: ["du beurre", "du miel", "de la confiture"], answer: 0 },
  { emoji: "🪟", concept: "escaparate / vitrina", options: ["la vitrine", "le présentoir", "une boîte"], answer: 0 },
  { emoji: "📦", concept: "caja de regalo", options: ["une boîte", "un cadeau", "le présentoir"], answer: 0 },
  { emoji: "🎁", concept: "regalo", options: ["un cadeau", "une boîte", "offrir"], answer: 0 },
  { emoji: "👅", concept: "probar antes de comprar", options: ["goûter", "déguster", "offrir"], answer: 0 },
  { emoji: "🚫", concept: "agotado / se acabó", options: ["terminé", "disponible", "populaire"], answer: 0 },
];

export const day4DefiSteps = [
  {
    serveur: "Bonjour ! Vous tombez bien — les macarons viennent juste de sortir du four !",
    hint: "Saluda a Sophie y reacciona al aroma y a la vitrina.",
    example: "Bonjour Sophie ! Ça sent tellement bon ici — ça a l'air délicieux !",
  },
  {
    serveur: "Regardez cette vitrine ! Qu'est-ce qui vous attire ?",
    hint: "Describe DOS productos que ves usando ÇA A L'AIR + adjectif.",
    example: "Ça a l'air délicieux, ce mille-feuille ! Et cette tarte au citron a l'air fraîche !",
  },
  {
    serveur: "Tout est fait maison ce matin. Vous cherchez quelque chose de particulier ?",
    hint: "Pide una recomendación con QU'EST-CE QUE VOUS RECOMMANDEZ.",
    example: "Qu'est-ce que vous recommandez comme spécialité ?",
  },
  {
    serveur: "Aujourd'hui, je vous recommande les éclairs au chocolat — notre spécialité !",
    hint: "Verifica si todavía quedan usando IL RESTE.",
    example: "Il reste des éclairs au chocolat ?",
  },
  {
    serveur: "Oui, il en reste trois ! Ils sont très populaires.",
    hint: "Pide probar antes de decidir con VOUS POUVEZ ME LE FAIRE GOÛTER.",
    example: "Vous pouvez me le faire goûter avant de décider ?",
  },
  {
    serveur: "Bien sûr, tenez ! Un petit morceau pour vous.",
    hint: "Después de probar, decide comprar con JE VAIS ESSAYER ÇA.",
    example: "C'est incroyable ! Je vais essayer ça — j'en prends trois.",
  },
  {
    serveur: "Parfait ! Trois éclairs au chocolat. Autre chose ?",
    hint: "Indica que es para regalar y pide une boîte con un ruban — C'EST POUR OFFRIR.",
    example: "C'est pour offrir — vous pouvez les mettre dans une boîte avec un ruban ?",
  },
  {
    serveur: "Avec plaisir ! Un joli cadeau parisien. Ça fait 9 euros, s'il vous plaît.",
    hint: "Paga, agradece y despídete.",
    example: "Voilà. Merci beaucoup, Sophie. Bonne journée !",
  },
];

export const day4GrammarStructures = [
  { formula: "ÇA A L'AIR + adjectif", use: "Para decir « parece / tiene pinta de ». El adjetivo va SIEMPRE en masculino singular." },
  { formula: "IL RESTE + artículo + nombre / C'EST TERMINÉ", use: "Preguntar qué queda (Il reste des éclairs ?) o confirmar que se agotó (C'est terminé)." },
  { formula: "C'EST POUR OFFRIR + boîte / cadeau", use: "Comprar un regalo y pedir presentación especial (boîte, ruban)." },
  { formula: "VOUS POUVEZ ME LE FAIRE GOÛTER ?", use: "Pedir probar un producto de forma educada antes de decidir." },
];
