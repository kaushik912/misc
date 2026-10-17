<script setup>
import { ref } from "vue";

// `payment` is {} for add mode, or an existing payment (with id) for edit mode.
const props = defineProps({ payment: Object, cards: Array });
const emit = defineEmits(["close", "save"]);

const card = ref(props.payment.card ?? props.cards[0] ?? "");
const amount = ref(props.payment.amount ?? "");
const date = ref(props.payment.date ?? new Date().toISOString().split("T")[0]);
const note = ref(props.payment.note ?? "");

function submit() {
  emit("save", {
    id: props.payment.id ?? null,
    card: card.value.trim(),
    amount: amount.value,
    date: date.value,
    note: note.value.trim(),
  });
}
</script>

<template>
  <div class="modal">
    <div class="modal-content">
      <h3>{{ payment.id ? "Edit Card Payment" : "Add Card Payment" }}</h3>
      <form @submit.prevent="submit">
        <input type="text" v-model="card" list="card-options" placeholder="Card (e.g. HDFC)" required />
        <datalist id="card-options">
          <option v-for="c in cards" :key="c" :value="c" />
        </datalist>
        <input type="number" v-model="amount" placeholder="Amount" required />
        <input type="date" v-model="date" required />
        <input type="text" v-model="note" placeholder="Note (optional)" />
        <button type="submit">Save</button>
        <button type="button" @click="$emit('close')">Cancel</button>
      </form>
    </div>
  </div>
</template>
