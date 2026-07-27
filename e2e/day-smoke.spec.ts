import { test, expect } from "@playwright/test";
import { adminClient, createStudent, deleteStudent, login, type TestStudent } from "./helpers";

/**
 * Smoke: EVERY day route must render its lesson shell — never the error
 * boundary. This exists because /day/3 crashed in production while the whole
 * suite stayed green: nothing rendered days other than day 1.
 */
const admin = adminClient();
let student: TestStudent;
const consoleErrors: Record<string, string[]> = {};

test.beforeAll(async () => {
  student = await createStudent(admin);
});
test.afterAll(async () => {
  if (student) await deleteStudent(admin, student.id);
});

test("days 1-20 render without the error boundary", async ({ page }) => {
  test.setTimeout(420_000);
  page.on("pageerror", (err) => {
    const key = page.url();
    (consoleErrors[key] ??= []).push(String(err));
  });
  await login(page, student);
  const broken: string[] = [];
  for (let day = 1; day <= 20; day++) {
    await page.goto(`/day/${day}`);
    // PASS = the lesson shell ("Ton progrès" sidebar) OR the legitimate
    // time-lock screen ("Jour N encore verrouillé"). FAIL = the error boundary
    // ("Cette page n'a pas pu se charger") or nothing at all.
    const crashed = page.getByText("Cette page n'a pas pu se charger");
    const okState = page.getByText(/Ton progrès|encore verrouillé/).first();
    try {
      await expect(okState).toBeVisible({ timeout: 20_000 });
    } catch {
      const isCrash = await crashed.isVisible().catch(() => false);
      broken.push(`/day/${day}${isCrash ? " (error boundary)" : " (no shell, no lock screen)"}`);
    }
  }
  const errs = Object.entries(consoleErrors)
    .map(([u, es]) => `${u}\n  ${es.join("\n  ")}`)
    .join("\n");
  expect(broken, `Broken days: ${broken.join(", ")}\nPage errors:\n${errs}`).toEqual([]);
});

test("switching days from a day-specific lesson never crashes (the /day/3 prod bug)", async ({ page }) => {
  test.setTimeout(180_000);
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));
  await login(page, student);

  // THE journey from the prod console (TypeError reading 'emoji' on /day/3):
  // sit on day 1's exclusive lesson "cafe", expand another day in the sidebar,
  // click one of ITS lessons → in-place navigation renders the new day while
  // `lesson` still holds "cafe", which the new day's list doesn't contain →
  // lessons.find() === undefined → ".emoji" crash → error boundary.
  await page.goto("/day/1");
  await page.getByRole("button", { name: /Bienvenue au café/ }).click();
  await expect(page.getByRole("heading", { name: /Bienvenue au café/ })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /Jour 3 ·/ }).click(); // expand day 3
  await page.getByRole("button", { name: /Vocabulaire/ }).first().click(); // navigate into day 3
  await expect(page).toHaveURL(/\/day\/3/);
  await expect(page.getByText("Cette page n'a pas pu se charger")).toHaveCount(0);
  await expect(page.getByText(/Ton progrès/).first()).toBeVisible({ timeout: 20_000 });

  // Same journey through day 2's exclusive "bonus" lesson → a day-4 lesson.
  await page.goto("/day/2");
  await page.getByRole("button", { name: /Le Petit Plus/ }).click();
  await page.getByRole("button", { name: /Jour 4 ·/ }).click();
  await page.getByRole("button", { name: /Vocabulaire/ }).first().click();
  await expect(page).toHaveURL(/\/day\/4/);
  await expect(page.getByText("Cette page n'a pas pu se charger")).toHaveCount(0);
  await expect(page.getByText(/Ton progrès/).first()).toBeVisible({ timeout: 20_000 });

  const emojiCrash = pageErrors.filter((e) => e.includes("emoji"));
  expect(emojiCrash, `page errors: ${pageErrors.join(" | ")}`).toEqual([]);
});
