/**
 * Throwaway-ish: which way of framing a short French word makes OpenAI TTS
 * reliably speak FRENCH? Instructions alone are not deterministic — the set of
 * words that come out English changes between runs — so measure the framings.
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env", "utf8").split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }),
);
const KEY = env.OPENAI_API_KEY;
const BASE = "https://api.openai.com/v1";

const INSTR =
  "The text is always FRENCH. Read it aloud in French, with French phonetics, never English and never Spanish — even for a single isolated word, and even when the word is spelled exactly like an English word (annuler, reporter, la date, agenda, client, message, important, double, table, menu, orange). Use a warm, encouraging tone, slightly slower than native pace, articulating each word so a beginner learner can follow.";

async function tts(input) {
  const r = await fetch(`${BASE}/audio/speech`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini-tts", voice: "shimmer", input, response_format: "mp3", instructions: INSTR }),
  });
  if (!r.ok) throw new Error(`TTS ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}
async function lang(mp3) {
  const f = new FormData();
  f.append("file", new Blob([mp3], { type: "audio/mpeg" }), "a.mp3");
  f.append("model", "whisper-1");
  f.append("response_format", "verbose_json");
  const r = await fetch(`${BASE}/audio/transcriptions`, { method: "POST", headers: { Authorization: `Bearer ${KEY}` }, body: f });
  if (!r.ok) throw new Error(`STT ${r.status}`);
  const j = await r.json();
  return { l: String(j.language ?? "?").toLowerCase(), t: String(j.text ?? "").trim() };
}

const WORDS = ["annuler", "reporter", "la date", "l'agenda", "noter", "D'accord.", "confirmer", "le motif"];
const STRATEGIES = {
  enFrancais: (w) => `En français : ${w}`,
  leMot: (w) => `Le mot : ${w}`,
  ecoutez: (w) => `Écoutez : ${w}`,
  trailing: (w) => `${w.replace(/[.!?]$/, "")}, en français.`,
};

const RUNS = Number(process.env.RUNS ?? 2);
const score = Object.fromEntries(Object.keys(STRATEGIES).map((k) => [k, { fr: 0, total: 0, bad: [] }]));

for (const w of WORDS) {
  const row = [];
  for (const [name, fn] of Object.entries(STRATEGIES)) {
    let frCount = 0;
    let sample = "";
    for (let r = 0; r < RUNS; r++) {
      try {
        const { l, t } = await lang(await tts(fn(w)));
        if (l.startsWith("fr")) frCount++;
        else { sample = `${l}:"${t}"`; }
      } catch (e) { sample = e.message; }
    }
    score[name].fr += frCount;
    score[name].total += RUNS;
    if (frCount < RUNS) score[name].bad.push(w);
    row.push(`${name}=${frCount}/${RUNS}${sample ? ` (${sample})` : ""}`);
  }
  console.log(`« ${w} »  ${row.join("  ")}`);
}

console.log(`\n${"─".repeat(70)}`);
for (const [name, s] of Object.entries(score)) {
  console.log(`${name.padEnd(12)} ${s.fr}/${s.total} French${s.bad.length ? `  — failed: ${[...new Set(s.bad)].join(", ")}` : "  ✓ ALL FRENCH"}`);
}
