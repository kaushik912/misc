<script setup>
import { ref, computed } from "vue";
import { CATEGORIES, CUSTOM, DEFAULT_CATEGORY, categoryKey } from "../categories";

// `expense` is {} for add mode, or an existing expense (with id) for edit mode.
// `savedCategories` are the user's previously saved custom categories.
const props = defineProps({ expense: Object, savedCategories: { type: Array, default: () => [] } });
const emit = defineEmits(["close", "save"]);

// Presets first, then saved customs (sorted), skipping any that collide with a preset.
const options = computed(() => {
  const presetKeys = new Set(CATEGORIES.map(categoryKey));
  const extras = props.savedCategories
    .filter((c) => !presetKeys.has(categoryKey(c)))
    .sort((a, b) => a.localeCompare(b));
  return [...CATEGORIES, ...extras];
});

const amount = ref(props.expense.amount ?? "");
const date = ref(props.expense.date ?? new Date().toISOString().split("T")[0]);
const notes = ref(props.expense.notes ?? "");

// Stored value is a plain string; anything outside the presets (and not the legacy default) is custom.
const initial = props.expense.category;
const isPreset = !initial || initial === DEFAULT_CATEGORY || options.value.includes(initial);
const selected = ref(!initial ? CATEGORIES[0] : isPreset ? initial : CUSTOM);
const customCategory = ref(isPreset ? "" : initial);

function submit() {
  emit("save", {
    id: props.expense.id ?? null,
    amount: amount.value,
    date: date.value,
    category: selected.value === CUSTOM ? customCategory.value.trim() : selected.value,
    notes: notes.value.trim(),
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
        <select v-model="selected">
          <option v-if="selected === DEFAULT_CATEGORY" :value="DEFAULT_CATEGORY">{{ DEFAULT_CATEGORY }}</option>
          <option v-for="c in options" :key="c" :value="c">{{ c }}</option>
          <option :value="CUSTOM">{{ CUSTOM }}</option>
        </select>
        <input v-if="selected === CUSTOM" type="text" v-model="customCategory" placeholder="Custom category" required />
        <input type="text" v-model="notes" placeholder="Notes (optional)" />
        <button type="submit">Save</button>
        <button type="button" @click="$emit('close')">Cancel</button>
      </form>
    </div>
  </div>
</template>
