// Makes days 1-10 TEACHER-EDITABLE.
//
// Days 1-10 were hand-built React components ("Integrado", read-only in the
// content manager) while 11-40 are data-driven RichDay lessons the teacher can
// edit. This converts each built-in day into the SAME RichDay shape and seeds it
// into `authored_days` as a **draft**, so:
//   * students keep seeing the original built-in design (nothing changes until
//     the teacher saves/publishes their edited version), and
//   * the content manager can open days 1-10 in the rich editor, pre-filled with
//     the real current content instead of a blank form.
//
// Run: node scripts/gen-days1-10-rich.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import ts from "typescript";

/* ---- tiny TS module loader (these data files are pure data + relative imports) ---- */
const cache = new Map();
function loadTs(file) {
  const abs = resolve(file);
  if (cache.has(abs)) return cache.get(abs);
  const src = readFileSync(abs, "utf8");
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  const module = { exports };
  cache.set(abs, exports); // set early so circular re-exports resolve
  const req = (spec) => {
    // Support the "@/..." path alias used across src/ (vite/tsconfig paths).
    const base = spec.startsWith("@/")
      ? resolve("src", spec.slice(2))
      : spec.startsWith(".")
        ? resolve(dirname(abs), spec)
        : (() => { throw new Error(`unexpected import "${spec}" in ${file}`); })();
    // Asset descriptors (`*.asset.json`) are plain JSON — return them as the
    // default export, matching how vite hands them to the app.
    if (spec.endsWith(".json")) {
      const j = JSON.parse(readFileSync(base, "utf8"));
      return { default: j, ...j };
    }
    // Resolve FIRST, then load outside the try — otherwise a genuine error
    // inside the imported module gets swallowed and reported as "cannot resolve".
    const hit = [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`].find((c) => existsSync(c));
    if (!hit) throw new Error(`cannot resolve ${spec} from ${file}`);
    return loadTs(hit);
  };
  new Function("exports", "module", "require", js)(exports, module, req);
  // TS re-exports (`export { x } from "./y"`) are defined as GETTERS on
  // `exports`, so they can't be Object.assign-ed over. `exports` is already the
  // cached object; only swap it if the module replaced `module.exports` wholesale.
  if (module.exports !== exports) cache.set(abs, module.exports);
  return cache.get(abs);
}

const P = (n, suffix = "") => `src/data/day${n}${suffix}.ts`;
const g = (mod, ...names) => { for (const n of names) if (mod[n] !== undefined) return mod[n]; return undefined; };

/* ---- UI metadata (mirrors DAYS_META / LESSONS_BY_DAY in day.$dayId.tsx) ---- */
const META = {
  1:  { label: "Jour 1 · Le Café", week: 1, emoji: "🗼", introSub: "Ton premier café parisien.", clesSub: "Je voudrais — la politesse.", defiSub: "Roleplay con el camarero: pide tu primer café en francés." },
  2:  { label: "Jour 2 · Retour au café", week: 1, emoji: "🗼", introSub: "De retour au café.", clesSub: "4 structures pour choisir & décrire.", defiSub: "Ma première vraie conversation au café." },
  3:  { label: "Jour 3 · La Boulangerie", week: 1, emoji: "🗼", introSub: "La Boulangerie Liberté.", clesSub: "Quantités et politesse à la boulangerie.", defiSub: "Compra pan y viennoiserie como un parisino." },
  4:  { label: "Jour 4 · La Vitrine des Douceurs", week: 1, emoji: "🗼", introSub: "La vitrine des douceurs.", clesSub: "Choisir, comparer et commander.", defiSub: "Elige y pide en la pastelería." },
  5:  { label: "Jour 5 · Le Bistrot Liberté", week: 1, emoji: "🗼", introSub: "Le bistrot Liberté.", clesSub: "Révision de la semaine 1.", defiSub: "Une commande complète au bistrot." },
  6:  { label: "Jour 6 · Restaurant · Partie 2", week: 2, emoji: "🍽️", introSub: "Le restaurant, partie 2.", clesSub: "Régimes, allergies et addition.", defiSub: "Cena completa: pide, adapta el plato y paga." },
  7:  { label: "Jour 7 · Supermarché · Partie 1", week: 2, emoji: "🛒", introSub: "Au supermarché.", clesSub: "Trouver les rayons et demander de l'aide.", defiSub: "Haz la compra en el supermercado." },
  8:  { label: "Jour 8 · Faire les courses", week: 2, emoji: "🧺", introSub: "Faire les courses.", clesSub: "Quantités, prix et paiement.", defiSub: "Cantidades y precios en el mercado." },
  9:  { label: "Jour 9 · Le métro & les transports", week: 2, emoji: "🚇", introSub: "Le métro de Paris.", clesSub: "Acheter un ticket et demander la direction.", defiSub: "Compra tu billete y encuentra tu línea." },
  10: { label: "Jour 10 · Taxi & ville à pied", week: 2, emoji: "🚕", introSub: "Taxi & ville à pied.", clesSub: "Donner une adresse, demander le prix.", defiSub: "Toma un taxi y llega a tu destino." },
};

/* ---- tutor scenes already defined for days 1-10 ---- */
const tutorMod = loadTs("src/lib/tutorContext.ts");
const SCEN = tutorMod.TUTOR_SCENARIOS;
const TOPICS = tutorMod.TUTOR_DAY_TOPICS;

const GENERIC_CRITERIA = (m) => [
  "Saluda y usa fórmulas de cortesía apropiadas al contexto.",
  `Emplea el vocabulario clave del día (${m.label.replace(/^Jour \d+ · /, "")}).`,
  "Aplica la estructura gramatical del día correctamente.",
  "Responde a las preguntas del interlocutor sin cambiar al español.",
  "Pide aclaración o repetición si no entiende algo.",
  "Cierra la interacción con una despedida adecuada.",
];

const rich = {};
for (let n = 1; n <= 10; n++) {
  const base = loadTs(P(n));
  const les = loadTs(P(n, "Lessons"));
  const m = META[n];

  const videos = g(base, `day${n}Videos`, "videos") ?? {};
  const vocabulary = g(base, `day${n}Vocabulary`, "vocabulary") ?? [];
  const grammarStructures = g(base, `day${n}GrammarStructures`);
  const grammarPairs = g(base, "grammarPairs");
  const flashQuiz = g(base, `day${n}FlashQuiz`) ?? [];
  const defiSteps = g(base, `day${n}DefiSteps`);
  const roleplay = g(base, "roleplayScript");

  // Day 1 predates the shared shapes: convert its right/wrong pairs and its
  // regex-driven roleplay into the editable structures.
  const grammar = grammarStructures ?? (grammarPairs ?? []).map((p) => ({
    formula: p.right,
    use: `Di « ${p.right} » en lugar de « ${p.wrong} » (registro cortés).`,
  }));
  const steps = defiSteps ?? (roleplay ?? []).map((r, i) => ({
    serveur: r.reply,
    hint: `Responde al camarero (paso ${i + 1}) usando el vocabulario del día.`,
    example: "",
  }));

  rich[String(n)] = {
    gym: videos.gym ?? "",
    vocabulary,
    flashQuiz,
    grammar,
    vocabGames: {
      reading: g(les, `day${n}VocabReadingTexts`, "vocabReadingTexts") ?? [],
      listening: g(les, `day${n}VocabListeningMC`, "vocabListeningMC") ?? [],
      speaking: g(les, `day${n}VocabSpeakingItems`, "vocabSpeakingItems") ?? [],
      writing: g(les, `day${n}VocabWritingItems`, "vocabWritingItems") ?? [],
    },
    clesReading: g(les, `day${n}ClesReadingText`, "clesReadingText") ?? { title: "", text: "", questions: [] },
    clesGames: {
      listening: g(les, `day${n}ClesListeningMC`, "clesListeningMC") ?? [],
      speaking: g(les, `day${n}ClesSpeakingItems`, "clesSpeakingItems") ?? [],
      writing: g(les, `day${n}ClesWritingItems`, "clesWritingItems") ?? [],
    },
    defiSteps: steps,
    defiCriteria: GENERIC_CRITERIA(m),
    tutor: {
      role: SCEN[n]?.role ?? "",
      opener_fr: SCEN[n]?.opener_fr ?? "",
      opener_es: SCEN[n]?.opener_es ?? "",
      objectives: (SCEN[n]?.objectives ?? []).slice(0, 3),
      topic: TOPICS[n] ?? "",
    },
    meta: {
      label: m.label,
      headTitle: `${m.label} — Liberté`,
      headDesc: `${m.label}: lección completa del programa Liberté.`,
      week: m.week,
      weekEmoji: m.emoji,
      intro: `Bienvenue au ${m.label.split(" · ")[0]} ! ${m.introSub} Respire, tu es prêt.`,
      introSub: m.introSub,
      clesSub: m.clesSub,
      defiTitle: m.label.replace(/^Jour \d+ · /, ""),
      defiSubtitle: m.defiSub,
      defiAvatar: m.emoji,
    },
  };
}

/* ---- sanity: the conversion must not be empty ---- */
const problems = [];
for (const [d, r] of Object.entries(rich)) {
  if (!r.vocabulary.length) problems.push(`day ${d}: no vocabulary`);
  if (!r.grammar.length) problems.push(`day ${d}: no grammar`);
  if (!r.defiSteps.length) problems.push(`day ${d}: no defiSteps`);
  if (!r.vocabGames.listening.length) problems.push(`day ${d}: no vocab listening`);
}
if (problems.length) { console.error("CONVERSION PROBLEMS:\n  " + problems.join("\n  ")); process.exit(1); }

const sq = (s) => String(s).replace(/'/g, "''");
let rows = "";
for (let n = 1; n <= 10; n++) {
  const r = rich[String(n)];
  const json = JSON.stringify(r);
  if (json.includes("$rich$")) { console.error(`day ${n} contains the dollar-quote tag`); process.exit(1); }
  rows +=
    `INSERT INTO public.authored_days (day_id, title, subtitle, status, rich) VALUES (` +
    `${n}, '${sq(r.meta.label)}', '${sq(r.meta.clesSub)}', 'draft', $rich$${json}$rich$::jsonb)\n` +
    `ON CONFLICT (day_id) DO NOTHING;\n`;
}

const sql = `-- AUTO-GENERATED by scripts/gen-days1-10-rich.mjs — DO NOT EDIT BY HAND.
-- Makes days 1-10 editable from the content manager by seeding their existing
-- built-in content as RichDay rows.
--
-- The original table constrained day_id to 11-120 (days 1-10 were code-only);
-- widen it so the flagship days can hold their editable rows too.
ALTER TABLE public.authored_days DROP CONSTRAINT IF EXISTS authored_days_day_id_check;
ALTER TABLE public.authored_days ADD CONSTRAINT authored_days_day_id_check CHECK (day_id BETWEEN 1 AND 120);
--
-- Seeded as 'draft' ON PURPOSE: the lesson player only prefers a DB row for days
-- 1-10 once it is PUBLISHED, so students keep seeing the original built-in
-- design until a teacher actually saves their edited version. (Days 1 and 2 have
-- an extra bespoke step — "Bienvenue au café" / "Le Petit Plus" — that the
-- standard 5-step layout does not have; publishing replaces it.)
--
-- ON CONFLICT DO NOTHING: never clobber a teacher's saved edits on re-run.
${rows}`;

writeFileSync("supabase/migrations/20260726000000_seed_days1_10_rich.sql", sql);
console.log("Wrote supabase/migrations/20260726000000_seed_days1_10_rich.sql");
for (let n = 1; n <= 10; n++) {
  const r = rich[String(n)];
  console.log(`  day ${n}: ${r.vocabulary.length} vocab · ${r.flashQuiz.length} flash · ${r.grammar.length} gram · ` +
    `${r.vocabGames.listening.length}/${r.vocabGames.speaking.length}/${r.vocabGames.writing.length} vocab games · ` +
    `${r.defiSteps.length} défi steps`);
}
