import { ref } from "vue";
import { auth } from "../firebase";

export function useAuth() {
  const user = ref(null);
  const authError = ref("");

  auth.onAuthStateChanged((u) => {
    user.value = u;
  });

  async function login(email, password) {
    authError.value = "";
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      authError.value = err.message;
    }
  }

  function logout() {
    auth.signOut();
  }

  return { user, authError, login, logout };
}
