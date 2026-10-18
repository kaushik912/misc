<script setup>
import { ref, computed, watch } from "vue";
import { testMode } from "./firebase";
import { useAuth } from "./composables/useAuth";
import { useExpenses } from "./composables/useExpenses";
import LoginForm from "./components/LoginForm.vue";
import UserControls from "./components/UserControls.vue";
import MonthNav from "./components/MonthNav.vue";
import ExpenseList from "./components/ExpenseList.vue";
import CardPaymentList from "./components/CardPaymentList.vue";
import CardPaymentModal from "./components/CardPaymentModal.vue";
import ExpenseModal from "./components/ExpenseModal.vue";
import PasswordModal from "./components/PasswordModal.vue";
import StatusToast from "./components/StatusToast.vue";

const { user, authError, login, logout } = useAuth();
const {
  expenses, monthLabel, total, isLoading, loadError,
  loadMockExpenses, initMonth, prevMonth, nextMonth, saveExpense, deleteExpense,
} = useExpenses(user);

const payments = useExpenses(user, "cardPayments", "mock_card_payments.json");
const view = ref("expenses"); // "expenses" | "cards"
const isCards = computed(() => view.value === "cards");
const editingPayment = ref(null);
const cardNames = computed(() => [...new Set(payments.expenses.value.map((p) => p.card))]);

const editingExpense = ref(null); // null = closed, {} = add mode, {id,...} = edit mode
const showPasswordModal = ref(false);

const toast = ref(null); // null or { type: "pending" | "success" | "error", message }
let toastTimer = null;
let toastSeq = 0;

function showToast(type, message, autoCloseMs = 0) {
  clearTimeout(toastTimer);
  toast.value = { type, message };
  if (autoCloseMs) toastTimer = setTimeout(() => (toast.value = null), autoCloseMs);
}

// Runs a background write, reflecting pending/success/error in the toast.
// Only the latest operation's result updates the toast.
async function withToast(work, { pending, success, failure }) {
  const seq = ++toastSeq;
  showToast("pending", pending);
  try {
    await work();
    if (seq === toastSeq) showToast("success", success, 3000);
  } catch (err) {
    showToast("error", `${failure}: ${err.message}`);
  }
}

for (const [name, src] of [["expenses", { loadError }], ["card payments", payments]]) {
  watch(src.loadError, (msg) => {
    if (msg) showToast("error", `Failed to load ${name}: ${msg}`);
  });
}

const loggedIn = computed(() => testMode || !!user.value);

if (testMode) {
  loadMockExpenses();
  payments.loadMockExpenses();
} else {
  watch(user, (u) => {
    if (u) {
      initMonth();
      payments.initMonth();
    }
  }, { immediate: true });
}

// Month nav drives whichever view is active.
function prev() { (isCards.value ? payments : { prevMonth }).prevMonth(); }
function next() { (isCards.value ? payments : { nextMonth }).nextMonth(); }

// Blocks an action while in test mode, alerting why. Returns true if blocked.
function requiresLive(actionLabel) {
  if (testMode) {
    alert(`${actionLabel} is disabled in test mode.`);
    return true;
  }
  return false;
}

function openAdd() {
  if (requiresLive("Adding expenses")) return;
  editingExpense.value = {};
}

function openEdit(id) {
  if (requiresLive("Editing expenses")) return;
  editingExpense.value = expenses.value.find((e) => e.id === id);
}

function onSave(payload) {
  editingExpense.value = null; // close right away; list updates optimistically
  return withToast(() => saveExpense(payload), {
    pending: "Saving expense…",
    success: "Expense saved",
    failure: "Failed to save expense",
  });
}

function onDelete(id) {
  if (requiresLive("Deleting expenses")) return;
  if (!confirm("Are you sure you want to delete this expense?")) return;
  return withToast(() => deleteExpense(id), {
    pending: "Deleting expense…",
    success: "Expense deleted",
    failure: "Failed to delete expense",
  });
}

function openAddPayment() {
  if (requiresLive("Adding card payments")) return;
  editingPayment.value = {};
}

function openEditPayment(id) {
  if (requiresLive("Editing card payments")) return;
  editingPayment.value = payments.expenses.value.find((p) => p.id === id);
}

function onSavePayment(payload) {
  editingPayment.value = null;
  return withToast(() => payments.saveExpense(payload), {
    pending: "Saving payment…",
    success: "Payment saved",
    failure: "Failed to save payment",
  });
}

function onDeletePayment(id) {
  if (requiresLive("Deleting card payments")) return;
  if (!confirm("Are you sure you want to delete this payment?")) return;
  return withToast(() => payments.deleteExpense(id), {
    pending: "Deleting payment…",
    success: "Payment deleted",
    failure: "Failed to delete payment",
  });
}

function openPassword() {
  if (requiresLive("Password update")) return;
  showPasswordModal.value = true;
}
</script>

<template>
  <LoginForm v-if="!loggedIn" :error="authError" @login="login" />

  <div v-else id="appSection">
    <h2>Expense Tracker</h2>
    <UserControls @logout="logout" @open-password="openPassword" />
    <div class="view-tabs">
      <button :class="{ active: !isCards }" @click="view = 'expenses'">Expenses</button>
      <button :class="{ active: isCards }" @click="view = 'cards'">Card Payments</button>
    </div>
    <MonthNav :label="isCards ? payments.monthLabel.value : monthLabel" @prev="prev" @next="next" />

    <template v-if="!isCards">
      <button class="add-btn" @click="openAdd">+ Add Expense</button>
      <div class="totals">
        <h4>Selected Month Total: Rs.<span>{{ total.toFixed(2) }}</span></h4>
      </div>
      <ExpenseList :expenses="expenses" :is-loading="isLoading" @edit="openEdit" @delete="onDelete" />
    </template>

    <template v-else>
      <button class="add-btn" @click="openAddPayment">+ Add Card Payment</button>
      <div class="totals card-totals">
        <h4>Paid This Month: Rs.<span>{{ payments.total.value.toFixed(2) }}</span></h4>
      </div>
      <CardPaymentList :payments="payments.expenses.value" :is-loading="payments.isLoading.value"
        @edit="openEditPayment" @delete="onDeletePayment" />
    </template>

    <CardPaymentModal v-if="editingPayment" :payment="editingPayment" :cards="cardNames"
      @close="editingPayment = null" @save="onSavePayment" />
    <ExpenseModal v-if="editingExpense" :expense="editingExpense" @close="editingExpense = null" @save="onSave" />
    <PasswordModal v-if="showPasswordModal" @close="showPasswordModal = false" />
    <StatusToast :toast="toast" @close="toast = null" />
  </div>
</template>
