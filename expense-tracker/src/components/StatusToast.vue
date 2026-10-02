<script setup>
// `toast` is null (hidden) or { type: "pending" | "success" | "error", message }.
defineProps({ toast: Object });
defineEmits(["close"]);
</script>

<template>
  <div v-if="toast" :class="['toast', toast.type]" role="status" aria-live="polite">
    <span class="toast-icon">{{ toast.type === "pending" ? "⏳" : toast.type === "success" ? "✓" : "⚠" }}</span>
    <span class="toast-message">{{ toast.message }}</span>
    <button class="toast-close" aria-label="Close" @click="$emit('close')">×</button>
  </div>
</template>
