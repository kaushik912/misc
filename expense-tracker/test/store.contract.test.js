// One contract, two stores. Every store-backed feature should add a case here so
// localStore (demo) and firestoreStore (real data) can't drift apart.
//
//   npm test          -> localStore only (fast, no emulator)
//   npm run test:all  -> localStore + firestoreStore against the Firestore emulator
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { createLocalStore } from "../src/stores/localStore";
import { createFirestoreStore } from "../src/stores/firestoreStore";

const EMULATOR = process.env.FIRESTORE_EMULATOR_HOST; // set by `firebase emulators:exec`
const PROJECT = "demo-test"; // demo-* projects are emulator-only, never real

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) };
}

const backends = [
  ["localStore", async () => createLocalStore({ storage: memoryStorage() })],
];

if (EMULATOR) {
  backends.push(["firestoreStore", async () => {
    const app = firebase.apps.find((a) => a.name === "contract") ?? firebase.initializeApp({ projectId: PROJECT }, "contract");
    const db = app.firestore();
    if (!db._contractEmulatorSet) {
      const [host, port] = EMULATOR.split(":");
      db.useEmulator(host, Number(port));
      db._contractEmulatorSet = true;
    }
    // Wipe emulator data between tests.
    await fetch(`http://${EMULATOR}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
    return createFirestoreStore(db, firebase.firestore.FieldValue);
  }]);
}

beforeAll(async () => {
  if (!EMULATOR) return;
  // These tests check the store contract, not security rules — open the emulator up.
  const rules = "rules_version='2'; service cloud.firestore { match /databases/{d}/documents { match /{p=**} { allow read, write: if true; } } }";
  await fetch(`http://${EMULATOR}/emulator/v1/projects/${PROJECT}:securityRules`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rules: { files: [{ name: "firestore.rules", content: rules }] } }),
  });
});

describe.each(backends)("%s contract", (_name, make) => {
  let store;
  beforeEach(async () => { store = await make(); });

  it("newId returns unique ids", () => {
    const a = store.newId("expenses");
    const b = store.newId("expenses");
    expect(a).toBeTruthy();
    expect(a).not.toBe(b);
  });

  it("listRange filters by uid and [start, end), sorted date desc", async () => {
    await store.create("expenses", "a", { uid: "u1", date: "2026-03-05", amount: "10" });
    await store.create("expenses", "b", { uid: "u1", date: "2026-03-20", amount: "20" });
    await store.create("expenses", "c", { uid: "u1", date: "2026-04-01", amount: "30" }); // end is exclusive
    await store.create("expenses", "d", { uid: "u1", date: "2026-02-28", amount: "40" }); // before start
    await store.create("expenses", "e", { uid: "u2", date: "2026-03-10", amount: "50" }); // other user

    const list = await store.listRange("expenses", "u1", "2026-03-01", "2026-04-01");
    expect(list.map((d) => d.id)).toEqual(["b", "a"]);
    expect(list[0]).toEqual({ id: "b", uid: "u1", date: "2026-03-20", amount: "20" });
  });

  it("collections are independent", async () => {
    await store.create("expenses", "x", { uid: "u1", date: "2026-03-05", amount: "1" });
    expect(await store.listRange("cardPayments", "u1", "2026-03-01", "2026-04-01")).toEqual([]);
  });

  it("update merges fields and keeps the rest", async () => {
    await store.create("expenses", "a", { uid: "u1", date: "2026-03-05", amount: "10", notes: "n" });
    await store.update("expenses", "a", { amount: "99" });
    expect(await store.getDoc("expenses", "a")).toEqual({ uid: "u1", date: "2026-03-05", amount: "99", notes: "n" });
  });

  it("update of a missing doc throws", async () => {
    await expect(store.update("expenses", "missing", { amount: "1" })).rejects.toThrow();
  });

  it("remove deletes; getDoc of missing returns null", async () => {
    await store.create("expenses", "a", { uid: "u1", date: "2026-03-05", amount: "10" });
    await store.remove("expenses", "a");
    expect(await store.getDoc("expenses", "a")).toBeNull();
  });

  it("addToArray upserts, merges extra fields, and dedupes", async () => {
    await store.addToArray("userCategories", "u1", "names", "Pets", { uid: "u1" });
    await store.addToArray("userCategories", "u1", "names", "Gifts", { uid: "u1" });
    await store.addToArray("userCategories", "u1", "names", "Pets", { uid: "u1" });
    expect(await store.getDoc("userCategories", "u1")).toEqual({ uid: "u1", names: ["Pets", "Gifts"] });
  });
});

describe("localStore extras", () => {
  it("seeds on first access, persists, and reset() re-seeds", async () => {
    const storage = memoryStorage();
    const seed = async () => ({ expenses: { s1: { uid: "demo", date: "2026-03-05", amount: "5" } } });
    const store = createLocalStore({ storage, seed });

    expect((await store.listRange("expenses", "demo", "2026-03-01", "2026-04-01")).map((d) => d.id)).toEqual(["s1"]);
    await store.remove("expenses", "s1");

    // A fresh instance on the same storage sees the persisted state, not the seed.
    const again = createLocalStore({ storage, seed });
    expect(await again.listRange("expenses", "demo", "2026-03-01", "2026-04-01")).toEqual([]);

    await again.reset();
    expect((await again.listRange("expenses", "demo", "2026-03-01", "2026-04-01")).map((d) => d.id)).toEqual(["s1"]);
  });
});
