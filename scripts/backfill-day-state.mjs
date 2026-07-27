#!/usr/bin/env node
/**
 * ONE-TIME DATA REPAIR — day_state backfill + calendar zoom_url fix.
 *
 * WHY: day_state (per-lesson checkmarks + resume position) was NEVER written in
 * production until the persist() fix deployed 2026-07-25 (the un-awaited
 * `void supabase...upsert` bug). Students' finished days live in
 * day_completions / defi_results, but revisiting those days shows "gym
 * cérébral, 0 lessons, 0%" because the day_state row is missing or empty —
 * the "se borra el avance" reports. This seeds the missing rows so completed
 * days LOOK completed.
 *
 * Rules (idempotent, safe to re-run):
 *  - Only (user, day) pairs present in day_completions OR defi_results.
 *  - Only when the day_state row is MISSING or has done_lessons = [].
 *    A row with ANY real lesson progress is never touched.
 *  - done_lessons = the day's full lesson list; current_lesson = "defi".
 *  - stars / seconds_spent are preserved (0 for new rows: star_awards is the
 *    real star ledger; day_state.stars is only the per-day counter).
 *
 * Also repairs calendar_events "Clase Europa #4": its zoom_url holds the whole
 * pasted Zoom invitation text; we extract the real /j/ join link.
 *
 * Run:  node scripts/backfill-day-state.mjs          (dry-run, prints plan)
 *       node scripts/backfill-day-state.mjs --apply  (writes)
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);
// No WebSocket in Node 20 — stub the realtime transport (same as test-all.mjs).
const rt = { transport: class { constructor() { throw new Error("no realtime"); } } };
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: rt,
});
const APPLY = process.argv.includes("--apply");

// Lesson keys per day — must mirror LESSONS_BY_DAY in src/routes/day.$dayId.tsx.
function lessonsForDay(day) {
  if (day === 1) return ["gym", "cafe", "vocab", "cles", "defi"];
  if (day === 2) return ["gym", "intro", "vocab", "cles", "defi", "bonus"];
  return ["gym", "intro", "vocab", "cles", "defi"]; // days 3-10 and every data-driven day 11+
}

const [dc, dr, ds] = await Promise.all([
  admin.from("day_completions").select("user_id, day_id"),
  admin.from("defi_results").select("user_id, day_id"),
  admin.from("day_state").select("user_id, day_id, done_lessons, current_lesson, stars, seconds_spent"),
]);
for (const r of [dc, dr, ds]) if (r.error) throw new Error(r.error.message);

const doneByUser = new Map(); // user_id -> Set<day_id>
for (const row of [...(dc.data ?? []), ...(dr.data ?? [])]) {
  if (!doneByUser.has(row.user_id)) doneByUser.set(row.user_id, new Set());
  doneByUser.get(row.user_id).add(Number(row.day_id));
}
const stateByKey = new Map((ds.data ?? []).map((r) => [`${r.user_id}:${r.day_id}`, r]));

const plan = [];
for (const [userId, dayIds] of doneByUser) {
  for (const day of [...dayIds].sort((a, b) => a - b)) {
    const existing = stateByKey.get(`${userId}:${day}`);
    const empty = !existing || !Array.isArray(existing.done_lessons) || existing.done_lessons.length === 0;
    if (!empty) continue; // real progress present — never touch it
    plan.push({
      user_id: userId,
      day_id: day,
      done_lessons: lessonsForDay(day),
      current_lesson: "defi",
      stars: Number(existing?.stars ?? 0),
      seconds_spent: Number(existing?.seconds_spent ?? 0),
    });
  }
}

console.log(`day_state backfill: ${plan.length} rows to seed (completed days with missing/empty state)`);
for (const p of plan) console.log(`  ${p.user_id.slice(0, 8)}… day ${p.day_id} → [${p.done_lessons.join(",")}]`);

// Calendar repair: extract the join URL from any zoom_url that is not a URL.
const { data: events, error: evErr } = await admin
  .from("calendar_events")
  .select("id, title, zoom_url");
if (evErr) throw new Error(evErr.message);
const fixes = [];
for (const ev of events ?? []) {
  const t = (ev.zoom_url ?? "").trim();
  if (!t || /^https?:\/\/\S+$/.test(t)) continue;
  const urls = t.match(/https?:\/\/[^\s<>")]+/g) ?? [];
  const url = urls.find((u) => /zoom\.us\/j\//.test(u)) ?? urls[0] ?? null;
  fixes.push({ id: ev.id, title: ev.title, from: t.slice(0, 60) + "…", to: url });
}
console.log(`calendar zoom_url repairs: ${fixes.length}`);
for (const f of fixes) console.log(`  "${f.title}": → ${f.to}`);

if (!APPLY) {
  console.log("\nDRY RUN — nothing written. Re-run with --apply to write.");
  process.exit(0);
}

let wrote = 0;
for (const p of plan) {
  const { error } = await admin
    .from("day_state")
    .upsert(p, { onConflict: "user_id,day_id" });
  if (error) console.error(`  FAILED ${p.user_id.slice(0, 8)} day ${p.day_id}: ${error.message}`);
  else wrote++;
}
for (const f of fixes) {
  const { error } = await admin.from("calendar_events").update({ zoom_url: f.to }).eq("id", f.id);
  if (error) console.error(`  FAILED event ${f.title}: ${error.message}`);
}
console.log(`\nDone: ${wrote}/${plan.length} day_state rows seeded, ${fixes.length} calendar rows repaired.`);
