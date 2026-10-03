# 02: Edit with auto-save, two-pane layout

**What to build:** Select a Note and edit it in a plain textarea next to the list. Typing auto-saves (debounced), bumps updatedAt, and the list stays sorted newest first.

**Blocked by:** 01

**Status:** resolved

- [x] Two-pane layout: list left, editor right
- [x] Edits persist without a save action, debounced
- [x] updatedAt changes on edit and the list re-sorts by updatedAt descending
- [x] Title in the list updates as the first line changes
- [x] Core tests cover update and ordering
