import { ref } from "vue";
import { auth } from "../firebase";
import { DEMO_UID } from "../stores";

// `user` is the Firebase user, or a fake { uid: DEMO_UID, isDemo: true } in demo mode.
// Demo mode never signs into Firebase; its data lives in localStorage (see src/stores/).
export function useAuth() {
  const user = ref(null);
  const authError = ref("");

  auth.onAuthStateChanged((u) => {
    if (!u && user.value?.isDemo) return; // don't let Firebase's "signed out" kick out a demo session
    user.value = u;
  });

  function enterDemo() {
    authError.value = "";
    user.value = { uid: DEMO_UID, isDemo: true };
  }

  async function login(email, password) {
    authError.value = "";
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      authError.value = err.message;
    }
  }

  function logout() {
    if (user.value?.isDemo) user.value = null;
    else auth.signOut();
  }

  return { user, authError, login, logout, enterDemo };
}
