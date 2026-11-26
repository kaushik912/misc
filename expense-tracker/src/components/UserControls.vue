<script setup>
defineProps({ demo: Boolean });
defineEmits(["logout", "open-password", "reset-demo"]);
</script>

<template>
  <div class="user-controls">
    <button @click="$emit('logout')">{{ demo ? "Exit Demo" : "Logout" }}</button>
    <!-- Firebase-only actions are hidden in demo mode -->
    <button v-if="demo" class="password-btn" @click="$emit('reset-demo')">Reset Demo Data</button>
    <button v-else class="password-btn" @click="$emit('open-password')">Update Password</button>
  </div>
</template>
