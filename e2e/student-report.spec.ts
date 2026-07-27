import { test, expect } from "@playwright/test";
import { adminClient, createStudent, deleteStudent, login, type TestStudent } from "./helpers";

/** «Mon rapport IA» is student-visible end to end: /progress shows the card,
 *  the button calls getMyAIReport (approval-gated), and a data-less student
 *  gets the friendly empty state (no AI spend). */
const admin = adminClient();
let student: TestStudent;

test.beforeAll(async () => {
  student = await createStudent(admin);
});
test.afterAll(async () => {
  if (student) await deleteStudent(admin, student.id);
});

test("student sees and can generate their AI report on /progress", async ({ page }) => {
  test.setTimeout(120_000);
  await login(page, student);
  await page.goto("/progress");
  await expect(page.getByText("Mon rapport IA")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Générer mon rapport" }).click();
  // Fresh student → hasData false → stats row + the friendly empty state.
  await expect(page.getByText("Pas encore assez d'activité")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Jours", { exact: true })).toBeVisible();
});
