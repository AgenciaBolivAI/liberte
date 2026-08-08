// DÍA 20 — "Quelle heure est-il ?" (client spec «Prompt Lovable Día 20», IDs 571-600).
//
// Replaces the old day-20 content (gym objectives + month recap) with the
// client's telling-the-time lesson: sport objectives 571-580 + l'heure 581-600,
// the IL EST + HEURE(S) grammar box, the "Ma journée complète" dialogue, the
// four activities and the day-20 AI coach.
//
// Writes:
//   supabase/migrations/20260730000000_day20_quelle_heure.sql  (authored_days.rich)
// and patches the code fallback entries in src/data/week34.ts + week34.meta.ts
// so the DB and the built-in copy never drift.
//
// Run:  node scripts/seed-day20-heure.mjs
import { readFileSync, writeFileSync } from "node:fs";

const GYM = "https://www.youtube.com/embed/AdJPOTR-CdU";
const w = (fr, es, example, emoji) => ({ fr, es, example, emoji });

/* ---------------- Section A + B — vocabulary (IDs 571-600) ---------------- */
const vocabulary = [
  // A · Objectifs et progrès (571-580)
  w("se tonifier", "tonificarse", "Je veux me tonifier — pas prendre de masse, juste me définir.", "💪"),
  w("perdre du poids", "perder peso", "Je ne cherche pas à perdre du poids — je veux juste être en forme.", "⚖️"),
  w("progresser", "progresar", "Je progresse chaque semaine — c'est la preuve que ça marche.", "📈"),
  w("se dépasser", "superarse", "Aujourd'hui, je me suis dépassée — une séance plus longue que d'habitude.", "🔥"),
  w("être en forme", "estar en forma", "Mon objectif : être en forme et me sentir bien dans mon corps.", "✨"),
  w("avoir des courbatures", "tener agujetas", "J'ai des courbatures partout — mais ça veut dire que j'ai bien travaillé !", "😣"),
  w("récupérer", "recuperarse", "Il faut laisser le corps récupérer — le repos est aussi un entraînement.", "😴"),
  w("se blesser", "lesionarse", "Je m'étire toujours après le sport pour ne pas me blesser.", "🤕"),
  w("la motivation", "la motivación", "Quand je perds la motivation, je pense à pourquoi j'ai commencé.", "🎯"),
  w("un objectif", "un objetivo", "Mon objectif pour ce mois : m'entraîner trois fois par semaine sans exception.", "🏁"),
  // B · L'heure et le temps (581-600)
  w("Quelle heure est-il ?", "¿Qué hora es? (formal)", "Excusez-moi, quelle heure est-il ?", "🕐"),
  w("Il est quelle heure ?", "¿Qué hora es? (informal)", "Il est quelle heure maintenant ?", "🕑"),
  w("il est… heure(s)", "son las… / es la…", "Il est six heures. Il est une heure.", "🕕"),
  w("il est midi", "es el mediodía", "Il est midi — on va déjeuner ?", "🍽️"),
  w("il est minuit", "es la medianoche", "Il est minuit — il faut dormir !", "🌙"),
  w("et quart", "y cuarto (+ 15 min)", "Il est sept heures et quart. → 7h15", "🕜"),
  w("et demie", "y media (+ 30 min)", "Il est sept heures et demie. → 7h30", "🕢"),
  w("moins le quart", "menos cuarto (− 15 min)", "Il est huit heures moins le quart. → 7h45", "🕥"),
  w("…pile", "en punto", "Il est six heures pile. → exactamente las 6h", "⏱️"),
  w("du matin", "de la mañana", "Je me lève à sept heures du matin.", "🌅"),
  w("de l'après-midi", "de la tarde", "Il est trois heures de l'après-midi.", "☀️"),
  w("du soir", "de la noche", "Je me couche à dix heures du soir.", "🌆"),
  w("vers", "hacia / alrededor de", "Je me couche vers 22h30.", "🔀"),
  w("tôt", "temprano", "Je me lève très tôt le matin.", "🐓"),
  w("tard", "tarde", "Je ne me couche jamais trop tard en semaine.", "🦉"),
  w("à [heure]", "a las [hora]", "Je m'entraîne à 18h.", "📍"),
  w("de [heure] à [heure]", "de X a X", "Je travaille de 9h à 17h.", "➡️"),
  w("environ / à peu près", "aproximadamente", "Il est environ 20h.", "⏳"),
  w("il est [heure] environ", "son aproximadamente las X", "Il est 7h environ — pas encore sûre.", "🌫️"),
  w("ma journée en français", "mi día en francés", "Je me lève à 6h30, je m'entraîne à 18h, je me couche vers 22h.", "📅"),
];

/* ---------------- Section C — grammar: IL EST + HEURE(S) ---------------- */
const grammar = [
  {
    formula: "Quelle heure est-il ? · Il est quelle heure ?",
    use: "Las dos formas de preguntar la hora: la primera es formal, la segunda es la que se oye a diario.",
  },
  {
    formula: "IL EST + [número] + HEURE(S)",
    use: "Il est une heure. · Il est deux heures. ⚠️ UNE heure — «heure» es femenino, es el único número que cambia.",
  },
  {
    formula: "IL EST MIDI · IL EST MINUIT",
    use: "12h00 y 00h00 tienen nombre propio: nunca «douze heures» ni «zéro heure», y no llevan «heures».",
  },
  {
    formula: "+ ET QUART · + ET DEMIE · + MOINS LE QUART",
    use: "7h15 → sept heures et quart · 7h30 → sept heures et demie · 7h45 → huit heures moins le quart. El ET y el LE son obligatorios.",
  },
  {
    formula: "DU MATIN · DE L'APRÈS-MIDI · DU SOIR",
    use: "En francés no existe AM ni PM: se precisa el momento del día solo cuando el contexto no es obvio.",
  },
  {
    formula: "VERS · TÔT · TARD · DE [heure] À [heure]",
    use: "Je me couche vers 22h30 (hora aproximada). · Je me lève tôt. · Je travaille de 9h à 17h (rango).",
  },
];

/* ---------------- Section E4 — quiz rápido (6 preguntas) ---------------- */
const flashQuiz = [
  {
    emoji: "🕖",
    concept: "«Son las siete y cuarto»",
    options: ["Il est sept heures et quart.", "Il est sept heures quart.", "Il est sept et quart heures."],
    answer: 0,
  },
  {
    emoji: "🍽️",
    concept: "¿Cuándo se dice MIDI en lugar del número?",
    options: ["Cuando son las 12h del día.", "Cuando son las 12h de la noche.", "Nunca — siempre «douze heures»."],
    answer: 0,
  },
  {
    emoji: "🕐",
    concept: "«Es la una»",
    options: ["Il est une heure.", "Il est un heure.", "Il est une heures."],
    answer: 0,
  },
  {
    emoji: "🕗",
    concept: "«Il est huit heures moins le quart» =",
    options: ["Son las ocho menos cuarto (7h45).", "Son las ocho y cuarto (8h15).", "Son las ocho y media (8h30)."],
    answer: 0,
  },
  {
    emoji: "🏋️",
    concept: "«Me entreno alrededor de las 18h»",
    options: ["Je m'entraîne vers 18h.", "Je m'entraîne à environ 18h.", "Je m'entraîne dans 18h."],
    answer: 0,
  },
  {
    emoji: "🕘",
    concept: "«De las 9h a las 17h»",
    options: ["De 9h à 17h.", "Entre 9h et 17h.", "Depuis 9h jusqu'à 17h."],
    answer: 0,
  },
];

/* ---------------- Section E1/E2 — activities on the vocabulary ---------------- */
const vocabGames = {
  reading: [
    {
      title: "Les erreurs classiques de l'heure",
      text:
        "Quatre phrases, quatre pièges. « Il est un heure » — non : heure est féminin, donc UNE heure. « Il est douze heures » — non : à midi on dit MIDI. « Il est sept et quart » — non : le mot HEURES ne disparaît jamais (sauf midi et minuit). « Il est huit heures moins quart » — non : l'article LE est obligatoire, moins LE quart.",
      questions: [
        {
          q: "¿Por qué «Il est un heure» es incorrecto?",
          options: ["Porque «heure» es femenino → une heure", "Porque falta «et»", "Porque se dice «midi»"],
          answer: 0,
        },
        {
          q: "¿Qué palabra falta en «Il est sept et quart» ?",
          options: ["heures", "le", "du matin"],
          answer: 0,
        },
        {
          q: "La forma correcta de 7h45 es:",
          options: ["Il est huit heures moins le quart.", "Il est huit heures moins quart.", "Il est sept heures quarante-cinq quart."],
          answer: 0,
        },
      ],
    },
  ],
  listening: [
    {
      audio: "Il est six heures et demie du matin.",
      question: "¿Qué hora se dice?",
      options: ["6h30", "6h15", "7h30"],
      answer: 0,
    },
    {
      audio: "Il est huit heures moins le quart.",
      question: "¿Qué hora se dice?",
      options: ["7h45", "8h15", "8h45"],
      answer: 0,
    },
    {
      audio: "Je m'entraîne de dix-huit heures à dix-neuf heures et demie.",
      question: "¿Cuánto dura el entrenamiento?",
      options: ["1h30", "1h", "2h"],
      answer: 0,
    },
  ],
  speaking: [
    { situation: "Son las 8h00 en punto. Dilo en francés.", expected: "Il est huit heures." },
    { situation: "Son las 10h15. Usa «et quart».", expected: "Il est dix heures et quart." },
    { situation: "Son las 6h30. Usa «et demie».", expected: "Il est six heures et demie." },
    { situation: "Son las 3h45. Usa «moins le quart».", expected: "Il est quatre heures moins le quart." },
    { situation: "Son las 12h00 del día.", expected: "Il est midi." },
    { situation: "Es la 1h00.", expected: "Il est une heure." },
  ],
  writing: [
    { prompt: "«Son las nueve de la mañana.»", answer: "Il est neuf heures du matin." },
    { prompt: "«Son las tres y cuarto de la tarde.»", answer: "Il est trois heures et quart de l'après-midi." },
    { prompt: "«Son las siete y media.»", answer: "Il est sept heures et demie." },
    { prompt: "«Son las once menos cuarto de la noche.»", answer: "Il est onze heures moins le quart du soir." },
    { prompt: "«Me levanto alrededor de las seis y media.»", answer: "Je me lève vers six heures et demie." },
    { prompt: "«Me acuesto muy tarde los viernes.»", answer: "Je me couche très tard le vendredi." },
  ],
};

/* ---------------- Section D — dialogue: Ma journée complète ---------------- */
const clesReading = {
  title: "Une journée en français — avec des heures !",
  text:
    "— Tu te lèves à quelle heure le matin ?\n— Je me lève à six heures et demie. Il est environ sept heures moins le quart quand je quitte la maison.\n\n— Et tu t'entraînes quand ?\n— Je m'entraîne de dix-huit heures à dix-neuf heures et demie. Après la séance, j'ai des courbatures — mais je me sens bien !\n\n— Tu as un objectif sportif cette année ?\n— Oui ! Mon objectif, c'est de progresser chaque semaine et d'être en forme. Je veux me dépasser — sans me blesser, bien sûr !\n\n— Et tu te couches tôt ?\n— Je me couche vers vingt-deux heures trente. Jamais trop tard — le corps a besoin de récupérer.",
  questions: [
    {
      q: "¿A qué hora sale de casa?",
      options: ["Hacia las 6h45", "A las 6h30", "A las 7h30"],
      answer: 0,
    },
    {
      q: "¿Cuál es su objetivo deportivo?",
      options: ["Progresar cada semana y estar en forma", "Perder peso rápido", "Competir este año"],
      answer: 0,
    },
    {
      q: "¿Por qué no se acuesta tarde?",
      options: ["Porque el cuerpo necesita recuperarse", "Porque trabaja de noche", "Porque se levanta a mediodía"],
      answer: 0,
    },
  ],
};

const clesGames = {
  listening: [
    {
      audio: "Je me couche vers vingt-deux heures trente. Jamais trop tard.",
      question: "¿A qué hora se acuesta?",
      options: ["Hacia las 22h30", "A las 23h30", "A las 20h30"],
      answer: 0,
    },
    {
      audio: "Il est environ sept heures moins le quart quand je quitte la maison.",
      question: "¿Qué expresión de aproximación usa?",
      options: ["environ", "pile", "vers midi"],
      answer: 0,
    },
  ],
  speaking: [
    {
      situation: "Cuenta a qué hora te levantas y a qué hora sales de casa.",
      expected: "Je me lève à six heures et demie et je quitte la maison vers sept heures moins le quart.",
    },
    {
      situation: "Di a qué hora te entrenas, usando «de… à…».",
      expected: "Je m'entraîne de dix-huit heures à dix-neuf heures et demie.",
    },
    {
      situation: "Explica tu objetivo deportivo de este mes.",
      expected: "Mon objectif, c'est de progresser chaque semaine et d'être en forme sans me blesser.",
    },
  ],
  writing: [
    {
      prompt: "Escribe tu mañana con horas (levantarte + salir de casa).",
      answer: "Je me lève à six heures et demie du matin. Il est sept heures moins le quart quand je quitte la maison.",
    },
    {
      prompt: "Escribe tu tarde/noche con horas (entrenar + acostarte).",
      answer: "Je m'entraîne de dix-huit heures à dix-neuf heures et demie et je me couche vers vingt-deux heures trente.",
    },
  ],
};

/* ---------------- Section E3 — the day's défi: ma journée complète ---------------- */
const defiSteps = [
  {
    serveur: "Tu te lèves à quelle heure le matin ?",
    hint: "Di la hora a la que te levantas y a la que sales de casa (usa et demie / moins le quart).",
    example: "Je me lève à six heures et demie. Il est sept heures moins le quart quand je quitte la maison.",
  },
  {
    serveur: "Et ta matinée, elle se passe comment ?",
    hint: "Di de qué hora a qué hora trabajas o estudias (de… à…).",
    example: "Je travaille de neuf heures à midi, puis je déjeune.",
  },
  {
    serveur: "Et tu t'entraînes quand ?",
    hint: "Di a qué hora entrenas y cómo te sientes después (courbatures, en forme…).",
    example: "Je m'entraîne de dix-huit heures à dix-neuf heures et demie. Après, j'ai des courbatures mais je me sens bien !",
  },
  {
    serveur: "Tu as un objectif ce mois-ci ?",
    hint: "Habla de tu objetivo deportivo: progresser, se dépasser, être en forme.",
    example: "Mon objectif, c'est de progresser chaque semaine et d'être en forme — sans me blesser.",
  },
  {
    serveur: "Et tu te couches à quelle heure ?",
    hint: "Termina tu día con una hora aproximada (vers) y tôt/tard.",
    example: "Je me couche vers vingt-deux heures trente. Jamais trop tard — le corps a besoin de récupérer.",
  },
];

const defiCriteria = [
  "Usa al menos 5 verbos (pronominales del Día 19 + vocabulario del Día 20)",
  "Expresa correctamente al menos 3 horas",
  "Usa et quart, et demie o moins le quart en al menos una frase",
  "Usa vers, tôt o tard en al menos una frase",
  "Menciona tu objetivo o cómo se siente el cuerpo (courbatures, en forme, récupérer)",
];

const tutor = {
  role:
    "Eres la IA Coach de Liberté en el Día 20 («Quelle heure est-il ?»). El alumno cuenta su rutina diaria CON HORAS reales, combinando los verbos pronominales del Día 19 con las expresiones de hora del Día 20. Corrige con cariño la construcción IL EST + heure(s), el uso de UNE heure, midi/minuit, et quart / et demie / moins le quart, y vers/tôt/tard. Celebra cada hora bien dicha.",
  opener_fr:
    "Bonjour ! On est au Jour 20 — le dernier jour de vocabulaire du mois. Dis-moi : ta journée, elle commence à quelle heure ?",
  opener_es:
    "¡Buenos días! Estamos en el Día 20 — el último día de vocabulario del mes. Cuéntame: ¿a qué hora empieza tu día?",
  // Exactly three — the tutor scene shape the suite enforces for every day.
  objectives: [
    "Preguntar y decir la hora: Quelle heure est-il ? / Il est… (midi, minuit, une heure)",
    "Usar et quart, et demie, moins le quart y situar la rutina con à, de… à…, vers, tôt, tard",
    "Hablar de objetivos y sensaciones deportivas: progresser, se dépasser, être en forme, courbatures",
  ],
  topic: "Cuéntame tu día con horas",
};

const meta = {
  label: "Jour 20 · Quelle heure est-il ?",
  headTitle: "Jour 20 · Quelle heure est-il ? — Liberté",
  headDesc: "Vingtième jour : l'heure en français et les objectifs sportifs — toute ta journée en français.",
  week: 4,
  weekEmoji: "🕐",
  intro:
    "Bienvenue au Jour 20 ! Aujourd'hui, l'heure en français — et ta journée complète, du réveil au coucher. Une formule simple, trois expressions clés, et tout le jour en français.",
  introSub: "L'heure en français.",
  clesSub: "IL EST + heure(s) — la hora.",
  defiTitle: "Ma journée complète",
  defiSubtitle: "Cuenta tu día entero en francés con horas reales: levantarte, trabajar, entrenar y acostarte.",
  defiAvatar: "🕐",
};

const day20 = {
  gym: GYM,
  vocabulary,
  flashQuiz,
  grammar,
  vocabGames,
  clesReading,
  clesGames,
  defiSteps,
  defiCriteria,
  tutor,
  meta,
};

/* ---------------- 1. SQL migration (authored_days.rich) ---------------- */
const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;
const sql =
  "-- Día 20 — «Quelle heure est-il ?» (client spec, IDs 571-600).\n" +
  "-- Replaces the previous day-20 content (gym objectives + month recap) with the\n" +
  "-- telling-the-time lesson: l'heure + objectifs sportifs, IL EST + HEURE(S),\n" +
  "-- the «Ma journée complète» dialogue, activities and the day-20 AI coach.\n" +
  "-- Idempotent: re-running simply rewrites day 20.\n\n" +
  "BEGIN;\n" +
  "UPDATE public.authored_days\n" +
  `   SET title = ${sqlStr(meta.label)},\n` +
  `       subtitle = ${sqlStr("L'heure en français — objectifs sportifs et ta journée complète")},\n` +
  "       status = 'published',\n" +
  `       rich = $json$${JSON.stringify(day20)}$json$::jsonb\n` +
  " WHERE day_id = 20;\n" +
  "COMMIT;\n";

const migration = "supabase/migrations/20260730000000_day20_quelle_heure.sql";
writeFileSync(migration, sql);

/* ---------------- 2. Patch the code fallback (week34.ts / week34.meta.ts) ---------------- */
// week34.ts is read back as STRICT JSON by scripts/test-all.mjs, so its last
// entry must not carry a trailing comma. week34.meta.ts is ordinary TS and keeps
// one, matching the surrounding style.
function replaceLastEntry(path, key, literal, trailingComma) {
  const src = readFileSync(path, "utf8").replace(/\r\n/g, "\n");
  const start = src.lastIndexOf(`\n  "${key}": {`);
  if (start === -1) throw new Error(`${path}: entry "${key}" not found`);
  const end = src.lastIndexOf("\n};");
  if (end === -1 || end < start) throw new Error(`${path}: closing brace not found`);
  const tail = trailingComma ? "," : "";
  writeFileSync(path, `${src.slice(0, start)}\n  "${key}": ${literal}${tail}${src.slice(end)}`);
}

const { meta: _m, ...content } = day20;
replaceLastEntry("src/data/week34.ts", "20", JSON.stringify(content, null, 2).replace(/\n/g, "\n  "), false);
replaceLastEntry(
  "src/data/week34.meta.ts",
  "20",
  JSON.stringify(meta, null, 2).replace(/\n/g, "\n  "),
  true,
);

console.log(
  `Wrote ${migration}\n` +
    `Patched src/data/week34.ts + src/data/week34.meta.ts (day 20)\n` +
    `vocabulary: ${vocabulary.length} · quiz: ${flashQuiz.length} · grammar: ${grammar.length} · défi steps: ${defiSteps.length}`,
);
