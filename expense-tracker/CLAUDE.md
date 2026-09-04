# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

```bash
npm install         # install/update dependencies
npm run dev         # start Vite dev server (localhost:5173)
npm run build       # build to dist/ for deployment
npm run preview     # test the production build locally
firebase deploy --only hosting    # deploy dist/ to Firebase Hosting
```

No test suite — the app is tested manually in the browser.

## Development & Testing

Use **testMode** in `src/firebase.js` to develop offline:
- Set `testMode = true` to skip Firebase Auth entirely
- Loads mock data from `public/mock_expenses.json` (read-only)
- All create/update/delete actions are blocked with an alert
- Set back to `false` for live development against Firebase

Common workflow:
1. `npm run dev` and open the localhost URL
2. Flip testMode for offline work, or ensure Firebase credentials are in `src/firebase.js`
3. Test changes in browser; hot reload works automatically
4. `npm run build` + `npm run preview` to test the production build before deploying

## Architecture

**Composables** (`src/composables/`) hold business logic and state:
- `useAuth()` — manages Firebase Auth (login, logout, current user, errors)
- `useExpenses()` — manages Firestore CRUD (read by month, create, update, delete), accepts reactive `user` ref

**Components** (`src/components/`) are presentational and event-driven:
- `App.vue` — wires composables to components; manages local state for modals
- Modals (`ExpenseModal`, `PasswordModal`) — conditional v-if rendering
- Each component emits events; parent handles actions

**Firebase** (`src/firebase.js`):
- Exports `auth`, `db`, `testMode` flag
- Config values (API key, project ID) use `<FILL>` placeholders — copy from Firebase Console
- Uses compat imports for Firestore/Auth

The app is a single-page app with no routing. State flows top-down (props) and events bubble up.

## Project Structure Highlights

```
src/
  firebase.js              # config, exports auth/db, testMode toggle
  main.js                  # mounts App into #app
  App.vue                  # root component, wires everything
  composables/
    useAuth.js             # auth state, login/logout
    useExpenses.js         # Firestore queries & mutations by month
  components/              # presentational components, mostly modals & forms
  style.css                # global styles (Vite auto-injects)
public/                    # static assets + mock_expenses.json
dist/                      # Vite build output (gitignored)
```

## Firebase Setup

Already configured for `expenses-tracker-3352f` project (see `.firebaserc`). To use a different project:
1. Update `firebaserc` with new project ID
2. Fill in `src/firebase.js` config (get from Firebase Console)
3. Create Firestore database with composite index on `uid + date` for the range query in `useExpenses.js`
4. Apply Firestore rules: `firestore_general.rules` (permissive) or `firestore_private.rules` (per-user)

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
