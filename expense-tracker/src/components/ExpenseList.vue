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
  <p v-if="isLoading" class="loading-text">Loading…</p>
  <table v-else>
    <thead>
      <tr>
        <th>Date</th>
        <th class="sortable" @click="toggleAmountSort">
          Amount (Rs.) {{ amountSort === "asc" ? "▲" : amountSort === "desc" ? "▼" : "⇅" }}
        </th>
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
