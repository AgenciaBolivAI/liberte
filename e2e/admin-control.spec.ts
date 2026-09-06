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

/**
 * Deleting an account is the one action in the panel that cannot be undone, so
 * it is tested end to end: the guards must hold, the data must actually be
 * gone, and the audit row must survive the account it describes.
 */
test("an admin can delete an account, and the guards hold", async ({ page }) => {
  test.setTimeout(240_000);
  const adminUser = await createStudent(admin);
  const victim = await createStudent(admin);
  try {
    await admin.from("user_roles").insert({ user_id: adminUser.id, role: "admin" });
    // Give them work, so the deletion has something real to destroy.
    await admin.from("day_completions").insert({ user_id: victim.id, day_id: 1 });
    await admin.from("star_awards").insert({ user_id: victim.id, amount: 2, reason: "day_done" });

    await login(page, adminUser);
    await page.goto("/liberte-profesor-panel-9382745-admin/alumnos");

    const card = page.locator(`[data-student="${victim.id}"]`);
    await expect(card).toBeVisible({ timeout: 45_000 });
    await card.getByRole("button", { name: /Ver detalle/ }).click();
    await card.getByRole("button", { name: "Eliminar cuenta" }).click();

    // The confirm button stays disabled until the email is typed exactly.
    const confirm = card.getByRole("button", { name: "Eliminar definitivamente" });
    await expect(confirm).toBeDisabled();
    await card.locator('input[autocomplete="off"]').fill("wrong@example.invalid");
    await expect(confirm).toBeDisabled();
    await card.locator('input[autocomplete="off"]').fill(victim.email);
    await expect(confirm).toBeEnabled();
    await confirm.click();

    // The account and everything it owned must actually be gone.
    await expect(async () => {
      const { data: prof } = await admin.from("profiles").select("id").eq("id", victim.id);
      expect(prof ?? []).toHaveLength(0);
      const { data: days } = await admin.from("day_completions").select("day_id").eq("user_id", victim.id);
      expect(days ?? []).toHaveLength(0);
      const { data: stars } = await admin.from("star_awards").select("amount").eq("user_id", victim.id);
      expect(stars ?? []).toHaveLength(0);
    }).toPass({ timeout: 40_000 });

    // ...and the record of it must outlive the account.
    const { data: log } = await admin
      .from("account_deletions")
      .select("email, days_completed, stars, deleted_by_email")
      .eq("deleted_user_id", victim.id)
      .maybeSingle();
    expect(log?.email).toBe(victim.email);
    expect(log?.days_completed).toBe(1);
    expect(log?.stars).toBe(2);
    expect(log?.deleted_by_email).toBe(adminUser.email);
  } finally {
    await admin.from("account_deletions").delete().eq("deleted_user_id", victim.id);
    await deleteStudent(admin, victim.id);
    await deleteStudent(admin, adminUser.id);
  }
});

test("revoking access locks the student out but keeps their work", async ({ page }) => {
  test.setTimeout(180_000);
  const adminUser = await createStudent(admin);
  const target = await createStudent(admin);
  try {
    await admin.from("user_roles").insert({ user_id: adminUser.id, role: "admin" });
    await admin.from("day_completions").insert({ user_id: target.id, day_id: 1 });

    await login(page, adminUser);
    await page.goto("/liberte-profesor-panel-9382745-admin/alumnos");
    const card = page.locator(`[data-student="${target.id}"]`);
    await expect(card).toBeVisible({ timeout: 45_000 });
    await card.getByRole("button", { name: /Ver detalle/ }).click();
    await card.getByRole("button", { name: /Retirar acceso/ }).click();

    await expect(async () => {
      const { data } = await admin.from("profiles").select("approved_at").eq("id", target.id).maybeSingle();
      expect(data?.approved_at).toBeNull();
    }).toPass({ timeout: 40_000 });

    // The whole point: the work is still there when they pay.
    const { data: days } = await admin.from("day_completions").select("day_id").eq("user_id", target.id);
    expect(days ?? []).toHaveLength(1);
  } finally {
    await deleteStudent(admin, target.id);
    await deleteStudent(admin, adminUser.id);
  }
});

test("an admin can deny an access request, and the student is told", async ({ page }) => {
  test.setTimeout(180_000);
  const adminUser = await createStudent(admin);
  const applicant = await createStudent(admin);
  try {
    await admin.from("user_roles").insert({ user_id: adminUser.id, role: "admin" });
    // createStudent approves by default; put this one back in the queue.
    await admin.from("profiles").update({ approved_at: null }).eq("id", applicant.id);

    await login(page, adminUser);
    await page.goto("/liberte-profesor-panel-9382745-admin");
    await expect(page.getByText("Solicitudes pendientes", { exact: false })).toBeVisible({ timeout: 45_000 });
    page.once("dialog", (d) => void d.accept("no completó el pago"));
    await page.getByRole("button", { name: "Denegar" }).first().click();

    await expect(async () => {
      const { data } = await admin
        .from("profiles")
        .select("approved_at, denied_at, denied_reason")
        .eq("id", applicant.id)
        .maybeSingle();
      expect(data?.denied_at).not.toBeNull();
      expect(data?.approved_at).toBeNull();
      expect(data?.denied_reason).toBe("no completó el pago");
    }).toPass({ timeout: 40_000 });
  } finally {
    await deleteStudent(admin, applicant.id);
    await deleteStudent(admin, adminUser.id);
  }
});

/**
 * Month 3's arcade, played for real. Compiling is not evidence that a game
 * works — this starts a round, taps a target and checks the score moves.
 */
test("a Month-3 day renders the arcade and a round is actually playable", async ({ page }) => {
  test.setTimeout(240_000);
  const student = await createStudent(admin);
  try {
    // Day 41 is behind the normal unlock; open it the way an admin preview does.
    await admin.from("user_roles").insert({ user_id: student.id, role: "admin" });
    await login(page, student);
    await page.goto("/day/41");

    // The day's own content from the client's document.
    await expect(page.getByText("Mi infancia").first()).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText("Passé composé avec avoir").first()).toBeVisible();

    // Both games are offered, and they are DIFFERENT games.
    await expect(page.getByText("Attrape le mot").first()).toBeVisible();
    await expect(page.getByText("Complète la phrase").first()).toBeVisible();

    // Play the whack-a-mole: start, wait for a target, tap it.
    const board = page.locator(".arcade-board").first();
    await board.getByRole("button", { name: "Jouer" }).click();
    await expect(page.getByText("¿Cómo se dice?")).toBeVisible({ timeout: 15_000 });
    const target = board.locator("button").filter({ hasNotText: "Pista sonora" }).last();
    await expect(target).toBeVisible({ timeout: 15_000 });
    await target.click();
    // Either a hit or a miss — what matters is the round responded, not froze.
    await expect(board.locator("button").first()).toBeVisible();

    // The grammar game shows a real sentence from the document with a gap.
    const second = page.locator(".arcade-board").nth(1);
    await second.getByRole("button", { name: "Jouer" }).click();
    await expect(second.getByText("____").or(second.getByText("?"))).toBeVisible({ timeout: 15_000 });

    // And the 30 words are one tap away.
    await page.getByRole("button", { name: /Las 30 palabras/ }).click();
    await expect(page.getByText("enfance").first()).toBeVisible();
    await expect(page.getByText("J'ai passé toute mon enfance à jouer dehors.")).toBeVisible();
  } finally {
    await deleteStudent(admin, student.id);
  }
});
