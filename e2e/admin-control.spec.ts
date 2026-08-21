import { test, expect, devices as pwDevices } from "@playwright/test";
import { adminClient, createStudent, deleteStudent, login, type TestStudent } from "./helpers";

/**
 * 1) The teacher's DIRECT switch over the «reto final de la semana»
 *    (content_access target_type = 'week_challenge'): force-open for a student
 *    with zero progress, and force-lock one who finished the week.
 * 2) Device analytics: a real mobile browser records 'mobile', a desktop one
 *    records 'desktop', and the admin card shows the split.
 */
const admin = adminClient();
let student: TestStudent;

test.beforeAll(async () => {
  student = await createStudent(admin);
});
test.afterAll(async () => {
  if (student) await deleteStudent(admin, student.id);
  await admin.from("content_access").delete().eq("user_id", student.id);
});

test("admin can force-OPEN the weekly challenge for a student with zero progress", async ({ page }) => {
  test.setTimeout(180_000);
  await admin.from("content_access").delete().eq("user_id", student.id).eq("target_type", "week_challenge");
  await login(page, student);
  // Baseline: nothing done → locked.
  await page.goto("/semaine/1");
  await expect(page.getByText("Termine le Jour 5")).toBeVisible({ timeout: 25_000 });

  await admin.from("content_access").insert({
    scope: "user", user_id: student.id, target_type: "week_challenge",
    target_id: 1, access: "open", set_by: student.id,
  });
  await page.reload();
  await expect(page.getByText("Commencer ma Fête !")).toBeVisible({ timeout: 25_000 });
});

test("admin can force-LOCK the weekly challenge for a student who finished the week", async ({ page }) => {
  test.setTimeout(180_000);
  const done = await createStudent(admin);
  try {
    await admin.from("day_completions").insert({ user_id: done.id, day_id: 5, week_number: 1 });
    await login(page, done);
    await page.goto("/semaine/1");
    await expect(page.getByText("Commencer ma Fête !")).toBeVisible({ timeout: 25_000 });

    await admin.from("content_access").insert({
      scope: "user", user_id: done.id, target_type: "week_challenge",
      target_id: 1, access: "locked", set_by: done.id,
    });
    await page.reload();
    await expect(page.getByText("Semaine verrouillée")).toBeVisible({ timeout: 25_000 });
  } finally {
    await admin.from("content_access").delete().eq("user_id", done.id);
    await deleteStudent(admin, done.id);
  }
});

test("device is recorded as desktop from a desktop browser", async ({ page }) => {
  test.setTimeout(120_000);
  const u = await createStudent(admin);
  try {
    await login(page, u);
    await page.goto("/progress");
    await expect(page.getByRole("heading", { name: /Mon progrès/ })).toBeVisible({ timeout: 25_000 });
    await expect(async () => {
      const { data } = await admin.from("user_devices").select("device").eq("user_id", u.id);
      expect((data ?? []).map((r) => r.device)).toEqual(["desktop"]);
    }).toPass({ timeout: 20_000 });
  } finally {
    await deleteStudent(admin, u.id);
  }
});

test("device is recorded as mobile from a real phone emulation", async ({ browser }) => {
  test.setTimeout(120_000);
  const u = await createStudent(admin);
  const ctx = await browser.newContext({ ...pwDevices["Pixel 5"] });
  const page = await ctx.newPage();
  try {
    await login(page, u);
    await page.goto("/progress");
    await expect(page.getByRole("heading", { name: /Mon progrès/ })).toBeVisible({ timeout: 25_000 });
    await expect(async () => {
      const { data } = await admin.from("user_devices").select("device").eq("user_id", u.id);
      expect((data ?? []).map((r) => r.device)).toEqual(["mobile"]);
    }).toPass({ timeout: 20_000 });
  } finally {
    await ctx.close();
    await deleteStudent(admin, u.id);
  }
});

test("admin analytics shows the desktop/mobile card", async ({ page }) => {
  test.setTimeout(180_000);
  const adminUser = await createStudent(admin);
  try {
    await admin.from("user_roles").insert({ user_id: adminUser.id, role: "admin" });
    await login(page, adminUser);
    await page.goto("/liberte-profesor-panel-9382745-admin");
    await expect(page.getByText("Dispositivos — alumnos por tipo de equipo")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("💻 Escritorio")).toBeVisible();
    await expect(page.getByText("📱 Móvil")).toBeVisible();
  } finally {
    await deleteStudent(admin, adminUser.id);
  }
});

/**
 * The owner's complaint, end to end: "recibí un lead y solo veo un email, no sé
 * quién es ni qué quiere". Seed one lead carrying every field and assert the
 * panel actually puts all of it on screen — the name, the phone, the country
 * and, above all, what the person asked for.
 */
test("the leads inbox shows who wrote and what they need", async ({ page }) => {
  test.setTimeout(180_000);
  const adminUser = await createStudent(admin);
  const email = `lead-e2e-${Date.now()}@example.invalid`;
  const NEED = "Necesito llegar a A2 antes de diciembre para una entrevista";
  try {
    await admin.from("user_roles").insert({ user_id: adminUser.id, role: "admin" });
    await admin.from("leads").insert({
      full_name: "Interesada E2E",
      email,
      phone: "+591 70999888",
      nationality: "Bolivia",
      message: NEED,
      status: "pending",
    });
    await login(page, adminUser);
    await page.goto("/liberte-profesor-panel-9382745-admin/interesados");

    await expect(page.getByText("Interesada E2E")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByText("+591 70999888")).toBeVisible();
    await expect(page.getByText("Bolivia", { exact: false }).first()).toBeVisible();
    await expect(page.getByText(NEED)).toBeVisible();
    // And a way to answer without retyping the address.
    await expect(page.locator(`a[href^="mailto:${email}"]`)).toBeVisible();
    await expect(page.locator('a[href^="https://wa.me/591709998"]')).toBeVisible();
  } finally {
    await admin.from("leads").delete().eq("email", email);
    await deleteStudent(admin, adminUser.id);
  }
});

/**
 * "Everything should be seen in the admin panel." A lead must be legible from
 * every surface that mentions one — the tab, the Analítica landing screen, and
 * the drill-down behind the "Leads nuevos" counter — not just from the tab the
 * owner was never told about.
 */
test("a lead is legible from every panel surface, not just the tab", async ({ page }) => {
  test.setTimeout(240_000);
  const adminUser = await createStudent(admin);
  const email = `lead-surf-${Date.now()}@example.invalid`;
  const NEED = "Quiero hablar francés para mi trabajo en marzo";
  try {
    await admin.from("user_roles").insert({ user_id: adminUser.id, role: "admin" });
    await admin.from("leads").insert({
      full_name: "Surface Probe", email, phone: "+591 70111222",
      nationality: "Bolivia", message: NEED, status: "pending",
    });
    await login(page, adminUser);

    // 1) Analítica — the page she actually lands on.
    await page.goto("/liberte-profesor-panel-9382745-admin");
    await expect(page.getByText("Interesados sin contactar", { exact: false })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText("Surface Probe").first()).toBeVisible();
    await expect(page.getByText(NEED).first()).toBeVisible();
    await expect(page.locator(`a[href^="mailto:${email}"]`).first()).toBeVisible();

    // 2) The "Leads nuevos" counter must open the person, not a date table.
    await page.getByText("Leads nuevos", { exact: false }).first().click();
    await expect(page.getByText("Quiénes son")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(NEED).nth(1)).toBeVisible();

    // 3) The full inbox.
    await page.goto("/liberte-profesor-panel-9382745-admin/interesados");
    await expect(page.getByText("Surface Probe")).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText("+591 70111222")).toBeVisible();
    await expect(page.getByText(NEED)).toBeVisible();
  } finally {
    await admin.from("leads").delete().eq("email", email);
    await deleteStudent(admin, adminUser.id);
  }
});
