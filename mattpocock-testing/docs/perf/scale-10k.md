# Scale check: 10,000 Notes (spec story 32, ticket 11)

## Machine caveat

Numbers are from a shared 4-vCPU Intel Xeon @ 2.1 GHz cloud VM (16 GB, Node 22, headless Chromium 1194). Core numbers use `fake-indexeddb` in Node, which is an in-memory IndexedDB, so absolute storage cost is not representative of a real browser; relative before/after is the useful signal. UI numbers use real Chromium IndexedDB. Treat all values as order-of-magnitude, single-machine measurements (medians of 3-10 runs after the first seeding).

## How to reproduce

- Core: `npm run perf:core` (in `app/`; `PERF_N=...` overrides the count). Seeds ~10,000 Notes (~300 chars, 0-3 Tags, 200 distinct Tags) by building an Export bundle and calling `importBundle`, then times the public interface. Harness: `perf/seed.ts`, `perf/scale-core.perf.ts`.
- UI: `PW_CHROMIUM=... npx playwright test e2e/scale.spec.ts` seeds 10,000 Notes straight into IndexedDB, reloads, and times the app. It prints `PERF-UI` lines on stderr and asserts only very generous bounds.
- Regression guard in the normal suite: `src/core/scale.test.ts` (2,000 Notes, order-of-magnitude bounds).

## Core timings (10,000 Notes)

| Operation | Before | After |
| --- | --- | --- |
| seed via `importBundle` (10k Notes) | 10,218 ms | 758 ms |
| open (read all + build search index) | 425 ms | 432 ms |
| `list()` | 128 ms | ~0 ms (cached) |
| `listTags()` | 130 ms | ~0 ms (cached) |
| `search("garden")` | 139 ms | 8 ms |
| `search("budg")` (prefix + fuzzy) | 134 ms | 8 ms |
| `search("#tag7")` | 127 ms | 0.5 ms |
| `notesByTag("tag7")` | 117 ms | 0.4 ms |
| `listTrash()` | 121 ms | 0.2 ms |
| `exportReminderDue()` | 151 ms | 0.1 ms |
| `update()` (save) | 16.5 ms | 10 ms |
| `update()` + `list()` + `listTags()` (autosave then refresh, first read re-sorts) | n/a (~275 ms, sum of parts) | 10.5 ms |
| `create()` | 1.9 ms | 0.2 ms |
| UI `refresh()` (tags + trash + reminder + list) | 493 ms | 0.3 ms (11 ms while searching) |

## UI timings (real Chromium, 10,000 Notes seeded in IndexedDB)

Typing time is included (6 keystrokes at 50 ms = 300 ms; 12 keystrokes at 30 ms + 400 ms autosave debounce = ~760 ms floor for the edit).

| Scenario | Before | After |
| --- | --- | --- |
| reload until the list is populated | 2,024 ms | 1,473 ms |
| type "quokka" in Search until results settle | 3,430 ms | 1,323 ms |
| edit a Note until the new Title shows in the list | 3,364 ms | 1,171 ms |

## Hot spots found and fixed

1. **Every read re-read and re-derived all Notes.** `list`, `listTags`, `notesByTag`, `search`, `listTrash`, `exportReminderDue` and `exportBundle` each ran `toArray()` over IndexedDB then recomputed Title and Tags for every Note (about 120 ms each at 10k). The UI's `refresh()` called four of them per autosave and per search keystroke (about 490 ms). Fix: `openNotes` loads each Note once into an in-memory `NoteView` map (the same read that already builds the search index) and every write keeps it in step; the sorted live list and Tag counts are derived lazily and invalidated on write. Trade-off: one open store per database is assumed (writes from another tab appear after reopening), which the search index already assumed.
2. **`importBundle` did sequential `get` + `add` per entry** (about 1 ms each, 10 s for 10k). Fix: decide against the in-memory Notes, then one `bulkPut`.
3. **Search keystrokes refreshed Tags, Trash and the reminder too.** Fix: typing refreshes only the list.
4. **Every refresh re-rendered every row** (and each select re-rendered all 10k). Fix: memoised `NoteRow`.

Core fixes are covered through the public interface by existing behavioural tests (trash, restore, empty Trash, import, search, Tags, export) plus `src/core/scale.test.ts`. The UI fixes are covered by the existing e2e suite and `e2e/scale.spec.ts`. One existing test (`export.test.ts`, "excludes trashed Notes") wrote `trashedAt` behind the store's back via raw Dexie; it now uses `trash()`.

## Remaining costs and not done

- Open still takes ~430 ms at 10k (reading every Note plus building the MiniSearch index), paid once per page load. Persisting the index or building it lazily would reduce it but adds complexity; not needed for responsiveness.
- The list renders every row in the DOM (10k `li` after reload, 1.5 s to first populated list). Windowing would remove this but is a UI/CSS change that overlaps ticket 10, so it was left alone. Typing a one-letter search can return thousands of rows, which is where the remaining ~1.3 s search time goes.
- `update()` costs ~10 ms, dominated by the MiniSearch `replace` and the IndexedDB `put`.
