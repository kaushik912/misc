<script setup>
import { ref, computed } from "vue";

const props = defineProps({ expenses: Array, isLoading: Boolean });
defineEmits(["edit", "delete"]);

const amountSort = ref(null); // null = default (date desc), "asc", "desc"

const sortedExpenses = computed(() => {
  if (!amountSort.value) return props.expenses;
  const dir = amountSort.value === "asc" ? 1 : -1;
  return [...props.expenses].sort((a, b) => dir * (parseFloat(a.amount) - parseFloat(b.amount)));
});

// Cycles: default -> ascending -> descending -> default.
function toggleAmountSort() {
  amountSort.value = amountSort.value === null ? "asc" : amountSort.value === "asc" ? "desc" : null;
}
</script>

<template>
  <h3>Transactions</h3>
  <button type="button" class="sort-btn" @click="toggleAmountSort">
    Sort by amount
    <svg class="sort-icon" viewBox="0 0 10 14" width="10" height="14" aria-hidden="true">
      <path d="M5 0L10 6H0z" :opacity="amountSort === 'asc' ? 1 : 0.25" />
      <path d="M5 14L0 8h10z" :opacity="amountSort === 'desc' ? 1 : 0.25" />
    </svg>
  </button>
  <p v-if="isLoading" class="loading-text">Loading…</p>
  <table v-else>
    <thead>
      <tr>
        <th>Date</th>
        <th>Amount (Rs.)</th>
        <th>Category</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="e in sortedExpenses" :key="e.id">
        <td>{{ e.date }}</td>
        <td>{{ parseFloat(e.amount).toFixed(2) }}</td>
        <td>{{ e.category }}</td>
        <td>
          <button class="edit-btn" title="Edit" aria-label="Edit" @click="$emit('edit', e.id)">✏️</button>
          <button class="delete-btn" title="Delete" aria-label="Delete" @click="$emit('delete', e.id)">🗑️</button>
        </td>
      </tr>
    </tbody>
  </table>
</template>
