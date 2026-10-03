# 05: Trash

**What to build:** Delete moves a Note to Trash, where it can be restored or the Trash emptied permanently after a confirmation. Trashed Notes are excluded from the list, sidebar counts and search.

**Blocked by:** 04

**Status:** resolved

- [x] Trash a Note (sets trashedAt); it disappears from list, Tag counts and search
- [x] Restore returns it everywhere
- [x] Empty Trash is permanent and requires confirmation
- [x] Playwright flow: trash and restore
- [x] Core tests cover the Trash lifecycle
