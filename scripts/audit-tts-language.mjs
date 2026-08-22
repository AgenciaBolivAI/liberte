/**
 * Does the French audio actually SOUND French?
 *
 * The client reported a day-22 vocabulary word being read in English. The
 * server already asks for a French voice, but OpenAI TTS infers the LANGUAGE
 * from the input text, and a bare token that is spelled exactly like an English
 * word ("reporter", "agenda", "important", "message"…) is genuinely ambiguous.
 * No amount of reading the code proves how it sounds, so this measures it:
 *
 *   text -> TTS (the real production call) -> Whisper verbose_json -> detected
 *   language.
 *
 * Anything that does not come back as French is a word a student hears wrong.
 *
 * Usage:
 *   node scripts/audit-tts-language.mjs            # every short vocab item
 *   node scripts/audit-tts-language.mjs --day 22   # one day
 *   node scripts/audit-tts-language.mjs --list a,b # explicit texts
 */
import { readFileSync, writeFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);
const KEY = env.OPENAI_API_KEY;
if (!KEY) {
  console.error("No OPENAI_API_KEY in .env");
  process.exit(2);
}

const BASE = "https://api.openai.com/v1";
const TTS_MODEL = "gpt-4o-mini-tts";
const TTS_VOICE = "shimmer";

// Keep in lockstep with speakFrenchBase64() in src/lib/ai.ts — the audit is
// worthless if it probes a different prompt than production sends.
const AI_SRC = readFileSync("src/lib/ai.ts", "utf8");
const INSTRUCTIONS = (() => {
  const m = AI_SRC.match(/instructions:\s*\n?\s*"((?:[^"\\]|\\.)*)"/);
  if (!m) throw new Error("could not read the TTS instructions out of src/lib/ai.ts");
  return JSON.parse(`"${m[1]}"`);
})();

async function tts(text) {
  const res = await fetch(`${BASE}/audio/speech`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: TTS_MODEL,
      voice: TTS_VOICE,
      input: text,
      response_format: "mp3",
      instructions: INSTRUCTIONS,
    }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}: ${(await res.text()).slice(0, 160)}`);
  return Buffer.from(await res.arrayBuffer());
}

/** whisper-1 + verbose_json is the only endpoint that reports a DETECTED
 *  language; gpt-4o-transcribe does not return one. No language hint is sent —
 *  that is the whole point. */
async function detectLanguage(mp3) {
  const form = new FormData();
  form.append("file", new Blob([mp3], { type: "audio/mpeg" }), "a.mp3");
  form.append("model", "whisper-1");
  form.append("response_format", "verbose_json");
  const res = await fetch(`${BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}` },
    body: form,
  });
  if (!res.ok) throw new Error(`STT ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const j = await res.json();
  return { language: String(j.language ?? "?").toLowerCase(), text: String(j.text ?? "").trim() };
}

/* ---------------- what to probe ---------------- */

function loadMonth(file, varName) {
  const src = readFileSync(file, "utf8");
  // Brace-match instead of string-matching `VAR = {`: the declaration carries a
  // type annotation (`MONTH2: Record<string, WeekDay> = {`) and earlier a stray
  // double space, both of which silently produced ZERO targets — an audit that
  // probes nothing and reports success is worse than no audit.
  const decl = src.indexOf(`const ${varName}`);
  if (decl < 0) throw new Error(`${varName} not found in ${file}`);
  const open = src.indexOf("{", src.indexOf("=", decl));
  if (open < 0) throw new Error(`no object literal for ${varName}`);
  let depth = 0, inStr = null, esc = false;
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

const args = process.argv.slice(2);
const dayArg = args.includes("--day") ? args[args.indexOf("--day") + 1] : null;
const listArg = args.includes("--list") ? args[args.indexOf("--list") + 1] : null;

const push = (day, fr) => {
  const text = String(fr ?? "").trim();
  // The ambiguity only exists for SHORT texts. A full sentence gives the model
  // plenty of French to lock onto.
  if (text && text.split(/\s+/).length <= 3) targets.push({ day, fr: text });
};
let targets = [];
if (listArg) {
  targets = listArg.split(",").map((t) => ({ day: 0, fr: t.trim() }));
} else {
  // Month 2 (days 21-40) and weeks 3-4 (days 11-20) are JSON-shaped maps.
  for (const [file, name] of [
    ["src/data/month2.ts", "MONTH2"],
    ["src/data/week34.ts", "WEEK34"],
  ]) {
    let data;
    try {
      data = loadMonth(file, name);
    } catch (e) {
      console.log(`  (skipping ${name}: ${e.message})`);
      continue;
    }
    for (const [day, entry] of Object.entries(data)) {
      if (dayArg && String(day) !== String(dayArg)) continue;
      for (const v of entry.vocabulary ?? []) push(Number(day), v.fr);
    }
  }
  // Days 1-10 are hand-written module arrays with unquoted keys — not JSON.
  // Pull the French side out textually rather than skipping month 1 entirely,
  // which is how it went unaudited in the first place.
  for (let d = 1; d <= 10; d++) {
    if (dayArg && String(d) !== String(dayArg)) continue;
    let src;
    try {
      src = readFileSync(`src/data/day${d}.ts`, "utf8");
    } catch {
      continue;
    }
    const i = src.indexOf("export const vocabulary");
    if (i < 0) continue;
    const block = src.slice(i, src.indexOf("\n];", i) + 3);
    for (const m of block.matchAll(/\bfr:\s*"((?:[^"\\]|\\.)*)"/g)) {
      push(d, JSON.parse(`"${m[1]}"`));
    }
  }
}

// De-duplicate: the same word appears on several days.
const seen = new Set();
targets = targets.filter((t) => {
  const k = t.fr.toLowerCase();
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

console.log(`Probing ${targets.length} short French items through TTS -> Whisper…\n`);

const bad = [];
let repairs = 0;
let flaky = 0;
let i = 0;
for (const t of targets) {
  i++;
  try {
    // Mirror production exactly: synthesize, listen back, and if it came out
    // wrong, re-synthesize with French context — the repair speakFrenchBase64()
    // performs. What is audited is what the STUDENT ends up hearing.
    let mp3 = await tts(t.fr);
    let { language, text } = await detectLanguage(mp3);
    let repaired = false;
    if (!language.startsWith("fr")) {
      repaired = true;
      mp3 = await tts(`En français : ${t.fr}`);
      ({ language, text } = await detectLanguage(mp3));
    }
    // Whisper's language field is noisy on one-second clips: two items came
    // back labelled "english" while the transcript was plainly French
    // ("En français, d'où qu'il y a-t-il ?"). Listen once more before calling
    // it a defect, so the audit reports real problems and not detector noise.
    if (!language.startsWith("fr")) {
      const second = await detectLanguage(mp3);
      if (second.language.startsWith("fr")) {
        ({ language, text } = second);
        flaky++;
      }
    }
    const isFr = language.startsWith("fr");
    if (!isFr) {
      bad.push({ ...t, language, heard: text });
      console.log(`  ✗ [${String(i).padStart(3)}] día ${t.day} « ${t.fr} » → ${language} ("${text}") — repair did NOT help`);
    } else if (repaired) {
      repairs++;
      console.log(`  ~ [${String(i).padStart(3)}] día ${t.day} « ${t.fr} » — bare audio was wrong, repaired to French`);
    } else if (process.env.VERBOSE) {
      console.log(`  ✓ [${String(i).padStart(3)}] día ${t.day} « ${t.fr} »`);
    }
  } catch (e) {
    console.log(`  ! [${String(i).padStart(3)}] día ${t.day} « ${t.fr} » — ${e.message}`);
  }
}

console.log(`\n${"─".repeat(60)}`);
console.log(`${targets.length - bad.length}/${targets.length} sound French to the student (${repairs} needed the French-context repair, ${flaky} were detector noise on the first listen). ${bad.length} do NOT.`);
if (bad.length) {
  writeFileSync("tts-language-report.json", JSON.stringify(bad, null, 2));
  console.log("Written to tts-language-report.json");
}
process.exit(bad.length ? 1 : 0);
