import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/i18n",
  testMatch: "mgB1CleanRuntime.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "line",
  timeout: 3 * 60 * 1000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.MG_B1_CLEAN_BASE_URL ?? "http://127.0.0.1:4334",
    ...devices["Desktop Chrome"],
    launchOptions: {
      executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
