<script setup>
defineProps({ expenses: Array, isLoading: Boolean });
defineEmits(["edit", "delete"]);
</script>

<template>
  <h3>Transactions</h3>
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
      <tr v-for="e in expenses" :key="e.id">
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
