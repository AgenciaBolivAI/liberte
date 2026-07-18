// Day 7 — Supermercado (partie 1). Vocab, video sources, flashcards, défi steps.

export const day7Videos = {
  gym: "https://www.youtube.com/embed/AdJPOTR-CdU",
  intro: "https://www.youtube.com/embed/ecZpdna48So",
  vocab: "https://www.youtube.com/embed/9uSpFAfNgvM",
  grammar: "https://www.youtube.com/embed/1xBud5oh5OA",
};

export type Vocab7 = { fr: string; es: string; example: string; emoji: string };

export const day7Vocabulary: Vocab7[] = [
  { fr: "un supermarché", es: "un supermercado", example: "Je vais au supermarché ce matin.", emoji: "🏬" },
  { fr: "un rayon", es: "una sección / pasillo", example: "Le rayon fromages est au fond.", emoji: "🧀" },
  { fr: "une caisse", es: "una caja", example: "Il y a une longue file à la caisse.", emoji: "💵" },
  { fr: "un chariot", es: "un carrito", example: "Je prends un chariot — j'ai beaucoup à acheter.", emoji: "🛒" },
  { fr: "un panier", es: "una cesta", example: "Je prends juste un panier — c'est rapide.", emoji: "🧺" },
  { fr: "un sac", es: "una bolsa", example: "Vous voulez un sac ?", emoji: "🛍️" },
  { fr: "une liste de courses", es: "una lista de compras", example: "J'ai oublié ma liste de courses !", emoji: "📝" },
  { fr: "une marque", es: "una marca", example: "Je préfère les marques françaises.", emoji: "🏷️" },
  { fr: "cher / pas cher", es: "caro / barato", example: "Ce produit est trop cher.", emoji: "💶" },
  { fr: "une promotion", es: "una oferta", example: "Il y a des promotions cette semaine.", emoji: "🎉" },
  { fr: "une réduction", es: "un descuento", example: "Il y a une réduction de 30 %.", emoji: "📉" },
  { fr: "une étiquette", es: "una etiqueta", example: "Lisez bien l'étiquette avant d'acheter.", emoji: "🏷️" },
  { fr: "la date de péremption", es: "la fecha de caducidad", example: "La date de péremption, c'est demain.", emoji: "📅" },
  { fr: "frais", es: "fresco", example: "Le pain frais est livré chaque matin.", emoji: "🥖" },
  { fr: "surgelé", es: "congelado", example: "Je cherche les produits surgelés.", emoji: "🧊" },
  { fr: "une conserve", es: "una conserva", example: "J'achète des conserves pour la semaine.", emoji: "🥫" },
  { fr: "bio", es: "ecológico / orgánico", example: "Je préfère les légumes bio.", emoji: "🌿" },
  { fr: "une allée", es: "un pasillo", example: "Les céréales sont dans l'allée 3.", emoji: "🛤️" },
  { fr: "l'entrée", es: "la entrada", example: "Le parking est près de l'entrée.", emoji: "🚪" },
  { fr: "la sortie", es: "la salida", example: "La sortie est à droite.", emoji: "🚶" },
  { fr: "Où se trouve… ?", es: "¿Dónde está…?", example: "Où se trouve le rayon boulangerie ?", emoji: "❓" },
  { fr: "Je cherche…", es: "Busco…", example: "Je cherche le rayon fromages.", emoji: "🔎" },
  { fr: "au fond", es: "al fondo", example: "Les surgelés sont au fond du magasin.", emoji: "⬇️" },
  { fr: "à gauche / à droite", es: "a la izquierda / a la derecha", example: "C'est à gauche, après les caisses.", emoji: "↔️" },
  { fr: "Il y a…", es: "Hay…", example: "Il y a du pain frais aujourd'hui ?", emoji: "✅" },
  { fr: "Il n'y a pas de…", es: "No hay…", example: "Il n'y a pas de lait demi-écrémé.", emoji: "🚫" },
  { fr: "les soldes", es: "las rebajas", example: "Les soldes commencent ce weekend.", emoji: "🔖" },
  { fr: "la qualité", es: "la calidad", example: "Ce produit est de bonne qualité.", emoji: "⭐" },
  { fr: "une offre", es: "una oferta especial", example: "Il y a une offre spéciale sur le fromage.", emoji: "🎁" },
  { fr: "un produit", es: "un producto", example: "Ce produit est excellent rapport qualité-prix.", emoji: "📦" },
];

export type FlashQuiz7 = { emoji: string; concept: string; options: string[]; answer: number };

export const day7FlashQuiz: FlashQuiz7[] = [
  { emoji: "🏬", concept: "supermercado", options: ["un supermarché", "un rayon", "une caisse"], answer: 0 },
  { emoji: "🧀", concept: "sección / pasillo (rayon)", options: ["un chariot", "un rayon", "une allée"], answer: 1 },
  { emoji: "🛒", concept: "carrito de compras", options: ["un panier", "un chariot", "un sac"], answer: 1 },
  { emoji: "🧺", concept: "cesta", options: ["un panier", "un chariot", "un sac"], answer: 0 },
  { emoji: "📝", concept: "lista de compras", options: ["une étiquette", "une liste de courses", "une marque"], answer: 1 },
  { emoji: "🎉", concept: "oferta / promoción", options: ["une promotion", "une réduction", "les soldes"], answer: 0 },
  { emoji: "📉", concept: "descuento (%)", options: ["une offre", "une réduction", "une étiquette"], answer: 1 },
  { emoji: "📅", concept: "fecha de caducidad", options: ["la date de péremption", "l'étiquette", "la qualité"], answer: 0 },
  { emoji: "🥖", concept: "pan fresco (frais)", options: ["surgelé", "frais", "bio"], answer: 1 },
  { emoji: "🧊", concept: "congelado", options: ["frais", "surgelé", "bio"], answer: 1 },
  { emoji: "🌿", concept: "ecológico / orgánico", options: ["bio", "frais", "cher"], answer: 0 },
  { emoji: "❓", concept: "¿Dónde está…?", options: ["Je cherche…", "Où se trouve… ?", "Il y a…"], answer: 1 },
  { emoji: "🔎", concept: "Busco…", options: ["Je cherche…", "Où se trouve… ?", "Il n'y a pas de…"], answer: 0 },
  { emoji: "✅", concept: "Hay…", options: ["Il y a…", "Il n'y a pas de…", "Je cherche…"], answer: 0 },
  { emoji: "🚫", concept: "No hay…", options: ["Il y a…", "Il n'y a pas de…", "Où se trouve… ?"], answer: 1 },
];

// Défi entregable — Supermarché · partie 1 (día impar 7)
export const day7DefiSteps = [
  {
    serveur: "Bonjour ! Bienvenue au supermarché. Je peux vous aider ?",
    hint: "Saluda al empleado y pregunta dónde está el rayon fromages usando « Où se trouve… ? ».",
    example: "Bonjour ! Excusez-moi, où se trouve le rayon fromages, s'il vous plaît ?",
  },
  {
    serveur: "Le rayon fromages est au fond du magasin, à gauche des surgelés.",
    hint: "Da las gracias y pregunta si hay pan fresco hoy usando « Il y a… ? ».",
    example: "Merci beaucoup ! Et il y a du pain frais aujourd'hui ?",
  },
  {
    serveur: "Oui, il y a du pain frais ce matin, au rayon boulangerie.",
    hint: "Pregunta por una segunda sección (por ejemplo boissons o produits bio) con « Où se trouve… ? ».",
    example: "Parfait. Et où se trouve le rayon des boissons, s'il vous plaît ?",
  },
  {
    serveur: "Les boissons sont dans l'allée 5, à droite après les conserves.",
    hint: "Comenta que no hay bolsas en la caja o pregunta si hay promociones esta semana usando « Il n'y a pas de… » o « Il y a… ».",
    example: "D'accord. Il n'y a pas de sacs à la caisse ? Et il y a des promotions cette semaine ?",
  },
  {
    serveur: "Il y a des promotions sur le fromage et les fruits bio. Autre chose ?",
    hint: "Agradece y despídete con « Merci » y « Bonne journée ».",
    example: "Non, c'est tout, merci beaucoup pour votre aide. Bonne journée !",
  },
];

// Grammar structures — Day 7 (Il y a / Il n'y a pas de)
export const day7GrammarStructures = [
  { formula: "IL Y A + article + nom = « Hay… »", use: "Confirmar la existencia: « Il y a du pain frais. » / « Il y a des promotions. »" },
  { formula: "IL N'Y A PAS DE + nom (sin artículo)", use: "Negar la existencia: « Il n'y a pas de lait. » / « Il n'y a pas d'œufs. »" },
  { formula: "OÙ SE TROUVE + article + nom ?", use: "Preguntar por la ubicación de una sección: « Où se trouve le rayon fromages ? »" },
  { formula: "JE CHERCHE + article + nom", use: "Explicar qué buscas: « Je cherche les produits surgelés. »" },
];
