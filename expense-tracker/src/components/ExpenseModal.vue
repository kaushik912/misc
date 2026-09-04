<script setup>
import { ref } from "vue";

// `expense` is {} for add mode, or an existing expense (with id) for edit mode.
const props = defineProps({ expense: Object });
const emit = defineEmits(["close", "save"]);

const amount = ref(props.expense.amount ?? "");
const date = ref(props.expense.date ?? new Date().toISOString().split("T")[0]);
const category = ref(props.expense.category ?? "");

function submit() {
  emit("save", {
    id: props.expense.id ?? null,
    amount: amount.value,
    date: date.value,
    category: category.value,
  });
}
</script>

<template>
  <div class="modal">
    <div class="modal-content">
      <h3>{{ expense.id ? "Edit Expense" : "Add Expense" }}</h3>
      <form @submit.prevent="submit">
        <input type="number" v-model="amount" placeholder="Amount" required />
        <input type="date" v-model="date" required />
        <input type="text" v-model="category" placeholder="Category" required />
        <button type="submit">Save</button>
        <button type="button" @click="$emit('close')">Cancel</button>
      </form>
    </div>
  </div>
</template>
