# Host on GitHub Pages under a subpath

The app is deployed to GitHub Pages from CI, which serves it under `/<repo>/` (`/misc/`) rather than the origin root. The build therefore takes a configurable base (`NOTES_BASE`, default `/`) that drives Vite's `base`, the PWA manifest `scope`/`start_url` and the service-worker scope. Cloudflare Pages would serve at the root, but GitHub Pages keeps hosting, CI and the repo in one place at no cost. Consequence: source code must not use root-absolute URLs (`/foo`); use relative URLs or Vite's base so the app works at any base.
