// Day 9 — Métro & transports publics. Prépositions de transport : en / à / par.

export const day9Videos = {
  gym: "https://www.youtube.com/embed/AdJPOTR-CdU",
  intro: "https://www.youtube.com/embed/iJ_kMC15_7g",
  vocab: "https://www.youtube.com/embed/3IE2UnvbwSU",
  grammar: "https://www.youtube.com/embed/8c6u5UVaK04",
};

export type Vocab9 = { fr: string; es: string; example: string; emoji: string };

export const day9Vocabulary: Vocab9[] = [
  { fr: "le métro", es: "el metro", example: "Je prends le métro chaque matin.", emoji: "🚇" },
  { fr: "le bus", es: "el autobús", example: "Le bus 73 va à l'Opéra.", emoji: "🚌" },
  { fr: "le tram", es: "el tranvía", example: "Le tram passe toutes les 5 minutes.", emoji: "🚊" },
  { fr: "le train", es: "el tren", example: "Je prends le train pour Lyon.", emoji: "🚆" },
  { fr: "une station", es: "una estación (metro/bus)", example: "La station Châtelet est très grande.", emoji: "🏙️" },
  { fr: "un arrêt", es: "una parada", example: "Je descends à l'arrêt suivant.", emoji: "🛑" },
  { fr: "une ligne", es: "una línea", example: "Je dois changer de ligne ?", emoji: "🧭" },
  { fr: "la direction", es: "la dirección / sentido", example: "Direction Châtelet — c'est le bon sens ?", emoji: "➡️" },
  { fr: "une correspondance", es: "un transbordo", example: "Il faut prendre une correspondance à Nation.", emoji: "🔁" },
  { fr: "un billet", es: "un billete", example: "Un billet, s'il vous plaît.", emoji: "🎟️" },
  { fr: "un ticket", es: "un ticket", example: "N'oubliez pas de valider votre ticket.", emoji: "🎫" },
  { fr: "un carnet", es: "un abono de viajes", example: "Un carnet de 10 tickets, s'il vous plaît.", emoji: "📇" },
  { fr: "un abonnement", es: "un abono mensual", example: "J'ai un abonnement mensuel.", emoji: "💳" },
  { fr: "un aller simple", es: "un billete de ida", example: "Un aller simple pour Versailles, s'il vous plaît.", emoji: "➡️" },
  { fr: "un aller-retour", es: "un billete de ida y vuelta", example: "Un aller-retour Paris-Lyon, s'il vous plaît.", emoji: "🔄" },
  { fr: "valider", es: "validar", example: "N'oubliez pas de valider votre billet !", emoji: "✅" },
  { fr: "un quai", es: "un andén", example: "Le train part du quai numéro 3.", emoji: "🚉" },
  { fr: "une voie", es: "una vía", example: "Voie B — départ dans 5 minutes.", emoji: "🛤️" },
  { fr: "le départ", es: "la salida (hora)", example: "Le départ est à 14h30.", emoji: "🕒" },
  { fr: "l'arrivée", es: "la llegada", example: "L'arrivée est prévue à 16h.", emoji: "🕓" },
  { fr: "un horaire", es: "un horario", example: "Je regarde les horaires en ligne.", emoji: "📅" },
  { fr: "un retard", es: "un retraso", example: "Il y a un retard de 10 minutes.", emoji: "⏰" },
  { fr: "une annulation", es: "una cancelación", example: "Il y a une annulation sur la ligne 4.", emoji: "❌" },
  { fr: "prochain", es: "próximo / siguiente", example: "Le prochain métro arrive dans 2 minutes.", emoji: "⏭️" },
  { fr: "direct", es: "directo", example: "Ce train est direct — pas de correspondance.", emoji: "🎯" },
  { fr: "en métro", es: "en metro", example: "J'y vais en métro.", emoji: "🚇" },
  { fr: "en bus", es: "en autobús", example: "Je préfère y aller en bus.", emoji: "🚌" },
  { fr: "à pied", es: "a pie", example: "C'est à 10 minutes à pied.", emoji: "🚶" },
  { fr: "composter", es: "picar el billete", example: "N'oubliez pas de composter votre ticket.", emoji: "🖊️" },
  { fr: "dernier", es: "último", example: "C'est le dernier métro à minuit.", emoji: "🌙" },
];

export type FlashQuiz9 = { emoji: string; concept: string; options: string[]; answer: number };

export const day9FlashQuiz: FlashQuiz9[] = [
  { emoji: "🚇", concept: "en métro (preposición)", options: ["à métro", "en métro", "par métro"], answer: 1 },
  { emoji: "🚶", concept: "a pie (preposición)", options: ["en pied", "à pied", "par pied"], answer: 1 },
  { emoji: "🚴", concept: "en bicicleta (preposición)", options: ["en vélo", "à vélo", "par vélo"], answer: 1 },
  { emoji: "🚆", concept: "en tren (formal)", options: ["à train", "en train", "par le train"], answer: 2 },
  { emoji: "🚌", concept: "en autobús", options: ["à bus", "en bus", "par bus"], answer: 1 },
  { emoji: "🎫", concept: "'validar el ticket'", options: ["valider le ticket", "composter le train", "acheter le quai"], answer: 0 },
  { emoji: "🚉", concept: "'el andén'", options: ["une voie", "un quai", "une ligne"], answer: 1 },
  { emoji: "🔁", concept: "'un transbordo'", options: ["une direction", "une correspondance", "un aller-retour"], answer: 1 },
  { emoji: "🎟️", concept: "'un billete de ida'", options: ["un aller-retour", "un aller simple", "un abonnement"], answer: 1 },
  { emoji: "⏰", concept: "'un retraso'", options: ["une annulation", "un retard", "un horaire"], answer: 1 },
  { emoji: "⏭️", concept: "'el próximo metro'", options: ["le dernier métro", "le prochain métro", "le direct métro"], answer: 1 },
  { emoji: "📇", concept: "'un abono de 10 tickets'", options: ["un abonnement", "un carnet", "un aller-retour"], answer: 1 },
];

// Défi entregable — Métro (día impar 9 · roleplay taquillero)
export const day9DefiSteps = [
  {
    serveur: "Bonjour ! Bienvenue au guichet. Je peux vous aider ?",
    hint: "Saluda y pide un billete usando « Je voudrais… » (aller simple o aller-retour).",
    example: "Bonjour ! Je voudrais un aller simple pour Versailles, s'il vous plaît.",
  },
  {
    serveur: "Très bien. Par le train ou par le RER ?",
    hint: "Elige el medio con la preposición correcta « par le train » o « par le RER ».",
    example: "Par le RER C, s'il vous plaît.",
  },
  {
    serveur: "Parfait. Voici votre billet. Autre chose ?",
    hint: "Pregunta qué línea debes tomar y en qué dirección para llegar a un lugar.",
    example: "Oui, pour aller à la Tour Eiffel, je dois prendre quelle ligne, et dans quelle direction ?",
  },
  {
    serveur: "Prenez la ligne 6, direction Nation. Descendez à Bir-Hakeim.",
    hint: "Pregunta si es directo o si hay que hacer un transbordo.",
    example: "C'est direct ou je dois faire une correspondance ?",
  },
  {
    serveur: "C'est direct. N'oubliez pas de valider votre ticket !",
    hint: "Agradece y despídete con cortesía.",
    example: "Merci beaucoup pour votre aide. Bonne journée !",
  },
];

// Grammar structures — Day 9 (Preposiciones de transporte)
export const day9GrammarStructures = [
  { formula: "EN + VÉHICULE FERMÉ", use: "Vehículo cerrado : en métro · en bus · en voiture · en avion · en bateau." },
  { formula: "À + SANS MOTEUR / PETIT", use: "Sin motor o pequeño : à pied · à vélo · à moto." },
  { formula: "PAR + MODE FORMEL", use: "Modo formal (textos, reservas) : par le train · par avion." },
  { formula: "⚠️ ERREURS À ÉVITER", use: "« en pied » ❌ · « en vélo » ❌ → siempre « à pied » ✓ · « à vélo » ✓." },
];
