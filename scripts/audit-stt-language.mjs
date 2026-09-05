/**
 * Does the platform actually UNDERSTAND French?
 *
 * Reported by a student: she said « Je m'entraîne trois fois par semaine », the
 * platform transcribed « Não vamos não. » — Portuguese — and graded it 0.0/10
 * against the expected phrase. `language: "fr"` was already being sent; the
 * model hallucinated on a quiet recording anyway, and nothing downstream ever
 * checked whether the words it produced were French.
 *
 * This drives the REAL transcribeFr() with real audio and asserts:
 *   - non-French speech never comes back as a gradeable transcript
 *   - genuine French — including a heavy beginner accent — always survives
 *
 * Usage: npm run audit:stt
 */
import { readFileSync } from "node:fs";
import { loadServerLib, cleanupServerLibs } from "./lib/load-server-lib.mjs";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);
if (!env.OPENAI_API_KEY) {
  console.error("No OPENAI_API_KEY in .env");
  process.exit(2);
}
process.env.OPENAI_API_KEY = env.OPENAI_API_KEY;

const ai = await loadServerLib("src/lib/ai.ts");

async function say(input, instructions) {
  const r = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input,
      response_format: "mp3",
      instructions,
    }),
  });
  if (!r.ok) throw new Error(`TTS ${r.status}: ${(await r.text()).slice(0, 120)}`);
  return Buffer.from(await r.arrayBuffer()).toString("base64");
}

const SPOKEN = [
  // Not French — the platform must not understand ANY of these.
  ["Portuguese (the reported case)", "Não vamos não. Eu não sei o que dizer.",
   "Read this Portuguese naturally.", false],
  ["Spanish", "No sé qué decir, la verdad no entiendo nada de esto.",
   "Read this Spanish naturally.", false],
  ["Spanish, short", "No sé. Yo no entiendo.", "Read this Spanish naturally.", false],
  ["Spanish, French-ish sounds", "Yo me levanto a las siete de la mañana.",
   "Read this Spanish naturally.", false],
  ["English", "I have no idea what I am supposed to say here.",
   "Read this English naturally.", false],
  ["English, short", "I don't know.", "Read this English naturally.", false],
  ["Portuguese, short", "Eu não sei.", "Read this Portuguese naturally.", false],
  // French — must ALWAYS survive, including a heavy beginner accent.
  ["French", "Je m'entraîne trois fois par semaine.", "Read this French naturally.", true],
  ["French, beginner Spanish accent", "Je me lève à sept heures.",
   "Read this French with a strong Spanish accent, hesitant beginner, uneven rhythm.", true],
  ["French, very heavy accent", "Je voudrais prendre rendez-vous.",
   "Read this French with a very heavy Spanish accent, mispronouncing the nasal vowels, unsure.", true],
  ["French, short answer", "Oui, d'accord.", "Read this French naturally.", true],
  ["French, one word", "Bonjour.", "Read this French naturally.", true],
];

// Free, exhaustive checks of the pure guard — no API, so they can be generous.
const NOT_FRENCH_TEXT = ["Não vamos não.", "¿Qué dices?", "Mañana la canción", "Ação não", "Está bien"];
const FRENCH_TEXT = [
  "Je m'entraîne trois fois par semaine.", "Je me lève à sept heures.", "Oui, d'accord.",
  "Bonjour madame, comment allez-vous ?", "Je voudrais un café s'il vous plaît",
  "Nous allons au marche demain", "trois fois par semaine",
];

let fails = 0;
const bad = (msg) => {
  fails++;
  console.log(`  ✗ ${msg}`);
};

console.log("Pure guard (no API):");
for (const s of NOT_FRENCH_TEXT) {
  if (ai.isDefinitelyNotFrench(s)) console.log(`  ✓ rejects "${s}"`);
  else bad(`should reject "${s}"`);
}
for (const s of FRENCH_TEXT) {
  if (!ai.isDefinitelyNotFrench(s) && ai.looksFrench(s)) console.log(`  ✓ keeps   "${s}"`);
  else bad(`should keep "${s}" (rejected=${ai.isDefinitelyNotFrench(s)}, french=${ai.looksFrench(s)})`);
}

console.log("\nReal audio through the real transcribeFr():");
for (const [label, text, instr, shouldSurvive] of SPOKEN) {
  try {
    const out = (await ai.transcribeFr(await say(text, instr), "audio/mpeg")).trim();
    const survived = out.length > 0;
    if (survived === shouldSurvive) {
      console.log(`  ✓ ${label.padEnd(34)} ${survived ? `"${out.slice(0, 44)}"` : "(discarded)"}`);
    } else {
      bad(`${label.padEnd(34)} ${survived ? `graded as "${out.slice(0, 44)}"` : "(discarded — a real French answer was thrown away)"}`);
    }
  } catch (e) {
    bad(`${label} — ${e.message}`);
  }
}

cleanupServerLibs();
console.log(`\n${"─".repeat(60)}`);
console.log(fails === 0 ? "The platform understands French." : `${fails} FAILURES`);
process.exit(fails ? 1 : 0);
