import gymCerebral from "@/assets/gym-cerebral.mov.asset.json";
import bienvenueCafe from "@/assets/bienvenue-au-cafe.mov.asset.json";
import grammar from "@/assets/grammar.mov.asset.json";
import roleplay from "@/assets/roleplay.mov.asset.json";

export const videos = {
  gymCerebral: gymCerebral.url,
  bienvenue: "https://www.youtube.com/embed/xQsarEoLS9w",
  grammar: "https://www.youtube.com/embed/c_9OHFZILDA",
  roleplay: roleplay.url,
};


export type Vocab = { fr: string; es: string; example: string; emoji: string };

export const vocabulary: Vocab[] = [
  { fr: "un café", es: "un café", example: "Je voudrais un café, s'il vous plaît.", emoji: "☕" },
  { fr: "un thé", es: "un té", example: "Je prends un thé au citron.", emoji: "🍵" },
  { fr: "un chocolat chaud", es: "un chocolate caliente", example: "Un chocolat chaud, s'il vous plaît.", emoji: "🍫" },
  { fr: "un jus d'orange", es: "un jugo de naranja", example: "Je voudrais un jus d'orange frais.", emoji: "🍊" },
  { fr: "une eau", es: "un agua", example: "Une eau plate, s'il vous plaît.", emoji: "💧" },
  { fr: "du lait", es: "leche", example: "Avec un peu de lait, merci.", emoji: "🥛" },
  { fr: "du sucre", es: "azúcar", example: "Sans sucre, s'il vous plaît.", emoji: "🍬" },
  { fr: "une tasse", es: "una taza", example: "Vous avez une grande tasse ?", emoji: "🫖" },
  { fr: "un verre", es: "un vaso", example: "Un verre d'eau, s'il vous plaît.", emoji: "🥃" },
  { fr: "une cuillère", es: "una cuchara", example: "Vous avez une cuillère ?", emoji: "🥄" },
  { fr: "une table", es: "una mesa", example: "Je voudrais une table pour deux.", emoji: "🪑" },
  { fr: "une chaise", es: "una silla", example: "Cette chaise est libre ?", emoji: "🪑" },
  { fr: "le comptoir", es: "la barra", example: "Je préfère m'asseoir au comptoir.", emoji: "🍷" },
  { fr: "la carte", es: "la carta / el menú", example: "Je peux voir la carte ?", emoji: "📜" },
  { fr: "un serveur", es: "un camarero", example: "Excusez-moi, monsieur le serveur !", emoji: "🤵" },
  { fr: "l'addition", es: "la cuenta", example: "L'addition, s'il vous plaît !", emoji: "🧾" },
  { fr: "la terrasse", es: "la terraza", example: "On peut s'asseoir en terrasse ?", emoji: "🌿" },
  { fr: "sur place", es: "para tomar aquí", example: "C'est sur place ou à emporter ?", emoji: "🪑" },
  { fr: "à emporter", es: "para llevar", example: "À emporter, s'il vous plaît.", emoji: "🥡" },
  { fr: "une serviette", es: "una servilleta", example: "Vous avez une serviette ?", emoji: "🧻" },
  { fr: "je voudrais", es: "quisiera", example: "Je voudrais un café, s'il vous plaît.", emoji: "🙏" },
  { fr: "s'il vous plaît", es: "por favor (formal)", example: "Un thé, s'il vous plaît.", emoji: "✨" },
  { fr: "je peux avoir…", es: "¿podría tener…?", example: "Je peux avoir un peu de lait ?", emoji: "🤲" },
  { fr: "par carte", es: "con tarjeta", example: "Je peux payer par carte ?", emoji: "💳" },
  { fr: "en espèces", es: "en efectivo", example: "Je paye en espèces.", emoji: "💶" },
  { fr: "c'est combien ?", es: "¿cuánto es?", example: "C'est combien, le café ?", emoji: "❓" },
  { fr: "ça fait combien ?", es: "¿cuánto es en total?", example: "Ça fait combien pour les deux ?", emoji: "💰" },
  { fr: "la note", es: "la nota / la cuenta", example: "Je voudrais la note, s'il vous plaît.", emoji: "📝" },
  { fr: "chaud / froid", es: "caliente / frío", example: "Je voudrais quelque chose de chaud.", emoji: "🔥" },
  { fr: "avec / sans", es: "con / sin", example: "Un café avec du lait et sans sucre.", emoji: "➕" },
];

export const listenGame = [
  { fr: "Je voudrais un café, s'il vous plaît.", correct: "Quisiera un café, por favor.", options: ["Quisiera un café, por favor.", "Quisiera un té, por favor.", "Quiero la cuenta, gracias."] },
  { fr: "Sur place ou à emporter ?", correct: "¿Para tomar aquí o para llevar?", options: ["¿Caliente o frío?", "¿Para tomar aquí o para llevar?", "¿Con o sin azúcar?"] },
  { fr: "L'addition, s'il vous plaît !", correct: "¡La cuenta, por favor!", options: ["¡La carta, por favor!", "¡La cuenta, por favor!", "¡Una servilleta, por favor!"] },
  { fr: "Je peux payer par carte ?", correct: "¿Puedo pagar con tarjeta?", options: ["¿Puedo pagar en efectivo?", "¿Puedo pagar con tarjeta?", "¿Cuánto es en total?"] },
  { fr: "Une table pour deux, s'il vous plaît.", correct: "Una mesa para dos, por favor.", options: ["Una mesa para dos, por favor.", "Una silla libre, por favor.", "Un café para llevar, por favor."] },
  { fr: "Sans sucre, merci.", correct: "Sin azúcar, gracias.", options: ["Con leche, gracias.", "Sin azúcar, gracias.", "Caliente, gracias."] },
  { fr: "C'est combien, le café ?", correct: "¿Cuánto cuesta el café?", options: ["¿Cuánto cuesta el café?", "¿Dónde está el café?", "¿Tiene un café?"] },
  { fr: "Je voudrais un chocolat chaud.", correct: "Quisiera un chocolate caliente.", options: ["Quisiera un café caliente.", "Quisiera un té con leche.", "Quisiera un chocolate caliente."] },
  { fr: "On peut s'asseoir en terrasse ?", correct: "¿Podemos sentarnos en la terraza?", options: ["¿Podemos pagar la cuenta?", "¿Podemos sentarnos en la terraza?", "¿Podemos ver la carta?"] },
  { fr: "Avec un peu de lait, merci.", correct: "Con un poco de leche, gracias.", options: ["Sin azúcar, gracias.", "Con un poco de leche, gracias.", "Con hielo, por favor."] },
];

export const grammarPairs = [
  { wrong: "Je veux un café, s'il vous plaît.", right: "Je voudrais un café, s'il vous plaît." },
  { wrong: "Je veux payer par carte.", right: "Je voudrais payer par carte." },
  { wrong: "Je veux une table pour deux.", right: "Je voudrais une table pour deux." },
  { wrong: "Je veux la carte.", right: "Je voudrais la carte." },
  { wrong: "Je veux un thé au citron.", right: "Je voudrais un thé au citron." },
];

export const buildSentences = [
  { words: ["Je", "voudrais", "un", "café,", "s'il", "vous", "plaît."], answer: "Je voudrais un café, s'il vous plaît." },
  { words: ["Je", "voudrais", "une", "table", "pour", "deux."], answer: "Je voudrais une table pour deux." },
  { words: ["Je", "voudrais", "payer", "par", "carte."], answer: "Je voudrais payer par carte." },
  { words: ["Je", "voudrais", "la", "carte,", "s'il", "vous", "plaît."], answer: "Je voudrais la carte, s'il vous plaît." },
];

export const dialogue = [
  { who: "Serveur", text: "Bonjour, je voudrais un café et un croissant, s'il vous plaît." }, // intentionally — client speaks per spec, fix below
];

export const cafeDialogue: { who: "Client" | "Serveur"; text: string }[] = [
  { who: "Client", text: "Bonjour, je voudrais un café et un croissant, s'il vous plaît." },
  { who: "Serveur", text: "Sur place ou à emporter ?" },
  { who: "Client", text: "Sur place." },
  { who: "Serveur", text: "Avec du sucre ?" },
  { who: "Client", text: "Non, sans sucre, merci. Je peux payer par carte ?" },
  { who: "Serveur", text: "Bien sûr. Ça fait 4,50 euros." },
  { who: "Client", text: "Merci, bonne journée !" },
];

export const comprehensionQs = [
  {
    q: "¿Qué pide el cliente además del café?",
    options: ["Un pain au chocolat", "Un croissant", "Una tarta"],
    answer: "Un croissant",
  },
  {
    q: "¿Cómo quiere pagar?",
    options: ["En espèces", "Par carte", "Par chèque"],
    answer: "Par carte",
  },
];

// Roleplay scripted answers (mock IA)
export const roleplayScript = [
  { trigger: /caf[eé]|boisson|voudrais/i, reply: "Très bien ! Un café. Sur place ou à emporter ?" },
  { trigger: /sur place|place/i, reply: "Parfait. Avec du sucre ?" },
  { trigger: /sucre/i, reply: "D'accord. Vous voulez quelque chose à manger ? Un croissant peut-être ?" },
  { trigger: /croissant|pain|merci|non/i, reply: "Très bien. Ça fait 4,50 euros. Vous payez comment ?" },
  { trigger: /carte|esp[eè]ces|payer/i, reply: "Parfait, merci ! Bonne journée et à bientôt au café !" },
];
