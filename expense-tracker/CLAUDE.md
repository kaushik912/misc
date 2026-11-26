# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

```bash
npm install         # install/update dependencies
npm run dev         # start Vite dev server (localhost:5173)
npm run build       # build to dist/ for deployment
npm run preview     # test the production build locally
npm test            # store contract tests, localStore only (fast)
npm run test:all    # contract tests on localStore + firestoreStore via Firestore emulator (needs Java + firebase CLI, no Docker)
firebase deploy --only hosting    # deploy dist/ to Firebase Hosting
```

UI is tested manually in the browser; the storage layer has a contract test (`test/store.contract.test.js`).

## Development & Testing

Click **Try Demo** on the login screen to work offline: no Firebase Auth, full CRUD against browser `localStorage`, seeded from `public/mock_*.json` (dates shifted so the newest mock month = current month). "Reset Demo Data" re-seeds.

Common workflow:
1. `npm run dev` and open the localhost URL
2. Use Try Demo for offline work, or log in for live Firebase
3. Test changes in browser; hot reload works automatically
4. `npm test` (or `npm run test:all` if you touched a store)
5. `npm run build` + `npm run preview` to test the production build before deploying

## Demo Mode & Stores — keep in sync

All persistence goes through a store (`src/stores/`): `firestoreStore.js` (real users) and `localStore.js` (demo user, uid `demo`). `storeFor(user)` in `src/stores/index.js` picks one. Composables never call Firestore directly.

Rules when adding features:
- UI/logic on already-loaded data, or new fields on existing docs → no store change needed.
- New query shape or storage operation → add the method to **both** stores and a case to `test/store.contract.test.js`; run `npm run test:all`.
- New collection → reuse the generic methods (they take a `collection` arg); add demo seed data in `stores/index.js` `demoSeed()` if the demo should show it.
- Firebase-only features (auth/password, Cloud Functions, server timestamps) → hide in demo (`isDemo` in App.vue, see `UserControls.vue`).
- Demo must never reach Firestore; Firestore rules allowlist only the owner's UID (`firestore_general.rules`).

## Architecture

**Composables** (`src/composables/`) hold business logic and state:
- `useAuth()` — manages Firebase Auth (login, logout, current user, errors) plus `enterDemo()` (fake `{ uid: "demo", isDemo: true }` user)
- `useExpenses()` — CRUD by month via the user's store (read by month, create, update, delete), accepts reactive `user` ref; clears its month cache on each login

**Components** (`src/components/`) are presentational and event-driven:
- `App.vue` — wires composables to components; manages local state for modals
- Modals (`ExpenseModal`, `PasswordModal`) — conditional v-if rendering
- Each component emits events; parent handles actions

**Firebase** (`src/firebase.js`):
- Exports `firebase`, `auth`, `db`
- Uses compat imports for Firestore/Auth

The app is a single-page app with no routing. State flows top-down (props) and events bubble up.

## Project Structure Highlights

```
src/
  firebase.js              # config, exports firebase/auth/db
  main.js                  # mounts App into #app
  App.vue                  # root component, wires everything
  composables/
    useAuth.js             # auth state, login/logout, enterDemo
    useExpenses.js         # queries & mutations by month (via store)
    useCategories.js       # saved custom categories (via store)
  stores/                  # firestoreStore, localStore (demo), storeFor() + demo seeding
  components/              # presentational components, mostly modals & forms
  style.css                # global styles (Vite auto-injects)
test/                      # store contract test (vitest)
public/                    # static assets + mock_*.json (demo seed)
dist/                      # Vite build output (gitignored)
```

## Expense Fields

`uid`, `date` (YYYY-MM-DD), `amount`, `category`, `notes` (optional). Categories are presets in `src/categories.js` plus "Custom…" (free text); legacy docs without a category display as "Uncategorized" (read-time default, no migration).

Custom categories are auto-saved on expense save to `userCategories/{uid}` (`{ uid, names: [] }`, via `useCategories()`; one read at login, write only when new, deduped case-insensitively vs presets + saved) and appear in the ExpenseModal dropdown after the presets. No manage/delete UI; old expenses keep their string. Rules deploy needed (`firebase deploy --only firestore:rules` or full deploy). In demo mode they're kept in localStorage.

The Expenses view also has a client-side text search (App.vue `searchText`): case-insensitive, all words must match across category, notes, amount and date; ANDs with the category filter, persists across month changes, current month only. The filtered-total header shows for either filter.

The Expenses view has a client-side category filter (App.vue): grouped case-insensitively via `categoryKey`, shows that category's total and % of the month total, persists across month changes. No extra Firestore reads.

## Firebase Setup

Already configured for `expenses-tracker-3352f` project (see `.firebaserc`). To use a different project:
1. Update `firebaserc` with new project ID
2. Fill in `src/firebase.js` config (get from Firebase Console)
3. Create Firestore database with composite index on `uid + date` for the range query in `useExpenses.js`
4. Apply Firestore rules from `firestore_general.rules` (covers `expenses`, `cardPayments`, `userCategories`). Put the owner's UID in `allowed()` first — the placeholder locks everyone out.
5. Recommended: Authentication → Settings → User actions → disable "Enable create (sign-up)", so accounts can't be self-created via the REST API.

Free-tier limits: 50K reads/day, 20K writes/day, 10K Auth verifications/month, 1GB storage / 10GB transfer.

## Deployment

Build & deploy to Firebase Hosting:
```bash
npm run build
firebase deploy --only hosting
```

If Firestore rules changed: `firebase deploy` (without `--only`) to push both hosting + rules.

Vite auto-hashes all JS/CSS filenames, so every deploy is a cache-buster (no manual versioning needed).

See HELP.md for detailed Firebase one-time setup, CLI requirements, and origin notes.

- After any major change (new feature, architectural decision, new dependency, workflow/config/command change, or lesson learned), update this CLAUDE.md in the same commit so it reflects the current state — keep entries concise and edit or remove outdated ones rather than appending.
