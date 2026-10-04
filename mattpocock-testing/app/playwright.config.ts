import { defineConfig } from "@playwright/test";
import { normalizeBase } from "./src/deploy/base";

// Locally, point PW_CHROMIUM at a preinstalled chromium
// (e.g. /opt/pw-browsers/chromium-1194/chrome-linux/chrome).
const executablePath = process.env.PW_CHROMIUM || undefined;

// Set NOTES_BASE (e.g. /misc/) to build, serve and test under a subpath, as on GitHub Pages.
const base = normalizeBase(process.env.NOTES_BASE);
// PW_PORT picks the preview port; PW_REUSE=1 reuses a server already running there.
const port = process.env.PW_PORT || "4173";
const origin = `http://localhost:${port}`;

export default defineConfig({
  testDir: "e2e",
  use: { baseURL: origin + base, launchOptions: { executablePath } },
  webServer: {
    command: `npm run build && npm run preview -- --port ${port} --strictPort`,
    url: origin + base,
    // Opt-in: a leftover server on the port may serve a stale build.
    reuseExistingServer: !!process.env.PW_REUSE,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
