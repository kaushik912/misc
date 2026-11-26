import { ref, computed } from "vue";
import { storeFor } from "../stores";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

// Manages the loaded expense list, the active month filter, and CRUD via the user's store
// (Firestore for real users, localStorage for the demo user — see src/stores/).
// `userRef` is a ref to the current user (or null).
// `collection` lets the same logic back other date-keyed lists (e.g. card payments).
export function useExpenses(userRef, collection = "expenses") {
  const expenses = ref([]);
  const currentMonth = ref(null); // { year, month }
  const isLoading = ref(false);
  const loadError = ref(null); // message of the last failed month load, else null
  const monthCache = new Map(); // "year-month" -> expenses array

  const monthLabel = computed(() =>
    currentMonth.value
      ? `${MONTH_NAMES[currentMonth.value.month - 1]} ${currentMonth.value.year}`
      : ""
  );

  const total = computed(() =>
    expenses.value.reduce((sum, e) => sum + parseFloat(e.amount), 0)
  );

  async function loadExpenses() {
    const user = userRef.value;
    if (!user || !currentMonth.value) return;

    const { year, month } = currentMonth.value;
    const cacheKey = `${year}-${month}`;

    if (monthCache.has(cacheKey)) {
      expenses.value = monthCache.get(cacheKey);
      return;
    }

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

    isLoading.value = true;
    loadError.value = null;
    try {
      const result = await storeFor(user).listRange(collection, user.uid, startDate, endDate);
      monthCache.set(cacheKey, result);
      expenses.value = result;
    } catch (err) {
      // Don't leave the previous month's rows on screen under the wrong label.
      expenses.value = [];
      loadError.value = err.message;
    } finally {
      isLoading.value = false;
    }
  }

  // Called on every login; clears the cache so one user's (or the demo's) data never shows for another.
  function initMonth() {
    monthCache.clear();
    expenses.value = [];
    const now = new Date();
    currentMonth.value = { year: now.getFullYear(), month: now.getMonth() + 1 };
    loadExpenses();
  }

  function prevMonth() {
    let { year, month } = currentMonth.value;
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    currentMonth.value = { year, month };
    loadExpenses();
  }

  function nextMonth() {
    let { year, month } = currentMonth.value;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    currentMonth.value = { year, month };
    loadExpenses();
  }

  function inCurrentMonth(date) {
    const { year, month } = currentMonth.value;
    return date.startsWith(`${year}-${String(month).padStart(2, "0")}-`);
  }

  // Replaces the visible list and its cache entry; other months' caches are dropped.
  function setLocal(list) {
    const { year, month } = currentMonth.value;
    list.sort((a, b) => b.date.localeCompare(a.date));
    monthCache.clear();
    monthCache.set(`${year}-${month}`, list);
    expenses.value = list;
  }

  // Optimistic: updates the UI immediately, rolls back and rethrows if the write fails.
  async function saveExpense({ id, ...fields }) {
    const user = userRef.value;
    if (!user) return;

    const store = storeFor(user);
    const previous = expenses.value;
    const docId = id ?? store.newId(collection);
    const { date } = fields;
    const doc = { id: docId, uid: user.uid, ...fields };
    const rest = previous.filter((e) => e.id !== docId);
    setLocal(inCurrentMonth(date) ? [...rest, doc] : rest);

    try {
      if (id) await store.update(collection, docId, fields);
      else await store.create(collection, docId, { uid: user.uid, ...fields });
    } catch (err) {
      setLocal([...previous]);
      throw err;
    }
  }

  async function deleteExpense(id) {
    const previous = expenses.value;
    setLocal(previous.filter((e) => e.id !== id));
    try {
      await storeFor(userRef.value).remove(collection, id);
    } catch (err) {
      setLocal([...previous]);
      throw err;
    }
  }

  return {
    expenses,
    currentMonth,
    monthLabel,
    total,
    isLoading,
    loadError,
    initMonth,
    prevMonth,
    nextMonth,
    saveExpense,
    deleteExpense,
  };
}
