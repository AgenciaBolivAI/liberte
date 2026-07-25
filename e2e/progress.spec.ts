import { test, expect } from "@playwright/test";
import { adminClient, createStudent, deleteStudent, login, simulateTabSwitch, type TestStudent } from "./helpers";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * THE regression suite for the production outage:
 * students reported that doing a lesson, switching to another window and coming
 * back wiped everything and sent them to "Gym cérébral". Root cause was a
 * never-sent write (`void supabase...upsert()` — supabase builders are thenables)
 * plus auth churn on tab return. `day_state` had 0 rows in prod, ever.
 *
 * These tests assert the OBSERVABLE behaviour (a real browser) AND the ground
 * truth (the row in the database).
 */

let admin: SupabaseClient;
let student: TestStudent;

test.beforeAll(async () => {
  admin = adminClient();
  student = await createStudent(admin);
});

test.afterAll(async () => {
  if (student) await deleteStudent(admin, student.id);
});

/** The lesson rail: step 2 of day 1 is "Bienvenue au café" (step 1 = Gym cérébral). */
const SECOND_LESSON = /Bienvenue au caf/i;
const FIRST_LESSON = /Gym c[ée]r[ée]bral/i;

async function openDay1AndAdvance(page: import("@playwright/test").Page) {
  await page.goto("/day/1");
  // Move off the first lesson so there is progress worth losing.
  await page.getByRole("button", { name: SECOND_LESSON }).first().click();
  await expect(page.getByRole("heading", { name: SECOND_LESSON })).toBeVisible();
  // The autosave is debounced (300ms) — let it flush.
  await page.waitForTimeout(1500);
}

test("progress is actually written to the database (it never was in production)", async ({ page }) => {
  await login(page, student);
  await openDay1AndAdvance(page);

  const { data, error } = await admin
    .from("day_state")
    .select("done_lessons, current_lesson")
    .eq("user_id", student.id)
    .eq("day_id", 1)
    .maybeSingle();

  expect(error, "day_state query failed").toBeNull();
  expect(data, "NO day_state ROW — the write never reached the database").not.toBeNull();
  expect(data!.current_lesson, "the active lesson was not persisted").toBeTruthy();
});

test("switching tabs and returning does NOT reset the lesson (the reported bug)", async ({ page }) => {
  await login(page, student);
  await openDay1AndAdvance(page);

  await simulateTabSwitch(page);

  // The student must still be where they were — not bounced to Gym cérébral,
  // and not bounced to the login page.
  await expect(page.getByRole("heading", { name: SECOND_LESSON })).toBeVisible();
  await expect(page.getByRole("heading", { name: FIRST_LESSON })).toHaveCount(0);
  expect(page.url()).not.toContain("log-in");

  // And the saved row must not have been overwritten with an empty state.
  const { data } = await admin
    .from("day_state").select("done_lessons, current_lesson")
    .eq("user_id", student.id).eq("day_id", 1).maybeSingle();
  expect(data, "day_state row disappeared after the tab switch").not.toBeNull();
  expect(data!.current_lesson, "the tab switch reset the saved lesson").toBeTruthy();
});

test("reloading mid-lesson resumes where the student left off", async ({ page }) => {
  await login(page, student);
  await openDay1AndAdvance(page);

  await page.reload();

  // Hydration must restore the saved lesson rather than dropping back to step 1.
  await expect(page.getByRole("heading", { name: SECOND_LESSON })).toBeVisible({ timeout: 30_000 });
});

test("a second tab (token rotation) does not wipe the first tab's progress", async ({ page, context }) => {
  await login(page, student);
  await openDay1AndAdvance(page);

  // Opening another tab makes supabase-js refresh/rotate the shared session —
  // the multi-tab race that used to surface as a transient signed-out state.
  const second = await context.newPage();
  await second.goto("/day/1");
  await second.waitForTimeout(2500);
  await second.close();

  await simulateTabSwitch(page);

  await expect(page.getByRole("heading", { name: SECOND_LESSON })).toBeVisible();
  const { data } = await admin
    .from("day_state").select("done_lessons")
    .eq("user_id", student.id).eq("day_id", 1).maybeSingle();
  expect(data, "progress row lost after multi-tab session rotation").not.toBeNull();
});
