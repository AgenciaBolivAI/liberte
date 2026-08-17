/**
 * BONUS MES 2 — «JE COMPRENDS» (client spec: Mapa + Diccionario Mes 2).
 *
 * Two month-level bonuses that sit outside the 20 days:
 *   1. 30 expressions de la vraie vie (dictionary IDs 601-630) — the everyday
 *      phrases no academy teaches, each with a real exchange so the memory is
 *      emotional, not mechanical.
 *   2. Le genre en français — the endings that reliably reveal masculine or
 *      feminine, plus the exceptions, plus a 10-word intuition quiz.
 *
 * Content only. The bonus player renders it under the teacher's video.
 */

export type LifeExpression = {
  /** Dictionary id (601-630) — keeps this traceable to the client's document. */
  id: number;
  fr: string;
  es: string;
  /** A real exchange, the way the expression is actually heard. */
  example: string;
  exampleEs: string;
};

export const MONTH2_EXPRESSIONS: LifeExpression[] = [
  {
    id: 601,
    fr: "Comme d'habitude",
    es: "Como de costumbre",
    example: "C'est comme d'habitude, il est en retard.",
    exampleEs: "Como de costumbre, llega tarde.",
  },
  {
    id: 602,
    fr: "Pas de problème.",
    es: "Sin problema. / No hay problema.",
    example: "— Vous pouvez rappeler demain ? — Pas de problème !",
    exampleEs: "— ¿Puede llamar mañana? — ¡Sin problema!",
  },
  {
    id: 603,
    fr: "Ça marche !",
    es: "¡Vale! / ¡De acuerdo!",
    example: "— On se retrouve à 14h ? — Ça marche !",
    exampleEs: "— ¿Nos vemos a las 14h? — ¡De acuerdo!",
  },
  {
    id: 604,
    fr: "À toute !",
    es: "¡Hasta luego! (muy informal)",
    example: "— Je dois partir. À toute !",
    exampleEs: "— Tengo que irme. ¡Hasta luego!",
  },
  {
    id: 605,
    fr: "Bien sûr.",
    es: "Por supuesto. / Claro que sí.",
    example: "— Vous parlez français ? — Bien sûr !",
    exampleEs: "— ¿Habla usted francés? — ¡Por supuesto!",
  },
  {
    id: 606,
    fr: "C'est dommage.",
    es: "Es una lástima. / Qué pena.",
    example: "— Le concert est annulé. — C'est vraiment dommage.",
    exampleEs: "— El concierto está cancelado. — Qué lástima.",
  },
  {
    id: 607,
    fr: "Allez, courage !",
    es: "¡Venga, ánimo! / ¡Tú puedes!",
    example: "— L'examen est difficile. — Allez, courage, tu vas y arriver !",
    exampleEs: "— El examen es difícil. — ¡Ánimo, lo vas a conseguir!",
  },
  {
    id: 608,
    fr: "De toute façon",
    es: "De todas formas / De todas maneras",
    example: "De toute façon, on n'avait pas le choix.",
    exampleEs: "De todas formas, no teníamos otra opción.",
  },
  {
    id: 609,
    fr: "Je m'en charge.",
    es: "Yo me encargo. / Yo me ocupo.",
    example: "— Qui s'occupe des billets ? — Je m'en charge.",
    exampleEs: "— ¿Quién se ocupa de los billetes? — Yo me encargo.",
  },
  {
    id: 610,
    fr: "Ça y est !",
    es: "¡Listo! / ¡Ya está! / ¡Por fin!",
    example: "Ça y est, j'ai enfin trouvé mon siège !",
    exampleEs: "¡Ya está, por fin encontré mi asiento!",
  },
  {
    id: 611,
    fr: "Je vous en prie.",
    es: "No hay de qué. (formal)",
    example: "— Merci beaucoup. — Je vous en prie, c'est normal.",
    exampleEs: "— Muchas gracias. — No hay de qué.",
  },
  {
    id: 612,
    fr: "C'est la vie.",
    es: "Así es la vida.",
    example: "— Mon train est annulé. — C'est la vie…",
    exampleEs: "— Mi tren está cancelado. — Así es la vida…",
  },
  {
    id: 613,
    fr: "Félicitations !",
    es: "¡Felicitaciones! / ¡Enhorabuena!",
    example: "Félicitations pour votre promotion !",
    exampleEs: "¡Felicitaciones por tu ascenso!",
  },
  {
    id: 614,
    fr: "Il n'y a pas de quoi.",
    es: "No hay de qué. / De nada.",
    example: "— Merci pour votre aide. — Il n'y a pas de quoi !",
    exampleEs: "— Gracias por su ayuda. — ¡De nada!",
  },
  {
    id: 615,
    fr: "Franchement",
    es: "Francamente / Sinceramente / La verdad",
    example: "Franchement, je ne comprends pas pourquoi.",
    exampleEs: "Francamente, no entiendo por qué.",
  },
  {
    id: 616,
    fr: "Finalement",
    es: "Al final / Finalmente",
    example: "Finalement, on a décidé de rester.",
    exampleEs: "Al final, decidimos quedarnos.",
  },
  {
    id: 617,
    fr: "Ce n'est pas grave.",
    es: "No pasa nada. / No importa.",
    example: "— Je suis en retard. — Ce n'est pas grave, on t'attendait.",
    exampleEs: "— Llego tarde. — No pasa nada, te esperábamos.",
  },
  {
    id: 618,
    fr: "On verra.",
    es: "Ya veremos. / Se verá.",
    example: "— Tu viens demain ? — On verra, j'ai beaucoup de travail.",
    exampleEs: "— ¿Vienes mañana? — Ya veremos, tengo mucho trabajo.",
  },
  {
    id: 619,
    fr: "C'est parti !",
    es: "¡Vamos! / ¡Empezamos!",
    example: "Tout le monde est prêt ? C'est parti !",
    exampleEs: "¿Todo el mundo está listo? ¡Vamos!",
  },
  {
    id: 620,
    fr: "À bientôt !",
    es: "¡Hasta pronto!",
    example: "— Merci pour tout. — À bientôt !",
    exampleEs: "— Gracias por todo. — ¡Hasta pronto!",
  },
  {
    id: 621,
    fr: "Je suis désolé(e).",
    es: "Lo siento. / Disculpe.",
    example: "Je suis vraiment désolé pour le retard.",
    exampleEs: "Lo siento de verdad por el retraso.",
  },
  {
    id: 622,
    fr: "Avec plaisir !",
    es: "¡Con mucho gusto! / ¡Encantado/a!",
    example: "— Pouvez-vous m'aider ? — Avec plaisir !",
    exampleEs: "— ¿Puede ayudarme? — ¡Con mucho gusto!",
  },
  {
    id: 623,
    fr: "Tant mieux !",
    es: "¡Menos mal! / ¡Mejor así!",
    example: "— Ton vol n'est pas annulé. — Tant mieux !",
    exampleEs: "— Tu vuelo no está cancelado. — ¡Menos mal!",
  },
  {
    id: 624,
    fr: "Tant pis.",
    es: "Qué le vamos a hacer. / Mala suerte.",
    example: "— Je rate mon train. — Tant pis, il y en a un autre dans une heure.",
    exampleEs: "— Pierdo el tren. — Qué le vamos a hacer, hay otro en una hora.",
  },
  {
    id: 625,
    fr: "De rien.",
    es: "De nada.",
    example: "— Merci ! — De rien, c'était un plaisir.",
    exampleEs: "— ¡Gracias! — De nada, fue un placer.",
  },
  {
    id: 626,
    fr: "N'importe quoi !",
    es: "¡Tonterías! / ¡Qué dices!",
    example: "Tu dis n'importe quoi, ce n'est pas vrai !",
    exampleEs: "¡Dices tonterías, eso no es verdad!",
  },
  {
    id: 627,
    fr: "C'est exactement ça.",
    es: "Eso es exactamente. / Exacto.",
    example: "— Vous voulez dire que le vol est annulé ? — C'est exactement ça.",
    exampleEs: "— ¿Quiere decir que el vuelo está cancelado? — Eso es exactamente.",
  },
  {
    id: 628,
    fr: "Je vous laisse.",
    es: "Le dejo. (formal, para cerrar)",
    example: "Bien, je vous laisse, j'ai une réunion dans cinq minutes.",
    exampleEs: "Bueno, le dejo, tengo una reunión en cinco minutos.",
  },
  {
    id: 629,
    fr: "Laissez-moi vous expliquer.",
    es: "Déjeme explicarle.",
    example: "Laissez-moi vous expliquer la situation, s'il vous plaît.",
    exampleEs: "Déjeme explicarle la situación, por favor.",
  },
  {
    id: 630,
    fr: "Vous m'avez compris ?",
    es: "¿Me ha entendido? / ¿Quedó claro?",
    example: "Je répète les instructions. Vous m'avez bien compris ?",
    exampleEs: "Repito las instrucciones. ¿Me ha entendido bien?",
  },
];

/* ------------------------- Bonus 2 · le genre ------------------------- */

export type GenderRule = {
  ending: string;
  gender: "f" | "m";
  examples: string[];
};

/** The reliable endings — the ones worth trusting when you have to guess. */
export const GENDER_RULES: GenderRule[] = [
  {
    ending: "-tion / -sion",
    gender: "f",
    examples: ["la situation", "la réservation", "la décision"],
  },
  { ending: "-ure", gender: "f", examples: ["la voiture", "la signature", "la facture"] },
  { ending: "-ette", gender: "f", examples: ["la baguette", "l'étiquette", "la quittance"] },
  { ending: "-ance / -ence", gender: "f", examples: ["la chance", "l'agence", "l'assurance"] },
  { ending: "-ité", gender: "f", examples: ["la liberté", "la sécurité", "la disponibilité"] },
  { ending: "-ie", gender: "f", examples: ["la boulangerie", "la copropriété", "la compagnie"] },
  {
    ending: "-euse / -trice",
    gender: "f",
    examples: ["la vendeuse", "la contrôleuse", "la directrice"],
  },
  { ending: "-age", gender: "m", examples: ["le voyage", "le bagage", "le message"] },
  { ending: "-ment", gender: "m", examples: ["le document", "le paiement", "le règlement"] },
  { ending: "-eau", gender: "m", examples: ["le chapeau", "le bureau", "le cadeau"] },
  { ending: "-eur", gender: "m", examples: ["le vendeur", "le contrôleur", "le facteur"] },
  { ending: "-oir", gender: "m", examples: ["le couloir", "le miroir", "le comptoir"] },
];

export const GENDER_PLURALS = [
  "-eau → -eaux : le chapeau → les chapeaux · le bureau → les bureaux",
  "-al → -aux : le journal → les journaux · le total → les totaux",
];

export const GENDER_TRAPS = [
  "Los países terminados en -e son femeninos: la France, la Bolivie, la Suisse… salvo le Mexique.",
  "⚠️ -e NO siempre es femenino: le musée, le lycée, le stade, le problème, le système.",
  "El artículo es la señal definitiva: aprende cada palabra CON su artículo, nunca sola.",
];

export type GenderQuizItem = { word: string; gender: "f" | "m"; why: string };

/** The closing 10-word intuition quiz from the client's spec. */
export const GENDER_QUIZ: GenderQuizItem[] = [
  { word: "situation", gender: "f", why: "-tion → siempre femenino. LA situation." },
  { word: "voyage", gender: "m", why: "-age → masculino. LE voyage." },
  { word: "voiture", gender: "f", why: "-ure → femenino. LA voiture." },
  { word: "document", gender: "m", why: "-ment → masculino. LE document." },
  { word: "chance", gender: "f", why: "-ance → femenino. LA chance." },
  { word: "couloir", gender: "m", why: "-oir → masculino. LE couloir." },
  { word: "boulangerie", gender: "f", why: "-ie → femenino. LA boulangerie." },
  { word: "vendeur", gender: "m", why: "-eur → masculino. LE vendeur (femenino: la vendeuse)." },
  { word: "musée", gender: "m", why: "¡Trampa! Termina en -ée pero es masculino: LE musée." },
  { word: "liberté", gender: "f", why: "-ité → femenino. LA liberté — como nuestra escuela." },
];
