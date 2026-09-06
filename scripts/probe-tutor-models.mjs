/**
 * Does the tutor stall because of the PROMPT, the MODEL, or the TEMPERATURE?
 *
 * The client says Lib "stops after a couple messages". Two failures are visible
 * in real stored conversations, both AFTER the prompt already forbade them:
 *
 *   día 7, 2026-08-26 — Lib, playing the supermarket employee, asked the
 *   customer « Où se trouve la caisse ? ». The student replied, baffled,
 *   « je ne travaille ici ». (role theft, despite the REGLA DE ORO)
 *
 *   día 1, 2026-08-26 — the student asked, in correct French, for help with
 *   pronunciation and grammar. Lib answered « Pardon, je n'ai pas compris »
 *   twice and the conversation died. (rigid scene kills a real attempt)
 *
 * This replays those exact histories through the REAL system prompt, N times
 * per model/temperature, and counts how often each failure reappears. Anything
 * else is opinion.
 *
 * Usage: npm run probe:tutor
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

const { buildTutorSystem } = await loadServerLib("src/lib/tutorPrompt.ts");
const { getTutorDayContext } = await loadServerLib("src/lib/tutorContext.ts");

const RUNS = Number(process.env.RUNS ?? 4);
const CANDIDATES = [
  { model: "gpt-4o-mini", temperature: undefined, label: "gpt-4o-mini @default(1.0)" },
  { model: "gpt-4o-mini", temperature: 0.6, label: "gpt-4o-mini @0.6" },
  { model: "gpt-4o", temperature: 0.6, label: "gpt-4o @0.6" },
];

/** The two real breakdowns, replayed up to the turn that went wrong. */
const CASES = [
  {
    key: "role-theft (día 7)",
    dayId: 7,
    history: [
      { role: "user", content: "Bonjour, oui, je cherche le rayon de fromages s'il vous plaît." },
      { role: "assistant", content: "Le rayon de fromages est au fond à droite." },
      { role: "user", content: "Merci beaucoup. Aussi, je voudrais un kilo de pommes de terre, s'il vous plaît." },
      { role: "assistant", content: "Très bien, un kilo de pommes de terre ! C'est tout ?" },
      { role: "user", content: "Non, je cherche aussi une boîte de fraises, s'il vous plaît." },
    ],
    /** Lib is the shop employee. Asking where the till is = stealing the customer's line. */
    fails: (reply) =>
      /o[uù]\s+(se\s+trouve|est)\s+la\s+caisse|je\s+voudrais|je\s+cherche|combien\s+(ça\s+)?co[uû]te/i.test(reply),
    failDesc: "asked the customer a question only the customer would ask",
  },
  {
    key: "rigid scene (día 1)",
    dayId: 1,
    history: [
      { role: "user", content: "Vous pouvez m'aider?" },
      { role: "assistant", content: "Bien sûr ! Qu'est-ce que vous désirez ?" },
      {
        role: "user",
        content:
          "Vous pouvez m'aider avec une chose pour mes premiers jours? Je pense que je fais mal la grammaire et la prononciation.",
      },
    ],
    /** The student wrote real French and asked a real question. Stonewalling
     *  them with "I didn't understand" is what ends the conversation. */
    fails: (reply) => /pas\s+compris|peux-tu\s+r[ée]p[ée]ter|pouvez-vous\s+r[ée]p[ée]ter|pardon\s*,?\s*je\s+ne/i.test(reply),
    failDesc: "stonewalled a genuine French question with « je n'ai pas compris »",
  },
];

async function turn(system, history, model, temperature) {
  const body = {
    model,
    messages: [{ role: "system", content: system }, ...history],
    response_format: { type: "json_object" },
    max_tokens: 1500,
  };
  if (typeof temperature === "number") body.temperature = temperature;
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) return { error: `HTTP ${r.status}` };
  const content = (await r.json()).choices?.[0]?.message?.content ?? "{}";
  try {
    const j = JSON.parse(content);
    return { reply: String(j.reply_fr ?? "").trim(), json: j };
  } catch {
    // This is the path that makes the app emit its canned "Pardon, peux-tu
    // répéter ?" — indistinguishable, to the student, from being ignored.
    return { reply: "", badJson: true };
  }
}

const results = [];
for (const cand of CANDIDATES) {
  for (const c of CASES) {
    const ctx = await getTutorDayContext(c.dayId);
    const system = buildTutorSystem(ctx, false);
    let failed = 0;
    let badJson = 0;
    let empty = 0;
    const samples = [];
    for (let i = 0; i < RUNS; i++) {
      const out = await turn(system, c.history, cand.model, cand.temperature);
      if (out.error) continue;
      if (out.badJson) badJson++;
      if (!out.reply) empty++;
      else if (c.fails(out.reply)) {
        failed++;
        if (samples.length < 2) samples.push(out.reply);
      }
    }
    results.push({ cand: cand.label, case: c.key, failed, badJson, empty, runs: RUNS, samples, desc: c.failDesc });
    console.log(
      `${cand.label.padEnd(26)} ${c.key.padEnd(22)} broke ${failed}/${RUNS}` +
        (badJson ? `  badJSON=${badJson}` : "") +
        (empty ? `  empty=${empty}` : ""),
    );
    for (const s of samples) console.log(`      ↳ "${s.slice(0, 96)}"`);
  }
}

cleanupServerLibs();
console.log(`\n${"─".repeat(72)}`);
for (const cand of CANDIDATES) {
  const mine = results.filter((r) => r.cand === cand.label);
  const total = mine.reduce((a, r) => a + r.failed + r.badJson + r.empty, 0);
  const runs = mine.reduce((a, r) => a + r.runs, 0);
  console.log(`${cand.label.padEnd(26)} ${total}/${runs} turns broke the scene`);
}
