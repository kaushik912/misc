<script setup>
defineProps({ payments: Array, isLoading: Boolean });
defineEmits(["edit", "delete"]);
</script>

<template>
  <h3>Card Payments</h3>
  <p v-if="isLoading" class="loading-text">Loading…</p>
  <table v-else>
    <thead>
      <tr>
        <th>Date</th>
        <th>Card</th>
        <th>Amount (Rs.)</th>
        <th>Note</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="p in payments" :key="p.id">
        <td>{{ p.date }}</td>
        <td>{{ p.card }}</td>
        <td>{{ parseFloat(p.amount).toFixed(2) }}</td>
        <td>{{ p.note }}</td>
        <td>
          <button class="edit-btn" title="Edit" aria-label="Edit" @click="$emit('edit', p.id)">✏️</button>
          <button class="delete-btn" title="Delete" aria-label="Delete" @click="$emit('delete', p.id)">🗑️</button>
        </td>
      </tr>
    </tbody>
  </table>
</template>
