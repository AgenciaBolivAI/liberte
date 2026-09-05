/**
 * Does the written-French detector ever refuse REAL French?
 *
 * The rule is that a written answer in Spanish or Portuguese is not understood.
 * The danger of that rule is the opposite error: refusing a student who really
 * did write French. So this runs the detector over every French string the
 * course itself teaches — vocabulary, examples, expected answers — and fails if
 * a single one is classified "not-french".
 *
 * Then it checks a Spanish/Portuguese corpus is refused.
 *
 * Free and exhaustive: no API calls.
 *
 * Usage: npm run audit:text
 */
import { readFileSync } from "node:fs";
import { loadServerLib, cleanupServerLibs } from "./lib/load-server-lib.mjs";

const { frenchness } = await loadServerLib("src/lib/french-text.ts");

/* ---------------- collect every French string in the curriculum ---------------- */

function objectLiteral(file, varName) {
  const src = readFileSync(file, "utf8");
  const decl = src.indexOf(`const ${varName}`);
  if (decl < 0) throw new Error(`${varName} not found in ${file}`);
  const open = src.indexOf("{", src.indexOf("=", decl));
  let depth = 0;
  let inStr = null;
  let esc = false;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") inStr = c;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return JSON.parse(src.slice(open, i + 1));
  }
  throw new Error(`unbalanced object for ${varName}`);
}

const french = [];
const seen = new Set();
const add = (day, what, s) => {
  const text = String(s ?? "").trim();
  if (!text || seen.has(text)) return;
  seen.add(text);
  french.push({ day, what, text });
};

for (const [file, name] of [
  ["src/data/month2.ts", "MONTH2"],
  ["src/data/week34.ts", "WEEK34"],
]) {
  let data;
  try {
    data = objectLiteral(file, name);
  } catch (e) {
    console.log(`  (skipping ${name}: ${e.message})`);
    continue;
  }
  for (const [day, entry] of Object.entries(data)) {
    for (const v of entry.vocabulary ?? []) {
      add(day, "vocab", v.fr);
      add(day, "example", v.example);
    }
    for (const g of entry.grammar ?? []) {
      add(day, "grammar", g.fr ?? g.title);
      add(day, "grammar-ex", g.example);
    }
    for (const p of entry.parler ?? entry.speaking ?? []) add(day, "expected", p.expected);
  }
}
// Days 1-10 are hand-written module arrays, not JSON.
for (let d = 1; d <= 10; d++) {
  let src;
  try {
    src = readFileSync(`src/data/day${d}.ts`, "utf8");
  } catch {
    continue;
  }
  for (const m of src.matchAll(/\b(?:fr|example|expected)\s*:\s*"((?:[^"\\]|\\.)*)"/g)) {
    add(String(d), "day-module", JSON.parse(`"${m[1]}"`));
  }
}

/* ---------------- the corpus that MUST be refused ---------------- */

const NOT_FRENCH = [
  "No sé qué decir, la verdad no entiendo nada",
  "Hola, quiero practicar mi francés",
  "No entiendo la pregunta, ¿me puedes ayudar?",
  "Yo me levanto a las siete de la mañana",
  "Não vamos não. Eu não sei o que dizer.",
  "Eu não sei falar francês ainda",
  "Muito obrigado pela ajuda",
  "Mañana voy a estudiar mucho",
  "Todavía no aprendo bien esto",
  "Gracias, ahora entiendo mejor",
];

/* ---------------- run ---------------- */

let fails = 0;
const buckets = { french: 0, unsure: 0, "not-french": 0 };

for (const item of french) {
  const verdict = frenchness(item.text);
  buckets[verdict]++;
  if (verdict === "not-french") {
    fails++;
    console.log(`  ✗ REAL FRENCH REFUSED — día ${item.day} (${item.what}): « ${item.text} »`);
  }
}

console.log(`Curriculum French: ${french.length} strings`);
console.log(`  french     ${buckets.french}`);
console.log(`  unsure     ${buckets.unsure}   (allowed through to normal correction)`);
console.log(`  not-french ${buckets["not-french"]}   (must be 0)\n`);

for (const s of NOT_FRENCH) {
  const verdict = frenchness(s);
  if (verdict === "not-french") console.log(`  ✓ refused: "${s}"`);
  else {
    fails++;
    console.log(`  ✗ NOT REFUSED (${verdict}): "${s}"`);
  }
}

cleanupServerLibs();
console.log(`\n${"─".repeat(64)}`);
console.log(fails === 0 ? "Written French detector is safe." : `${fails} FAILURES`);
process.exit(fails ? 1 : 0);
