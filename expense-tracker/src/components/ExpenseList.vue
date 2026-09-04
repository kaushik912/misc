<script setup>
defineProps({ expenses: Array, total: Number });
defineEmits(["edit", "delete"]);
</script>

<template>
  <h3>Transactions</h3>
  <table>
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
          <button class="edit-btn" @click="$emit('edit', e.id)">Edit</button>
          <button class="delete-btn" @click="$emit('delete', e.id)">Delete</button>
        </td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <h4>Selected Month Total: Rs.<span>{{ total.toFixed(2) }}</span></h4>
  </div>
</template>
