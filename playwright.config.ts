import { defineConfig, devices } from "@playwright/test";

/**
 * Browser-level tests. These exist because the grep-based suite passed 495/495
 * while production silently lost 100% of student progress: only a real browser
 * can reproduce "switch tab → come back → everything is gone".
 *
 * Runs against the dev server (started automatically). Requires .env with real
 * Supabase credentials — the specs create and delete their own test student.
 */
export default defineConfig({
  testDir: "./e2e",
  // Progress bugs are timing-sensitive; keep them serial and deterministic.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- --port 5173",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
