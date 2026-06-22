import { defineConfig, devices } from "@playwright/test";

/**
 * Composition-aware visual verification (DEMO-PLAN.md §14, task #15).
 * Drives the scenario harness in visual/ to prove each UI state renders, check runtime
 * token conformance + overflow, and emit screenshots for the human/design audit.
 * Runs as part of `npm run smoke`. CI must `npx playwright install --with-deps chromium` first.
 */
export default defineConfig({
  testDir: "./visual",
  outputDir: "./visual/.results",
  fullyParallel: true,
  reporter: process.env.CI ? "list" : [["list"]],
  use: {
    baseURL: "http://localhost:5179",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "VITE_OPEN=false npx vite --port 5179 --strictPort",
    url: "http://localhost:5179/",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
