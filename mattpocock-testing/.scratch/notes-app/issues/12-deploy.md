# 12: Deploy to static hosting

**What to build:** Pushing to main builds and deploys the app to static hosting (GitHub Pages or Cloudflare Pages) from CI, and the deployed app installs and works offline.

**Blocked by:** 09, 10

**Status:** ready-for-human

- [ ] CI builds and deploys on push to main
- [ ] Deployed app loads, installs and works offline
- [x] Hosting choice recorded in an ADR only if a real trade-off arises

## Comments

- Implemented: `.github/workflows/deploy.yml` (test job, then build and deploy to GitHub Pages under `/misc/`), base-path handling, and PWA e2e under the subpath (`NOTES_BASE=/misc/`) all pass locally. Hosting choice recorded in ADR 0002.
- The first two boxes cannot be verified from here. They need a manual one-time Pages setup (Settings -> Pages -> Source: GitHub Actions) and a first push to main, after which confirm CI deploys and the deployed app loads, installs and works offline.
