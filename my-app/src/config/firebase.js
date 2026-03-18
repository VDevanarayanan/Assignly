import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAaHL0g0jswvZvlCvSSbfsOnXR0ObaFgjE",
  authDomain: "taskly-app-vdev.firebaseapp.com",
  projectId: "taskly-app-vdev",
  storageBucket: "taskly-app-vdev.firebasestorage.app",
  messagingSenderId: "962619757124",
  appId: "1:962619757124:web:b36500dcbdac16f82ce211"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();