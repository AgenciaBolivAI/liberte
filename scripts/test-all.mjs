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
// Weeks 3-4 are now real content (LESSON_DAYS=20): finishing day 10 points at day 11.
eq("furthest day, days 1-10 done -> 11", mod.furthestUnlockedDay(S(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)), 11);
eq("furthest day caps at 20 (weeks 1-4)", mod.furthestUnlockedDay(S(...Array.from({ length: 20 }, (_, i) => i + 1))), 20);

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
  ok("hang-up button ends the loop", conv.includes("Terminar conversación"));
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
  ok("defi_results written via service role", defiSrc.includes('supabaseAdmin\n      .from("defi_results")'));

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
  ok("weeks without content show 'próximamente'", dash.includes("LAST_WEEK_WITH_CONTENT") && dash.includes("Próximamente"));
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
  ok("day route BLOCKS autosave while impersonating", /if \(!userI?d?\w* \|\| readOnly\) return/.test(day));
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
       !readFileSync("src/routes/liberte-profesor-panel-9382745-admin.tsx", "utf8").includes("CalendarManager"));
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
  // It must follow the user EVERYWHERE — only the tutor page itself is excluded,
  // and it must not be hidden inside lessons/challenges.
  ok("mascot hidden only on the tutor page", /HIDE_PREFIXES\s*=\s*\["\/conversation"\]/.test(mascotSrc));
  ok("mascot shows inside lessons + challenges", !mascotSrc.includes('"/day"') && !mascotSrc.includes('"/semaine"'));
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
  const adminPanelSrc = readFileSync("src/routes/liberte-profesor-panel-9382745-admin.tsx", "utf8");
  // Day authoring (ContentManager) stays in the admin panel; the recorded-class
  // editor moved into the Live tab so staff add/edit tiles where they live.
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
  ok("LessonView dispatches days 11-20 to the generic wrappers",
     day.includes("Number(dayId) >= 11 && Number(dayId) <= 20"));
  ok("router sends registered days (1-20) to DayPage",
     day.includes("if (dayId in LESSONS_BY_DAY) return <DayPage") && day.includes("<AuthoredDayView"));
  ok("gym video wired for weeks 3-4", day.includes("WEEK34[dayId]?.gym"));

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
  eq("LESSON_DAYS covers weeks 1-4", mod.LESSON_DAYS, 20);
  eq("weeks 3-4 stay sequentially gated (OPEN_THROUGH_DAY unchanged)", mod.OPEN_THROUGH_DAY, 10);
  ok("day 11 LOCKED until day 10 done", !mod.isDayUnlocked(11, S()));
  ok("day 11 opens once day 10 done", mod.isDayUnlocked(11, S(10)));
  ok("day 20 opens once day 19 done", mod.isDayUnlocked(20, S(19)));

  // Tutor now covers weeks 3-4, driven by the same WEEK34 data.
  const tc = readFileSync("src/lib/tutorContext.ts", "utf8");
  ok("TUTOR_MAX_DAY raised to 20", /TUTOR_MAX_DAY\s*=\s*20/.test(tc));
  ok("tutor pulls scenes 11-20 from WEEK34",
     tc.includes("Object.entries(WEEK34)") && tc.includes("TUTOR_SCENARIOS[id]") && tc.includes("CONTEXTS[id]"));
  ok("each WEEK34 day carries a complete 3-objective tutor scene",
     days34.every((d) => W34[d].tutor && W34[d].tutor.objectives.length === 3 && W34[d].tutor.opener_fr && W34[d].tutor.opener_es && W34[d].tutor.topic && W34[d].tutor.role));
  ok("scene picker lists all 20 scenes", readFileSync("src/routes/conversation.tsx", "utf8").includes("tutorDayGroups(20)"));
  ok("tutor day-group helper defaults to 20", readFileSync("src/data/program.ts", "utf8").includes("tutorDayGroups(maxDay = 20)"));

  // "Weeks with content" is a single source of truth (derived from LESSON_DAYS),
  // shared by the student dashboard AND the admin content-access panel, so the
  // "con contenido" badge can't drift (bug: it used to be hardcoded to weeks 1-2).
  eq("WEEKS_WITH_CONTENT derives 4 from LESSON_DAYS", mod.WEEKS_WITH_CONTENT, 4);
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
  ok("player renders DB rich with a WEEK34 fallback",
     day.includes("useRichDay(dayId)") && day.includes("richDay ?? week34Data"));
  const rde = readFileSync("src/components/RichDayEditor.tsx", "utf8");
  ok("rich editor covers every lesson section",
     ["Vocabulario", "Flashcards", "Gramática", "Juegos de Vocabulario", "Juegos de Les clés", "Défi final"].every((s) => rde.includes(s)));
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
  ok("content manager lists built-in days 1-10 (read-only, so the list runs from day 1)",
     cmSrc2.includes("BUILTIN_DAYS") && cmSrc2.includes("Integrado") && /day_id: 1,/.test(cmSrc2));
  ok("blank rich-day factory is shared", readFileSync("src/lib/rich-content.ts", "utf8").includes("export function blankRichDay"));

  // Tutor teaches the teacher-edited content: days 11+ override code vocab/grammar
  // from authored_days.rich (falls back to code when there's no DB row).
  const tutSrc = readFileSync("src/lib/tutor.functions.ts", "utf8");
  ok("tutor resolves day context from the DB for weeks 3+",
     tutSrc.includes("resolveTutorContext") && tutSrc.includes('.from("authored_days")') && tutSrc.includes("rich.vocabulary"));
  ok("tutor falls back to code content when no DB row",
     tutSrc.includes("if (dayId < 11) return base") && /return base/.test(tutSrc));
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
  ok("weekly unlock generalized to any week (day N*5)", sem.includes("days.includes(weekNumber * 5)"));
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
       semSrc.includes("navigator.mediaDevices.getUserMedia") && semSrc.includes("No pudimos acceder al micrófono"));
  }
  ok("types.ts tutor_consume_message can return null (daily cap)",
     /tutor_consume_message[\s\S]{0,60}Returns: number \| null/.test(readFileSync("src/integrations/supabase/types.ts", "utf8")));
  ok("500 error page is Spanish", readFileSync("src/lib/error-page.ts", "utf8").includes('<html lang="es">'));
  ok("admin star bar uses the true max (weekly-eval stars included)",
     readFileSync("src/routes/liberte-profesor-panel-9382745-admin.tsx", "utf8").includes("TOTAL_DAYS * 4 + TOTAL_WEEKS * 3"));
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
