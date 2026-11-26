import { db, firebase } from "../firebase";
import { createFirestoreStore } from "./firestoreStore";
import { createLocalStore } from "./localStore";

export const DEMO_UID = "demo";

export const firestoreStore = createFirestoreStore(db, firebase.firestore.FieldValue);

// Seeds demo data from the bundled mock JSONs, shifted so the newest mock month lands on
// the current month (the demo always opens on "this month" with data in it).
async function demoSeed() {
  const files = { expenses: "mock_expenses.json", cardPayments: "mock_card_payments.json" };
  const lists = await Promise.all(
    Object.values(files).map((f) => fetch(`${import.meta.env.BASE_URL}${f}`).then((r) => r.json()))
  );

  const latest = lists.flat().map((d) => d.date).sort().at(-1);
  const now = new Date();
  const offset = monthIndex(now.getFullYear(), now.getMonth() + 1) - monthIndex(...latest.split("-").map(Number));

  const seed = {};
  Object.keys(files).forEach((collection, i) => {
    seed[collection] = {};
    lists[i].forEach((d, j) => {
      seed[collection][`seed-${collection}-${j}`] = { ...d, uid: DEMO_UID, date: shiftDate(d.date, offset) };
    });
  });
  return seed;
}

function monthIndex(year, month) {
  return year * 12 + (month - 1);
}

function shiftDate(date, offset) {
  const [y, m, d] = date.split("-").map(Number);
  const idx = monthIndex(y, m) + offset;
  const year = Math.floor(idx / 12);
  const month = (idx % 12) + 1;
  const day = Math.min(d, new Date(year, month, 0).getDate());
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export const demoStore = createLocalStore({ storage: window.localStorage, seed: demoSeed });

export function storeFor(user) {
  return user?.uid === DEMO_UID ? demoStore : firestoreStore;
}
