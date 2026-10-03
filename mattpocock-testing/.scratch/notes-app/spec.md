Status: ready-for-agent

# Notes app v1

## Problem Statement

I want a fast, private place to jot plain-text notes, organise them with lightweight tags, and find them again instantly, on my own device, offline, with no account and no server. Existing apps are heavy, push formatting I don't want, or lock my notes in someone else's cloud.

## Solution

A local-first installable web app (PWA). Notes are plain text. Structure is limited to a Title (first non-blank line) and inline `#tags`. A two-pane UI shows the Note list and a plain editor, with a tag sidebar. Full-text fuzzy search with `#tag` filtering finds Notes. Deleted Notes go to Trash. Notes move between devices via an Export bundle. Everything runs in the browser.

## User Stories

1. As a user, I want to create a new Note with one action, so that I can capture a thought immediately.
2. As a user, I want my typing auto-saved (debounced), so that I never lose text.
3. As a user, I want the Title derived from my first non-blank line, so that I never name things separately.
4. As a user, I want an empty Note shown as "Untitled", so that the list is never blank.
5. As a user, I want to write `#tag` inline in my text, so that tagging costs no extra steps.
6. As a user, I want `#123` and `page#section` not treated as Tags, so that issue refs and URLs don't pollute my tags.
7. As a user, I want Tags to be case-insensitive (`#Work` = `#work`), so that I don't create duplicates.
8. As a user, I want a Note's Tags updated automatically when I edit its text, so that tags never go stale.
9. As a user, I want a Tag to disappear when no Note uses it, so that I never manage tags by hand.
10. As a user, I want a tag sidebar listing all Tags with counts, so that I can browse by topic.
11. As a user, I want to click a Tag to filter the list, so that I see only related Notes.
12. As a user, I want the Note list sorted by last updated, newest first, so that recent work is on top.
13. As a user, I want a two-pane layout (list and editor), so that I can switch Notes quickly.
14. As a mobile user, I want a single-pane layout, so that the app is usable on a phone.
15. As a user, I want full-text search across Title and body, so that I can find any Note.
16. As a user, I want prefix and fuzzy matching, so that typos and partial words still find results.
17. As a user, I want Title matches ranked above body matches, so that the most relevant Note comes first.
18. As a user, I want to type `#tag` in search to filter by Tag, so that I can combine text and tags.
19. As a user, I want trashed Notes excluded from search and the list, so that deleted things stay out of sight.
20. As a user, I want deleting a Note to move it to Trash, so that mistakes are recoverable.
21. As a user, I want to restore a Note from Trash, so that I can undo a delete.
22. As a user, I want to empty the Trash manually with a confirmation, so that permanent deletion is deliberate.
23. As a user, I want the app to work fully offline, so that I can use it anywhere.
24. As a user, I want to install the app from the browser, so that it feels native.
25. As a user, I want the app to request persistent storage, so that the browser doesn't evict my Notes.
26. As a user, I want to export all Notes as a zip of `<id>.txt` files, so that I own my data and can back up.
27. As a user, I want a reminder if I haven't exported in 30 days, so that I don't forget to back up.
28. As a user, I want to import an Export bundle, so that I can bring Notes to another device.
29. As a user, I want an imported Note with the same id and a newer `updatedAt` to overwrite, and an older one skipped, so that import never loses newer work.
30. As a user, I want files not named like an id imported as new Notes, so that I can import plain `.txt` files from elsewhere.
31. As a user, I want a count summary after import (added, updated, skipped), so that I know what happened.
32. As a user, I want the app to handle about 10k Notes without lag, so that it scales with my habit.

## Implementation Decisions

- Single Vite + TypeScript package with React UI. Two top-level areas: a deep `core/` module and a `ui/` layer. `ui/` depends on `core/` only through its public interface.
- `core/` public interface (small): Note service (create, update, get, list, trash, restore, emptyTrash), tag queries (listTags with counts, notesByTag), `search(query)`, `exportBundle()`, `importBundle(zip)`. Storage, indexing and parsing are hidden behind it.
- Note shape: UUIDv7 `id`, `text`, `createdAt`, `updatedAt`, `trashedAt` (null when live). Title and Tags are derived from `text`, never stored as authoritative fields.
- Title: first non-blank line, trimmed; empty Note displays "Untitled".
- Tag rule: `#` then a letter, then letters, digits or `-`; preceded by whitespace or line start; case-insensitive, stored lowercase. Re-derived on every save.
- Storage: IndexedDB via Dexie. Search: MiniSearch index over Title and body with prefix and fuzzy matching, Title boosted, trashed Notes excluded. `#tag` tokens in a query act as Tag filters.
- Auto-save: debounced on keystroke.
- Export bundle: zip with one `<id>.txt` per Note, contents are the raw text, zip entry modified time carries `updatedAt`. Import: same id and newer time wins, older skipped, non-id filenames become new Notes; returns added/updated/skipped counts.
- Export reminder: last-export timestamp kept in local settings; reminder shown after 30 days.
- PWA: service worker caches the app shell, install prompt, `navigator.storage.persist()` requested.
- Editor: plain `<textarea>`, no highlighting or preview. Tags appear as chips in the list and sidebar.
- UI: two panes (list sorted by `updatedAt` desc, editor) plus tag sidebar; single-pane on narrow screens.
- Hosting: static site deployed from CI on push to main.
- ADR 0001: local-first, no server in v1.

## Testing Decisions

- Good tests assert external behaviour through a public interface only, never internals or implementation details.
- Seam 1 (primary): the `core/` public interface, tested with Vitest against real code and `fake-indexeddb`, no mocks of internals. Covers Title and Tag derivation, search ranking and filtering, Trash lifecycle, auto-save-independent persistence, export/import and collision rules.
- Seam 2 (smoke): 2–3 Playwright flows (create, tag and find a Note; trash and restore; export then import) proving the wiring only.
- No unit tests for UI components.
- Build `core/` test-first (TDD), one red-green slice at a time.
- Prior art: none, greenfield.

## Out of Scope

Sync and any server; attachments; backlinks and wiki links; version history; Markdown or any rich formatting and preview; tag highlighting in the editor; folders; collaboration; dark-mode polish.

## Further Notes

- Vocabulary follows `GLOSSARY.md` (Note, Title, Tag, Trash, Export bundle); avoid the listed synonyms.
- Browser storage is fragile with no sync, so export, the reminder and persistent storage are first-class, not extras.
- Sync is a later phase and will need its own spec and conflict-handling decision.
