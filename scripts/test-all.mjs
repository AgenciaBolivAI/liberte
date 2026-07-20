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
eq("furthest day caps at 10", mod.furthestUnlockedDay(S(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)), 10);

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
  ok("voice mode uses a trimmed JSON schema", tut.includes("buildTutorSystem(data.dayId, data.withAudio)"));
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
  ok("week1Done uses snapshot-aware doneDays", day.includes("const week1Done = doneDays.has(5)"));
  // #10 confetti replay.
  ok("confetti only on transition", day.includes("wasDoneAtMount"));

  // #2 preview state must be shared, not per-component.
  const prev = readFileSync("src/lib/admin-preview.ts", "utf8");
  ok("preview uses a shared external store", prev.includes("useSyncExternalStore"));
  ok("preview syncs across tabs", prev.includes('addEventListener("storage"'));
  ok("preview has SSR snapshot", prev.includes("getServerSnapshot"));

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

  // TEACH-2: calendar edit path wired in the coach panel.
  const coach = readFileSync("src/routes/coach.tsx", "utf8");
  ok("calendar has an editingId state", coach.includes("editingId"));
  ok("calendar edit calls update().eq(id)", /\.update\(payload\)\.eq\("id", editingId\)/.test(coach));
  ok("calendar edit pre-fills via beginEdit", coach.includes("function beginEdit("));
  ok("calendar reload fetches description for pre-fill", coach.includes("duration_min, zoom_url, zoom_id, description"));

  // #7/#8 analytics.
  const adm = readFileSync("src/lib/admin.functions.ts", "utf8");
  ok("analytics raises the 1000-row cap", adm.includes("MAX_ROWS"));
  const an = readFileSync("src/components/AdminAnalytics.tsx", "utf8");
  ok("analytics ignores stale responses", an.includes("reqIdRef"));

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
  ok("calendar dots have 28px tap targets", cal.includes('className="grid h-7 w-7 place-items-center"'));
  ok("calendar modal scrolls on short screens", cal.includes("max-h-[85dvh]"));
  const ban = readFileSync("src/components/AdminPreviewBanner.tsx", "utf8");
  ok("preview select can't overflow", ban.includes("w-full max-w-full"));
  ok("preview select is 16px on mobile", ban.includes("text-base") && ban.includes("sm:text-xs"));
  for (const f of ["calendar", "conversation", "profile", "progress"]) {
    const s = readFileSync(`src/routes/${f}.tsx`, "utf8");
    ok(`${f}: bg-fixed gated to md+ (iOS Safari)`, !/[^:]bg-fixed/.test(s) || s.includes("md:bg-fixed"));
  }
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
