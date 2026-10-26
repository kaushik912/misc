import { ref } from "vue";
import { db, firebase } from "../firebase";
import { CATEGORIES, categoryKey } from "../categories";

// Saved custom categories, stored as one doc `userCategories/{uid}` -> { names: [...] }.
// `userRef` is a ref to the current firebase user (or null).
export function useCategories(userRef) {
  const saved = ref([]);

  async function loadCategories() {
    const user = userRef.value;
    if (!user) return;
    try {
      const snap = await db.collection("userCategories").doc(user.uid).get();
      saved.value = snap.exists ? snap.data().names ?? [] : [];
    } catch (err) {
      console.error("Failed to load saved categories", err);
    }
  }

  // Adds `name` if it's not a preset or already saved (case-insensitive). Optimistic; failures are non-fatal.
  async function addCategory(name) {
    const user = userRef.value;
    const trimmed = (name || "").trim();
    if (!user || !trimmed) return;

    const known = new Set([...CATEGORIES, ...saved.value].map(categoryKey));
    if (known.has(categoryKey(trimmed))) return;

    saved.value = [...saved.value, trimmed];
    try {
      await db.collection("userCategories").doc(user.uid).set(
        { uid: user.uid, names: firebase.firestore.FieldValue.arrayUnion(trimmed) },
        { merge: true }
      );
    } catch (err) {
      saved.value = saved.value.filter((n) => n !== trimmed);
      console.error("Failed to save category", err);
    }
  }

  return { saved, loadCategories, addCategory };
}
