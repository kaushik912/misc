import { defineConfig } from "@playwright/test";
import { normalizeBase } from "./src/deploy/base";

// Locally, point PW_CHROMIUM at a preinstalled chromium
// (e.g. /opt/pw-browsers/chromium-1194/chrome-linux/chrome).
const executablePath = process.env.PW_CHROMIUM || undefined;

// Set NOTES_BASE (e.g. /misc/) to build, serve and test under a subpath, as on GitHub Pages.
const base = normalizeBase(process.env.NOTES_BASE);
const origin = "http://localhost:4173";

export default defineConfig({
  testDir: "e2e",
  use: { baseURL: origin + base, launchOptions: { executablePath } },
  webServer: {
    command: "npm run build && npm run preview -- --port 4173 --strictPort",
    url: origin + base,
    reuseExistingServer: true,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
