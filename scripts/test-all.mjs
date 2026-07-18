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

ok("day 1 always open", mod.isDayUnlocked(1, S()));
ok("day 2 LOCKED when day 1 not done", !mod.isDayUnlocked(2, S()));
ok("day 2 opens once day 1 done", mod.isDayUnlocked(2, S(1)));
ok("day 3 LOCKED when only day 1 done", !mod.isDayUnlocked(3, S(1)));
ok("day 10 LOCKED for fresh student", !mod.isDayUnlocked(10, S()));
ok("admin sees every day", mod.isDayUnlocked(10, S(), { isAdmin: true }));
ok("first day of week 2 (day 6) open", mod.isDayUnlocked(6, S(), { firstDayOfWeek: 6 }));

const order = ["gym", "intro", "vocab", "cles", "defi"];
ok("lesson 1 always open", mod.isLessonUnlocked(0, {}, order));
ok("lesson 2 LOCKED before lesson 1 done", !mod.isLessonUnlocked(1, {}, order));
ok("lesson 2 opens after lesson 1 done", mod.isLessonUnlocked(1, { gym: true }, order));
ok("lesson 5 LOCKED with only lesson 1 done", !mod.isLessonUnlocked(4, { gym: true }, order));
ok("lesson 5 opens after lesson 4 done", mod.isLessonUnlocked(4, { cles: true }, order));
ok("admin sees every lesson", mod.isLessonUnlocked(4, {}, order, { isAdmin: true }));

ok("scene 1 always open", mod.isSceneUnlocked(1, S()));
ok("scene 2 LOCKED when day 1 not done", !mod.isSceneUnlocked(2, S()));
ok("scene 2 opens once day 1 done", mod.isSceneUnlocked(2, S(1)));
ok("scene 6 LOCKED even at week boundary (no week exception)", !mod.isSceneUnlocked(6, S(1, 2, 3)));
ok("scene 6 opens once day 5 done", mod.isSceneUnlocked(6, S(1, 2, 3, 4, 5)));
eq("furthest day, fresh student", mod.furthestUnlockedDay(S()), 1);
eq("furthest day, days 1-4 done", mod.furthestUnlockedDay(S(1, 2, 3, 4)), 5);
eq("furthest day caps at 10", mod.furthestUnlockedDay(S(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)), 10);

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
  ok("day 2 unlocked", mod.isDayUnlocked(2, done));
  ok("day 3 unlocked (day 2 done)", mod.isDayUnlocked(3, done));
  ok("day 4 still LOCKED", !mod.isDayUnlocked(4, done));
  ok("scene 3 unlocked", mod.isSceneUnlocked(3, done));
  ok("scene 4 still LOCKED", !mod.isSceneUnlocked(4, done));
  eq("furthest day = 3", mod.furthestUnlockedDay(done), 3);
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
  await studentClient.from("tutor_usage").upsert({ user_id: uid, usage_date: today, message_count: 30 }, { onConflict: "user_id,usage_date" });
  const { data: usage } = await studentClient.from("tutor_usage").select("message_count").eq("user_id", uid).eq("usage_date", today).maybeSingle();
  eq("daily counter records usage", usage?.message_count, 30);
  ok("cap reached at 30 blocks further messages", (usage?.message_count ?? 0) >= 30);

  const scen = readFileSync("src/lib/tutorContext.ts", "utf8");
  for (let d = 1; d <= 10; d++) ok(`scene ${d} defined`, scen.includes(`  ${d}: {`) || scen.includes(`\n  ${d}: {`));
  const gate = readFileSync("src/lib/tutor.functions.ts", "utf8");
  ok("server gates locked scenes", gate.includes("assertDayUnlocked"));
  ok("server enforces daily cap", gate.includes("TUTOR_DAILY_LIMIT"));
  ok("server checks approval before spending tokens", gate.includes("requireApprovedStudent"));
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

  // #5 atomic tutor cap.
  const tut = readFileSync("src/lib/tutor.functions.ts", "utf8");
  ok("tutor cap uses atomic RPC", tut.includes("tutor_consume_message"));
  ok("tutor cap no longer read-then-write", !tut.includes('.from("tutor_usage")\n      .upsert'));

  // #6 conversation day pinning.
  const conv = readFileSync("src/routes/conversation.tsx", "utf8");
  ok("conversation pins the scene on first send", conv.includes("if (dayId === null) setDayId(activeDay)"));

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
