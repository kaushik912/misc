# 02: Edit with auto-save, two-pane layout

**What to build:** Select a Note and edit it in a plain textarea next to the list. Typing auto-saves (debounced), bumps updatedAt, and the list stays sorted newest first.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Two-pane layout: list left, editor right
- [ ] Edits persist without a save action, debounced
- [ ] updatedAt changes on edit and the list re-sorts by updatedAt descending
- [ ] Title in the list updates as the first line changes
- [ ] Core tests cover update and ordering
