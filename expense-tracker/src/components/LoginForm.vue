<script setup>
import { ref } from "vue";

defineProps({ error: String });
const emit = defineEmits(["login"]);

const email = ref("");
const password = ref("");

function submit() {
  emit("login", email.value, password.value);
}
</script>

<template>
  <div id="loginSection">
    <h2>Login to Expense Tracker</h2>
    <input type="email" v-model="email" placeholder="Email" />
    <input type="password" v-model="password" placeholder="Password" @keyup.enter="submit" />
    <button @click="submit">Login</button>
    <p style="color: red;">{{ error }}</p>
  </div>
</template>
