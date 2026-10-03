# 09: PWA: offline, install, persistent storage

**What to build:** The app works fully offline after the first load, can be installed from the browser, and requests persistent storage so notes are not evicted.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Service worker caches the app shell; app loads and works offline
- [ ] Install prompt offered
- [ ] navigator.storage.persist() requested
- [ ] Verified with a Playwright offline check
