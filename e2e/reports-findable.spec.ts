import { test, expect } from "@playwright/test";
import { adminClient, createStudent, deleteStudent, login, type TestStudent } from "./helpers";

/**
 * CLIENT REPORT: "¿dónde lo puedo ver yo o la profesora? no lo encuentro" —
 * the weekly report existed but had no teacher-facing surface, and the PDF
 * download vanished in the "ver como alumno" preview. Drives the real UI with
 * a real evaluated week.
 */
const admin = adminClient();
let student: TestStudent;
let teacher: TestStudent;

const AI_REPORT = {
  verdict_title: "TRÈS BIEN",
  verdict_message: "Buen avance esta semana.",
  strengths: [{ title: "Pronunciación clara", example: "je voudrais un café" }],
  common_errors: [{ said: "je veux", corrected: "je voudrais", rule: "cortesía" }],
  improvements: ["Repasar los artículos partitivos"],
  pronunciation: [{ word: "voudrais", heard: "vudré", target: "vu-DRÈ", tip: "R francesa" }],
  coach_summary: "Semana sólida: pide y paga con cortesía.",
  competence_scores: { CO: 8, CE: 7.5, PE: 7, PO: 6.5 },
};

const STUDENT_NAME = `QA Informes ${Date.now()}`;

test.beforeAll(async () => {
  student = await createStudent(admin);
  teacher = await createStudent(admin);
  // Every helper account is called "E2E Student"; give this one a unique name
  // so the roster click targets exactly it.
  await admin.from("profiles").update({ full_name: STUDENT_NAME }).eq("id", student.id);
  await admin.from("user_roles").insert({ user_id: teacher.id, role: "admin" });
  await admin.from("day_completions").insert({ user_id: student.id, day_id: 5, week_number: 1 });
  await admin.from("weekly_evaluations").insert({
    user_id: student.id, week_number: 1, weekly_score: 7.4, test_score: 74,
    test_scores: { CO: 8, CE: 7.5, PE: 7, PO: 6.5 }, ai_report: AI_REPORT, responses: {},
  });
});
test.afterAll(async () => {
  if (student) await deleteStudent(admin, student.id);
  if (teacher) await deleteStudent(admin, teacher.id);
});

test("teacher finds the weekly report in the panel, opens it and downloads the PDF", async ({ page }) => {
  test.setTimeout(240_000);
  await login(page, teacher);
  await page.goto("/coach");
  await page.getByRole("button", { name: STUDENT_NAME }).click();

  // The section the client could not find.
  const section = page.getByText("📄 Informes semanales (PDF)");
  await expect(section).toBeVisible({ timeout: 30_000 });

  // Opening the week shows the real stored report, not just a score.
  // Anchor to the START of the name: the activity feed also contains a button
  // whose text mentions "la Semana 1".
  await page.getByRole("button", { name: /^Semana 1/ }).click();
  await expect(page.getByText("TRÈS BIEN")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Semana sólida: pide y paga con cortesía.")).toBeVisible();
  await expect(page.getByText(/je veux/)).toBeVisible();

  // And the PDF actually downloads.
  const [dl] = await Promise.all([
    page.waitForEvent("download", { timeout: 30_000 }),
    page.getByRole("button", { name: /^PDF$/ }).first().click(),
  ]);
  expect(dl.suggestedFilename()).toMatch(/informe-semana1.*\.pdf$/);
});

test("the PDF download is visible while previewing as the student", async ({ page }) => {
  test.setTimeout(240_000);
  await login(page, teacher);
  await page.evaluate(([uid]) => {
    localStorage.setItem("liberte:preview-mode", "as-user");
    localStorage.setItem("liberte:preview-user", uid);
    localStorage.setItem("liberte:preview-name", "Repro Student");
  }, [student.id]);
  await page.goto("/progress");
  await expect(page.getByText(/Viendo como/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("📄 Mes rapports hebdomadaires")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: /PDF/ }).first()).toBeVisible();
});

test("the student sees their own report with a working PDF button", async ({ page }) => {
  test.setTimeout(240_000);
  await login(page, student);
  await page.goto("/progress");
  await expect(page.getByText("📄 Mes rapports hebdomadaires")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("7.4/10")).toBeVisible();
  const [dl] = await Promise.all([
    page.waitForEvent("download", { timeout: 30_000 }),
    page.getByRole("button", { name: /PDF/ }).first().click(),
  ]);
  expect(dl.suggestedFilename()).toMatch(/Semaine1.*\.pdf$/);
});
