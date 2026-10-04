# 07: Import bundle

**What to build:** Import an Export bundle. A file whose id matches an existing Note with an older updatedAt overwrites it; with a newer or equal one it is skipped; files not named like an id become new Notes. The user sees added, updated and skipped counts.

**Blocked by:** 06

**Status:** resolved

- [x] Newer-wins and older-skipped rules by id and mtime
- [x] Non-id filenames become new Notes
- [x] Summary shows added, updated and skipped counts
- [x] Playwright flow: export then import
- [x] Core tests cover importBundle(zip) collision rules
