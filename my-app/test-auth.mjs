import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAaHL0g0jswvZvlCvSSbfsOnXR0ObaFgjE",
  authDomain: "taskly-app-vdev.firebaseapp.com",
  projectId: "taskly-app-vdev",
  storageBucket: "taskly-app-vdev.firebasestorage.app",
  messagingSenderId: "962619757124",
  appId: "1:962619757124:web:b36500dcbdac16f82ce211"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function test() {
  try {
    const cred = await createUserWithEmailAndPassword(auth, "testuser8999@example.com", "Password123!");
    console.log("SUCCESS!", cred.user.uid);
  } catch (err) {
    console.error("ERROR CREATING:", err.code, err.message);
  }
  process.exit(0);
}

test();
