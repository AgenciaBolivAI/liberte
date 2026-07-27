import { test, expect } from "@playwright/test";
import { adminClient, createStudent, deleteStudent, login, type TestStudent } from "./helpers";

/**
 * EVERY weekly challenge gate, end to end, with a REAL student (per the
 * client: "test thoroughly for every single week"):
 *  - each week locked while its last day is missing, with the actionable
 *    «Termine le Jour N» screen;
 *  - a teacher 'locked' override shows the dedicated screen;
 *  - a coach 'open' override does NOT open the challenge with zero work done
 *    (the star-farming protection);
 *  - completing the LAST day of each week (day_completions row — no défi
 *    audio needed) opens that week's challenge.
 */
const admin = adminClient();
let student: TestStudent;

test.beforeAll(async () => {
  student = await createStudent(admin);
});
test.afterAll(async () => {
  if (student) await deleteStudent(admin, student.id);
});

const SEMAINE_WEEKS = [1, 3, 4, 5, 6, 7, 8]; // week 2 lives on /defi-semaine2

test("all 8 weekly gates: locked → teacher-lock → open-override → unlocked", async ({ page }) => {
  test.setTimeout(600_000);
  await login(page, student);

  // 1) Fresh student: every week locked, naming the exact day to finish.
  for (const w of SEMAINE_WEEKS) {
    await page.goto(`/semaine/${w}`);
    await expect(page.getByText(`Termine le Jour ${w * 5}`)).toBeVisible({ timeout: 20_000 });
  }
  await page.goto("/defi-semaine2");
  await expect(page.getByText("Termine le Jour 10")).toBeVisible({ timeout: 20_000 });

  // 2) Teacher 'locked' override → dedicated screen (week 3).
  await admin.from("content_access").insert({
    scope: "user", user_id: student.id, target_type: "week", target_id: 3, access: "locked", set_by: student.id,
  });
  await page.goto("/semaine/3");
  await expect(page.getByText("Semaine verrouillée")).toBeVisible({ timeout: 20_000 });

  // 3) Coach 'open' override with ZERO work → still locked (it opens the
  //    week's days, never the evaluation — no zero-work score/stars).
  await admin.from("content_access").update({ access: "open" })
    .eq("user_id", student.id).eq("target_type", "week").eq("target_id", 3);
  await page.goto("/semaine/3");
  await expect(page.getByText("Termine le Jour 15")).toBeVisible({ timeout: 20_000 });
  await admin.from("content_access").delete()
    .eq("user_id", student.id).eq("target_type", "week").eq("target_id", 3);

  // 4) Finishing the LAST day of each week opens exactly that challenge.
  for (const w of SEMAINE_WEEKS) {
    await admin.from("day_completions").insert({ user_id: student.id, day_id: w * 5, week_number: w });
    await page.goto(`/semaine/${w}`);
    await expect(page.getByText("Commencer ma Fête !")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(`Semaine ${w} ·`).first()).toBeVisible();
  }
  await admin.from("day_completions").insert({ user_id: student.id, day_id: 10, week_number: 2 });
  await page.goto("/defi-semaine2");
  await expect(page.getByText("Puntos:")).toBeVisible({ timeout: 20_000 });
});

/** PROD BUG (reported by the client, reproduced against production):
 *  "el reto final no abre, ni para el profesor o el coach".
 *  Two distinct causes, one test each. */
test("a student PAST the week gets in even without that exact day's row", async ({ page }) => {
  test.setTimeout(180_000);
  const past = await createStudent(admin);
  try {
    // Days 6-8 done, NO day 5 — the real shape of several live students whose
    // day-5 row was lost to the historical un-awaited-write bug.
    for (const d of [6, 7, 8]) {
      await admin.from("day_completions").insert({ user_id: past.id, day_id: d, week_number: 2 });
    }
    await login(page, past);
    await page.goto("/semaine/1");
    await expect(page.getByText("Commencer ma Fête !")).toBeVisible({ timeout: 25_000 });
  } finally {
    await deleteStudent(admin, past.id);
  }
});

/** THE screenshot the client sent: a student who finished the week but has a
 *  HOLE in the middle (Mayra: days 1,2,4,5 — no day 3). The sidebar tile
 *  demanded ALL FIVE days, so it showed the padlock «S'ouvre quand tu termines
 *  la semaine» even though she is on day 5 and the route would let her in.
 *  Checked twice: as the student, and through the teacher's "ver como alumno"
 *  preview (the exact view in the screenshot). */
test("sidebar tile opens for a student with a missing middle day — direct and via teacher preview", async ({ page, browser }) => {
  test.setTimeout(240_000);
  const holey = await createStudent(admin);
  const teacher = await createStudent(admin);
  try {
    for (const d of [1, 2, 4, 5]) {
      await admin.from("day_completions").insert({ user_id: holey.id, day_id: d, week_number: 1 });
    }
    // 1) The student's own view.
    await login(page, holey);
    await page.goto("/day/2");
    await expect(page.getByRole("link", { name: /Le défi de la semaine/ })).toBeVisible({ timeout: 25_000 });
    await expect(page.getByText("S’ouvre quand tu termines la semaine")).toHaveCount(0);

    // 2) The teacher previewing that student ("Viendo como … · solo lectura").
    //    A fresh CONTEXT: the Supabase session lives in localStorage, so
    //    reusing the page would stay signed in as the student.
    await admin.from("user_roles").insert({ user_id: teacher.id, role: "admin" });
    const ctx = await browser.newContext();
    const tp = await ctx.newPage();
    try {
      await login(tp, teacher);
      await tp.evaluate(([uid, name]) => {
        localStorage.setItem("liberte:preview-mode", "as-user");
        localStorage.setItem("liberte:preview-user", uid);
        localStorage.setItem("liberte:preview-name", name);
      }, [holey.id, "Repro Holey"]);
      await tp.goto("/day/2");
      await expect(tp.getByText(/Viendo como/)).toBeVisible({ timeout: 25_000 });
      await expect(tp.getByRole("link", { name: /Le défi de la semaine/ })).toBeVisible({ timeout: 25_000 });
    } finally {
      await ctx.close();
    }
  } finally {
    await deleteStudent(admin, holey.id);
    await deleteStudent(admin, teacher.id);
  }
});

test("a coach opens the weekly challenge without any progress of their own", async ({ page }) => {
  test.setTimeout(180_000);
  const coach = await createStudent(admin);
  try {
    await admin.from("user_roles").insert({ user_id: coach.id, role: "coach" });
    await login(page, coach);
    await page.goto("/semaine/1");
    await expect(page.getByText("Commencer ma Fête !")).toBeVisible({ timeout: 25_000 });
    await page.goto("/defi-semaine2");
    await expect(page.getByText("Puntos:")).toBeVisible({ timeout: 25_000 });
  } finally {
    await deleteStudent(admin, coach.id);
  }
});
