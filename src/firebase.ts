import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAY_8iWWGnsSc-KsUw4eaQWO3NIBiSd-Z0",
  authDomain: "cafestrello.firebaseapp.com",
  databaseURL:
    "https://cafestrello-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cafestrello",
  storageBucket: "cafestrello.firebasestorage.app",
  messagingSenderId: "428396133641",
  appId: "1:428396133641:web:c5b83f448954fe6278a7d8",
  measurementId: "G-PKN23S7L2E",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { db, auth, googleProvider };
