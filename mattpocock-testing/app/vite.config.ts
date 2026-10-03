/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { normalizeBase } from "./src/deploy/base";

// Subpath hosting (GitHub Pages serves under /<repo>/): set NOTES_BASE=/misc/. Defaults to "/".
const base = normalizeBase(process.env.NOTES_BASE);

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png"],
      workbox: { globPatterns: ["**/*.{js,css,html,png,svg}"], navigateFallback: "index.html" },
      manifest: {
        name: "Notes",
        short_name: "Notes",
        description: "Fast, private, offline plain-text notes.",
        start_url: base,
        scope: base,
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#4f46e5",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["fake-indexeddb/auto"],
  },
});
