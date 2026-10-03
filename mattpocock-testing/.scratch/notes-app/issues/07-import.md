# 07: Import bundle

**What to build:** Import an Export bundle. A file whose id matches an existing Note with an older updatedAt overwrites it; with a newer or equal one it is skipped; files not named like an id become new Notes. The user sees added, updated and skipped counts.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] Newer-wins and older-skipped rules by id and mtime
- [ ] Non-id filenames become new Notes
- [ ] Summary shows added, updated and skipped counts
- [ ] Playwright flow: export then import
- [ ] Core tests cover importBundle(zip) collision rules
