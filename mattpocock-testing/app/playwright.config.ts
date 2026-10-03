import { defineConfig } from "@playwright/test";

// Locally, point PW_CHROMIUM at a preinstalled chromium
// (e.g. /opt/pw-browsers/chromium-1194/chrome-linux/chrome).
const executablePath = process.env.PW_CHROMIUM || undefined;

export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://localhost:4173", launchOptions: { executablePath } },
  webServer: {
    command: "npm run build && npm run preview -- --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: true,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
