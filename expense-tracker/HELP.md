## Overview

Expense tracker: Vue 3 (Vite) frontend + Firebase (Auth + Firestore + Hosting), free tier.

## Project structure

```
src/
  firebase.js              # firebase config, testMode flag, auth/db exports
  composables/
    useAuth.js              # login/logout, current user
    useExpenses.js           # month filter + Firestore CRUD
  components/
    LoginForm.vue
    UserControls.vue         # logout / update password buttons
    MonthNav.vue
    ExpenseList.vue
    ExpenseModal.vue         # shared add + edit modal
    PasswordModal.vue
  App.vue                    # wires the composables to the components
  main.js                    # mounts App into index.html's #app
public/
  mock_expenses.json         # sample data for testMode
  404.html
index.html                   # Vite entry point, do not add app markup here
firebase.json                # hosting public dir = dist
```

## Local development

```
npm install         # first time only, or after pulling dependency changes
npm run dev          # starts Vite dev server with hot reload
```

Open the printed `localhost` URL. Log in with a real Firebase Auth user, or
flip `testMode` to `true` in `src/firebase.js` to skip auth entirely and load
`public/mock_expenses.json` instead (read-only — add/edit/delete/password
actions are blocked with an alert in this mode).

To sanity-check the production build locally before deploying:

```
npm run build
npm run preview
```

## Making a change and shipping it

1. Edit the relevant component/composable under `src/`.
2. `npm run dev` and check it in the browser.
3. `npm run build` — outputs to `dist/` (gitignored).
4. `firebase deploy --only hosting` — ships `dist/`.
   - Drop `--only hosting` (just `firebase deploy`) if `firestore_*.rules`
     also changed, so rules get pushed too.

No manual cache-busting needed — Vite content-hashes the built JS/CSS
filenames (`assets/index-XXXXXXXX.js`), so every deploy is automatically a
cache-buster. (The old vanilla-JS version used a manual `?v=N` query param on
`app.js`; that's gone now that there's a build step.)

## One-time Firebase project setup

Only needed once per Firebase project (already done for
`expenses-tracker-3352f` — see `.firebaserc`):

- [Firebase Console](https://console.firebase.google.com) → create project.
- **Build → Authentication** → Sign-in method → enable **Email/Password**.
  - Signed-up users show up under the **Users** tab.
- **Build → Firestore Database** → create a `default` database.
  - Create composite indexes as Firestore/Chrome console prompts for them
    (the `uid` + `date` range query in `useExpenses.js` needs one).
  - Rules: `firestore_general.rules` (permissive/shared) vs
    `firestore_private.rules` (restrictive, per-user `uid` scoping).
  - Inspect data in the **Data** tab; `uid` on each expense doc is the
    logged-in user's Firebase Auth uid.
- CLI: `npm install -g firebase-tools`, `firebase login`, then this repo's
  `firebase.json` / `.firebaserc` already point at the right project — just
  run the deploy steps above.

## Free-tier limits (as of 2025)

- Firestore: 50K reads/day, 20K writes/day
- Auth: 10K verifications/month
- Hosting: 1 GB storage / 10 GB transfer

## Origin

This app started from a ChatGPT prompt: "expense tracker in Firebase free
tier, email+password auth, store date/amount/category transactions,
step-by-step setup." It was later rewritten from vanilla HTML/JS to Vue 3 +
Vite for component-based structure.
