<script setup>
defineEmits(["logout", "open-password"]);
</script>

<template>
  <div class="user-controls">
    <button @click="$emit('logout')">Logout</button>
    <button class="password-btn" @click="$emit('open-password')">Update Password</button>
  </div>
</template>
