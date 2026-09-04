<script setup>
import { ref } from "vue";
import { auth, firebase } from "../firebase";

const emit = defineEmits(["close"]);

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const msg = ref("");

async function submit() {
  msg.value = "";

  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    msg.value = "All fields are required.";
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    msg.value = "New passwords do not match.";
    return;
  }
  if (newPassword.value.length < 6) {
    msg.value = "New password must be at least 6 characters.";
    return;
  }

  try {
    const user = auth.currentUser;
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword.value);
    await user.reauthenticateWithCredential(credential);
    await user.updatePassword(newPassword.value);

    alert("Password updated successfully!");
    emit("close");
  } catch (err) {
    msg.value = err.code === "auth/wrong-password" ? "Current password is incorrect." : err.message;
  }
}
</script>

<template>
  <div class="modal">
    <div class="modal-content">
      <h3>Update Password</h3>
      <p style="color: red;">{{ msg }}</p>
      <input type="password" v-model="currentPassword" placeholder="Current Password" required />
      <input type="password" v-model="newPassword" placeholder="New Password" required />
      <input type="password" v-model="confirmPassword" placeholder="Confirm New Password" required />
      <div style="margin-top: 15px;">
        <button @click="submit">Update Password</button>
        <button type="button" @click="$emit('close')">Cancel</button>
      </div>
    </div>
  </div>
</template>
