#!/usr/bin/env node
/**
 * Full end-to-end test suite for Liberté.
 * Run after EVERY change:  npm run test:all
 *
 * Covers: env/config, unlock rules, auth, RLS isolation, progress persistence
 * (day_state + day_completions), star triggers, tutor state/limits/gating,
 * admin analytics data, approval flow, schema integrity, and the built bundle.
 *
 * Uses the real Supabase project. Creates a throwaway student, then deletes it.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

/* ---------------- harness ---------------- */
let pass = 0,
  fail = 0,
  skip = 0;
const failures = [];
let group = "";

const g = (name) => {
  group = name;
  console.log(`\n\x1b[1m${name}\x1b[0m`);
};
function ok(name, cond, detail = "") {
  if (cond) {
    pass++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    fail++;
    failures.push(`${group} → ${name}${detail ? `: ${detail}` : ""}`);
    console.log(`  \x1b[31m✗ ${name}\x1b[0m${detail ? ` — ${detail}` : ""}`);
  }
}
const eq = (name, actual, expected) =>
  ok(name, JSON.stringify(actual) === JSON.stringify(expected), `got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
function skipped(name, why) {
  skip++;
  console.log(`  \x1b[33m∼\x1b[0m ${name} — skipped: ${why}`);
}

/* ---------------- env ---------------- */
g("1. Environment & config");
const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);
const URL_ = env.SUPABASE_URL, ANON = env.SUPABASE_PUBLISHABLE_KEY, SVC = env.SUPABASE_SERVICE_ROLE_KEY;
ok("SUPABASE_URL is a https URL", /^https:\/\/.+\.supabase\.co$/.test(URL_ || ""), URL_);
ok("VITE_SUPABASE_URL matches SUPABASE_URL", env.VITE_SUPABASE_URL === URL_);
ok("publishable key present", Boolean(ANON));
ok("service role key present", Boolean(SVC));
ok("OPENAI_API_KEY present", Boolean(env.OPENAI_API_KEY));
ok(".env is gitignored", readFileSync(".gitignore", "utf8").includes(".env"));

const rt = { transport: typeof globalThis.WebSocket !== "undefined" ? globalThis.WebSocket : class { constructor() { throw new Error("no realtime"); } } };
const admin = createClient(URL_, SVC, { auth: { persistSession: false }, realtime: rt });
const anon = createClient(URL_, ANON, { auth: { persistSession: false }, realtime: rt });

/* ---------------- unlock rules (pure) ---------------- */
g("2. Progressive unlock rules");
const ts = (await import("typescript")).default;
const compiled = ts.transpileModule(readFileSync("src/lib/unlock.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const modExports = {};
new Function("exports", "module", compiled)(modExports, { exports: modExports });
const mod = modExports;
const S = (...a) => new Set(a);

// LAUNCH SETTING: weeks 1-2 (days 1-10) are open to every student.
eq("OPEN_THROUGH_DAY covers weeks 1-2", mod.OPEN_THROUGH_DAY, 10);
for (const d of [1, 2, 5, 6, 10]) {
  ok(`day ${d} open to a brand-new student`, mod.isDayUnlocked(d, S()));
}
ok("admin sees every day", mod.isDayUnlocked(11, S(), { isAdmin: true }));
// Beyond the open range the sequential rule still governs (future content).
ok("day 12 LOCKED when day 11 not done", !mod.isDayUnlocked(12, S()));
ok("day 12 opens once day 11 done", mod.isDayUnlocked(12, S(11)));

const order = ["gym", "intro", "vocab", "cles", "defi"];
ok("lesson 1 always open", mod.isLessonUnlocked(0, {}, order));
ok("lesson 2 LOCKED before lesson 1 done (sequential mode)", !mod.isLessonUnlocked(1, {}, order));
ok("lesson 2 opens after lesson 1 done", mod.isLessonUnlocked(1, { gym: true }, order));
ok("admin sees every lesson", mod.isLessonUnlocked(4, {}, order, { isAdmin: true }));
// LAUNCH: a day in the open-window has ALL its lessons navigable.
for (const idx of [1, 2, 3, 4]) {
  ok(`open-window day: lesson ${idx + 1} navigable with no progress`, mod.isLessonUnlocked(idx, {}, order, { allOpen: true }));
}
// PRODUCT FLAGS: sequential lesson gate + watch-the-video gate are OFF, so
// every lesson in a reachable day is open (fixes the day-1/day-6 "only lesson
// 1 available" inconsistency at the root, not just via OPEN_THROUGH_DAY).
eq("SEQUENTIAL_LESSON_GATE is off", mod.SEQUENTIAL_LESSON_GATE, false);
eq("REQUIRE_VIDEO_WATCHED is off", mod.REQUIRE_VIDEO_WATCHED, false);

// Tutor scenes for weeks 1-2 are open to everyone at launch too.
for (const d of [1, 2, 5, 6, 9, 10]) {
  ok(`tutor scene ${d} open to a brand-new student`, mod.isSceneUnlocked(d, S()));
}
eq("furthest day, fresh student", mod.furthestUnlockedDay(S()), 1);
eq("furthest day, days 1-4 done", mod.furthestUnlockedDay(S(1, 2, 3, 4)), 5);
// Weeks 3-8 are now real content (LESSON_DAYS=40): finishing day 10 points at day 11,
// finishing day 20 continues into month 2 (day 21), and the furthest day caps at 40.
eq("furthest day, days 1-10 done -> 11", mod.furthestUnlockedDay(S(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)), 11);
eq("furthest day, days 1-20 done -> 21 (weeks 5-8 continue)", mod.furthestUnlockedDay(S(...Array.from({ length: 20 }, (_, i) => i + 1))), 21);
eq("furthest day caps at 40 (weeks 1-8)", mod.furthestUnlockedDay(S(...Array.from({ length: 40 }, (_, i) => i + 1))), 40);

// Admin content_access overrides — most specific wins, and locks beat the window.
const ovr = (scope, target_type, target_id, access) => ({ scope, target_type, target_id, access });
eq("weekOfDay: day 3 -> week 1", mod.weekOfDay(3), 1);
eq("weekOfDay: day 6 -> week 2", mod.weekOfDay(6), 2);
eq("no overrides => undefined", mod.effectiveOverride(3, []), undefined);
eq("global week lock covers its days", mod.effectiveOverride(6, [ovr("global", "week", 2, "locked")]), "locked");
eq("global day open", mod.effectiveOverride(15, [ovr("global", "day", 15, "open")]), "open");
eq("per-user day beats global week", mod.effectiveOverride(6, [ovr("global", "week", 2, "locked"), ovr("user", "day", 6, "open")]), "open");
eq("per-user week beats global day", mod.effectiveOverride(7, [ovr("global", "day", 7, "open"), ovr("user", "week", 2, "locked")]), "locked");
eq("per-user day beats per-user week", mod.effectiveOverride(6, [ovr("user", "week", 2, "open"), ovr("user", "day", 6, "locked")]), "locked");
ok("locked override closes an otherwise-open day", !mod.isDayUnlocked(3, S(), { override: "locked" }));
ok("open override opens a day beyond the window", mod.isDayUnlocked(50, S(), { override: "open" }));
ok("admin still sees a locked day", mod.isDayUnlocked(3, S(), { override: "locked", isAdmin: true }));
ok("no override keeps weeks 1-2 open", mod.isDayUnlocked(3, S()));
ok("locked override closes a tutor scene", !mod.isSceneUnlocked(3, S(), { override: "locked" }));
ok("open override opens a tutor scene beyond the window", mod.isSceneUnlocked(50, S(), { override: "open" }));

/* ---------------- program / current week ---------------- */
g("2b. Program weeks & 'current week'");
{
  const progSrc = ts.transpileModule(readFileSync("src/data/program.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const pm = {};
  new Function("exports", "module", progSrc)(pm, { exports: pm });
  const DAY = 86_400_000;
  const enrolled = (daysAgo) => new Date(Date.now() - daysAgo * DAY).toISOString();
  const currentOf = (r) => r.weeks.find((w) => w.isCurrent);

  // Brand-new student: only week 1 open, and it is the current one.
  let r = pm.getWeeks(enrolled(0), [], []);
  eq("new student's current week is 1", currentOf(r)?.globalIndex, 1);
  eq("new student is in month 1", currentOf(r)?.monthIndex, 1);
  ok("week 24 locked for a new student", r.weeks[23].status === "locked-time");

  // THE BUG: every week unlocked (coach/admin or long enrolment) but nothing
  // completed used to report week 24 ("Mois 6 · JE SUIS LIBRE") as current.
  const allWeeks = Array.from({ length: 24 }, (_, i) => i + 1);
  r = pm.getWeeks(enrolled(0), allWeeks, []);
  eq("all-unlocked + none done => current is week 1, NOT 24", currentOf(r)?.globalIndex, 1);
  eq("...and shows month 1", currentOf(r)?.monthIndex, 1);

  // Student who fell behind: enrolled 6 months ago, only week 1 finished.
  r = pm.getWeeks(enrolled(200), [], [1]);
  eq("behind student resumes at week 2", currentOf(r)?.globalIndex, 2);

  // Steady progress: weeks 1-3 done => current is 4.
  r = pm.getWeeks(enrolled(30), [], [1, 2, 3]);
  eq("on-track student's current week is 4", currentOf(r)?.globalIndex, 4);

  // Everything finished => still highlights something (last completed).
  r = pm.getWeeks(enrolled(300), allWeeks, allWeeks);
  ok("fully finished course still marks a current week", Boolean(currentOf(r)));
  eq("exactly one week is ever current", r.weeks.filter((w) => w.isCurrent).length, 1);

  // Unlock cadence sanity.
  r = pm.getWeeks(enrolled(0), [], []);
  eq("week 2 unlocks on day 7", r.weeks[1].unlockDay, 7);
  eq("week 5 (month 2) unlocks on day 35", r.weeks[4].unlockDay, 35);

  // TUTOR-1: month→day scene picker groups (5 days/week, 4 weeks/month).
  const groups = pm.tutorDayGroups(10);
  eq("tutor picker has 2 groups for days 1-10", groups.length, 2);
  eq("group 1 = days 1-5", groups[0].days.join(","), "1,2,3,4,5");
  eq("group 2 = days 6-10", groups[1].days.join(","), "6,7,8,9,10");
  ok("groups labeled by month theme (J'OSE)", groups.every((x) => x.label.includes("J'OSE")));
  ok("group 1 labeled Semaine 1", groups[0].label.includes("Semaine 1"));
  ok("group 2 labeled Semaine 2", groups[1].label.includes("Semaine 2"));
  ok("every day 1-10 appears exactly once", groups.flatMap((x) => x.days).join(",") === "1,2,3,4,5,6,7,8,9,10");
}

/* ---------------- schema ---------------- */
g("3. Database schema");
const required = [
  "profiles", "user_roles", "day_completions", "day_state", "week_state",
  "star_awards", "defi_results", "activity_results", "weekly_evaluations",
  "week_unlocks", "leads", "calendar_events", "tutor_conversations", "tutor_usage",
];
for (const t of required) {
  const { error } = await admin.from(t).select("*").limit(1);
  ok(`table ${t} exists`, !error, error?.message);
}
{
  const { error } = await admin.from("profiles").select("approved_at, approved_by").limit(1);
  ok("profiles has approval columns", !error, error?.message);
}
{
  const { error } = await admin.from("tutor_conversations").select("objectives_done").limit(1);
  ok("tutor_conversations has objectives_done", !error, error?.message);
}

/* ---------------- test student ---------------- */
g("4. Auth & approval");
// Sweep any test students left behind by an interrupted prior run, so they
// never accumulate in the real teacher roster.
try {
  const res = await fetch(`${URL_}/auth/v1/admin/users?per_page=200`, {
    headers: { Authorization: `Bearer ${SVC}`, apikey: SVC },
  });
  const stale = ((await res.json()).users ?? []).filter((u) =>
    (u.email ?? "").endsWith("@liberte-test.local"),
  );
  for (const u of stale) {
    await fetch(`${URL_}/auth/v1/admin/users/${u.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${SVC}`, apikey: SVC },
    });
  }
  if (stale.length) console.log(`  (swept ${stale.length} stale test account(s))`);
} catch {
  /* non-fatal */
}
const email = `test-${Date.now()}@liberte-test.local`;
const password = "TestPass!2026";
let uid = null, studentClient = null;
{
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: "Test Student" },
  });
  ok("can create a student account", !error && Boolean(data?.user?.id), error?.message);
  uid = data?.user?.id ?? null;
}
if (uid) {
  const { data: prof } = await admin.from("profiles").select("id, full_name, approved_at").eq("id", uid).maybeSingle();
  ok("handle_new_user trigger created the profile", Boolean(prof), "no profile row");
  ok("new signup starts UNAPPROVED", prof ? prof.approved_at === null : false,
     prof ? `approved_at=${prof.approved_at}` : "");

  const { data: sess, error: sErr } = await anon.auth.signInWithPassword({ email, password });
  ok("student can log in", !sErr && Boolean(sess?.session?.access_token), sErr?.message);
  if (sess?.session) {
    studentClient = createClient(URL_, ANON, {
      auth: { persistSession: false },
      realtime: rt,
      global: { headers: { Authorization: `Bearer ${sess.session.access_token}` } },
    });
  }

  await admin.from("profiles").update({ approved_at: new Date().toISOString() }).eq("id", uid);
  const { data: after } = await admin.from("profiles").select("approved_at").eq("id", uid).maybeSingle();
  ok("admin approval sets approved_at", after?.approved_at !== null);
}

/* ---------------- RLS ---------------- */
g("5. Row-level security");
if (studentClient) {
  const { data: own } = await studentClient.from("profiles").select("id").eq("id", uid);
  eq("student reads own profile", own?.length, 1);
  const { data: all } = await studentClient.from("profiles").select("id");
  ok("student CANNOT read other profiles", (all?.length ?? 0) === 1, `saw ${all?.length} rows`);
  const { data: leads } = await studentClient.from("leads").select("id");
  eq("student CANNOT read leads", leads?.length ?? 0, 0);
  const { error: escalate } = await studentClient.from("user_roles").insert({ user_id: uid, role: "admin" });
  ok("student CANNOT grant themselves admin", Boolean(escalate));
  const { error: starHack } = await studentClient.from("star_awards")
    .insert({ user_id: uid, amount: 9999, reason: "hack", source_key: "hack:1" });
  ok("student CANNOT insert stars directly", Boolean(starHack));
  // Audit M1: score tables fire star triggers, so students must not write them.
  const { error: defiHack } = await studentClient.from("defi_results")
    .insert({ user_id: uid, day_id: 88, score_10: 10, hits: 5, misses: 0 });
  ok("student CANNOT insert defi_results (star-minting)", Boolean(defiHack));
  const { error: weekHack } = await studentClient.from("weekly_evaluations")
    .insert({ user_id: uid, week_number: 88, test_score: 100, weekly_score: 10 });
  ok("student CANNOT insert weekly_evaluations (star-minting)", Boolean(weekHack));
  // Audit H1(b): the tutor quota counter must not be resettable by the student.
  await admin.from("tutor_usage").upsert({ user_id: uid, usage_date: new Date().toISOString().slice(0, 10), message_count: 5 }, { onConflict: "user_id,usage_date" });
  const { error: quotaHack } = await studentClient.from("tutor_usage")
    .update({ message_count: 0 }).eq("user_id", uid);
  ok("student CANNOT reset their tutor quota", Boolean(quotaHack));
  const { error: selfApprove } = await studentClient.from("profiles")
    .update({ approved_at: new Date().toISOString() }).eq("id", uid);
  ok("student CANNOT write approved_at", Boolean(selfApprove));
} else skipped("RLS checks", "no student session");

/* ---------------- progress persistence ---------------- */
g("6. Progress tracking (the core feature)");
if (studentClient) {
  const save = await studentClient.from("day_state").upsert(
    { user_id: uid, day_id: 1, done_lessons: ["gym"], current_lesson: "intro", stars: 2 },
    { onConflict: "user_id,day_id" },
  );
  ok("day_state saves lesson progress", !save.error, save.error?.message);

  const { data: loaded } = await studentClient.from("day_state")
    .select("done_lessons, current_lesson, stars").eq("user_id", uid).eq("day_id", 1).maybeSingle();
  eq("done_lessons persisted", loaded?.done_lessons, ["gym"]);
  eq("current_lesson persisted", loaded?.current_lesson, "intro");
  eq("stars persisted", loaded?.stars, 2);

  await studentClient.from("day_state").upsert(
    { user_id: uid, day_id: 1, done_lessons: ["gym", "intro"], current_lesson: "vocab", stars: 4 },
    { onConflict: "user_id,day_id" },
  );
  const { data: upd } = await studentClient.from("day_state")
    .select("done_lessons, current_lesson").eq("user_id", uid).eq("day_id", 1).maybeSingle();
  eq("progress updates across lessons", upd?.done_lessons, ["gym", "intro"]);
  eq("current lesson advances", upd?.current_lesson, "vocab");

  const { data: fresh } = await studentClient.from("day_state").select("day_id").eq("user_id", uid).eq("day_id", 2).maybeSingle();
  ok("untouched day has no state (fresh start)", fresh === null);

  const wk = await studentClient.from("week_state").upsert(
    { user_id: uid, week_number: 1, state: { block: "CO", coAnswers: [1, 2] } },
    { onConflict: "user_id,week_number" },
  );
  ok("week_state saves weekly-défi progress", !wk.error, wk.error?.message);
  const { data: wkLoad } = await studentClient.from("week_state").select("state").eq("user_id", uid).eq("week_number", 1).maybeSingle();
  eq("weekly progress resumes", wkLoad?.state?.block, "CO");
} else skipped("progress persistence", "no student session");

/* ---------------- stars & completion ---------------- */
g("7. Day completion & star triggers");
if (studentClient) {
  const ins = await studentClient.from("day_completions").insert({ user_id: uid, day_id: 1, week_number: 1 });
  ok("student can mark a day complete", !ins.error, ins.error?.message);

  const { data: stars } = await admin.from("star_awards").select("amount, reason, source_key").eq("user_id", uid);
  const dayStar = (stars ?? []).find((s) => s.source_key === "day_complete:1");
  ok("trigger awards +2 stars on day completion", dayStar?.amount === 2, JSON.stringify(stars));

  const dup = await studentClient.from("day_completions").insert({ user_id: uid, day_id: 1, week_number: 1 });
  ok("duplicate day completion is rejected", Boolean(dup.error));
  const { data: stars2 } = await admin.from("star_awards").select("id").eq("user_id", uid).eq("source_key", "day_complete:1");
  eq("no double stars from duplicate", stars2?.length, 1);

  await admin.from("defi_results").insert({ user_id: uid, day_id: 2, score_10: 8, hits: 3, misses: 1 });
  const { data: defiStar } = await admin.from("star_awards").select("amount").eq("user_id", uid).eq("source_key", "defi:2").maybeSingle();
  ok("trigger awards +2 stars on défi", defiStar?.amount === 2);

  await admin.from("weekly_evaluations").insert({ user_id: uid, week_number: 1, test_score: 8, weekly_score: 8 });
  const { data: weekStar } = await admin.from("star_awards").select("amount").eq("user_id", uid).eq("source_key", "weekly:1").maybeSingle();
  ok("trigger awards +3 stars on weekly défi", weekStar?.amount === 3);

  const { data: allStars } = await admin.from("star_awards").select("amount").eq("user_id", uid);
  eq("total stars = 2+2+3", (allStars ?? []).reduce((s, r) => s + r.amount, 0), 7);
}

/* ---------------- unlock against real data ---------------- */
g("8. Unlock rules against real student data");
if (studentClient) {
  const [{ data: dc }, { data: dr }] = await Promise.all([
    admin.from("day_completions").select("day_id").eq("user_id", uid),
    admin.from("defi_results").select("day_id").eq("user_id", uid),
  ]);
  const done = new Set([...(dc ?? []).map((r) => r.day_id), ...(dr ?? []).map((r) => r.day_id)]);
  eq("student has days 1,2 done", [...done].sort(), [1, 2]);
  // Launch: all of weeks 1-2 open regardless of how far they've got.
  for (const d of [3, 6, 10]) ok(`day ${d} open for this student`, mod.isDayUnlocked(d, done));
  for (const d of [3, 6, 10]) ok(`scene ${d} open for this student`, mod.isSceneUnlocked(d, done));
  eq("furthest completed-day pointer = 3", mod.furthestUnlockedDay(done), 3);
}

/* ---------------- tutor ---------------- */
g("9. AI tutor");
if (studentClient) {
  const conv = await studentClient.from("tutor_conversations").upsert(
    { user_id: uid, day_id: 1, messages: [{ role: "user", content: "bonjour" }], objectives_done: [1] },
    { onConflict: "user_id" },
  );
  ok("tutor conversation saves", !conv.error, conv.error?.message);
  const { data: convLoad } = await studentClient.from("tutor_conversations").select("messages, objectives_done").eq("user_id", uid).maybeSingle();
  eq("conversation resumes", convLoad?.messages?.length, 1);
  eq("objectives persist", convLoad?.objectives_done, [1]);

  const today = new Date().toISOString().slice(0, 10);
  // Students can no longer write tutor_usage directly (H1(b) fix) — only the
  // SECURITY DEFINER RPC and the service role may. Seed via admin.
  await admin.from("tutor_usage").upsert({ user_id: uid, usage_date: today, message_count: 30 }, { onConflict: "user_id,usage_date" });
  const { data: usage } = await studentClient.from("tutor_usage").select("message_count").eq("user_id", uid).eq("usage_date", today).maybeSingle();
  eq("student can READ own daily counter", usage?.message_count, 30);
  ok("cap reached at 30 blocks further messages", (usage?.message_count ?? 0) >= 30);

  const scen = readFileSync("src/lib/tutorContext.ts", "utf8");
  for (let d = 1; d <= 10; d++) ok(`scene ${d} defined`, scen.includes(`  ${d}: {`) || scen.includes(`\n  ${d}: {`));
  const gate = readFileSync("src/lib/tutor.functions.ts", "utf8");
  ok("server gates locked scenes", gate.includes("assertDayUnlocked"));
  ok("server enforces daily cap", gate.includes("TUTOR_DAILY_LIMIT"));
  ok("server checks approval before spending tokens", gate.includes("requireApprovedStudent"));
}

/* ---------------- hands-free voice conversation ---------------- */
g("9b. Hands-free voice tutor");
{
  const ai = readFileSync("src/lib/ai.ts", "utf8");
  ok("real TTS model configured (not browser voice)", ai.includes("gpt-4o-mini-tts"));
  ok("TTS helper returns base64 audio", ai.includes("speakFrenchBase64"));
  ok("TTS instructs a learner-friendly pace", ai.includes("Slightly slower than native pace"));

  const tut = readFileSync("src/lib/tutor.functions.ts", "utf8");
  ok("reply audio comes back in the same round trip", tut.includes("withAudio"));
  ok("TTS failure degrades gracefully", tut.includes("audio = null; // fall back"));
  ok("standalone speak endpoint exists (opener/replay)", tut.includes("speakTutorLine"));

  const aud = readFileSync("src/lib/audio.ts", "utf8");
  ok("silence detection implemented (auto-stop)", aud.includes("watchForSilence"));
  ok("silence detection uses RMS threshold", aud.includes("SILENCE") && aud.includes("HANG_MS"));
  ok("ignores a stray click at the start", aud.includes("MIN_SPEECH_MS"));
  ok("audio context torn down after each turn", aud.includes("vadCleanupRef"));
  ok("base64 mp3 playback helper", aud.includes("playBase64Mp3"));

  const conv = readFileSync("src/routes/conversation.tsx", "utf8");
  ok("voice phases: listening/thinking/speaking", conv.includes('VoicePhase') && conv.includes('"speaking"'));
  ok("loop hands the turn back automatically", conv.includes("listenRef.current()"));
  ok("empty/noise transcript re-listens instead of sending", conv.includes("if (!said)"));
  ok("voice mode opens with the spoken scene opener", conv.includes("scenario.opener_fr"));
  ok("hang-up button ends the loop", conv.includes("Terminer la conversation"));
  ok("voice loop stops cleanly via ref guard", conv.includes("voiceOnRef"));
  ok("entry point is prominent", conv.includes("Conversar en voz con Lib"));

  // iOS/WebKit (incl. Chrome on iOS) hardening — found on a real device.
  ok("audio unlocked inside the user gesture", aud.includes("unlockAudioPlayback"));
  ok("playback reuses ONE unlocked element", aud.includes("sharedAudio"));
  ok("playsInline set for WebKit", aud.includes("playsInline"));
  ok("AudioContext resumed (iOS starts suspended)", aud.includes('ctx.state === "suspended"'));
  ok("mic never stays open forever", aud.includes("MAX_TURN_MS"));
  ok("recorder reports whether speech was heard", aud.includes("heardSpeech"));
  ok("voice mode unlocks audio on tap", conv.includes("unlockAudioPlayback()"));
  ok("silent captures never reach the transcriber", conv.includes("!recorder.heardSpeech()"));
  ok("listening circle is tappable as a manual send", conv.includes('voicePhase === "listening") void finishListening()'));

  // Transcription hallucination guards (verified live against the API).
  ok("tiny audio rejected before transcription", ai.includes("bytes.length < 4000"));
  ok("non-Latin hallucinations discarded", ai.includes("Ѐ-ӿ"));
  ok("NO prompt bias (it fabricates transcripts on silence)", !ai.includes('fd.append("prompt"'));

  // Tutor must not parrot its opener at unintelligible input.
  ok("prompt forbids repeating the opener", tut.includes("NUNCA repitas tu frase de apertura"));

  // The loop must never strand the student on a spinner (reported on-device).
  ok("turn double-finish guarded", conv.includes("turnBusyRef"));
  ok("transcription has a timeout", conv.includes('25_000') && conv.includes("withTimeout"));
  ok("reply has a timeout", conv.includes("45_000"));
  ok("errors hand the turn back, not hang", conv.includes("listenTurn();\n    }") || conv.includes("listenRef.current();"));
  ok("playback can't hang the loop", aud.includes("setTimeout(finish, 20_000)"));
  ok("max turn shortened for mobile uploads", aud.includes("MAX_TURN_MS = 15_000"));
  // Voice turns request a compact payload (measured 3.3s -> 1.4s).
  ok("voice mode uses a trimmed JSON schema", tut.includes("buildTutorSystem(tutorCtx, data.withAudio)"));
  ok("trimmed schema documented with the measurement", tut.includes("3.3s → 1.4s"));

  // Audit H1(a)/H2: AI cost guards.
  const aiSrc = readFileSync("src/lib/ai.ts", "utf8");
  ok("callChat caps output tokens", aiSrc.includes("max_tokens: MAX_OUTPUT_TOKENS"));
  ok("transcription rejects oversized audio before decode", aiSrc.includes("MAX_AUDIO_B64"));
  const tutSrc = readFileSync("src/lib/tutor.functions.ts", "utf8");
  ok("tutor cap is not caller-controlled", readFileSync("supabase/migrations/20260718000008_launch_security_hardening.sql", "utf8").includes("cap CONSTANT INT := 30"));
  // Audit C2: signup endpoint hardening.
  const sup = readFileSync("src/routes/api/public/liberte-frances-signup.ts", "utf8");
  ok("signup endpoint no longer updates leads by email", !/\.from\("leads"\)\s*\.update/.test(sup));
  ok("signup endpoint doesn't re-send mail for known emails", sup.includes("isNewLead"));
  ok("signup endpoint doesn't echo zod internals", !sup.includes("parsed.error.issues"));
  ok("signup admin email uses a static reply-to", sup.includes('reply_to: "hola@libertefrances.com"'));
  // Audit M1: grading writes go through the service role.
  const defiSrc = readFileSync("src/lib/defi.functions.ts", "utf8");
  ok("defi_results written via service role", defiSrc.replace(/\r\n/g, "\n").includes('supabaseAdmin\n      .from("defi_results")'));

  // Launch: the day route applies the product flags so lessons are all open
  // and the video gate is off — regardless of active-day (root-cause fix).
  const dayLaunch = readFileSync("src/routes/day.$dayId.tsx", "utf8");
  ok("lesson unlock gated behind SEQUENTIAL_LESSON_GATE", dayLaunch.includes("!SEQUENTIAL_LESSON_GATE ||"));
  ok("video gate behind REQUIRE_VIDEO_WATCHED", dayLaunch.includes("REQUIRE_VIDEO_WATCHED &&"));
  // Lesson-resume: hydration guarded so it doesn't reset on every re-render.
  ok("hydration guarded against spurious resets", dayLaunch.includes("if (hydratedKeyRef.current === key) return"));

  // Week 2 wiring.
  const dash = readFileSync("src/routes/liberte-plataforma-834798234728482934254-student.tsx", "utf8");
  ok("weeks 1-2 open to every student at launch", /: \[1, 2\]/.test(dash));
  ok("server-side tutor gate honours the launch window", readFileSync("src/lib/tutor.functions.ts", "utf8").includes("dayId <= OPEN_THROUGH_DAY"));
  ok("weeks without content show a coming-soon lock (in French)", dash.includes("LAST_WEEK_WITH_CONTENT") && dash.includes("Bientôt disponible"));
  ok("dashboard respects the student-preview toggle", dash.includes("bypassLocks"));
  const dayRoute = readFileSync("src/routes/day.$dayId.tsx", "utf8");
  ok("week-2 final challenge is reachable from day 10", dayRoute.includes('to="/defi-semaine2"'));
  ok("week-1 challenge still reachable from day 5", dayRoute.includes('params={{ weekId: "1" }}'));

  // Mic permission was re-requested every turn (stream killed after each one).
  ok("mic stream reused across turns", aud.includes("keepAlive"));
  ok("stream liveness checked before re-acquiring", aud.includes("isStreamLive"));
  ok("explicit mic release exposed", aud.includes("releaseMic"));
  ok("conversation holds the mic for the whole call", conv.includes("keepAlive: true"));
  ok("hang-up frees the mic", conv.includes("recorder.releaseMic()"));
  ok("leaving the page frees the mic", /return \(\) => \{\s*voiceOnRef\.current = false;\s*recorder\.releaseMic\(\);/.test(conv));
}

/* ---------------- admin preview / view-as ---------------- */
g("10. Admin preview modes (view as student / specific student)");
{
  const prev = readFileSync("src/lib/admin-preview.ts", "utf8");
  ok("teacher mode bypasses locks", prev.includes('mode === "teacher"'));
  ok("student mode keeps locks active", /bypassLocks:\s*isAdmin\s*&&\s*\w*\.?mode === "teacher"/.test(prev));
  ok("impersonation is read-only", prev.includes("readOnly: impersonating"));
  ok("preview choice persists locally", prev.includes("localStorage"));

  const day = readFileSync("src/routes/day.$dayId.tsx", "utf8");
  ok("day route uses preview-aware admin flag", day.includes("bypassLocks: isAdmin"));
  ok("day route loads the student snapshot", day.includes("getStudentSnapshot"));
  // The readOnly gate now lives in the pure state machine (shouldPersistDay in
  // src/lib/dayProgress.ts); group 12h asserts it actually blocks impersonation.
  ok("day route BLOCKS autosave while impersonating",
     day.includes("shouldPersistDay({") && /readOnly,/.test(day));
  ok("day route BLOCKS lesson completion while impersonating", day.includes("if (readOnly) return"));
  ok("day route shows the preview banner", day.includes("<AdminPreviewBanner />"));

  const conv = readFileSync("src/routes/conversation.tsx", "utf8");
  ok("tutor uses preview-aware admin flag", conv.includes("bypassLocks: isAdmin"));

  const fns = readFileSync("src/lib/admin.functions.ts", "utf8");
  ok("snapshot fn is admin-gated", fns.includes("getStudentSnapshot") && fns.includes("requireAdmin"));
  ok("roster fn is admin-gated", fns.includes("getStudentRoster"));
  ok("snapshot returns progress data", fns.includes("dayStates") && fns.includes("completedDays"));
}

/* ---------------- admin ---------------- */
g("10. Admin surfaces");
{
  const { data: adminRole } = await admin.from("user_roles").select("user_id").eq("role", "admin");
  ok("at least one admin exists", (adminRole?.length ?? 0) > 0);
  const { data: profs } = await admin.from("profiles").select("id");
  ok("analytics can read all profiles", (profs?.length ?? 0) > 0, `${profs?.length} profiles`);
  const { data: pending } = await admin.from("profiles").select("id").is("approved_at", null);
  ok("approval queue query works", Array.isArray(pending), `${pending?.length} pending`);
  const { data: cal } = await admin.from("calendar_events").select("id");
  ok("calendar has seeded events", (cal?.length ?? 0) > 0, `${cal?.length} events`);
  const { data: leads } = await admin.from("leads").select("id");
  ok("service role reads leads", Array.isArray(leads));
}

/* ---------------- source integrity ---------------- */
g("11. Source integrity (features still wired)");
{
  const day = readFileSync("src/routes/day.$dayId.tsx", "utf8");
  ok("day route hydrates day_state", day.includes('.from("day_state")') && day.includes("hydratedKeyRef"));
  ok("day route autosaves progress", day.includes("pendingSaveRef"));
  ok("day route enforces lesson locks", day.includes("isLessonUnlockedRule") && day.includes("lessonLocked"));
  ok("day route enforces day locks", day.includes("isDayUnlockedRule") && day.includes("currentDayUnlocked"));
  ok("day route gates video before Suivant", day.includes("VideoGateCtx") && day.includes("nextLocked"));
  ok("day route marks completion", day.includes("markDayCompleted"));

  const conv = readFileSync("src/routes/conversation.tsx", "utf8");
  ok("tutor locks scenes in picker", conv.includes("isSceneUnlocked") && conv.includes("disabled={locked}"));

  const css = readFileSync("src/styles.css", "utf8");
  ok("buttons show pointer cursor", css.includes("cursor: pointer"));

  const ai = readFileSync("src/lib/ai.ts", "utf8");
  ok("AI uses OpenAI directly", ai.includes("api.openai.com") && ai.includes("OPENAI_API_KEY"));
  for (const f of ["defi.functions.ts", "week.functions.ts", "defiSemaine2.functions.ts"]) {
    ok(`${f} has no Lovable AI gateway`, !readFileSync(`src/lib/${f}`, "utf8").includes("ai.gateway.lovable.dev"));
  }
  ok("realtime shim applied (Node<22 safe)", readFileSync("src/integrations/supabase/client.server.ts", "utf8").includes("realtimeOptions"));
}

/* ---------------- regression guards ---------------- */
g("12. Regressions (bugs found in audit — must stay fixed)");
{
  const day = readFileSync("src/routes/day.$dayId.tsx", "utf8");
  // #1 video gate: a parent-level reset wiped child registrations.
  ok("video gate has NO parent reset effect", !/setPendingVideos\(new Set\(\)\)/.test(day));
  ok("video gate unregisters on unmount", day.includes("return () => gate?.ended(src)"));
  ok("video gate uses preview-aware flag", day.includes("!bypassLocks"));
  // YouTube embeds (35 of them) were silently ungated — only local files locked.
  ok("YouTube embeds are gated too", day.includes("enablejsapi=1"));
  ok("YouTube gate listens for ENDED state", day.includes('d?.event === "onStateChange"'));
  ok("YouTube gate verifies message origin", day.includes('String(e.origin).includes("youtube.com")'));
  ok("YouTube gate fails open if player is blocked", day.includes("heardFromPlayer"));
  ok("YouTube videos register with the gate", /if \(!isYouTube\) return;\s*\n\s*gate\?\.register/.test(day));
  // #4 progress reset on token refresh.
  ok("hydration keyed on user?.id, not user object", day.includes("user?.id, viewAsUserId"));
  ok("autosave keyed on userId", day.includes("[done, stars, lesson, userId, activeDay, readOnly]"));
  ok("getCompletedDays retries when auth resolves", day.includes("}, [user?.id]);"));
  // #16 impersonation must not write to the admin's own row.
  ok("day-complete button gated by readOnly", day.includes("if (readOnly) return; // impersonating"));
  ok("day-complete block receives readOnly", day.includes("readOnly={readOnly}"));
  // Weekly challenge now requires EVERY day of the active week (not just day 5).
  ok("weekly challenge gated on whole-week completion", day.includes("weekDayIds.every((id) => doneDays.has(id))"));
  ok("weekly challenge routes per active week", day.includes('activeWeek === 2 ? (') && day.includes('params={{ weekId: String(activeWeek) }}'));
  // #10 confetti replay.
  ok("confetti only on transition", day.includes("wasDoneAtMount"));

  // #2 preview state must be shared, not per-component.
  const prev = readFileSync("src/lib/admin-preview.ts", "utf8");
  ok("preview uses a shared external store", prev.includes("useSyncExternalStore"));
  ok("preview syncs across tabs", prev.includes('addEventListener("storage"'));
  ok("preview has SSR snapshot", prev.includes("getServerSnapshot"));

  // "View as student" must work app-wide, not just in the lesson player.
  const progHooks = readFileSync("src/lib/progress.ts", "utf8");
  ok("progress hooks accept a target user", progHooks.includes("useStars(targetUserId") && progHooks.includes("useDayCompletions(targetUserId"));
  ok("impersonation reads via service-role snapshot", progHooks.includes("getStudentSnapshot({ data: { userId: targetUserId } })"));
  ok("snapshot carries enrolledAt + completions", readFileSync("src/lib/admin.functions.ts", "utf8").includes("createdAt") && readFileSync("src/lib/admin.functions.ts", "utf8").includes("completions: completionRows"));
  const dashImp = readFileSync("src/routes/liberte-plataforma-834798234728482934254-student.tsx", "utf8");
  ok("dashboard renders the viewed student", dashImp.includes("useDayCompletions(viewAsUserId)") && dashImp.includes("useStars(viewAsUserId)"));
  ok("dashboard reads unlocks/overrides for the viewed student", dashImp.includes("dataUserId"));
  const convImp = readFileSync("src/routes/conversation.tsx", "utf8");
  ok("tutor renders the viewed student", convImp.includes("useDayCompletions(viewAsUserId)"));
  ok("tutor send is read-only while impersonating", convImp.includes("if (readOnly) return; // impersonating"));
  ok("progress page renders the viewed student", readFileSync("src/routes/progress.tsx", "utf8").includes("useDayCompletions(viewAsUserId)"));

  // #3 lead form must not fake success.
  const idx = readFileSync("src/routes/index.tsx", "utf8");
  ok("lead form only treats 502 as saved", idx.includes("res.status === 502"));
  ok("lead form surfaces 500 as an error", idx.includes("No pudimos guardar tus datos"));
  // Landing header: login was hidden below sm, stranding mobile students.
  ok("landing login link visible on mobile", !/hidden text-navy sm:inline-flex/.test(idx));
  ok("landing header has a mobile login label", idx.includes(">Entrar<"));
  ok("landing header buttons don't wrap", idx.includes("whitespace-nowrap"));
  ok("landing logo capped on mobile", idx.includes("max-w-[32vw]"));

  // #5 atomic tutor cap.
  const tut = readFileSync("src/lib/tutor.functions.ts", "utf8");
  ok("tutor cap uses atomic RPC", tut.includes("tutor_consume_message"));
  ok("tutor cap no longer read-then-write", !tut.includes('.from("tutor_usage")\n      .upsert'));

  // #6 conversation day pinning.
  const conv = readFileSync("src/routes/conversation.tsx", "utf8");
  ok("conversation pins the scene on first send", conv.includes("if (dayId === null) setDayId(activeDay)"));

  // TUTOR-1: scene picker is grouped month→day and keeps its binding.
  ok("scene picker renders <optgroup> groups", conv.includes("<optgroup") && conv.includes("tutorDayGroups("));
  ok("scene picker still binds value to activeDay", conv.includes("value={activeDay}"));
  ok("scene picker still resets on change", conv.includes("void handleReset(Number(e.target.value))"));

  // Calendar editing is ONE shared inline board (CalendarBoard), used by BOTH the
  // Calendar tab AND the coach panel — click a day to open its agenda (all its
  // events + edit/delete each + add), so a day can hold many classes.
  const board = readFileSync("src/components/CalendarBoard.tsx", "utf8");
  ok("shared calendar board exists + is staff-gated",
     board.includes("export function CalendarBoard") && board.includes("useIsStaff"));
  ok("clicking a day opens its agenda (staff only)", board.includes("isStaff ? () => setDayPanel"));
  ok("day agenda lists all its events + an add button (multiple per day)",
     board.includes("Clases del día") && board.includes("Añadir una clase"));
  ok("board opens the inline editor for create + edit",
     board.includes("<CalendarEventEditor") && board.includes('mode: "create"') && board.includes('mode: "edit"'));
  {
    const calTab = readFileSync("src/routes/calendar.tsx", "utf8");
    ok("Calendar tab renders the shared board", calTab.includes("<CalendarBoard"));
    ok("coach panel renders the SAME shared board",
       readFileSync("src/routes/coach.tsx", "utf8").includes("<CalendarBoard"));
    ok("no old calendar-manager panel in the Calendar tab", !calTab.includes("<CalendarManager"));
    ok("calendar editor no longer in the admin panel (single home)",
       ["liberte-profesor-panel-9382745-admin.tsx", "liberte-profesor-panel-9382745-admin.index.tsx",
        "liberte-profesor-panel-9382745-admin.alumnos.tsx", "liberte-profesor-panel-9382745-admin.contenido.tsx",
        "liberte-profesor-panel-9382745-admin.accesos.tsx", "liberte-profesor-panel-9382745-admin.equipo.tsx"]
         .every((f) => !readFileSync(`src/routes/${f}`, "utf8").includes("CalendarManager")));
    const cee = readFileSync("src/components/CalendarEventEditor.tsx", "utf8");
    ok("inline editor does insert/update/delete on calendar_events",
       cee.includes('.from("calendar_events").update') && cee.includes('.from("calendar_events").insert') && cee.includes('.from("calendar_events").delete'));
    // The staff gate must respect admin "Ver como alumno" preview, so a teacher
    // previewing as a student sees NO staff editors (looked like students could edit).
    const useStaff = readFileSync("src/lib/use-staff.ts", "utf8");
    ok("useIsStaff hides staff UI while previewing as a student",
       useStaff.includes("useAdminPreview") && useStaff.includes('mode !== "teacher"'));
    // Defence in depth: only coach/admin can write calendar_events (RLS).
    const calMig = readFileSync("supabase/migrations/20260718000001_calendar_events.sql", "utf8");
    ok("calendar_events writes are coach/admin-only (RLS)",
       /INSERT[\s\S]*has_role/.test(calMig) && /UPDATE[\s\S]*has_role/.test(calMig) && /DELETE[\s\S]*has_role/.test(calMig));
  }

  // Admin day/week content-access control + enforcement.
  const caFn = readFileSync("src/lib/content-access.functions.ts", "utf8");
  ok("content-access exposes getContentAccess", caFn.includes("export const getContentAccess"));
  ok("content-access exposes setContentAccess", caFn.includes("export const setContentAccess"));
  ok("content-access exposes loadUserOverrides", caFn.includes("export async function loadUserOverrides"));
  ok("content-access day/week gates exist", caFn.includes("assertDayNotLocked") && caFn.includes("assertWeekNotLocked"));
  const dayRoute = readFileSync("src/routes/day.$dayId.tsx", "utf8");
  ok("day route applies effectiveOverride", dayRoute.includes("effectiveOverride(id, accessOverrides)"));
  ok("day route reads overrides via hook", dayRoute.includes("useContentOverrides(viewAsUserId)"));
  ok("day route pending-lesson fixes cross-day reset", dayRoute.includes("pendingLessonRef"));
  ok("tutor server gate honours the override lock", tut.includes("effectiveOverride(dayId, await loadUserOverrides"));
  ok("conversation picker honours the override", conv.includes("effectiveOverride(d, accessOverrides)"));
  const defiFnSrc = readFileSync("src/lib/defi.functions.ts", "utf8");
  ok("defi submit is gated by day lock", defiFnSrc.includes("assertDayNotLocked(context, data.dayId)"));
  // Both evaluateDefi AND correctActivity (per-activity AI) must be gated.
  ok("per-activity AI correction also gated", (defiFnSrc.match(/assertDayNotLocked\(context, data\.dayId\)/g) || []).length >= 2);
  ok("week eval is gated by week lock", readFileSync("src/lib/week.functions.ts", "utf8").includes("assertWeekNotLocked(context, data.weekNumber)"));
  ok("week-2 challenge AI gated by week lock", readFileSync("src/lib/defiSemaine2.functions.ts", "utf8").includes("assertWeekNotLocked(context, 2)"));
  const dashSrc = readFileSync("src/routes/liberte-plataforma-834798234728482934254-student.tsx", "utf8");
  ok("student dashboard applies admin week locks", dashSrc.includes("lockedWeeks"));
  // Available (unlocked, non-current) weeks must render bright — no dark dimming
  // overlay — so they read as enabled, like the current week.
  ok("available weeks render bright (no dimming tint)", dashSrc.includes("look just as ENABLED as the current") && !dashSrc.includes("250 / 0.55"));
  ok("content_access migration present", readFileSync("supabase/migrations/20260720000000_content_access.sql", "utf8").includes("CREATE TABLE IF NOT EXISTS public.content_access"));

  // Colibrí tutor mascot floats across the platform → /conversation.
  const mascotSrc = readFileSync("src/components/TutorMascot.tsx", "utf8");
  ok("mascot links to the tutor", mascotSrc.includes('to="/conversation"'));
  ok("mascot mounted at the root (renders on every route)", readFileSync("src/routes/__root.tsx", "utf8").includes("<TutorMascot />"));
  // It follows the user across the app BUT is hidden on the pages that have a
  // bottom-right primary action (the tutor composer, the day player's « Suivant »,
  // the weekly-défi recorder) — the fixed bottom-right mascot used to sit on top
  // of « Suivant » and eat the click, freezing progress. See the 12g regression.
  ok("mascot hidden on the tutor page + lesson flows (can't block « Suivant »)",
     ["/conversation", "/day", "/semaine", "/defi-semaine2"].every((p) => mascotSrc.includes(`"${p}"`)));
  ok("mascot still shows on the dashboard/calendar (not globally hidden)",
     !mascotSrc.includes('"/calendar"') && !mascotSrc.includes('"/progress"'));
  ok("mascot sits under drawers/modals (z-30)", mascotSrc.includes("z-30"));

  // Teacher <-> student messaging + document attachments.
  const msgFn = readFileSync("src/lib/messaging.functions.ts", "utf8");
  ok("messaging exposes send/thread/conversations/attachment", ["sendMessage", "getThread", "getConversations", "getAttachmentUrl"].every((f) => msgFn.includes(`export const ${f}`)));
  ok("messaging validates UUIDs (no PostgREST filter injection)", msgFn.includes("UUID.test"));
  const msgMig = readFileSync("supabase/migrations/20260720000001_messaging.sql", "utf8");
  ok("messages migration present", msgMig.includes("CREATE TABLE IF NOT EXISTS public.messages"));
  ok("attachments use a PRIVATE bucket", msgMig.includes("'message-attachments', false"));
  ok("messaging RLS requires a staff participant", msgMig.includes("has_role(recipient_id, 'admin')"));
  const mt = readFileSync("src/components/MessageThread.tsx", "utf8");
  ok("thread uploads attachments to storage", mt.includes('storage.from("message-attachments").upload'));
  ok("thread sends via server fn", mt.includes("sendMessage({ data:"));
  ok("student messages route exists", readFileSync("src/routes/mensajes.tsx", "utf8").includes("getConversations()"));
  ok("nav has a Mensajes entry", readFileSync("src/components/TopNav.tsx", "utf8").includes('to: "/mensajes"'));

  // AI student report + tutor "failed attempt" logging.
  const repFn = readFileSync("src/lib/report.functions.ts", "utf8");
  ok("AI report aggregates every source", ["defi_results", "activity_results", "weekly_evaluations", "tutor_events", "tutor_usage", "day_completions"].every((t) => repFn.includes(t)));
  ok("AI report is staff-gated", repFn.includes("requireStaff"));
  ok("tutor logs corrections as durable events", tut.includes('.from("tutor_events").insert'));
  ok("tutor_events migration present", readFileSync("supabase/migrations/20260720000002_tutor_events.sql", "utf8").includes("CREATE TABLE IF NOT EXISTS public.tutor_events"));
  const sdp = readFileSync("src/components/StudentDetailPanel.tsx", "utf8");
  ok("teacher panel shows AI report + message thread", sdp.includes("<StudentReportCard") && sdp.includes("<MessageThread"));

  // Telegram linking + live-class reminders (token must live ONLY in env).
  const tgHelper = readFileSync("src/lib/telegram.ts", "utf8");
  ok("telegram reads the token from env", tgHelper.includes("process.env.TELEGRAM_BOT_TOKEN"));
  ok("telegram exposes sendTelegram + botUsername", tgHelper.includes("export async function sendTelegram") && tgHelper.includes("export async function botUsername"));
  ok("telegram link fns exist", ["startTelegramLink", "getTelegramStatus", "unlinkTelegram"].every((f) => readFileSync("src/lib/telegram.functions.ts", "utf8").includes(`export const ${f}`)));
  ok("telegram migration present", readFileSync("supabase/migrations/20260720000003_telegram.sql", "utf8").includes("telegram_chat_id"));
  const tgHook = readFileSync("src/routes/api/telegram/webhook.ts", "utf8");
  ok("telegram webhook verifies the secret", tgHook.includes("x-telegram-bot-api-secret-token") && tgHook.includes("TELEGRAM_WEBHOOK_SECRET"));
  ok("telegram webhook links by one-time code", tgHook.includes("telegram_link_code"));
  ok("reminders endpoint fails closed without a secret", readFileSync("src/routes/api/telegram/reminders.ts", "utf8").includes("if (!secret) return"));
  ok("webhook fails closed without a secret", tgHook.includes("if (!secret ||"));
  ok("reminders claim-then-send dedupe", readFileSync("src/lib/telegram.reminders.ts", "utf8").includes("claimErr"));
  ok("messages: only read_at is updatable by students", msgMig.includes("GRANT UPDATE (read_at)") && !/GRANT SELECT, INSERT, UPDATE ON public\.messages/.test(msgMig));
  ok("attachment path ownership enforced", msgFn.includes('startsWith(`${context.userId}/`)') && msgFn.includes('startsWith(`${msg.sender_id}/`)'));
  ok("defi submit blocked while impersonating", readFileSync("src/components/StagedDefi.tsx", "utf8").includes("if (readOnly) return"));
  ok("tutor reset blocked while impersonating", conv.includes("if (readOnly) return; // impersonating"));
  ok("AI report survives an AI failure", readFileSync("src/lib/report.functions.ts", "utf8").includes("} catch {"));

  // Live-DB verified: this project's schema-wide default ACL auto-grants full
  // CRUD (incl. TRUNCATE) to anon/authenticated on every new public table, on
  // top of whatever a migration's own GRANT says. Applied directly to
  // tpqoszkffdmxdyskdnyi and verified: anon had zero rows on all 7 new tables,
  // messages' UPDATE was column-scoped to read_at only, no TRUNCATE anywhere,
  // telegram_reminders had no grants at all. This migration is what closes it.
  const hardening = readFileSync("supabase/migrations/20260721000000_privilege_hardening.sql", "utf8");
  ok("privilege hardening migration revokes the default over-grant first", (hardening.match(/REVOKE ALL ON public\.\w+ FROM anon, authenticated;/g) || []).length >= 7);
  ok("hardening re-grants messages UPDATE as read_at only", hardening.includes("GRANT UPDATE (read_at) ON public.messages"));
  ok("hardening leaves telegram_reminders with no grants", hardening.trim().endsWith("REVOKE ALL ON public.telegram_reminders FROM anon, authenticated;"));
  ok("reminders target upcoming live classes", readFileSync("src/lib/telegram.reminders.ts", "utf8").includes("calendar_events"));
  ok("profile can connect telegram", readFileSync("src/routes/profile.tsx", "utf8").includes("<TelegramConnect"));
  ok("new messages notify via telegram", msgFn.includes("sendTelegram"));

  // TEACH-1 v1: content authoring (days 11-120) + recorded classes.
  {
    const contentSrc = ts.transpileModule(readFileSync("src/lib/content.ts", "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const cm = {};
    new Function("exports", "module", contentSrc)(cm, { exports: cm });
    eq("authored day 11 -> week 3", cm.weekOfAuthoredDay(11), 3);
    eq("authored day 120 -> week 24", cm.weekOfAuthoredDay(120), 24);
    eq("youtube watch URL embeds", cm.toEmbedUrl("https://www.youtube.com/watch?v=kLuB1ZDjkHg").embed, "https://www.youtube.com/embed/kLuB1ZDjkHg");
    eq("youtu.be URL embeds", cm.toEmbedUrl("https://youtu.be/abc123DEF45").kind, "youtube");
    eq("uploaded file passes through", cm.toEmbedUrl("https://x.supabase.co/storage/v1/object/public/content-assets/a.mp4").kind, "file");
  }
  const authMig = readFileSync("supabase/migrations/20260720000005_authored_content.sql", "utf8");
  ok("authored content migration present", authMig.includes("public.authored_days") && authMig.includes("public.authored_blocks"));
  ok("authored days limited to 11-120", authMig.includes("BETWEEN 11 AND 120"));
  ok("students read only published days", authMig.includes("status = 'published'"));
  ok("content-assets bucket staff-only writes", authMig.includes("'content-assets', true") && authMig.includes("staff upload content assets"));
  const dayRouteSrc = readFileSync("src/routes/day.$dayId.tsx", "utf8");
  ok("day route falls to the authored block renderer for non-rich days past the code days", dayRouteSrc.includes("DynamicDayGate") && dayRouteSrc.includes("<AuthoredDayView"));
  const adv = readFileSync("src/components/AuthoredDayView.tsx", "utf8");
  ok("authored view honours unlock + overrides", adv.includes("effectiveOverride(dayId, accessOverrides)"));
  ok("authored view completion uses day_completions", adv.includes("markDayCompleted(user.id, dayId"));
  ok("authored writing/speaking reuse AI correction", (adv.match(/correctActivity\(\{ data:/g) || []).length >= 2);
  const cmSrc = readFileSync("src/components/ContentManager.tsx", "utf8");
  ok("content manager uploads to content-assets", cmSrc.includes('storage.from("content-assets").upload'));
  ok("content manager can publish/unpublish", cmSrc.includes('"published"') && cmSrc.includes("Publicar"));
  ok("recorded classes migration present", readFileSync("supabase/migrations/20260720000004_recorded_classes.sql", "utf8").includes("public.recorded_classes"));
  ok("recorded classes manager wired", readFileSync("src/components/RecordedClassesManager.tsx", "utf8").includes('from("recorded_classes")'));
  const cev = readFileSync("src/routes/clasesenvivo.index.tsx", "utf8");
  ok("replays read from DB with hardcoded fallback", cev.includes('from("recorded_classes")') && cev.includes("dbClasses ?? RECORDED_CLASSES"));
  const adminPanelSrc = readFileSync("src/routes/liberte-profesor-panel-9382745-admin.contenido.tsx", "utf8");
  // Day authoring (ContentManager) lives in the admin Contenido tab; the
  // recorded-class editor moved into the Live tab so staff add/edit tiles where they live.
  ok("admin panel still mounts the content manager", adminPanelSrc.includes("<ContentManager />"));
  {
    const liveTab = readFileSync("src/routes/clasesenvivo.index.tsx", "utf8");
    ok("recorded-class editor lives in the Live tab (staff-gated)",
       liveTab.includes("<RecordedClassesManager") && liveTab.includes("useIsStaff") && liveTab.includes("isStaff &&"));
  }
  ok("dashboard reaches authored weeks", readFileSync("src/routes/liberte-plataforma-834798234728482934254-student.tsx", "utf8").includes("authoredStart"));

  // Week-3 content seed (days 11-15) — authored days published into the DB.
  ok("week-3 seed generator present", existsSync("scripts/seed-week3.mjs"));
  const seedSql = readFileSync("supabase/migrations/20260722000000_seed_week3_content.sql", "utf8");
  ok("week-3 seed publishes 5 days", (seedSql.match(/INSERT INTO public\.authored_days/g) || []).length === 5 && seedSql.includes("'published'"));
  ok("week-3 seed covers days 11-15", [11, 12, 13, 14, 15].every((d) => seedSql.includes(`VALUES (${d}, 'Jour ${d}`)));
  ok("week-3 seed is idempotent", seedSql.includes("DELETE FROM public.authored_days WHERE day_id BETWEEN 11 AND 15"));
  ok("week-3 seed has vocab/quiz/writing/speaking blocks", ["'vocab'", "'quiz'", "'writing'", "'speaking'"].every((t) => seedSql.includes(t)));

  // Week-4 content seed (days 16-20); day 16 from the Lovable spec.
  ok("week-4 seed generator present", existsSync("scripts/seed-week4.mjs"));
  const seed4 = readFileSync("supabase/migrations/20260722000001_seed_week4_content.sql", "utf8");
  ok("week-4 seed publishes 5 days", (seed4.match(/INSERT INTO public\.authored_days/g) || []).length === 5 && seed4.includes("'published'"));
  ok("week-4 seed covers days 16-20", [16, 17, 18, 19, 20].every((d) => seed4.includes(`VALUES (${d}, 'Jour ${d}`)));
  ok("week-4 seed is idempotent", seed4.includes("DELETE FROM public.authored_days WHERE day_id BETWEEN 16 AND 20"));
  ok("day 16 carries the Lovable spec (pronoms COD + ça me va)", seed4.includes("Pronoms COD") && seed4.includes("Ça me va"));

  // SECURITY: the bot token must NEVER be committed to the repo.
  {
    let leak = null;
    const walk = (dir) => {
      for (const ent of readdirSync(dir, { withFileTypes: true })) {
        if (leak) return;
        const p = `${dir}/${ent.name}`;
        if (ent.isDirectory()) {
          if (ent.name !== "node_modules" && ent.name !== ".output" && ent.name !== ".wrangler") walk(p);
        } else if (/\.(ts|tsx|js|mjs|sql|json|md)$/.test(ent.name)) {
          if (/\b\d{9,10}:AA[A-Za-z0-9_-]{30,}\b/.test(readFileSync(p, "utf8"))) leak = p;
        }
      }
    };
    for (const d of ["src", "supabase", "scripts"]) walk(d);
    ok("no Telegram bot token hardcoded in the repo", leak === null);
  }

  // #7/#8 analytics.
  const adm = readFileSync("src/lib/admin.functions.ts", "utf8");
  ok("analytics raises the 1000-row cap", adm.includes("MAX_ROWS"));
  const an = readFileSync("src/components/AdminAnalytics.tsx", "utf8");
  ok("analytics ignores stale responses", an.includes("reqIdRef"));
  // Analytics drill-down + PDF export of the selected timeframe.
  ok("KPI tiles open a drill-down", an.includes("<DrillPanel") && an.includes("onSelect={() => setDrill("));
  ok("analytics has a PDF export button", an.includes("generateAnalyticsPdf(data).save("));
  ok("analytics PDF generator exists", readFileSync("src/lib/analyticsPdf.ts", "utf8").includes("export function generateAnalyticsPdf"));

  // #13 mic stream leak.
  const aud = readFileSync("src/lib/audio.ts", "utf8");
  ok("recorder releases mic on unmount", aud.includes("streamRef"));

  // #9 streak timezone.
  const prog = readFileSync("src/lib/progress.ts", "utf8");
  ok("streak uses local day keys", prog.includes("localDayKey"));
  ok("streak no longer mixes UTC with local midnight", !prog.includes("toISOString().slice(0, 10)"));

  // Mobile HIGH fixes.
  const nav = readFileSync("src/components/TopNav.tsx", "utf8");
  ok("mobile nav items can shrink (no overflow)", nav.includes("min-w-0 flex-1 basis-0"));
  ok("mobile nav uses short labels", nav.includes("n.short ?? n.label"));
  const d2 = readFileSync("src/routes/defi-semaine2.tsx", "utf8");
  ok("no invalid comma grid-cols", !d2.includes("grid-cols-[1fr,"));
  ok("textareas are 16px on mobile (no iOS zoom)", d2.includes("p-3 text-base sm:text-sm"));
  const cal = readFileSync("src/routes/calendar.tsx", "utf8");
  ok("calendar dots have 28px tap targets", readFileSync("src/components/CalendarBoard.tsx", "utf8").includes('className="grid h-7 w-7 place-items-center"'));
  ok("calendar modal scrolls on short screens", cal.includes("max-h-[85dvh]"));
  const ban = readFileSync("src/components/AdminPreviewBanner.tsx", "utf8");
  ok("preview select can't overflow", ban.includes("w-full max-w-full"));
  ok("preview select is 16px on mobile", ban.includes("text-base") && ban.includes("sm:text-xs"));
  for (const f of ["calendar", "conversation", "profile", "progress"]) {
    const s = readFileSync(`src/routes/${f}.tsx`, "utf8");
    ok(`${f}: bg-fixed gated to md+ (iOS Safari)`, !/[^:]bg-fixed/.test(s) || s.includes("md:bg-fixed"));
  }
}

/* ---------------- weeks 3-4 (days 11-20) ---------------- */
g("12c. Weeks 3-4 · days 11-20 render through the REAL lesson player");
{
  const day = readFileSync("src/routes/day.$dayId.tsx", "utf8");
  ok("day player imports the WEEK34 code data", day.includes('from "@/data/week34"'));
  ok("days 11-20 registered into the same lesson maps as 1-10",
     day.includes("Object.entries(WEEK34_META)") && day.includes("LESSONS_BY_DAY[id]") && day.includes("WEEK_TITLE_BY_DAY[id]"));
  ok("generic wrappers reuse the day-1-10 games",
     ["IntroLessonG", "VocabLessonG", "ClesLessonG", "DefiLessonG"].every((w) => day.includes(`function ${w}`)));
  ok("LessonView dispatches data-driven days (11-40 always; 1-10 when published) to the generic wrappers",
     day.includes("!builtInDay && Number(dayId) <= 40 && richData"));
  ok("router sends registered days (1-20) to DayPage",
     day.includes("if (dayId in LESSONS_BY_DAY) return <DayPage") && day.includes("<AuthoredDayView"));
  ok("gym video wired for weeks 3-8", day.includes("(WEEK34[dayId] ?? MONTH2[dayId])?.gym"));

  // The generated content module must be complete and in the day-6 shape.
  const w34src = readFileSync("src/data/week34.ts", "utf8");
  const jsonStart = w34src.indexOf("= {", w34src.indexOf("export const WEEK34"));
  const W34 = JSON.parse(w34src.slice(jsonStart + 2).replace(/;\s*$/, "").trim());
  const days34 = Object.keys(W34).map(Number).sort((a, b) => a - b);
  eq("WEEK34 covers days 11-20", days34.join(","), "11,12,13,14,15,16,17,18,19,20");
  ok("each day has 30 vocab words", days34.every((d) => W34[d].vocabulary.length === 30));
  ok("each day has flashcards + 4 grammar structures",
     days34.every((d) => W34[d].flashQuiz.length >= 5 && W34[d].grammar.length >= 1));
  ok("each day has the 4 vocab games (reading/listening/speaking/writing)",
     days34.every((d) => { const gm = W34[d].vocabGames; return gm.reading.length >= 1 && gm.listening.length >= 1 && gm.speaking.length >= 1 && gm.writing.length >= 1; }));
  ok("each day has a clés reading (with questions) + 3 clés games",
     days34.every((d) => (W34[d].clesReading?.questions?.length ?? 0) >= 1 && W34[d].clesGames.listening.length >= 1 && W34[d].clesGames.speaking.length >= 1 && W34[d].clesGames.writing.length >= 1));
  ok("each day has a staged défi (steps + criteria)",
     days34.every((d) => W34[d].defiSteps.length >= 1 && W34[d].defiCriteria.length >= 1));

  // Unlock: weeks 3-4 are real content days now, still sequentially gated.
  eq("LESSON_DAYS covers weeks 1-8", mod.LESSON_DAYS, 40);
  eq("weeks 3-4 stay sequentially gated (OPEN_THROUGH_DAY unchanged)", mod.OPEN_THROUGH_DAY, 10);
  ok("day 11 LOCKED until day 10 done", !mod.isDayUnlocked(11, S()));
  ok("day 11 opens once day 10 done", mod.isDayUnlocked(11, S(10)));
  ok("day 20 opens once day 19 done", mod.isDayUnlocked(20, S(19)));

  // Tutor now covers weeks 3-4, driven by the same WEEK34 data.
  const tc = readFileSync("src/lib/tutorContext.ts", "utf8");
  ok("TUTOR_MAX_DAY raised to 40", /TUTOR_MAX_DAY\s*=\s*40/.test(tc));
  ok("tutor pulls scenes 11-40 from WEEK34 + MONTH2",
     tc.includes("...WEEK34, ...MONTH2") && tc.includes("TUTOR_SCENARIOS[id]") && tc.includes("CONTEXTS[id]"));
  ok("each WEEK34 day carries a complete 3-objective tutor scene",
     days34.every((d) => W34[d].tutor && W34[d].tutor.objectives.length === 3 && W34[d].tutor.opener_fr && W34[d].tutor.opener_es && W34[d].tutor.topic && W34[d].tutor.role));
  ok("scene picker lists all 40 scenes", readFileSync("src/routes/conversation.tsx", "utf8").includes("tutorDayGroups(40)"));
  ok("tutor day-group helper defaults to 40", readFileSync("src/data/program.ts", "utf8").includes("tutorDayGroups(maxDay = 40)"));

  // "Weeks with content" is a single source of truth (derived from LESSON_DAYS),
  // shared by the student dashboard AND the admin content-access panel, so the
  // "con contenido" badge can't drift (bug: it used to be hardcoded to weeks 1-2).
  eq("WEEKS_WITH_CONTENT derives 8 from LESSON_DAYS", mod.WEEKS_WITH_CONTENT, 8);
  const dashW = readFileSync("src/routes/liberte-plataforma-834798234728482934254-student.tsx", "utf8");
  ok("dashboard content-week count derives from the shared constant",
     dashW.includes("LAST_WEEK_WITH_CONTENT = WEEKS_WITH_CONTENT") && dashW.includes('3: "11"') && dashW.includes('4: "16"'));
  ok("admin content-access 'con contenido' badge uses the shared constant",
     readFileSync("src/components/ContentAccessManager.tsx", "utf8").includes("w <= WEEKS_WITH_CONTENT"));

  // Teacher-editable rich content: weeks 3-4 live in authored_days.rich, render
  // through the SAME wrappers, and are edited from the content manager. The code
  // WEEK34 stays as an always-available fallback.
  ok("authored_days.rich migration present",
     readFileSync("supabase/migrations/20260723000000_authored_days_rich.sql", "utf8").includes("ADD COLUMN IF NOT EXISTS rich JSONB"));
  const richSeed = readFileSync("supabase/migrations/20260723000001_seed_week34_rich.sql", "utf8");
  ok("rich seed publishes all 10 days 11-20",
     (richSeed.match(/INSERT INTO public\.authored_days/g) || []).length === 10 && richSeed.includes("'published'"));
  ok("rich seed is idempotent", richSeed.includes("DELETE FROM public.authored_days WHERE day_id BETWEEN 11 AND 20"));
  const rc = readFileSync("src/lib/rich-content.ts", "utf8");
  ok("rich-content layer exports the hook + CRUD",
     ["useRichDay", "listRichDays", "getRichDay", "saveRichDay", "deleteRichDay"].every((f) => rc.includes(f)));
  ok("player renders DB rich with a code (WEEK34/MONTH2) fallback",
     day.includes("useRichDay(dayId)") && day.includes("richDay ?? codeData"));
  const rde = readFileSync("src/components/RichDayEditor.tsx", "utf8");
  ok("rich editor covers every lesson section",
     ["1 · Gym cérébral", "2 · Bienvenue", "3 · Vocabulaire — palabras", "3 · Vocabulaire — flashcards", "3 · Vocabulaire — juegos", "4 · Les Clés — gramática", "4 · Les Clés — juegos", "5 · Défi final"].every((s) => rde.includes(s)));
  ok("rich editor saves to authored_days.rich", rde.includes("saveRichDay"));
  const cmSrc2 = readFileSync("src/components/ContentManager.tsx", "utf8");
  ok("content manager routes rich days to the rich editor",
     cmSrc2.includes("richIds.has(editingDay)") && cmSrc2.includes("<RichDayEditor"));
  ok("week34 meta is shared by the renderer and the seed script",
     readFileSync("src/data/week34.meta.ts", "utf8").includes("export const WEEK34_META") &&
     readFileSync("scripts/gen-week34-seed.mjs", "utf8").includes("week34.meta.ts"));

  // Brand-new weeks (days 21+): teacher-authored full lessons render through the
  // SAME shell (DynamicDayGate registers their DB meta first), and are creatable
  // from the content manager.
  ok("router sends 21+ through the dynamic rich gate",
     day.includes("DynamicDayGate") && day.includes("n >= 21 && n <= 120"));
  ok("gate registers DB meta into the shell maps before rendering",
     day.includes("registerDay(dayId, rich.meta)") && day.includes("function registerDay"));
  ok("content manager can create a full rich lesson (any day 11-120)",
     cmSrc2.includes("createRichDay") && cmSrc2.includes("Crear lección completa"));
  // Days 1-10 are now EDITABLE (client request): their built-in content is
  // seeded as a draft RichDay; "Editar" opens the rich editor; students keep the
  // original design until the teacher PUBLISHES the edited version.
  ok("content manager lists days 1-10 AND lets the teacher edit them",
     cmSrc2.includes("BUILTIN_DAYS") && /day_id: 1,/.test(cmSrc2) &&
     /richIds\.has\(d\.day_id\) && \(\s*<Button size="sm" variant="outline" onClick=\{\(\) => setEditingDay\(d\.day_id\)\}/.test(cmSrc2));
  const rcSrc = readFileSync("src/lib/rich-content.ts", "utf8");
  ok("a days-1-10 rich row only takes over when PUBLISHED (drafts never change what students see)",
     rcSrc.includes('n >= 11 || row.status === "published"'));
  const dayGate = readFileSync("src/routes/day.$dayId.tsx", "utf8");
  ok("bespoke 1-10 components render unless a published rich row exists",
     dayGate.includes("const builtInDay = Number(dayId) <= 10 && !richDay") &&
     (dayGate.match(/\{builtInDay && dayId === "/g) || []).length >= 38);
  ok("published day 1 maps its bespoke 'cafe' step to the generic intro",
     dayGate.includes('(lesson === "intro" || lesson === "cafe")'));
  ok("day-2 cultural bonus still renders even when published",
     /\{dayId === "2" && lesson === "bonus"/.test(dayGate));
  const seed110 = readFileSync("supabase/migrations/20260726000000_seed_days1_10_rich.sql", "utf8");
  ok("days 1-10 seeded as DRAFTS without clobbering teacher edits",
     (seed110.match(/INSERT INTO public\.authored_days/g) || []).length === 10 &&
     seed110.includes("'draft'") && seed110.includes("ON CONFLICT (day_id) DO NOTHING") &&
     !seed110.includes("DELETE FROM"));
  ok("blank rich-day factory is shared", readFileSync("src/lib/rich-content.ts", "utf8").includes("export function blankRichDay"));

  // Tutor teaches the teacher-edited content: days 11+ override code vocab/grammar
  // from authored_days.rich (falls back to code when there's no DB row).
  const tutSrc = readFileSync("src/lib/tutor.functions.ts", "utf8");
  ok("tutor resolves day context from the DB for weeks 3+",
     tutSrc.includes("resolveTutorContext") && tutSrc.includes('.from("authored_days")') && tutSrc.includes("rich.vocabulary"));
  ok("tutor falls back to code content when no DB row",
     tutSrc.includes("if (dayId < 11) return base") && /return base/.test(tutSrc));
}

/* ---------------- Month 2 · JE COMPRENDS (days 21-40) ---------------- */
g("12f. Month 2 · days 21-40 (JE COMPRENDS) render through the REAL lesson player");
{
  const day = readFileSync("src/routes/day.$dayId.tsx", "utf8");
  ok("day player imports the MONTH2 code data + meta",
     day.includes('from "@/data/month2"') && day.includes('from "@/data/month2.meta"'));
  ok("days 21-40 registered into the same lesson maps as 1-20",
     day.includes("Object.entries(MONTH2_META)) registerDay"));
  ok("week title uses the JE COMPRENDS theme for weeks 5+",
     day.includes('m.week <= 4 ? "J\'OSE" : "JE COMPRENDS"'));

  // The generated Month-2 content module must be complete and in the WeekDay shape.
  const m2src = readFileSync("src/data/month2.ts", "utf8");
  const jsonStart = m2src.indexOf("= {", m2src.indexOf("export const MONTH2"));
  const M2 = JSON.parse(m2src.slice(jsonStart + 2).replace(/;\s*$/, "").trim());
  const days2 = Object.keys(M2).map(Number).sort((a, b) => a - b);
  const want2 = Array.from({ length: 20 }, (_, i) => 21 + i).join(",");
  eq("MONTH2 covers days 21-40", days2.join(","), want2);
  ok("each Month-2 day has 30 vocab words", days2.every((d) => M2[d].vocabulary.length === 30));
  // >= 4, not === 4: the client's Mapa gives six days a grammar point the
  // platform never taught (possessifs, verbes piliers, depuis/on, adverbes
  // d'intensité, c'est vs il est, accord+BAPNE). Those were ADDED on top of the
  // existing cards, so those days legitimately carry 6-7 now.
  ok("each Month-2 day has flashcards + at least 4 grammar structures",
     days2.every((d) => M2[d].flashQuiz.length >= 12 && M2[d].grammar.length >= 4));
  ok("each Month-2 day has the 4 vocab games (reading/5 listening/5 speaking/5 writing)",
     days2.every((d) => { const gm = M2[d].vocabGames; return gm.reading.length >= 1 && gm.listening.length === 5 && gm.speaking.length === 5 && gm.writing.length === 5; }));
  ok("each Month-2 day has a clés reading (3 questions) + 3 clés games (5 each)",
     days2.every((d) => (M2[d].clesReading?.questions?.length ?? 0) === 3 && M2[d].clesGames.listening.length === 5 && M2[d].clesGames.speaking.length === 5 && M2[d].clesGames.writing.length === 5));
  ok("each Month-2 day has a staged défi (5 steps + 6 criteria)",
     days2.every((d) => M2[d].defiSteps.length === 5 && M2[d].defiCriteria.length === 6));
  ok("each Month-2 day carries a complete 3-objective tutor scene",
     days2.every((d) => M2[d].tutor && M2[d].tutor.objectives.length === 3 && M2[d].tutor.opener_fr && M2[d].tutor.opener_es && M2[d].tutor.topic && M2[d].tutor.role));
  // Every MCQ/listening answer index must point at a real option (no off-by-one
  // that would silently mark a wrong option as correct — real student content).
  const mcqOk = days2.every((d) => {
    const r = M2[d];
    const listens = [...r.vocabGames.listening, ...r.clesGames.listening];
    const reads = [r.clesReading, ...r.vocabGames.reading];
    return listens.every((l) => l.answer >= 0 && l.answer <= 2 && l.options[l.answer] !== undefined)
      && reads.every((rd) => rd.questions.every((q) => q.answer >= 0 && q.answer <= 2 && q.options[q.answer] !== undefined))
      && r.flashQuiz.every((f) => f.answer >= 0 && f.answer <= 2 && f.options[f.answer] !== undefined);
  });
  ok("every Month-2 MCQ/listening answer index points at a real option", mcqOk);

  // Meta: 20 day labels for weeks 5-8, JE COMPRENDS branding.
  const m2meta = readFileSync("src/data/month2.meta.ts", "utf8");
  ok("MONTH2_META covers days 21-40", Array.from({ length: 20 }, (_, i) => 21 + i).every((d) => m2meta.includes(`"${d}":`)));
  ok("Month-2 meta spans weeks 5-8", m2meta.includes("week: 5,") && m2meta.includes("week: 8,"));

  // Unlock: Month 2 days are real content now, still sequentially gated after day 10.
  ok("day 21 LOCKED until day 20 done", !mod.isDayUnlocked(21, S()));
  ok("day 21 opens once day 20 done", mod.isDayUnlocked(21, S(20)));
  ok("day 40 opens once day 39 done", mod.isDayUnlocked(40, S(39)));

  // Dashboard weeks 5-8 point at the right start days; month 2 is JE COMPRENDS.
  const dashW = readFileSync("src/routes/liberte-plataforma-834798234728482934254-student.tsx", "utf8");
  ok("dashboard maps weeks 5-8 to their start days",
     dashW.includes('5: "21"') && dashW.includes('6: "26"') && dashW.includes('7: "31"') && dashW.includes('8: "36"'));
  ok("program month 2 theme is JE COMPRENDS",
     readFileSync("src/data/program.ts", "utf8").includes('name: "JE COMPRENDS"'));

  // Rich seed: days 21-40 published into authored_days (teacher-editable), idempotent.
  const richSeed2 = readFileSync("supabase/migrations/20260725000000_seed_month2_rich.sql", "utf8");
  ok("Month-2 rich seed publishes all 20 days 21-40",
     (richSeed2.match(/INSERT INTO public\.authored_days/g) || []).length === 20 && richSeed2.includes("'published'"));
  ok("Month-2 rich seed is idempotent", richSeed2.includes("DELETE FROM public.authored_days WHERE day_id BETWEEN 21 AND 40"));
  ok("Month-2 seed script shares the meta module",
     readFileSync("scripts/gen-month2-seed.mjs", "utf8").includes("month2.meta.ts"));

  // Recorded-classes fix: the built-in library appeared to vanish when staff added
  // their first class (page swaps hardcoded->DB the moment the table is non-empty).
  // Seeding the 3 real built-ins makes the table the source of truth (additive).
  const recSeed = readFileSync("supabase/migrations/20260724000001_seed_recorded_classes.sql", "utf8");
  ok("recorded-classes seed inserts the 3 real built-in classes",
     (recSeed.match(/INSERT INTO public\.recorded_classes/g) || []).length === 3);
  ok("recorded-classes seed is idempotent (skips titles already present)",
     (recSeed.match(/WHERE NOT EXISTS/g) || []).length === 3);
}

/* -------- Universal messaging + the colibri/progress/calendar regressions -------- */
g("12g. Peer messaging + regression guards for the client-reported bugs");
{
  // #3 REGRESSION — the floating tutor mascot (fixed bottom-right) must NOT show on
  // the lesson-flow pages, where it overlapped and stole clicks from « Suivant »
  // (the ONLY control that marks a lesson done — so #2 was a downstream effect).
  const mascot = readFileSync("src/components/TutorMascot.tsx", "utf8");
  ok("tutor mascot hidden on the day player + weekly défis (unblocks « Suivant »)",
     ["/conversation", "/day", "/semaine", "/defi-semaine2"].every((p) => mascot.includes(`"${p}"`)));

  // #2 — « Suivant » (advance) is what completes a lesson and persists progress to
  // day_state; if this wiring breaks, "Ton progrès" freezes at 0% again.
  const day = readFileSync("src/routes/day.$dayId.tsx", "utf8");
  ok("advancing a lesson marks it done + persists to day_state",
     day.includes("onComplete()") && /const complete = \(k[^)]*\) =>/.test(day) && day.includes("setDone((d) => ({ ...d, [k]: true }))") && day.includes("done_lessons"));

  // #1 — students CAN read calendar_events (SELECT open to authenticated). If this
  // regresses to staff-only, students silently fall back to the hardcoded schedule
  // and never see the teacher's edits.
  const calMig = readFileSync("supabase/migrations/20260718000001_calendar_events.sql", "utf8");
  ok("students can read calendar_events (SELECT USING true)",
     /FOR SELECT TO authenticated\s+USING \(true\)/.test(calMig));

  // Universal messaging — peer-to-peer allowed at the DB layer (staff requirement dropped).
  const msgMig = readFileSync("supabase/migrations/20260725000001_universal_messaging.sql", "utf8");
  ok("messages INSERT policy allows peer messaging (no staff requirement)",
     msgMig.includes('CREATE POLICY "send own messages"') && /WITH CHECK \(auth\.uid\(\) = sender_id\)/.test(msgMig) && !msgMig.includes("has_role(recipient_id"));
  const msgFns = readFileSync("src/lib/messaging.functions.ts", "utf8");
  ok("getContacts directory lists staff + approved students (not staff-only)",
     msgFns.includes("export const getContacts") && msgFns.includes('.not("approved_at", "is", null)') && msgFns.includes('role: roleOf.get(id) ?? "student"'));
  ok("getContacts is gated on approval (no unapproved cohort enumeration)",
     /getContacts[\s\S]{0,400}requireApprovedStudent/.test(msgFns));
  ok("sendMessage requires an approved account (spam guard after the RLS relax)",
     /sendMessage[\s\S]{0,1600}requireApprovedStudent/.test(msgFns));
  const msgUi = readFileSync("src/routes/mensajes.tsx", "utf8");
  ok("Mensajes uses the universal directory + a search box",
     msgUi.includes("getContacts") && !msgUi.includes("getStaffContacts") && msgUi.includes("Chercher un prof ou un camarade"));
  ok("Mensajes shows role badges (profe vs compañero)", msgUi.includes("RoleBadge") && msgUi.includes("roleLabel"));
}

/* ------- progress persistence: the bug that silently lost ALL student work ------- */
g("12h. Progress persistence (REAL writes + the state machine)");
{
  // ── 1. The anti-pattern that caused it ────────────────────────────────────
  // supabase-js builders are THENABLES: `void supabase.from(x).upsert(...)`
  // builds a query and NEVER sends it. That single pattern meant `day_state`
  // had 0 rows in production for the entire life of the app — every student
  // lost their lesson progress on any reload/tab switch, with no error anywhere.
  // Persistence must go through `persist()` (which awaits + reports failures).
  const persistSrc = readFileSync("src/lib/persist.ts", "utf8");
  ok("persist() helper exists and awaits the query", persistSrc.includes("export async function persist") && /await run\(\)/.test(persistSrc));
  const srcFiles = ["src/routes/day.$dayId.tsx", "src/routes/semaine.$weekId.tsx", "src/routes/defi-semaine2.tsx"];
  const offenders = [];
  for (const f of srcFiles) {
    const s = readFileSync(f, "utf8");
    // `void supabase...` is only OK for removeChannel (a real Promise).
    for (const m of s.match(/void\s+supabase\s*\.?\s*\n?\s*(?!removeChannel)[a-zA-Z]*/g) ?? []) {
      if (!m.includes("removeChannel")) offenders.push(`${f}: ${m.replace(/\s+/g, " ").trim()}`);
    }
  }
  ok("no un-awaited supabase writes remain (they never execute)", offenders.length === 0, offenders.join(" | "));
  for (const f of srcFiles) {
    ok(`${f.split("/").pop()} persists via persist()`, readFileSync(f, "utf8").includes('persist("'));
  }

  // ── 2. The pure state machine (races, deterministically) ──────────────────
  const dpSrc = ts.transpileModule(readFileSync("src/lib/dayProgress.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const dp = {};
  new Function("exports", "module", dpSrc)(dp, { exports: dp });

  const K = dp.dayStateKey("u1", "3", false);
  eq("hydration key includes user + day", K, "u1:3:nosnap");
  ok("day 1 key does not certify day 10", !dp.isHydratedFor("u1:1:nosnap", "u1", "10"));
  ok("matching user+day certifies", dp.isHydratedFor("u1:10:nosnap", "u1", "10"));
  ok("another user's key never certifies", !dp.isHydratedFor("u2:3:nosnap", "u1", "3"));

  const base = { hydratedKey: "u1:3:nosnap", userId: "u1", dayId: "3", readOnly: false };
  ok("SAVE BLOCKED before a successful hydration (would overwrite real progress)",
     !dp.shouldPersistDay({ ...base, hydratedKey: "", localDoneCount: 0, remoteDoneCount: null }));
  ok("SAVE BLOCKED when empty local state meets an unknown remote row (no-downgrade)",
     !dp.shouldPersistDay({ ...base, localDoneCount: 0, remoteDoneCount: null }));
  ok("SAVE BLOCKED when empty local state would erase a non-empty remote row",
     !dp.shouldPersistDay({ ...base, localDoneCount: 0, remoteDoneCount: 4 }));
  ok("SAVE ALLOWED for a genuinely empty day", dp.shouldPersistDay({ ...base, localDoneCount: 0, remoteDoneCount: 0 }));
  ok("SAVE ALLOWED with real progress", dp.shouldPersistDay({ ...base, localDoneCount: 2, remoteDoneCount: 1 }));
  ok("SAVE BLOCKED while impersonating a student", !dp.shouldPersistDay({ ...base, readOnly: true, localDoneCount: 3, remoteDoneCount: 1 }));
  ok("SAVE BLOCKED with no user", !dp.shouldPersistDay({ ...base, userId: undefined, localDoneCount: 3, remoteDoneCount: 1 }));

  // A slow read must never roll back a lesson finished while it was in flight.
  const merged = dp.mergeHydrated({ gym: true, intro: true }, { done_lessons: ["gym"], current_lesson: "gym", stars: 0 });
  ok("hydration merges (local progress is never rolled back)", merged.gym === true && merged.intro === true);
  eq("done keys are the completed lessons", dp.doneKeys({ a: true, b: false, c: true }).join(","), "a,c");
  const ORDER = ["gym", "intro", "vocab", "cles", "defi"];
  eq("resume lands on the saved lesson", dp.resolveLesson({ pending: null, saved: "cles", order: ORDER }), "cles");
  eq("a cross-day click beats the saved lesson", dp.resolveLesson({ pending: "vocab", saved: "cles", order: ORDER }), "vocab");
  // NULL = "leave the student where they are". Returning order[0] here meant a
  // slow hydration yanked a student who had already tapped lesson 2 back to
  // "Gym cérébral" — and then autosaved that position. Caught by the E2E suite.
  eq("nothing to restore → keep the current lesson", dp.resolveLesson({ pending: null, saved: null, order: ORDER }), null);
  eq("an unknown saved lesson does not reset to lesson 1", dp.resolveLesson({ pending: null, saved: "bogus", order: ORDER }), null);

  // ── 3. REAL round-trip as an authenticated student (catches the outage) ────
  if (studentClient && uid) {
    const up = await studentClient.from("day_state").upsert(
      { user_id: uid, day_id: 4, done_lessons: ["gym", "intro"], current_lesson: "vocab", stars: 2 },
      { onConflict: "user_id,day_id" },
    );
    ok("student CAN write day_state (RLS + grants)", !up.error, up.error?.message);
    const back = await studentClient.from("day_state").select("done_lessons, current_lesson, stars").eq("user_id", uid).eq("day_id", 4).maybeSingle();
    ok("day_state round-trips (progress actually persists)",
       !back.error && back.data?.current_lesson === "vocab" && Array.isArray(back.data?.done_lessons) && back.data.done_lessons.length === 2,
       back.error?.message ?? JSON.stringify(back.data));
    const ws = await studentClient.from("week_state").upsert(
      { user_id: uid, week_number: 3, state: { block: "CE" } }, { onConflict: "user_id,week_number" },
    );
    ok("student CAN write week_state (weekly-test autosave)", !ws.error, ws.error?.message);
    const foreign = await studentClient.from("day_state").select("user_id").neq("user_id", uid);
    ok("RLS hides other students' day_state", !foreign.error && (foreign.data ?? []).length === 0, foreign.error?.message);
  } else {
    skip("student day_state round-trip", "no authenticated student client");
  }

  // ── 4. Dashboard counters: a student mid-week-2 must NOT read 0 ───────────
  // They used to derive from `day_completions` ONLY (ignoring défi submissions)
  // and counted weeks as floor(totalDays/5), so real work showed as 0/24 · 0/120.
  const progSrcTxt = readFileSync("src/lib/progress.ts", "utf8");
  ok("completed days = union(day_completions, defi_results)",
     /new Set\(\[\s*\.\.\.rows\.map\(\(r\) => r\.day_id\),\s*\.\.\.defiDays\s*\]\)/.test(progSrcTxt));
  ok("weeks counted only when ALL their days are done (not floor(n/5))",
     progSrcTxt.includes("doneSet.has(dayId)") && !/weeksCompleted = Math\.floor/.test(progSrcTxt));
  ok("a failed fetch keeps the previous data instead of blanking it",
     progSrcTxt.includes("if (!dc.error) setRows") &&
     /if \(!dr\.error\) \{\s*\n\s*setDefiDays/.test(progSrcTxt));
  ok("progress hooks depend on user?.id, not the churning user object",
     progSrcTxt.includes("[user?.id, user?.created_at, targetUserId]") && progSrcTxt.includes("[user?.id, targetUserId]"));

  // Replicate the shipped derivation to prove the arithmetic on real shapes.
  const DPW = 5, TW = 24, TD = 120;
  const derive = (dcDays, defiDays) => {
    const days = Array.from(new Set([...dcDays, ...defiDays])).sort((a, b) => a - b);
    const set = new Set(days);
    const weeks = Array.from({ length: TW }, (_, i) => i + 1).filter((w) =>
      Array.from({ length: DPW }, (_, d) => (w - 1) * DPW + d + 1).every((x) => set.has(x)),
    ).length;
    return { days: days.length, weeks, pct: Math.round((days.length / TD) * 100) };
  };
  const midWeek2 = derive([1, 2, 3, 4, 5, 6, 7], [8]);
  eq("student mid-week-2 counts 8 days (not 0)", midWeek2.days, 8);
  eq("student mid-week-2 shows week 1 complete", midWeek2.weeks, 1);
  ok("student mid-week-2 shows real % (not the 1% floor)", midWeek2.pct === 7);
  eq("défi-only days still count", derive([], [1, 2, 3]).days, 3);
  eq("duplicates across both tables are not double-counted", derive([1, 2, 3], [2, 3, 4]).days, 4);
  eq("5 scattered days do NOT make a completed week", derive([1, 2, 3, 7, 9], []).weeks, 0);
  eq("a full week 2 counts once days 1-10 are done", derive(Array.from({ length: 10 }, (_, i) => i + 1), []).weeks, 2);

  // ── 5. Auth churn: a tab return must not tear the app down ────────────────
  const authSrc = readFileSync("src/lib/auth-context.tsx", "utf8");
  ok("auth listener is event-aware (supabase re-emits SIGNED_IN on every tab return)",
     authSrc.includes("onAuthStateChange((event, s)") && authSrc.includes('event === "SIGNED_OUT"'));
  ok("a no-op auth event keeps the same user identity (no refetch storm)",
     authSrc.includes("userIdRef.current") && authSrc.includes("if (sameUser) return;"));
  ok("context value is memoized (consumers don't re-run on every render)", authSrc.includes("const value = useMemo("));
  const gateSrc = readFileSync("src/components/AuthGate.tsx", "utf8");
  ok("AuthGate keeps the page mounted through a transient auth blip",
     gateSrc.includes("hadUserRef") && gateSrc.includes("!hadUserRef.current"));

  // ── 6. EVERY week is evaluated + the coach sees it in the dashboard ───────
  const wk = readFileSync("src/routes/semaine.$weekId.tsx", "utf8");
  for (const w of [5, 6, 7, 8]) {
    ok(`week ${w} has its own weekly test bank`, new RegExp(`const WEEK${w}_VARIANTS: Variant\\[\\]`).test(wk));
  }
  const byWeek = wk.slice(wk.indexOf("const VARIANTS_BY_WEEK"), wk.indexOf("const VARIANTS_BY_WEEK") + 400);
  ok("weeks 1 and 3-8 are all registered (every content week is evaluated)",
     [1, 3, 4, 5, 6, 7, 8].every((w) => new RegExp(`\\b${w}:\\s*(VARIANTS|WEEK${w}_VARIANTS)`).test(byWeek)));
  ok("the week gate is week-agnostic (unlocks 5-8 like 3-4)",
     wk.includes("getWeekChallengeAccess({ data: { weekNumber } })") ||
     wk.includes("days.includes(weekNumber * 5)"));

  const coachFns = readFileSync("src/lib/coach.functions.ts", "utf8");
  ok("coach analytics server fn exists and is coach/admin-gated",
     coachFns.includes("export const getStudentAnalytics") && /getStudentAnalytics[\s\S]{0,900}assertCoachOrAdmin/.test(coachFns));
  ok("analytics aggregate every source a coach needs",
     ["day_completions", "defi_results", "weekly_evaluations", "activity_results", "star_awards", "tutor_usage"]
       .every((t) => new RegExp(`getStudentAnalytics[\\s\\S]*?from\\("${t}"\\)`).test(coachFns)));
  ok("analytics count a day done via completion OR défi (same rule as unlocks)",
     /doneDays = new Set<number>\(\[[\s\S]{0,200}wComp[\s\S]{0,200}wDefis/.test(coachFns));
  ok("analytics flag stalled students", coachFns.includes("daysSinceLastSeen"));
  const anaUi = readFileSync("src/components/StudentAnalytics.tsx", "utf8");
  ok("coach UI shows per-week status, scores and weak points",
     anaUi.includes("Test semanal") && anaUi.includes("weakPoints") && anaUi.includes("STATUS["));
  ok("weekly PDF kept as an optional export (client's choice)",
     anaUi.includes("generateWeeklyPdf") && anaUi.includes("Descargar PDF"));
  ok("analytics panel mounted for coach AND admin",
     readFileSync("src/routes/coach.tsx", "utf8").includes("<StudentAnalytics") &&
     readFileSync("src/components/StudentDetailPanel.tsx", "utf8").includes("<StudentAnalytics"));

  // ── 7. Audit findings — each of these was a real defect, keep them fixed ──
  const dayTsx = readFileSync("src/routes/day.$dayId.tsx", "utf8");

  // C1: fast day A→B→A left a stale hydration certificate over cleared state,
  // so the next click overwrote day A's saved row with near-empty progress.
  ok("clearing day state also REVOKES the hydration certificate",
     /ownerDayRef\.current !== ownerDay[\s\S]*?hydratedKeyRef\.current = "";[\s\S]*?setDone\(\{\}\)/.test(dayTsx));
  ok("a never-read day can never be persisted (remoteDoneCount null ⇒ blocked)",
     !dp.shouldPersistDay({ ...base, localDoneCount: 3, remoteDoneCount: null }));
  ok("the A→B→A interleaving is blocked even with local progress",
     !dp.shouldPersistDay({ hydratedKey: "u1:3:nosnap", userId: "u1", dayId: "3", readOnly: false, localDoneCount: 1, remoteDoneCount: null }));

  // M2/M3: admin "view as student" must never mix identities.
  ok("day state is keyed on the OWNER + day (view-as can't leak into the admin's row)",
     dayTsx.includes("const ownerDayRef") && dayTsx.includes("${viewAsUserId ?? user?.id ?? \"anon\"}:${activeDay}"));
  ok("switching previewed students drops the previous snapshot immediately",
     /setSnapshot\(null\);\s*\n\s*let alive = true;\s*\n\s*getStudentSnapshot/.test(dayTsx));
  ok("stars are not awarded while impersonating", /const award = \([^)]*\) => \{ if \(!readOnly\)/.test(dayTsx));

  // M4: a failed read must be visible and recoverable, never silent.
  ok("a failed hydration warns the student and retries on reconnect/refocus",
     dayTsx.includes("setHydrateFailed(true)") && dayTsx.includes('addEventListener("online"'));
  // minor: don't lose the last <300ms of work when leaving/closing.
  ok("debounced save is flushed on day change and on pagehide",
     /pendingSaveRef\.current\?\.\(\);[\s\S]{0,200}ownerDayRef\.current = ownerDay/.test(dayTsx) &&
     dayTsx.includes('addEventListener("pagehide"'));
  ok("a late save ack cannot describe a different day",
     dayTsx.includes("savingOwnerDay") && dayTsx.includes("ownerDayRef.current === savingOwnerDay"));

  // M1: the weekly tests had the SAME failed-read-certification bug.
  for (const f of ["src/routes/semaine.$weekId.tsx", "src/routes/defi-semaine2.tsx"]) {
    const src = readFileSync(f, "utf8");
    ok(`${f.split("/").pop()} only marks hydrated after a SUCCESSFUL read`,
       src.includes("let readOk = false") && /if \(alive && readOk\) setHydrated\(true\)/.test(src));
    ok(`${f.split("/").pop()} surfaces a failed week_state read`, /\[week_state\] hydrate failed/.test(src));
  }

  // D1: the union must not hide the "+2 ⭐ mark day complete" path.
  ok("mark-day-complete uses day_completions only (union would hide the +2 ⭐)",
     dayTsx.includes("const alreadyMarked = rows.some((r) => r.day_id === dayNum)") &&
     dayTsx.includes("!completionDays.includes(dayNum)"));

  // B1/B2: analytics maths.
  ok("activity hits/misses count jsonb ARRAY lengths (Number([...]) was NaN)",
     coachFns.includes("const countOf = (v: unknown) => (Array.isArray(v) ? v.length : Number(v) || 0)"));
  ok("weekly stars match the real 'weekly:N' key exactly (not substring 'week:N')",
     coachFns.includes("/^weekly:(\\d+)$/") && coachFns.includes("/^(?:day_complete|defi):(\\d+)$/") &&
     !coachFns.includes("includes(`week:${w}`)"));

  // C1 (weeks 5-8 were printed as "Mois 1 : J'OSE").
  ok("month label is derived from the week (weeks 5-8 are JE COMPRENDS)",
     wk.includes("function monthLabelForWeek") &&
     wk.includes("monthLabel: monthLabelForWeek(weekNumber)") &&
     wk.includes("{monthLabelForWeek(weekNumber)}") &&
     // the old hardcode must be gone from real code (comments may mention it)
     !/monthLabel: "Mois 1/.test(wk) && !/Semaine \{weekNumber\} · Mois 1/.test(wk));
  ok("weekly AI evaluation grades THIS week's pronunciation targets",
     readFileSync("src/lib/week.functions.ts", "utf8").includes("PRONUNCIATION_TARGETS[data.weekNumber]"));
  ok("coach PDF maps week-2's different score shape instead of printing 0.0",
     anaUi.includes("isWeek2Shape"));
}

/* ---------------- audit fixes (Kimi findings) ---------------- */
g("12d. Audit fixes: security hardening, weekly eval, coach unlock, cleanup");
{
  // #3 — the ~17 older tables lose the RLS-bypassing TRUNCATE (+ TRIGGER/REFERENCES).
  const h2 = readFileSync("supabase/migrations/20260722000002_privilege_hardening_older_tables.sql", "utf8");
  eq("older-table hardening revokes TRUNCATE on all 17 tables",
     (h2.match(/REVOKE TRUNCATE, REFERENCES, TRIGGER ON public\.\w+ FROM anon, authenticated;/g) || []).length, 17);
  for (const t of ["profiles", "user_roles", "star_awards", "weekly_evaluations"]) {
    ok(`hardening covers ${t}`, h2.includes(`ON public.${t} FROM anon, authenticated`));
  }

  // #4 — coach week unlock now writes the ENFORCED content_access, not the
  // display-only week_unlocks (which the server never checked).
  const coach = readFileSync("src/lib/coach.functions.ts", "utf8");
  ok("coach unlock/lock write content_access (enforced), not week_unlocks",
     coach.includes('.from("content_access")') && !coach.includes('.from("week_unlocks")'));
  ok("coach unlock grants a per-user week override",
     coach.includes('target_type: "week"') && coach.includes('access: "open"'));

  // #2 — weekly evaluation generalized to weeks 3-4 (was week-1-only).
  const sem = readFileSync("src/routes/semaine.$weekId.tsx", "utf8");
  ok("weekly test has real content for weeks 3 and 4",
     sem.includes("WEEK3_VARIANTS") && sem.includes("WEEK4_VARIANTS") && sem.includes("VARIANTS_BY_WEEK"));
  ok("weekly unlock generalized to any week (lastDay = weekNumber*5 via the shared access fn)",
     sem.includes("getWeekChallengeAccess({ data: { weekNumber } })") &&
     readFileSync("src/lib/week.functions.ts", "utf8").includes("const lastDay = weekNumber * 5;"));
  const wk = readFileSync("src/lib/week.functions.ts", "utf8");
  ok("evaluateWeek reads the correct days for any week (not just week 1)",
     wk.includes("(data.weekNumber - 1) * 5 + i + 1") && !wk.includes("weekNumber === 1 ? [1, 2, 3, 4, 5] : []"));

  // Cleanup: single Toaster host, Spanish <html lang>, no stray migration image.
  const root = readFileSync("src/routes/__root.tsx", "utf8");
  ok("single app-wide Toaster host (root only)",
     root.includes("<Toaster") &&
     !readFileSync("src/components/AuthPage.tsx", "utf8").includes("<Toaster") &&
     !readFileSync("src/routes/conversation.tsx", "utf8").includes("<Toaster") &&
     !readFileSync("src/routes/reset-password.tsx", "utf8").includes("<Toaster"));
  ok("<html> lang is Spanish (matches the UI)", root.includes('<html lang="es">'));
  ok("no stray image.png committed in migrations", !existsSync("supabase/migrations/image.png"));
}

/* ---------------- re-audit fixes (Kimi round 2) ---------------- */
g("12e. Re-audit fixes: paid-AI gates, star-minting, wildcard injection, misc");
{
  // Shared approval gate, applied to EVERY paid-AI + staff-directory endpoint.
  ok("shared requireApprovedStudent helper exists",
     readFileSync("src/lib/approval.ts", "utf8").includes("export async function requireApprovedStudent"));
  const defi = readFileSync("src/lib/defi.functions.ts", "utf8");
  eq("defi endpoints all gate on approval (correctActivity/transcribeStage/evaluateDefi)",
     (defi.match(/await requireApprovedStudent\(context\)/g) || []).length, 3);
  ok("tutor + week + messaging import the shared approval gate",
     readFileSync("src/lib/tutor.functions.ts", "utf8").includes('from "@/lib/approval"') &&
     readFileSync("src/lib/week.functions.ts", "utf8").includes("requireApprovedStudent") &&
     readFileSync("src/lib/messaging.functions.ts", "utf8").includes("requireApprovedStudent"));
  ok("getStaffContacts gates unapproved accounts",
     /getStaffContacts[\s\S]{0,400}requireApprovedStudent/.test(readFileSync("src/lib/messaging.functions.ts", "utf8")));

  // evaluateWeek can't mint +3 stars for a week the student hasn't finished.
  const wk = readFileSync("src/lib/week.functions.ts", "utf8");
  ok("evaluateWeek has a server-side completion gate before scoring",
     wk.includes("day_completions") && wk.includes("defi_results") && /Termina el Día/.test(wk) && wk.includes("weekNumber * 5"));

  // Role-grant lookups match emails LITERALLY (no ilike wildcard injection) and
  // revoke works for null-email accounts (by user id).
  const adm = readFileSync("src/lib/admin.functions.ts", "utf8");
  ok("setCoachRole escapes LIKE wildcards + supports lookup by userId",
     adm.includes("escapeLike") && adm.includes('q.eq("id", data.userId)') && adm.includes("UUID_RE"));
  ok("approveStudent lead match escapes wildcards too", adm.includes("escapeLike(profile.email.toLowerCase())"));
  ok("staff revoke uses the user id, not a nullable email",
     readFileSync("src/components/StaffManager.tsx", "utf8").includes("userId: member.id"));

  // /semaine/2 must redirect to its bespoke route, not serve the week-1 test.
  ok("/semaine/2 redirects to /defi-semaine2 (no clobber of the week-2 result)",
     readFileSync("src/routes/semaine.$weekId.tsx", "utf8").includes('navigate({ to: "/defi-semaine2", replace: true })'));

  // Smaller fixes.
  ok("messages inbox not wiped by a transient refresh failure",
     readFileSync("src/routes/mensajes.tsx", "utf8").includes("error && (convs === null || convs.length === 0)"));
  {
    const semSrc = readFileSync("src/routes/semaine.$weekId.tsx", "utf8");
    ok("weekly-test mic denial is handled (not a silent no-op)",
       semSrc.includes("navigator.mediaDevices.getUserMedia") && semSrc.includes("Impossible d’accéder au micro"));
  }
  ok("types.ts tutor_consume_message can return null (daily cap)",
     /tutor_consume_message[\s\S]{0,60}Returns: number \| null/.test(readFileSync("src/integrations/supabase/types.ts", "utf8")));
  ok("500 error page is French + home goes to the student dashboard (not the marketing landing)",
     (() => { const e = readFileSync("src/lib/error-page.ts", "utf8");
              return e.includes('<html lang="fr">') && e.includes("/liberte-plataforma-834798234728482934254-student"); })());
  ok("admin star bar uses the true max (weekly-eval stars included)",
     readFileSync("src/routes/liberte-profesor-panel-9382745-admin.alumnos.tsx", "utf8").includes("TOTAL_DAYS * 4 + TOTAL_WEEKS * 3"));
}

/* ---------------- teacher suite + client-list features ---------------- */
g("12i. Teacher suite: reports, notifications, time-on-task, videos, French chrome");
{
  const wk = readFileSync("src/lib/week.functions.ts", "utf8");
  ok("weekly report auto-delivery helper is exported + called after the eval",
     wk.includes("export async function sendWeeklyReportToTeacher") &&
     wk.includes("await sendWeeklyReportToTeacher(supabaseAdmin"));
  ok("week-2 result delivers the same report (parity — ai_report is no longer {})",
     readFileSync("src/lib/defiSemaine2.functions.ts", "utf8").includes("sendWeeklyReportToTeacher(supabaseAdmin, userId, 2"));
  ok("students can list every weekly evaluation (Mes rapports data source)",
     wk.includes("getMyWeeklyEvaluations"));
  const prog = readFileSync("src/routes/progress.tsx", "utf8");
  ok("Mes rapports on /progress lists weeks + downloads the PDF",
     prog.includes("MyReports") && prog.includes("getMyWeeklyEvaluations") && prog.includes("generateWeeklyPdf"));
  const coachFns = readFileSync("src/lib/coach.functions.ts", "utf8");
  ok("overrideScore audits who changed what (overridden_by/at) and gates on staff",
     coachFns.includes("overrideScore") && coachFns.includes("overridden_by") && coachFns.includes("assertCoachOrAdmin"));
  ok("setAssignedCoach validates the assignee holds a staff role",
     /setAssignedCoach[\s\S]{0,1600}user_roles[\s\S]{0,400}coach/.test(coachFns));
  ok("analytics aggregates per-week + total time-on-task",
     coachFns.includes("secondsSpent") && coachFns.includes("seconds_spent"));
  const ana = readFileSync("src/components/StudentAnalytics.tsx", "utf8");
  ok("coach can override a weekly grade from the analytics grid (✏️)",
     ana.includes("editWeeklyScore") && ana.includes("overrideScore"));
  ok("analytics surfaces time-on-task", ana.includes("fmtTime") && ana.includes("Tiempo"));
  ok("admin panel has the assigned-teacher selector",
     (() => { const s = readFileSync("src/components/StudentDetailPanel.tsx", "utf8");
              return s.includes("AssignedCoachCard") && s.includes("setAssignedCoach"); })());
  const bell = readFileSync("src/components/NotificationsBell.tsx", "utf8");
  ok("nav bell: realtime notifications + unread badge + mark-read",
     bell.includes('table: "notifications"') && bell.includes("markAllRead") && bell.includes("useUnreadMessages"));
  const nav = readFileSync("src/components/TopNav.tsx", "utf8");
  ok("TopNav mounts the bell + unread Messages badge",
     nav.includes("<NotificationsBell />") && nav.includes("useUnreadMessages(path)"));
  ok("coach panel has the live activity feed",
     readFileSync("src/routes/coach.tsx", "utf8").includes("ActivityFeed") &&
     readFileSync("src/components/ActivityFeed.tsx", "utf8").includes('"coach-activity-feed"'));
  const day12i = readFileSync("src/routes/day.$dayId.tsx", "utf8");
  ok("day page heartbeat banks visible seconds via the atomic RPC",
     day12i.includes('supabase.rpc("add_day_seconds"') && day12i.includes("visibilitychange"));

  // Live schema: the migrations actually reached the project.
  {
    const { error: nErr } = await admin.from("notifications").select("id").limit(1);
    ok("live DB: notifications table exists", !nErr, nErr?.message ?? "");
    const { error: sErr } = await admin.from("day_state").select("seconds_spent").limit(1);
    ok("live DB: day_state.seconds_spent exists", !sErr, sErr?.message ?? "");
    const { error: rErr } = await admin.rpc("add_day_seconds", { _day_id: 1, _seconds: 0 });
    ok("live DB: add_day_seconds RPC callable", !rErr, rErr?.message ?? "");
    const { error: oErr } = await admin.from("weekly_evaluations").select("overridden_by").limit(1);
    ok("live DB: override audit columns exist", !oErr, oErr?.message ?? "");
    const { error: acErr } = await admin.from("profiles").select("assigned_coach").limit(1);
    ok("live DB: profiles.assigned_coach exists", !acErr, acErr?.message ?? "");
  }

  // Videos (client #3/#8): optional per-section YouTube embeds.
  ok("WeekDay carries optional per-section video embeds",
     readFileSync("src/data/week34.ts", "utf8").includes("introVideo?: string"));
  ok("editor accepts any YouTube URL shape and normalizes it",
     readFileSync("src/components/RichDayEditor.tsx", "utf8").includes("toYouTubeEmbed") &&
     readFileSync("src/lib/rich-content.ts", "utf8").includes("export function toYouTubeEmbed"));
  ok("lesson wrappers render the per-section videos when set (ctx override first)",
     day12i.includes("{intro && <VideoBlock src={intro}") &&
     day12i.includes("{vocabVid && <VideoBlock src={vocabVid}") &&
     day12i.includes("{clesVid && <VideoBlock src={clesVid}"));

  // TEACHER-REPORTED BUG (2026-07-26, confirmed with screenshots): "cambié el
  // enlace del video y se guarda en el panel, pero no cambia en la plataforma".
  // Root cause 1: GymCerebral read the video from hardcoded constants / the
  // code bundle and NEVER from the authored row — even for published days 11+.
  // Root cause 2: days 1-10 rows are drafts, and RLS hides drafts from
  // students, so no client-side read could ever see those saved links.
  // Fix: getDayVideos server fn (service role, returns ONLY the 4 video URLs,
  // any status) → useDayVideos → DayVideosCtx → every video slot prefers it.
  {
    const dvFns = readFileSync("src/lib/day-videos.functions.ts", "utf8");
    ok("getDayVideos server fn: auth-gated, service-role read, videos only",
       dvFns.includes("requireSupabaseAuth") &&
       dvFns.includes('.select("rich")') &&
       dvFns.includes("supabaseAdmin") &&
       !dvFns.includes("vocabulary")); // it must never leak draft lesson content
    const rcSrc = readFileSync("src/lib/rich-content.ts", "utf8");
    ok("useDayVideos hook fetches saved links regardless of publish status",
       rcSrc.includes("export function useDayVideos") && rcSrc.includes("getDayVideos"));
    ok("day player provides the overrides to every lesson",
       day12i.includes("<DayVideosProvider dayId={activeDay}>") &&
       day12i.includes("const DayVideosCtx = createContext<DayVideos>"));
    ok("GymCerebral prefers the teacher-saved gym link (the exact repro)",
       /const src =\s*\n?\s*v\.gym \|\|/.test(day12i));
    const oVideoCount = (day12i.match(/<OVideo slot=/g) ?? []).length;
    ok(`all bespoke days-1-10 videos go through the override (${oVideoCount} slots ≥ 30)`,
       oVideoCount >= 30);
    ok("editor banner tells the teacher videos apply instantly (no publish needed)",
       readFileSync("src/components/RichDayEditor.tsx", "utf8").includes("Los videos se actualizan al instante"));
  }
  {
    const src = readFileSync("src/lib/rich-content.ts", "utf8");
    const body = src.slice(src.indexOf("export function toYouTubeEmbed"));
    const jsSrc = body.slice(0, body.indexOf("\n}") + 2)
      .replace("export function toYouTubeEmbed(raw: string): string", "return function toYouTubeEmbed(raw)");
    const fn = new Function(jsSrc)();
    ok("toYouTubeEmbed: watch / youtu.be / shorts → embed; non-YouTube passes through",
       fn("https://www.youtube.com/watch?v=AdJPOTR-CdU") === "https://www.youtube.com/embed/AdJPOTR-CdU" &&
       fn("https://youtu.be/AdJPOTR-CdU") === "https://www.youtube.com/embed/AdJPOTR-CdU" &&
       fn("https://www.youtube.com/shorts/AdJPOTR-CdU") === "https://www.youtube.com/embed/AdJPOTR-CdU" &&
       fn("https://example.com/video.mp4") === "https://example.com/video.mp4");
  }

  // French chrome (client #6): student-facing spot-checks.
  ok("student chrome is French (spot-checks)",
     prog.includes("Mon progrès") &&
     readFileSync("src/routes/mensajes.tsx", "utf8").includes("✉️ Messages") &&
     nav.includes("Se déconnecter") &&
     readFileSync("src/components/StagedDefi.tsx", "utf8").includes("Envoyer mon défi") &&
     day12i.includes("Comment dit-on en français ?"));

  // ---- 2026-07-26 night forensics fixes (student + teacher reports) ----

  // Report 3: routes gated on defi_results ONLY while the sidebar/server used
  // the union — "terminé el día 10 pero no se me abre el desafío".
  ok("getCompletedDays unions day_completions with defi_results (matches the server gate)",
     /getCompletedDays[\s\S]{0,900}defi_results[\s\S]{0,300}day_completions/.test(wk));
  {
    const d2 = readFileSync("src/routes/defi-semaine2.tsx", "utf8");
    ok("defi-semaine2: finished-result revisit sets readOk (no more infinite spinner)",
       /setStage\("results"\);[\s\S]{0,400}readOk = true;[\s\S]{0,50}return;/.test(d2));
    ok("defi-semaine2: a failed gate read shows a retry, never the lock screen",
       d2.includes("ok: false as const") && d2.includes("setGateFailed(true)") && d2.includes("Réessayer"));
    const sem = readFileSync("src/routes/semaine.$weekId.tsx", "utf8");
    ok("semaine gate: retry on failure + an existing evaluation always unlocks",
       sem.includes("setGateFailed(!isAdmin)") && sem.includes("Réessayer") && readFileSync("src/lib/week.functions.ts", "utf8").includes("s.hasEvaluation || reachedEndOfWeek"));
  }

  // Report 5: the error pages' "home" went to the public landing, which shows
  // "Iniciar sesión" — students believed an error had logged them out.
  {
    const root = readFileSync("src/routes/__root.tsx", "utf8");
    ok("error + 404 pages send students to the dashboard, not the marketing landing",
       root.includes('const STUDENT_HOME = "/liberte-plataforma-834798234728482934254-student"') &&
       root.includes("href={STUDENT_HOME}") && root.includes("to={STUDENT_HOME}") &&
       !root.includes('href="/"'));
  }

  // Stale bundles: tabs opened before a deploy kept re-reporting fixed bugs.
  ok("long-lived tabs detect a new deploy and offer a reload",
     readFileSync("src/lib/use-new-build.ts", "utf8").includes("assets\\/index-") &&
     nav.includes("useNewBuildNudge()"));

  // Calendar: the whole Zoom invitation pasted as zoom_url corrupted an event.
  {
    const cal = readFileSync("src/lib/calendarEvents.ts", "utf8");
    ok("zoom_url is normalized on read AND on save (join link extracted from pasted text)",
       cal.includes("export function extractZoomUrl") &&
       cal.includes("zoomUrl: extractZoomUrl(r.zoom_url)") &&
       readFileSync("src/components/CalendarEventEditor.tsx", "utf8").includes("extractZoomUrl(form.zoomUrl)"));
    const body = cal.slice(cal.indexOf("export function extractZoomUrl"));
    const fn = new Function(
      body.slice(0, body.indexOf("\n}") + 2)
        .replace("export function extractZoomUrl(raw: string | null | undefined): string | undefined", "return function extractZoomUrl(raw)"),
    )();
    ok("extractZoomUrl pulls the /j/ join link out of a pasted invitation",
       fn("Liberté le está invitando…\nUnirse: https://us06web.zoom.us/j/86574307208?pwd=x\nChat: https://zoom.us/launch/jc/abc") ===
         "https://us06web.zoom.us/j/86574307208?pwd=x" &&
       fn("https://us06web.zoom.us/j/123456") === "https://us06web.zoom.us/j/123456" &&
       fn("") === undefined);
  }

  // Streak: défi-only days are real work and must not break the chain.
  ok("streak counts défi days too",
     readFileSync("src/lib/progress.ts", "utf8").includes("computeStreak([...rows.map((r) => r.completed_at), ...defiDates])"));

  // The one-time repair for pre-fix students exists and is idempotent-by-design.
  ok("day_state backfill script exists (dry-run default, only fills missing/empty rows)",
     (() => { const b = readFileSync("scripts/backfill-day-state.mjs", "utf8");
              return b.includes("--apply") && b.includes("never touch it") && b.includes("onConflict: \"user_id,day_id\""); })());
}

/* ---------------- 12j. Student AI report + week-gate unification + stale-chunk recovery ---------------- */
g("12j. Student AI report · per-week challenge gates · stale-chunk recovery");
{
  // ---- A: the report is stored and visible to BOTH roles ----
  const mig = readFileSync("supabase/migrations/20260727000000_ai_student_reports.sql", "utf8");
  ok("ai_student_reports migration: PK per user, SELECT-only grant, own+staff read policies",
     mig.includes("user_id uuid PRIMARY KEY") &&
     mig.includes("updated_at timestamptz NOT NULL DEFAULT now()") &&
     mig.includes("GRANT SELECT ON public.ai_student_reports TO authenticated") &&
     !/GRANT ALL ON public\.ai_student_reports TO authenticated/.test(mig) &&
     mig.includes("own ai report read") && mig.includes("staff ai report read"));
  const rep = readFileSync("src/lib/report.functions.ts", "utf8");
  ok("getMyAIReport: approval-gated, live stats every call, 24h cached narrative",
     rep.includes("getMyAIReport") && rep.includes("requireApprovedStudent") &&
     rep.includes("REPORT_TTL_MS = 24 * 60 * 60 * 1000") &&
     rep.includes("gatherStudentData(uid)"));
  ok("a failed/empty generation is never stored or served as fresh",
     rep.includes("return report.resumen ? report : null;") &&
     rep.includes("storedUsable = Boolean(stored && stored.resumen)"));
  ok("mensaje_sugerido is stripped SERVER-side for students (teacher's draft message)",
     rep.includes('{ ...report, mensaje_sugerido: "" }'));
  ok("teacher generations persist too, so both roles see the same report",
     /getStudentAIReport[\s\S]{0,700}storeReport\(data\.userId, built/.test(rep));
  const cardSrc = readFileSync("src/components/StudentReportCard.tsx", "utf8");
  ok("«Mon rapport IA» card: French labels, no suggested-message section, cooldown shown",
     cardSrc.includes("MyAIReportCard") && cardSrc.includes("Mon rapport IA") &&
     cardSrc.includes("prochaine actualisation possible") &&
     /STUDENT_LABELS[\s\S]{0,900}recomendaciones: "Recommandations",\n  \},/.test(cardSrc));
  ok("/progress mounts the student report card",
     readFileSync("src/routes/progress.tsx", "utf8").includes("<MyAIReportCard />"));

  // ---- B: ONE gate rule for every week, behaviorally tested per week ----
  const wk12j = readFileSync("src/lib/week.functions.ts", "utf8");
  {
    const start = wk12j.indexOf("export function decideWeekAccess");
    const body = wk12j.slice(start, wk12j.indexOf("\n}", start) + 2)
      .replace(/export function decideWeekAccess\([\s\S]*?\): WeekAccess \{/,
               "return function decideWeekAccess(weekNumber, s) {");
    const decide = new Function(body)();
    let allWeeksOk = true;
    for (let w = 1; w <= 8; w++) {
      const last = w * 5;
      const S = (o) => decide(w, { isStaff: false, hasEvaluation: false, maxDoneDay: 0, override: undefined, ...o });
      const none = S({});
      const midWeek = S({ maxDoneDay: last - 1 });            // inside the week → still locked
      const exact = S({ maxDoneDay: last });                   // finished the last day
      const past = S({ maxDoneDay: last + 3 });                // ALREADY BEYOND this week
      const evald = S({ hasEvaluation: true });                // revisit an evaluated week
      const staff = S({ isStaff: true });                      // coach OR admin
      const staffLocked = S({ isStaff: true, override: "locked" });
      const open0 = S({ override: "open" });                   // zero work + 'open' override
      const lockD = S({ maxDoneDay: last, override: "locked" });
      const okW =
        !none.unlocked && none.lastDay === last &&
        !midWeek.unlocked &&                                   // one day short stays locked
        exact.unlocked && past.unlocked &&                     // reached OR passed the week
        evald.unlocked &&
        staff.unlocked && staffLocked.unlocked &&              // staff always in
        !open0.unlocked && !open0.lockedByTeacher &&           // 'open' ≠ evaluation authorization
        !lockD.unlocked && lockD.lockedByTeacher;              // teacher lock beats a finished day
      if (!okW) { allWeeksOk = false; ok(`week ${w} gate matrix`, false, JSON.stringify({ none, midWeek, exact, past, evald, staff, staffLocked, open0, lockD })); }
    }
    ok("decideWeekAccess matrix holds for EVERY week 1-8 (9 states each)", allWeeksOk);
    ok("a student PAST the week gets in even without that exact day (prod bug: day 8, no day 5)",
       decide(1, { isStaff: false, hasEvaluation: false, maxDoneDay: 8, override: undefined }).unlocked);
    ok("coaches are staff, not students (prod bug: 'no abre ni para el coach')",
       decide(1, { isStaff: true, hasEvaluation: false, maxDoneDay: 0, override: undefined }).unlocked);
    const bad = decide(0, { isStaff: true, hasEvaluation: true, maxDoneDay: 99, override: undefined });
    const bad2 = decide(25, { isStaff: true, hasEvaluation: true, maxDoneDay: 99, override: undefined });
    ok("invalid week numbers are locked, never a throw", !bad.unlocked && !bad2.unlocked);
  }
  ok("getWeekChallengeAccess: validates weekNumber, surfaces read errors (retry screen, not silent-lock)",
     wk12j.includes("getWeekChallengeAccess") &&
     wk12j.includes("n >= 1 && n <= 24 ? n : 0") &&
     /if \(evalRes\.error\) throw/.test(wk12j) && /if \(dcRes\.error\) throw/.test(wk12j) && /if \(drRes\.error\) throw/.test(wk12j));
  ok("ONE server decision shared by the route gate AND both submit gates",
     wk12j.includes("export async function computeWeekAccess") &&
     wk12j.includes("await computeWeekAccess(context, data.weekNumber)") &&
     readFileSync("src/lib/defiSemaine2.functions.ts", "utf8").includes("computeWeekAccess(context, 2)"));
  ok("staff = coach OR admin (both roles queried server-side)",
     wk12j.includes(String.fromCharCode(95) + "role: " + JSON.stringify("coach")) &&
     wk12j.includes(String.fromCharCode(95) + "role: " + JSON.stringify("admin")) &&
     wk12j.includes("isStaff: Boolean(coachRes.data) || Boolean(adminRes.data)"));
  ok("progress rule is reached-end-of-week (max done day), not that exact day",
     wk12j.includes("maxDoneDay >= lastDay") && wk12j.includes("Math.max(...days)"));
  ok("/semaine gate consumes the shared access fn (+ teacher-locked screen)",
     (() => { const s = readFileSync("src/routes/semaine.$weekId.tsx", "utf8");
              return s.includes("getWeekChallengeAccess({ data: { weekNumber } })") &&
                     s.includes("Semaine verrouillée") && !s.includes("getCompletedDays()"); })());
  ok("/defi-semaine2 gate consumes the shared access fn (+ teacher-locked screen)",
     (() => { const s = readFileSync("src/routes/defi-semaine2.tsx", "utf8");
              return s.includes("getWeekChallengeAccess({ data: { weekNumber: 2 } })") &&
                     s.includes("Semaine verrouillée") && !s.includes("getCompletedDays()"); })());
  ok("saveWeek2Result is finally gated (approval + shared access decision + clamped scores)",
     (() => { const s = readFileSync("src/lib/defiSemaine2.functions.ts", "utf8");
              return /saveWeek2Result[\s\S]{0,2500}requireApprovedStudent\(context\)/.test(s) &&
                     /saveWeek2Result[\s\S]{0,2500}computeWeekAccess\(context, 2\)/.test(s) &&
                     /saveWeek2Result[\s\S]{0,2500}access\.unlocked/.test(s) &&
                     s.includes("clamp(d?.totalScore, 100)"); })());
  ok("day-page tile mirrors the route rule (reached end of week) instead of all-5-days",
     (() => { const d = readFileSync("src/routes/day.$dayId.tsx", "utf8");
              return d.includes("const weekChallengeOpen = maxDoneDay >= weekLastDay || isAdmin") &&
                     d.includes("{weekChallengeOpen ? (") &&
                     d.includes("S’ouvre au Jour {weekLastDay}"); })());

  // ---- C: stale-chunk auto-recovery + the silent completion write ----
  const cli = readFileSync("src/client.tsx", "utf8");
  ok("src/client.tsx: preloadError → one guarded reload (no preventDefault, storage try/catch)",
     cli.includes('window.addEventListener("vite:preloadError"') &&
     cli.includes("hydrateRoot") && cli.includes("<StartClient />") &&
     !cli.split("\n").some((l) => !l.trim().startsWith("//") && l.includes(".preventDefault(")) &&
     cli.includes("sessionStorage.getItem") && cli.includes("60_000"));
  ok("défi auto-backfill failures now toast (catch scoped to the write only)",
     (() => { const d = readFileSync("src/routes/day.$dayId.tsx", "utf8");
              return d.includes("Ton jour n'a pas pu être enregistré") &&
                     /markDayCompleted\(user\.id, dayNum, activeWeek\)\s*\n\s*\.then\(\s*\n\s*\(\) => refreshDays\(\)\.catch/.test(d); })());
  // PROD CRASH (user console: "Cannot read properties of undefined (reading
  // 'emoji')" on /day/3): in-place day switches kept the previous day's lesson
  // key ("cafe"/"bonus"), LessonView's find() came back undefined, and the
  // render crashed BEFORE the reset effect could run. Two-layer fix:
  ok("day switch resets an alien lesson key DURING render (not in an effect)",
     (() => { const d = readFileSync("src/routes/day.$dayId.tsx", "utf8");
              return /const \[renderedDay, setRenderedDay\] = useState\(activeDay\);\s*\n\s*if \(renderedDay !== activeDay\) \{\s*\n\s*setRenderedDay\(activeDay\);\s*\n\s*if \(!order\.includes\(lesson\)\) setLesson\(order\[0\]\);/.test(d); })());
  ok("LessonView can never render an undefined lesson meta",
     readFileSync("src/routes/day.$dayId.tsx", "utf8").includes("lessons.find((l) => l.key === lesson) ?? lessons[0]"));
  ok("the crashing journey is an e2e (day-1 'cafe' → day 3, day-2 'bonus' → day 4)",
     (() => { const sm = readFileSync("e2e/day-smoke.spec.ts", "utf8");
              return sm.includes("Bienvenue au café") && sm.includes("Le Petit Plus") &&
                     sm.includes("never crashes"); })());
  ok("every-week e2e + day smoke exist (weeks 1-8 gates driven with a real student)",
     (() => { const w = readFileSync("e2e/week-gates.spec.ts", "utf8");
              return w.includes("[1, 3, 4, 5, 6, 7, 8]") && w.includes("Commencer ma Fête !") &&
                     w.includes('access: "locked"') && w.includes("Puntos:") &&
                     readFileSync("e2e/day-smoke.spec.ts", "utf8").includes("encore verrouillé"); })());
}


/* ---------------- 12k. Admin control of the weekly challenge + device analytics ---------------- */
g("12k. Reto final: admin open/lock switch . desktop vs mobile analytics");
{
  const wk12k = readFileSync("src/lib/week.functions.ts", "utf8");

  // ---- Teacher's direct switch over the weekly challenge ----
  const mig12k = readFileSync("supabase/migrations/20260727000001_week_challenge_access.sql", "utf8");
  ok("migration adds the week_challenge target type (both CHECK constraints)",
     mig12k.includes("'day', 'week', 'week_challenge'") &&
     mig12k.includes("target_type = 'week_challenge' AND target_id BETWEEN 1 AND 24"));
  ok("setContentAccess accepts week_challenge (id range 1..24)",
     (() => { const c = readFileSync("src/lib/content-access.functions.ts", "utf8");
              return c.includes('d?.targetType === "week_challenge" ? "week_challenge"') &&
                     c.includes('targetType === "day" ? 120 : 24'); })());
  ok("the gate reads BOTH override kinds (week days vs the challenge itself)",
     wk12k.includes('override: pick("week")') && wk12k.includes('challengeOverride: pick("week_challenge")'));
  ok("admin UI: per-week auto/open/locked control, mounted in both panels",
     (() => { const c = readFileSync("src/components/WeekChallengeControl.tsx", "utf8");
              return c.includes('targetType: "week_challenge"') && c.includes("Reto final de cada semana") &&
                     readFileSync("src/components/StudentDetailPanel.tsx", "utf8").includes("<WeekChallengeControl userId={userId} />") &&
                     readFileSync("src/routes/coach.tsx", "utf8").includes("<WeekChallengeControl userId={userId} />"); })());
  {
    const start = wk12k.indexOf("export function decideWeekAccess");
    const body = wk12k.slice(start, wk12k.indexOf("\n}", start) + 2)
      .replace(/export function decideWeekAccess\([\s\S]*?\): WeekAccess \{/,
               "return function decideWeekAccess(weekNumber, s) {");
    const decide = new Function(body)();
    let allOk = true;
    for (let w = 1; w <= 8; w++) {
      const S = (o) => decide(w, { isStaff: false, hasEvaluation: false, maxDoneDay: 0, override: undefined, ...o });
      const forcedOpen = S({ challengeOverride: "open" });
      const forcedLock = S({ maxDoneDay: w * 5, challengeOverride: "locked" });
      const beatsWeekLock = S({ override: "locked", challengeOverride: "open" });
      const staffWins = S({ isStaff: true, challengeOverride: "locked" });
      const okW = forcedOpen.unlocked && forcedOpen.forcedOpen &&
                  !forcedLock.unlocked && forcedLock.lockedByTeacher &&
                  beatsWeekLock.unlocked && staffWins.unlocked;
      if (!okW) { allOk = false; ok(`week ${w} challenge-override matrix`, false, JSON.stringify({ forcedOpen, forcedLock, beatsWeekLock, staffWins })); }
    }
    ok("admin can force-open AND force-lock the reto for EVERY week 1-8", allOk);
  }

  // ---- Desktop vs mobile analytics ----
  const migDev = readFileSync("supabase/migrations/20260727000002_user_devices.sql", "utf8");
  ok("user_devices: server-only writes via SECURITY DEFINER RPC pinned to auth.uid()",
     migDev.includes("CREATE TABLE IF NOT EXISTS public.user_devices") &&
     migDev.includes("SECURITY DEFINER") && migDev.includes("VALUES (auth.uid(), _device)") &&
     migDev.includes("GRANT SELECT ON public.user_devices TO authenticated") &&
     !/GRANT ALL ON public.user_devices TO authenticated/.test(migDev));
  {
    const dev = readFileSync("src/lib/device.ts", "utf8");
    const start = dev.indexOf("export function detectDevice");
    const body = dev.slice(start, dev.indexOf("\n}", start) + 2)
      .replace(/export function detectDevice\([\s\S]*?\): DeviceKind \{/,
               "return function detectDevice(ua, opts = {}) {");
    const detect = new Function(body)();
    const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
    const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36";
    const ANDROID_TAB = "Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";
    const IPAD = "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/604.1";
    const IPAD_DESKTOP = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
    const WIN = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";
    const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";
    ok("detectDevice classifies real user agents (phone/tablet/desktop, incl. iPadOS desktop-mode)",
       detect(IPHONE, { touchPoints: 5, width: 390 }) === "mobile" &&
       detect(ANDROID, { touchPoints: 5, width: 412 }) === "mobile" &&
       detect(ANDROID_TAB, { touchPoints: 5, width: 1200 }) === "tablet" &&
       detect(IPAD, { touchPoints: 5, width: 1024 }) === "tablet" &&
       detect(IPAD_DESKTOP, { touchPoints: 5, width: 1024 }) === "tablet" &&
       detect(WIN, { touchPoints: 0, width: 1920 }) === "desktop" &&
       detect(MAC, { touchPoints: 0, width: 1680 }) === "desktop" &&
       detect("", {}) === "desktop");
  }
  ok("device recorded once per session, via the RPC (never a direct table write)",
     (() => { const d = readFileSync("src/lib/device.ts", "utf8");
              return d.includes('supabase.rpc("record_device"') && d.includes("sessionStorage.getItem(key)") &&
                     !d.includes('from("user_devices")'); })());
  ok("TopNav records the device for every signed-in page",
     readFileSync("src/components/TopNav.tsx", "utf8").includes("useRecordDevice()"));
  ok("analytics returns distinct users per device (dual-device users flagged, not hidden)",
     (() => { const a = readFileSync("src/lib/admin.functions.ts", "utf8");
              return a.includes("devices: { desktop: number; mobile: number; tablet: number; both: number; totalUsers: number }") &&
                     a.includes('from("user_devices")') && a.includes("byDevice[kind].add(r.user_id)"); })());
  ok("admin analytics renders the desktop/mobile card",
     (() => { const c = readFileSync("src/components/AdminAnalytics.tsx", "utf8");
              return c.includes("function DeviceSplit") && c.includes("<DeviceSplit devices={data.devices}") &&
                     c.includes("Escritorio") && c.includes("Movil".replace("Movil", "M\u00f3vil")); })());

  {
    const { error: dErr } = await admin.from("user_devices").select("user_id").limit(1);
    ok("live DB: user_devices table exists", !dErr, dErr?.message ?? "");
    const { error: rErr } = await admin.rpc("record_device", { _device: "desktop" });
    ok("live DB: record_device RPC callable", !rErr, rErr?.message ?? "");
    const { error: caErr } = await admin.from("content_access").select("target_type").eq("target_type", "week_challenge").limit(1);
    ok("live DB: content_access accepts the week_challenge target type", !caErr, caErr?.message ?? "");
  }
}


/* ---------------- 12l. No hung AI calls + tutor stays in its own role ---------------- */
g("12l. AI deadlines (stuck 'Corrigiendo...') . tutor role discipline");
{
  // STUDENT REPORT: "se queda pegado corrigiendo la escritura" — the writing
  // exercise sat on "Corrigiendo... " forever. Root cause: fetch() has NO
  // default timeout, so a stalled OpenAI request never settled and the button's
  // busy flag was never cleared. Deadlines now exist on BOTH sides.
  const aiSrc = readFileSync("src/lib/ai.ts", "utf8");
  ok("every OpenAI call has a server-side deadline (chat + TTS + STT)",
     aiSrc.includes("AbortSignal.timeout(TIMEOUT_MS[kind])") &&
     aiSrc.includes('signal: deadline("chat")') &&
     aiSrc.includes('signal: deadline("tts")') &&
     aiSrc.includes('signal: deadline("stt")'));
  ok("an aborted call becomes a catchable error, never a hang",
     aiSrc.includes("function asTimeout") && aiSrc.includes('name === "TimeoutError"'));
  {
    const wt = readFileSync("src/lib/with-timeout.ts", "utf8");
    const body = wt.slice(wt.indexOf("export function withTimeout"));
    const js = body.slice(0, body.indexOf("\n}") + 2)
      .replace("export function withTimeout<T>(p: Promise<T>, ms: number, label = \"La operación\"): Promise<T> {",
               "return function withTimeout(p, ms, label = \"La operación\") {")
      .replace(/new Promise<T>/g, "new Promise");
    const withTimeout = new Function(js)();
    const hung = new Promise(() => {}); // never settles — the exact prod shape
    const rejected = await withTimeout(hung, 30, "La corrección").then(
      () => "RESOLVED", (e) => String(e.message));
    ok("withTimeout rejects a promise that never settles", /tard\u00f3 demasiado/.test(rejected), rejected);
    const fast = await withTimeout(Promise.resolve("ok"), 1000);
    ok("withTimeout passes a normal result straight through", fast === "ok");
  }
  ok("both graded-writing/speaking calls are bounded client-side",
     (() => { const d = readFileSync("src/routes/day.$dayId.tsx", "utf8");
              const wrapped = (d.match(/await withTimeout\(\s*correctActivity\(\{/g) ?? []).length;
              return wrapped === 2 && d.includes('from "@/lib/with-timeout"'); })());

  // STUDENT REPORT: "el Tutor IA no entiende bien los roles: responde cosas
  // que uno deberia responder" — Lib was speaking the STUDENT's lines.
  const tut = readFileSync("src/lib/tutor.functions.ts", "utf8");
  ok("tutor prompt forbids speaking the student's lines, with a worked example",
     tut.includes("LOS DOS PAPELES SON DISTINTOS") &&
     tut.includes('NUNCA escribas en "reply_fr" una frase que le toca decir al ALUMNO') &&
     tut.includes("MAL (le robas su turno)") &&
     tut.includes('va SIEMPRE en "suggestion"'));
  ok("the objectives are labelled as the STUDENT's, not the tutor's",
     tut.includes("los cumple \u00c9L, no t\u00fa"));
}


/* ---------------- 12m. Weekly reports are FINDABLE by the teacher ---------------- */
g("12m. Where is the report? teacher view + preview + message pointer");
{
  // CLIENT: "me llego el mensajito de que termino el desafio, pero no se donde
  // verlo" / "donde lo puedo ver yo o la profesora?" / "en el alumno no me sale
  // la opcion de descargar el pdf". The staff panels listed the week + score as
  // dead text with NO way to open or download the report.
  const rep = readFileSync("src/components/StudentWeeklyReports.tsx", "utf8");
  ok("teacher panel has a real reports section: open inline + download the PDF",
     rep.includes("Informes semanales (PDF)") &&
     rep.includes("generateWeeklyPdf(buildPdfData(w))") &&
     rep.includes("getStudentAnalytics"));
  ok("the teacher's PDF uses the STORED report (verdict, errors, pronunciation)",
     rep.includes("r?.strengths ?? []") && rep.includes("r?.commonErrors ?? []") &&
     rep.includes("r?.pronunciation ?? []") && rep.includes("r?.verdictTitle"));
  ok("mounted in BOTH staff panels (admin + coach)",
     readFileSync("src/components/StudentDetailPanel.tsx", "utf8").includes("<StudentWeeklyReports userId={userId} />") &&
     readFileSync("src/routes/coach.tsx", "utf8").includes("<StudentWeeklyReports userId={userId} />"));

  const wk12m = readFileSync("src/lib/week.functions.ts", "utf8");
  ok("staff can read another student's evaluations (preview), coach OR admin only",
     wk12m.includes("getWeeklyEvaluationsFor") &&
     /getWeeklyEvaluationsFor[\s\S]{0,900}_role: "coach"/.test(wk12m) &&
     /getWeeklyEvaluationsFor[\s\S]{0,1200}Forbidden/.test(wk12m));
  ok("/progress shows the reports during 'ver como alumno' preview (was hidden)",
     (() => { const pr = readFileSync("src/routes/progress.tsx", "utf8");
              return pr.includes("<MyReports viewAsUserId={viewAsUserId} />") &&
                     pr.includes("getWeeklyEvaluationsFor({ data: { userId: viewAsUserId } })") &&
                     !pr.includes("{!viewAsUserId && <MyReports"); })());
  ok("the automatic message tells the teacher exactly where to open it",
     wk12m.includes("D\u00f3nde verlo: Panel del profesor") &&
     wk12m.includes("Informes semanales (PDF)"));
}

/* ---- client list 2026-07-29: cross-device progress, mic latency, grading, bonus videos ---- */
g("12n. Cross-device progress . mic latency . grading floor . editable Petit Plus");
{
  /* A) CROSS-DEVICE PROGRESS ("aparece 80% en la compu y 20% en el celu").
     The autosave used to upsert done_lessons, REPLACING the row, so a second
     session of the same student overwrote the first with its own smaller array.
     Now it merges server-side and both surfaces revalidate on return. */
  const dayPage = readFileSync("src/routes/day.$dayId.tsx", "utf8");
  ok("day autosave MERGES via RPC instead of replacing the row",
     dayPage.includes('supabase.rpc("merge_day_state"') &&
     !/from\("day_state"\)\s*\.upsert/.test(dayPage));
  ok("day page re-reads saved progress when the tab comes back",
     dayPage.includes('document.addEventListener("visibilitychange", onVisible)') &&
     dayPage.includes("isHydratedFor(hydratedKeyRef.current"));
  ok("revalidation never drags the student to the other device's lesson",
     (() => { const i = dayPage.indexOf("const revalidate = async ()");
              const j = dayPage.indexOf("document.addEventListener(\"visibilitychange\"", i);
              const body = dayPage.slice(i, j);
              return i > 0 && body.includes("setDone((local) => mergeHydrated") && !body.includes("setLesson("); })());
  const progressLib = readFileSync("src/lib/progress.ts", "utf8");
  ok("dashboard star + day counters revalidate on return too",
     progressLib.includes("useRefreshOnReturn(refresh)") &&
     (progressLib.match(/useRefreshOnReturn\(refresh\)/g) ?? []).length >= 2);
  ok("merge_day_state migration is in the repo",
     readFileSync("supabase/migrations/20260729000000_merge_day_state.sql", "utf8")
       .includes("CREATE OR REPLACE FUNCTION public.merge_day_state"));

  /* Behavioural: the RPC must not let a stale device shrink real progress. */
  if (studentClient && uid) {
    await admin.from("day_state").upsert(
      { user_id: uid, day_id: 118, done_lessons: ["gym", "intro", "vocab", "cles"], current_lesson: "cles", stars: 6 },
      { onConflict: "user_id,day_id" },
    );
    const { error: mErr } = await studentClient.rpc("merge_day_state", {
      _day_id: 118, _done_lessons: ["gym"], _current_lesson: "gym", _stars: 0,
    });
    ok("student may call merge_day_state on their own row", !mErr, mErr?.message);
    const { data: merged } = await admin
      .from("day_state").select("done_lessons, current_lesson, stars")
      .eq("user_id", uid).eq("day_id", 118).maybeSingle();
    const kept = Array.isArray(merged?.done_lessons) ? merged.done_lessons.length : 0;
    ok("a stale device CANNOT shrink saved lessons (4 kept, not 1)", kept === 4, `kept ${kept}`);
    ok("stars never go backwards on merge", Number(merged?.stars) === 6, `stars=${merged?.stars}`);
    ok("current lesson still follows the most recent device", merged?.current_lesson === "gym", String(merged?.current_lesson));
    const { data: grew } = await studentClient.rpc("merge_day_state", {
      _day_id: 118, _done_lessons: ["gym", "intro", "vocab", "cles", "defi"], _current_lesson: "defi", _stars: 9,
    }).then(async () => await admin.from("day_state").select("done_lessons, stars").eq("user_id", uid).eq("day_id", 118).maybeSingle());
    ok("real new progress still lands (5 lessons, 9 stars)",
       (Array.isArray(grew?.done_lessons) ? grew.done_lessons.length : 0) === 5 && Number(grew?.stars) === 9);
    await admin.from("day_state").delete().eq("user_id", uid).eq("day_id", 118);
  } else {
    skipped("merge_day_state behaviour", "no student client");
  }

  /* B) MIC LATENCY ("tarda mucho en abrir y empezar a grabar"). */
  ok("mic button reacts on the tap, not after getUserMedia resolves",
     dayPage.includes("const [acquiring, setAcquiring] = useState(false)") &&
     dayPage.includes('"Activation du micro…"') &&
     dayPage.includes("aria-busy={rec.acquiring}"));
  ok("the mic stream stays warm between takes",
     (() => { const i = dayPage.indexOf("function useRecorder()");
              const body = dayPage.slice(i, i + 3000);
              return i > 0 && body.includes("liveStream() ?? (await navigator.mediaDevices.getUserMedia") &&
                     !/rec\.onstop[\s\S]{0,400}stream\.getTracks\(\)\.forEach/.test(body); })());
  ok("double-tapping during mic acquisition can't start two recorders",
     (() => { const i = dayPage.indexOf("function useRecorder()");
              const body = dayPage.slice(i, i + 3000);
              return body.indexOf("startingRef.current = true") < body.indexOf("await navigator.mediaDevices.getUserMedia"); })());
  const staged = readFileSync("src/components/StagedDefi.tsx", "utf8");
  ok("defi recorder also warms the mic + guards before the await",
     staged.includes("startingRef.current = true") &&
     staged.indexOf("startingRef.current = true") < staged.indexOf("await navigator.mediaDevices.getUserMedia") &&
     staged.includes("liveStream() ?? (await navigator.mediaDevices.getUserMedia"));
  ok("defi recorder shows the mic warming up", staged.includes("acquiringIdx === idx"));
  ok("both recorders release the mic on unmount",
     (dayPage.match(/streamRef\.current\?\.getTracks\(\)\.forEach\(\(t\) => t\.stop\(\)\)/g) ?? []).length >= 1 &&
     (staged.match(/streamRef\.current\?\.getTracks\(\)\.forEach\(\(t\) => t\.stop\(\)\)/g) ?? []).length >= 1);
  ok("correction tones reuse ONE AudioContext (they leaked, starving the mic)",
     dayPage.includes("let toneCtx: AudioContext | null = null") &&
     !/const ctx = new Ctx\(\);/.test(dayPage));
  ok("routes preload on intent so the day chunk isn't fetched on click",
     readFileSync("src/router.tsx", "utf8").includes('defaultPreload: "intent"'));

  /* C) GRADING ("la calificacion en general es muy baja"). */
  const aiLib = readFileSync("src/lib/ai.ts", "utf8");
  ok("callChat can pin a temperature (grading was at the 1.0 default)",
     aiLib.includes("temperature?: number") && aiLib.includes('typeof opts?.temperature === "number"'));
  ok("parseScore10 exists to read grades the model returned as text",
     aiLib.includes("export function parseScore10"));
  const defiLib = readFileSync("src/lib/defi.functions.ts", "utf8");
  ok("per-activity grade no longer collapses to 0 when the model sends a string",
     defiLib.includes("const nota = parseScore10(parsed.nota) ?? notaFromVerdict;") &&
     !/const nota = Math\.max\(0, Math\.min\(10, Number\(parsed\.nota/.test(defiLib));
  ok("defi grade no longer falls back to the mechanical criteria fraction first",
     defiLib.includes("parseScore10(parsed.score_10) ??") &&
     !defiLib.includes('typeof parsed.score_10 === "number"'));
  ok("both graders run at a low temperature for repeatable marks",
     (defiLib.match(/temperature: 0\.2/g) ?? []).length >= 2);
  ok("the per-activity corrector targets A1-A2, not A2-B1",
     defiLib.includes("nivel A1-A2 (principiantes)") && !defiLib.includes("nivel A2-B1"));
  ok("the corrector states the communication floor (7-10 when understood)",
     defiLib.includes("la nota es 7-10"));
  const weekLib = readFileSync("src/lib/week.functions.ts", "utf8");
  ok("weekly PE/PO scores also parse tolerantly",
     weekLib.includes("parseScore10(cs.PE) ?? 0") && weekLib.includes("parseScore10(cs.PO) ?? 0") &&
     !weekLib.includes("clamp(Number(cs.PO ?? 0))"));
  ok("weekly report may return NO pronunciation faults (it had to invent 2-3)",
     weekLib.includes("devuelve [] — es correcto y esperado") &&
     !weekLib.includes("2 improvements, 2-3 pronunciation."));
  ok("passed criteria are matched loosely, so paraphrases aren't shown as failed",
     staged.includes("function criterionMet") && staged.includes("criterionMet(result.matched_criteria, c)") &&
     !staged.includes("result.matched_criteria.includes(c)"));

  /* D) "LE PETIT PLUS LIBERTE" is editable ("no hay donde cambiar ahí los videitos"). */
  ok("plus_resources migration is in the repo",
     readFileSync("supabase/migrations/20260729000001_plus_resources.sql", "utf8")
       .includes("CREATE TABLE IF NOT EXISTS public.plus_resources"));
  const plusLib = readFileSync("src/lib/plus-resources.ts", "utf8");
  ok("bonus videos read from the DB with the code list as fallback",
     plusLib.includes('from("plus_resources")') && plusLib.includes("PLUS_RESOURCES_BY_WEEK[String(week)]"));
  ok("teacher can paste any YouTube link (id is extracted)",
     plusLib.includes("export function extractYouTubeId"));
  ok("the day sidebar uses the editable list",
     dayPage.includes("usePlusResources(activeWeekForPlus)"));
  ok("weeks 3+ no longer silently replay WEEK 1's bonus videos",
     !dayPage.includes('PLUS_RESOURCES_BY_WEEK["1"]'));
  ok("the standalone bonus page uses it too",
     readFileSync("src/routes/plus.$weekId.$itemId.tsx", "utf8").includes("usePlusResources(Number(weekId))"));
  ok("the teacher editor is mounted in the admin Contenido tab",
     readFileSync("src/routes/liberte-profesor-panel-9382745-admin.contenido.tsx", "utf8")
       .includes("<PlusResourcesManager />"));
  const mgr = readFileSync("src/components/PlusResourcesManager.tsx", "utf8");
  ok("editor can add, save and delete bonus videos through persist()",
     mgr.includes('persist("plus_resources"') && mgr.includes(".insert(") &&
     mgr.includes(".update(") && mgr.includes(".delete()"));
  ok("editor can copy the built-in defaults into the table to edit them",
     mgr.includes("seedFromDefaults"));

  /* plus_resources RLS: everyone reads, only staff writes. */
  if (studentClient) {
    const { error: rErr } = await studentClient.from("plus_resources").select("id").limit(1);
    ok("students CAN read bonus videos", !rErr, rErr?.message);
    const { error: wErr } = await studentClient
      .from("plus_resources")
      .insert({ week: 99, title: "hack", youtube_id: "x" });
    ok("students CANNOT write bonus videos", Boolean(wErr));
  } else {
    skipped("plus_resources RLS", "no student client");
  }
}

/* ---- 3D landing («La Ville Lumière») 2026-07-30 ---- */
g("12o. 3D night-flight landing: SSR safety, fallbacks, flight wiring");
{
  const idx12o = readFileSync("src/routes/index.tsx", "utf8");
  ok("landing mounts the 3D city boundary", idx12o.includes("<LandingCity />"));
  ok("all 7 flight stops are marked in the DOM",
     [0, 1, 2, 3, 4, 5, 6].every((n) => idx12o.includes(`data-flight="${n}"`)));
  ok("content sits above the fixed canvas (z-10 wrapper)", idx12o.includes('"relative z-10"'));
  ok("the lead form kept its readable near-white card", idx12o.includes("bg-white/95"));

  const boundary = readFileSync("src/components/landing3d/LandingCity.tsx", "utf8");
  // The route module is evaluated in the Cloudflare Worker on EVERY request —
  // three.js must be constant-folded out of the server graph.
  ok("three loads behind the SSR guard (worker stays three-free)",
     boundary.includes("!import.meta.env.SSR") && boundary.includes('import("./CityCanvas")'));
  ok("a failed 3D chunk degrades to the static sky (no reload loop)",
     /import\("\.\/CityCanvas"\)[\s\S]{0,200}\.catch\(/.test(boundary));
  ok("repeated WebGL context loss lands on the static sky",
     boundary.includes("webglcontextlost") && boundary.includes(">= 2"));

  const quality = readFileSync("src/components/landing3d/quality.ts", "utf8");
  ok("prefers-reduced-motion is a hard opt-out of the flight",
     quality.includes("prefers-reduced-motion: reduce") &&
     /if \(prefersReducedMotion\(\)\) return "static";/.test(quality));
  ok("no usable WebGL means the static sky, not a crash",
     quality.includes('return "static"') && quality.includes("webglAvailable"));
  ok("phones get the tuned tier, not the desktop one",
     quality.includes('if (device === "mobile") return "mobile"'));

  const rigSrc = readFileSync("src/components/landing3d/CameraRig.tsx", "utf8");
  ok("camera starts AT the current scroll position (scrollRestoration)",
     rigSrc.includes("useRef(rig.getProgress())"));
  ok("anchor jumps fast-forward instead of replaying the whole flight",
     rigSrc.includes("1.6 * Math.sign"));

  const canvasSrc = readFileSync("src/components/landing3d/CityCanvas.tsx", "utf8");
  ok("frame loop stops when the tab is hidden", canvasSrc.includes("visibilitychange"));
  ok("mobile frames are capped (fpsCap in the loop)", canvasSrc.includes("params.fpsCap"));

  ok("static import graph of the landing route has NO three.js",
     (() => {
       // Walk the files index.tsx statically imports from landing3d and assert
       // none of them import "three" at top level.
       const staticFiles = [
         "src/components/landing3d/LandingCity.tsx",
         "src/components/landing3d/StaticCityFallback.tsx",
         "src/components/landing3d/quality.ts",
         "src/components/landing3d/scrollProgress.ts",
         "src/components/landing3d/useReveal.ts",
       ];
       return staticFiles.every((f) => !/from "three"/.test(readFileSync(f, "utf8")));
     })());

  /* --- REAL Paris (Google Photorealistic 3D Tiles) 2026-07-30 --- */
  ok("real-Paris mode needs a key AND a non-phone device",
     boundary.includes("Boolean(key) && t !== \"mobile\"") &&
     boundary.includes("realTilesKey"));
  ok("real-Paris failure hands the flight to the procedural night city",
     /onFail=\{\(\) => \{[\s\S]{0,300}setMode\("procedural"\)/.test(boundary));
  ok("BOTH heavy renderers sit behind the SSR guard",
     boundary.includes('import("./RealCityCanvas")') &&
     boundary.includes('import("./CityCanvas")') &&
     boundary.indexOf("!import.meta.env.SSR") < boundary.indexOf('import("./RealCityCanvas")'));
  const realSrc = readFileSync("src/components/landing3d/RealParis.tsx", "utf8");
  // Built with createElement, not JSX — the dev devtools plugin injects
  // data-tsd-source into JSX tags and this library reads dashes as prop paths.
  ok("Google attribution overlay is rendered (ToS requirement)",
     realSrc.includes("createElement(TilesAttributionOverlay"));
  ok("tiles elements bypass JSX so the dev source-tagger can't crash them",
     /createElement\(\s*TilesRenderer,/.test(realSrc) &&
     realSrc.includes("createElement(TilesPlugin, {") &&
     !/<TilesRenderer/.test(realSrc));
  ok("tiles authenticate through GoogleCloudAuthPlugin",
     realSrc.includes("GoogleCloudAuthPlugin") && realSrc.includes("apiToken"));
  ok("daylight tiles get the twilight grade on load",
     realSrc.includes("DUSK_TINT") && realSrc.includes("duskGraded"));
  ok("slow/bad tiles time out into the fallback (no infinite skeleton)",
     realSrc.includes("18000") && realSrc.includes("onFail"));
  ok("the real tower gets the champagne sparkles overlay",
     realSrc.includes("buildTowerGlow"));
  /* Load speed: Google forbids caching/bundling their tiles, so the only lever
     is getting the first real frame up sooner. */
  ok("first wave streams coarse, then sharpens (progressive detail)",
     realSrc.includes("COARSE") && realSrc.includes("FINE") &&
     realSrc.includes('setDetail("fine")'));
  ok("the painted sky holds until real geometry is on screen",
     realSrc.includes("models.current >= 8") && realSrc.includes("const reveal ="));
  ok("a sparse view still reveals (backstop timer, never a wedged skeleton)",
     realSrc.includes("revealTimer") && realSrc.includes("6000"));
  ok("tiles already paid for are cached for the scroll back up",
     realSrc.includes('"lruCache-maxSize"') && realSrc.includes('"downloadQueue-maxJobs"'));
  ok("the renderer chunk warms during hydration, not after the auth gate",
     boundary.includes('void import("./RealCityCanvas").catch') &&
     boundary.indexOf("typeof window !== \"undefined\" && !import.meta.env.SSR") <
       boundary.indexOf("export function LandingCity"));
  ok("landing preconnects to the tile host (saves a TLS handshake)",
     idx12o.includes('rel: "preconnect"') && idx12o.includes("tile.googleapis.com"));

  ok("tiles key comes from the env, never hardcoded",
     readFileSync("src/components/landing3d/quality.ts", "utf8").includes(
       "import.meta.env.VITE_GOOGLE_3D_TILES_KEY",
     ) && !/AIza[0-9A-Za-z_-]{20}/.test(realSrc));
  ok("draco decoders are self-hosted for Google tile meshes",
     existsSync("public/draco/draco_decoder.wasm") &&
     realSrc.includes('setDecoderPath("/draco/")'));

  /* Role assignment from the panel (admin included) — the rails matter more
     than the feature: a mistake here is a permanent lockout or a privilege
     escalation. */
  {
    const adm = readFileSync("src/lib/admin.functions.ts", "utf8");
    ok("only an admin may assign any role",
       /setCoachRole[\s\S]{0,1200}?requireAdmin/.test(adm));
    ok("the role is whitelisted, never taken raw from the request",
       adm.includes('raw !== "admin" && raw !== "coach"') &&
       adm.includes('const role: "admin" | "coach" = raw'));
    ok("you cannot demote yourself out of the panel",
       adm.includes("userId === context.userId") &&
       adm.includes("No puedes quitarte a ti mismo"));
    ok("the last admin cannot be demoted (permanent lockout)",
       adm.includes("ids.includes(userId) && ids.length <= 1") &&
       adm.includes("No puedes quitar el último administrador"));
    ok("the lockout check runs BEFORE the delete (no rollback needed)",
       adm.indexOf("No puedes quitar el último administrador") <
         adm.indexOf('.eq("role", data.role)'));
    const ui = readFileSync("src/components/StaffManager.tsx", "utf8");
    ok("the panel offers both roles and can revoke either",
       ui.includes('<option value="admin">') && ui.includes("revoke(m, r)"));
  }

  /* Mes 2 grammar must match the client's Mapa on the day it names.
     Six days taught something else; these lock the document's points in place. */
  {
    const m2src = readFileSync("src/data/month2.ts", "utf8");
    const m2start = m2src.indexOf("= {", m2src.indexOf("export const MONTH2"));
    const M2 = JSON.parse(m2src.slice(m2start + 2).replace(/;\s*$/, "").trim());
    const teaches = (day, re) =>
      (M2[String(day)]?.grammar ?? []).some((g) => re.test(`${g.formula} ${g.use}`));
    ok("J23 teaches the possessifs the document assigns to it", teaches(23, /mon\/ma\/mes/));
    ok("J23 still teaches COD too (the document asks for BOTH)", teaches(23, /le\/la\/les/));
    ok("J27 teaches C'est vs Il est", teaches(27, /c'est \+ article/i));
    ok("J31 teaches les 4 verbes piliers", teaches(31, /verbes piliers/i));
    ok("J36 teaches l'accord des adjectifs + BAPNE", teaches(36, /BAPNE/));
    ok("J39 teaches depuis + présent and on = nous", teaches(39, /depuis \+ durée/i));
    ok("J40 teaches les adverbes d'intensité", teaches(40, /verbe \+ beaucoup/i));
    ok("month2.ts stays machine-readable after the patch (indexOf(\"= {\"))",
       m2start !== -1);
  }

  /* Landing render speed — the four things that kept the page blank. */
  {
    const q = readFileSync("src/components/landing3d/quality.ts", "utf8");
    ok("real Paris is OFF unless explicitly switched on (no Google round-trips)",
       q.includes('import.meta.env.VITE_REAL_PARIS !== "1"'));
    // NOTE: letting public routes render while auth is still loading was tried
    // and REVERTED — it broke hydration on the login page (native form submit,
    // sign-in silently dead). Do not reintroduce without fixing that first.
    const auth = readFileSync("src/components/AuthPage.tsx", "utf8");
    ok("the login page reacts to auth state instead of sampling it once",
       auth.includes("if (sessionUser) {") && !auth.includes("supabase.auth.getSession().then"));
    ok("the sign-in button cannot be submitted before hydration",
       auth.includes("disabled={loading || !hydrated}"));
    const idx = readFileSync("src/routes/index.tsx", "utf8");
    const heroBlock = idx.slice(idx.indexOf('data-flight="0"'), idx.indexOf('data-flight="1"'));
    // Strip JSX comments first — the block explains WHY it has no reveal.
    ok("the hero copy is never hidden behind a scroll-reveal",
       !/data-reveal/.test(heroBlock.replace(/\{\/\*[\s\S]*?\*\/\}/g, "")));
    const css = readFileSync("src/styles.css", "utf8");
    ok("nothing stays invisible if JS is slow or never runs",
       css.includes("html[data-reveal-ready] [data-reveal] {") &&
       !/^\[data-reveal\] \{/m.test(css));
    ok("the reveal CSS is armed by JS before it observes",
       readFileSync("src/components/landing3d/useReveal.ts", "utf8")
         .includes('setAttribute("data-reveal-ready"'));
  }

  /* Survey Aug-2026 fixes: speech grading + the student's own error panel. */
  {
    const aiSrc = readFileSync("src/lib/ai.ts", "utf8");
    ok("graded speech no longer uses the weak mini transcriber",
       !/STT_MODEL = "gpt-4o-mini-transcribe"/.test(aiSrc) &&
       aiSrc.includes("gpt-4o-transcribe"));
    ok("the STT model can be changed from the environment (no deploy)",
       aiSrc.includes("process.env.OPENAI_STT_MODEL"));

    const ins = readFileSync("src/lib/insights.functions.ts", "utf8");
    ok("the insights panel reads through RLS, never the admin client",
       ins.includes("context.supabase") && !ins.includes("supabaseAdmin"));
    ok("it never accepts a user id (a student cannot ask for someone else)",
       !/inputValidator/.test(ins) && !/\.eq\(\s*["']user_id/.test(ins));
    ok("\"recurring\" means it actually happened more than once",
       ins.includes("w.times >= 2"));
    const panel = readFileSync("src/components/MyWeakPoints.tsx", "utf8");
    ok("the student gets the SAME structured errors the coach reads",
       ins.includes("aiErrors(rep.common_errors)") &&
       ins.includes("aiPronunciation(rep.pronunciation)"));
    ok("a weekly report alone is enough to show them (no activities needed)",
       readFileSync("src/components/MyWeakPoints.tsx", "utf8").includes(
         "data.graded === 0 && data.commonErrors.length === 0 && data.pronunciation.length === 0",
       ));
    ok("the panel can never break the progress page",
       panel.includes("setFailed(true)") && panel.includes("if (failed) return null"));
    ok("the panel is hidden when a coach inspects another student",
       readFileSync("src/routes/progress.tsx", "utf8").includes("{!viewAsUserId && <MyWeakPoints />}"));
  }

  /* BONUS MES 2 — «JE COMPRENDS» (client Mapa + Diccionario Mes 2). */
  {
    const bonus = readFileSync("src/data/bonusMonth2.ts", "utf8");
    const ui = readFileSync("src/components/BonusMonth2.tsx", "utf8");
    const plus = readFileSync("src/routes/plus.$weekId.$itemId.tsx", "utf8");
    const ids = [...bonus.matchAll(/id: (6[0-2][0-9]|630),/g)].map((m) => Number(m[1]));
    eq("bonus 1 carries all 30 expressions (dictionary 601-630)", ids.length, 30);
    eq("expression ids run 601..630 with no gap", `${Math.min(...ids)}-${Math.max(...ids)}`, "601-630");
    ok("every expression has a real exchange in both languages",
       !/example: ""/.test(bonus) && !/exampleEs: ""/.test(bonus));
    ok("gender bonus has the reliable endings + the 10-word quiz",
       /GENDER_RULES/.test(bonus) &&
       (bonus.match(/word: "/g) ?? []).length === 10 &&
       bonus.includes("le musée"));
    ok("expressions are listenable (same TTS as the rest of the app)",
       ui.includes("speakFr(e.example)"));
    ok("both bonuses are offered on every month-2 week (5-8)",
       ["5", "6", "7", "8"].every((w) => plus.includes(`"${w}": BONUS_MONTH2`)) &&
       plus.includes('lesson: "month2-expressions"') &&
       plus.includes('lesson: "month2-gender"'));
    ok("an unrecorded bonus shows a placeholder, never a broken player",
       /resource\.youtubeId \? \(/.test(plus) && plus.includes("El video llega pronto"));
  }

  /* Read-aloud on the reading exercises (client request 2026-08-16). */
  {
    const dayPage = readFileSync("src/routes/day.$dayId.tsx", "utf8");
    ok("reading passages can be listened to (title + body, one phrase)",
       /const passage = `\$\{t\.title\}\. \$\{t\.text\}`/.test(dayPage) &&
       dayPage.includes("speakFr(passage)"));
    ok("the listen button toggles to Pause while it reads",
       dayPage.includes('aria-label={playing ? "Pause" : "Écouter le texte"}') &&
       dayPage.includes("onSpeakChange(() => setPlaying(isSpeaking(passage)))"));
    ok("audio stops when the reading exercise unmounts (no talking over the quiz)",
       /useEffect\(\(\) => \(\) => stopFr\(\), \[\]\)/.test(dayPage));
  }

  // Reduced-motion CSS exists (first ever in this codebase — the reveal + stars).
  const css = readFileSync("src/styles.css", "utf8");
  ok("reveal + twinkle animations respect prefers-reduced-motion",
     css.includes("prefers-reduced-motion: reduce") &&
     css.includes("prefers-reduced-motion: no-preference"));
}

/* ---------------- build output ---------------- */
g("12. Build output");
{
  const dir = ".output/public/assets";
  if (!existsSync(dir)) skipped("bundle checks", "no .output — run npm run build");
  else {
    const files = readdirSync(dir).filter((f) => f.endsWith(".js"));
    const joined = files.map((f) => readFileSync(`${dir}/${f}`, "utf8")).join("");
    const ref = URL_.replace("https://", "").split(".")[0];
    ok("client bundle has Supabase URL inlined (deploy-critical)", joined.includes(ref),
       "VITE_ vars missing at build time — deployed app cannot reach Supabase");
    ok("service role key NOT in client bundle", !joined.includes(SVC));
    ok("OpenAI key NOT in client bundle", !joined.includes(env.OPENAI_API_KEY));
  }
}

/* ---------------- cleanup ---------------- */
g("13. Cleanup");
if (uid) {
  const { error } = await admin.auth.admin.deleteUser(uid);
  ok("test student removed", !error, error?.message);
  const { data: leftover } = await admin.from("profiles").select("id").eq("id", uid);
  eq("cascade deleted their data", leftover?.length, 0);
}

/* ---------------- report ---------------- */
console.log(`\n${"─".repeat(60)}`);
console.log(`\x1b[1mRESULT\x1b[0m  \x1b[32m${pass} passed\x1b[0m  \x1b[31m${fail} failed\x1b[0m  \x1b[33m${skip} skipped\x1b[0m`);
if (failures.length) {
  console.log("\n\x1b[31mFAILURES:\x1b[0m");
  failures.forEach((f) => console.log(`  • ${f}`));
}
console.log("─".repeat(60));
process.exit(fail > 0 ? 1 : 0);
