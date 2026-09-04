<script setup>
defineProps({ label: String });
defineEmits(["prev", "next"]);
</script>

<template>
  <div class="filter-controls">
    <button class="month-nav-btn" @click="$emit('prev')">&lsaquo;</button>
    <span class="month-label">{{ label }}</span>
    <button class="month-nav-btn" @click="$emit('next')">&rsaquo;</button>
  </div>
</template>
