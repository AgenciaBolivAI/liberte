import { readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";

/** .env is the single source of credentials (same parsing as scripts/test-all.mjs). */
export function loadEnv(): Record<string, string> {
  return Object.fromEntries(
    readFileSync(".env", "utf8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
      }),
  );
}

export function adminClient(): SupabaseClient {
  const env = loadEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    // No WebSocket in the test runner.
    realtime: { transport: class { constructor() { throw new Error("no realtime"); } } } as never,
  });
}

export type TestStudent = { id: string; email: string; password: string };

/** Create an APPROVED student (approval gates the paid-AI + messaging features). */
export async function createStudent(admin: SupabaseClient): Promise<TestStudent> {
  const email = `e2e-progress-${Date.now()}@liberte-test.local`;
  const password = "E2e!Progress_12345";
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: "E2E Student" },
  });
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
  await admin.from("profiles").update({ approved_at: new Date().toISOString() }).eq("id", data.user.id);
  return { id: data.user.id, email, password };
}

export async function deleteStudent(admin: SupabaseClient, id: string) {
  await admin.auth.admin.deleteUser(id);
}

const LOGIN_PATH = "/liberte-log-in-983749824923465723";

export async function login(page: Page, student: TestStudent) {
  await page.goto(LOGIN_PATH);
  await page.locator('input[type="email"]').fill(student.email);
  await page.locator('input[type="password"]').first().fill(student.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  // Landing anywhere authenticated is fine; the specs navigate explicitly after.
  await page.waitForURL((u) => !u.pathname.includes("log-in"), { timeout: 30_000 });
}

/**
 * Simulate leaving the tab and coming back — the exact user action that used to
 * wipe progress. Playwright has no real tab-blur, so we drive the same signals
 * the browser sends: document.hidden + visibilitychange (which is what
 * supabase-js listens to in order to refresh the session), plus window blur/focus.
 */
export async function simulateTabSwitch(page: Page, hiddenMs = 1200) {
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("blur"));
  });
  await page.waitForTimeout(hiddenMs);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    Object.defineProperty(document, "hidden", { value: false, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("focus"));
  });
  // Give auth-js + any refetch a moment to settle.
  await page.waitForTimeout(2000);
}
