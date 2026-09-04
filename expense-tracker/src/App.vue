<script setup>
import { ref, computed, watch } from "vue";
import { testMode } from "./firebase";
import { useAuth } from "./composables/useAuth";
import { useExpenses } from "./composables/useExpenses";
import LoginForm from "./components/LoginForm.vue";
import UserControls from "./components/UserControls.vue";
import MonthNav from "./components/MonthNav.vue";
import ExpenseList from "./components/ExpenseList.vue";
import ExpenseModal from "./components/ExpenseModal.vue";
import PasswordModal from "./components/PasswordModal.vue";

const { user, authError, login, logout } = useAuth();
const {
  expenses, monthLabel, total,
  loadMockExpenses, initMonth, prevMonth, nextMonth, saveExpense, deleteExpense,
} = useExpenses(user);

const editingExpense = ref(null); // null = closed, {} = add mode, {id,...} = edit mode
const showPasswordModal = ref(false);

const loggedIn = computed(() => testMode || !!user.value);

if (testMode) {
  loadMockExpenses();
} else {
  watch(user, (u) => {
    if (u) initMonth();
  }, { immediate: true });
}

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

async function onSave(payload) {
  await saveExpense(payload);
  editingExpense.value = null;
}

async function onDelete(id) {
  if (requiresLive("Deleting expenses")) return;
  if (confirm("Are you sure you want to delete this expense?")) await deleteExpense(id);
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
    <MonthNav :label="monthLabel" @prev="prevMonth" @next="nextMonth" />
    <ExpenseList :expenses="expenses" :total="total" @edit="openEdit" @delete="onDelete" />
    <button class="add-btn" @click="openAdd">+ Add Expense</button>

    <ExpenseModal v-if="editingExpense" :expense="editingExpense" @close="editingExpense = null" @save="onSave" />
    <PasswordModal v-if="showPasswordModal" @close="showPasswordModal = false" />
  </div>
</template>
