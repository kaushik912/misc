import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

const firebaseConfig = {
  apiKey: "<FILL>",
  authDomain: "expenses-tracker-3352f.firebaseapp.com",
  projectId: "<FILL>",
  storageBucket: "expenses-tracker-3352f.firebasestorage.app",
  messagingSenderId: "924419386388",
  appId: "1:924419386388:web:dd7901678415da486fcb01",
  measurementId: "G-K83YZ0TS8R",
};

// Toggle this to use mock data instead of Firebase
export const testMode = false;

firebase.initializeApp(firebaseConfig);

export { firebase };
export const auth = firebase.auth();
export const db = firebase.firestore();
