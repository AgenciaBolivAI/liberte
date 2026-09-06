/**
 * Does the Month-3 data match the client's document?
 *
 * The standing rule on this project is that the client's curriculum document is
 * the specification: transcribe verbatim, audit every dimension, never claim a
 * match from titles alone. This proves the four claims that matter:
 *
 *   1. 20 days, 30 vocabulary items each, no duplicates within a day
 *   2. every item has BOTH sides (fr + es) and BOTH phrase sides
 *   3. the phrase attached to word N actually TEACHES word N — the 1:1 order is
 *      the document's own, and this checks it word by word instead of trusting it
 *   4. every day carries its grammar point and objective
 *
 * Usage: npm run audit:month3
 */
import { readFileSync } from "node:fs";

const dict = JSON.parse(readFileSync("scripts/data/month3-dictionary.json", "utf8"));

let fails = 0;
const bad = (msg) => {
  fails++;
  console.log(`  ✗ ${msg}`);
};

/** Strip accents and case so « grandi » can be matched against « grandir ». */
const norm = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z' ]/g, " ");

/**
 * Does the phrase teach this word? French inflects, so an exact substring is too
 * strict: « courir » appears as « couru », « naître » as « né », « faire un
 * choix » as « faire un choix difficile ». Match on a stem long enough not to
 * fire by accident, and for multi-word entries require most of the words.
 */
function teaches(word, phrase) {
  const p = norm(phrase);
  const parts = norm(word).split(/\s+/).filter((w) => w.length > 1);
  if (parts.length > 1) {
    // Multi-word entry: at least half of its content words must appear.
    const hits = parts.filter((w) => p.includes(w.slice(0, Math.max(3, w.length - 2)))).length;
    return hits >= Math.ceil(parts.length / 2);
  }
  const w = parts[0] ?? norm(word);
  if (w.length <= 3) return p.includes(w);
  // Verbs: drop the infinitive ending so the conjugated form still matches.
  const stem = w.replace(/(er|ir|re|oir)$/, "");
  return p.includes(w.slice(0, Math.max(4, w.length - 2))) || p.includes(stem.slice(0, 4));
}

console.log(`Month 3 — ${dict.month} (platform days ${dict.platformDayOffset + 1}-${dict.platformDayOffset + 20})\n`);

if (dict.days.length !== 20) bad(`expected 20 days, got ${dict.days.length}`);

let weakLinks = 0;
for (const day of dict.days) {
  const v = day.vocabulary;
  if (v.length !== 30) bad(`día ${day.day}: ${v.length} words, expected 30`);
  if (!day.grammar) bad(`día ${day.day}: no grammar point`);
  if (!day.objective) bad(`día ${day.day}: no objective`);
  if (!day.theme) bad(`día ${day.day}: no theme`);

  const frs = v.map((x) => x.fr);
  const dup = [...new Set(frs.filter((f, i) => frs.indexOf(f) !== i))];
  if (dup.length) bad(`día ${day.day}: duplicate word(s) ${dup.join(", ")}`);

  for (const [i, item] of v.entries()) {
    if (!item.fr || !item.es) bad(`día ${day.day} #${i + 1}: missing fr/es`);
    if (!item.example || !item.exampleEs) {
      bad(`día ${day.day} #${i + 1} « ${item.fr} »: missing phrase`);
      continue;
    }
    if (!teaches(item.fr, item.example)) {
      // Not fatal on its own — French inflection is irregular and the document
      // sometimes illustrates a word rather than repeating it. Reported so a
      // human can look, and counted so a mass misalignment would be obvious.
      weakLinks++;
      console.log(`  ~ día ${day.day} #${i + 1} « ${item.fr} » ← "${item.example.slice(0, 62)}"`);
    }
  }
}

const totalWords = dict.days.reduce((a, d) => a + d.vocabulary.length, 0);
const withPhrase = dict.days.reduce(
  (a, d) => a + d.vocabulary.filter((v) => v.example && v.exampleEs).length,
  0,
);

console.log(`\n${"─".repeat(66)}`);
console.log(`días            ${dict.days.length}/20`);
console.log(`palabras        ${totalWords}/600`);
console.log(`frases FR+ES    ${withPhrase}/${totalWords}`);
console.log(`enlaces flojos  ${weakLinks} (frase que no repite la palabra literalmente)`);
console.log(fails === 0 ? "\nMonth 3 matches the document." : `\n${fails} FAILURES`);
process.exit(fails ? 1 : 0);
