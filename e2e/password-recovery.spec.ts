import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { adminClient, createStudent, deleteStudent, loadEnv, type TestStudent } from "./helpers";

/**
 * The password-reset flow, end to end, with a REAL Supabase recovery link.
 *
 * Reported by the client, verbatim: «Llega un correo, y te da "reset password"
 * pero cuando le das click a ese correo, te hace entrar "directo" a la
 * plataforma, no permite se ponga una nueva contraseña, entonces no se tiene
 * acceso, y siempre hay que hacer el mismo proceso para poder entrar».
 *
 * Cause, measured against the live project: Supabase DISCARDS the `redirectTo`
 * we pass (/reset-password is not in the project's Redirect-URL allowlist) and
 * sends the student to the Site URL root with `#access_token=…&type=recovery`.
 * `detectSessionInUrl` then signs her in on the spot, so she lands inside the
 * platform, is never shown the form, and her password is never changed — hence
 * "siempre hay que hacer el mismo proceso".
 *
 * This spec reproduces that landing exactly: it asks Supabase for a genuine
 * link, follows the verify hop the way a mail client does, and replays the
 * resulting fragment against the app. Grep-level tests cannot catch this — the
 * bug lives in the interaction between Supabase's redirect, supabase-js's URL
 * detection and our route guards.
 */
const admin = adminClient();
let student: TestStudent;

function anonClient() {
  const env = loadEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false },
    realtime: { transport: class { constructor() { throw new Error("no realtime"); } } } as never,
  });
}

/** Ask Supabase for a real recovery link and follow it to where the student lands. */
async function recoveryLanding(email: string, redirectTo: string) {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });
  expect(error, `generateLink failed: ${error?.message}`).toBeFalsy();
  const actionLink = data?.properties?.action_link;
  expect(actionLink, "no action_link returned").toBeTruthy();

  const res = await fetch(actionLink!, { redirect: "manual" });
  return { status: res.status, location: res.headers.get("location") ?? "" };
}

test.beforeAll(async () => {
  student = await createStudent(admin);
});
test.afterAll(async () => {
  if (student) await deleteStudent(admin, student.id);
});

test("a real recovery link ends with the password ACTUALLY changed", async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  const newPassword = "Nouveau!MotDePasse_2026";

  // 1) The link the student receives, and where it really goes.
  const { location } = await recoveryLanding(student.email, `${baseURL}/reset-password`);
  const hashAt = location.indexOf("#");
  expect(hashAt, `no fragment in the recovery redirect: ${location}`).toBeGreaterThan(-1);
  const fragment = location.slice(hashAt);
  expect(fragment).toContain("type=recovery");

  // 2) Replay that landing against the app. NOTE we deliberately go to the
  //    ROOT, not /reset-password: that is what Supabase actually does, and
  //    navigating straight to the form would test a path no student walks.
  await page.goto(`/${fragment}`);

  // 3) The app must pull her onto the form instead of into the platform.
  await page.waitForURL((u) => u.pathname === "/reset-password", { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Nouveau mot de passe" })).toBeVisible();
  await expect(page.locator("#new-password")).toBeVisible({ timeout: 20_000 });

  // 4) Set the new password.
  await page.locator("#new-password").fill(newPassword);
  await page.locator("#confirm-password").fill(newPassword);
  await page.getByRole("button", { name: "Enregistrer le mot de passe" }).click();

  // 5) She ends up inside the platform, off the form.
  await page.waitForURL((u) => !u.pathname.includes("reset-password"), { timeout: 30_000 });

  // 6) THE ASSERT THAT MATTERS: the password really changed. Everything above
  //    could pass while the account still held the old password — which is
  //    precisely the state the client was stuck in.
  const anon = anonClient();
  const fresh = await anon.auth.signInWithPassword({ email: student.email, password: newPassword });
  expect(fresh.error, `new password rejected: ${fresh.error?.message}`).toBeFalsy();
  expect(fresh.data.session?.access_token).toBeTruthy();

  const stale = await anonClient().auth.signInWithPassword({
    email: student.email,
    password: student.password,
  });
  expect(stale.data.session, "the OLD password still works — nothing was changed").toBeFalsy();

  student.password = newPassword; // keep afterAll/other specs honest
});

test("a dead recovery link does not trap her on the form", async ({ page }) => {
  // Recovery mode is sticky on purpose (a reload must not drop her back into
  // the platform). That stickiness is exactly what could imprison her when the
  // link is expired: the guard would keep sending her back to a form she has no
  // session for. Releasing it is part of the fix, so it gets its own test.
  await page.goto("/reset-password#access_token=not-a-real-token&type=recovery");
  await expect(page.getByText(/Ce lien n’est pas valide|Ce lien n'est pas valide/)).toBeVisible({
    timeout: 30_000,
  });

  await page.getByRole("link", { name: "Aller à la connexion" }).click();
  await page.waitForURL((u) => u.pathname.includes("log-in"), { timeout: 20_000 });
  // …and it must STAY there rather than bouncing back to /reset-password.
  await page.waitForTimeout(2500);
  expect(page.url()).toContain("log-in");
});
