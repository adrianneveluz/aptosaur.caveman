import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDSnP6nCYGbLPnIaoZbQIY9ORY5lZmRBWw",
  authDomain: "aptosaurs-5f670.firebaseapp.com",
  projectId: "aptosaurs-5f670",
  storageBucket: "aptosaurs-5f670.firebasestorage.app",
  messagingSenderId: "654440117315",
  appId: "1:654440117315:web:8a8535ce13b62b7beb10f6",
  measurementId: "G-2NRYPNXL29"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };