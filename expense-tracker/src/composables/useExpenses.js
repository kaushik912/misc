import { ref, computed } from "vue";
import { db } from "../firebase";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

// Manages the loaded expense list, the active month filter, and CRUD against Firestore.
// `userRef` is a ref to the current firebase user (or null).
export function useExpenses(userRef) {
  const expenses = ref([]);
  const currentMonth = ref(null); // { year, month }

  const monthLabel = computed(() =>
    currentMonth.value
      ? `${MONTH_NAMES[currentMonth.value.month - 1]} ${currentMonth.value.year}`
      : ""
  );

  const total = computed(() =>
    expenses.value.reduce((sum, e) => sum + parseFloat(e.amount), 0)
  );

  async function loadMockExpenses() {
    const res = await fetch("mock_expenses.json");
    const data = await res.json();
    currentMonth.value = { year: 2025, month: 8 };
    expenses.value = data.map((e, i) => ({ id: `mock-id-${i}`, ...e }));
  }

  async function loadExpenses() {
    const user = userRef.value;
    if (!user || !currentMonth.value) return;

    const { year, month } = currentMonth.value;
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

    const snapshot = await db.collection("expenses")
      .where("uid", "==", user.uid)
      .where("date", ">=", startDate)
      .where("date", "<", endDate)
      .orderBy("date", "desc")
      .get();

    expenses.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  function initMonth() {
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

  async function saveExpense({ id, amount, date, category }) {
    const user = userRef.value;
    if (!user) return;

    if (id) {
      await db.collection("expenses").doc(id).update({ amount, date, category });
    } else {
      await db.collection("expenses").add({ uid: user.uid, amount, date, category });
    }
    await loadExpenses();
  }

  async function deleteExpense(id) {
    await db.collection("expenses").doc(id).delete();
    await loadExpenses();
  }

  return {
    expenses,
    currentMonth,
    monthLabel,
    total,
    loadMockExpenses,
    initMonth,
    prevMonth,
    nextMonth,
    saveExpense,
    deleteExpense,
  };
}
