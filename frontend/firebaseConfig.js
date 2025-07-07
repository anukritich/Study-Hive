import { initializeApp } from 'firebase/app';
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAPAW97gJwJVWnidgO4qTD3Edlqaglg1W4",
  authDomain: "studyhive2026.firebaseapp.com",
  projectId: "studyhive2026",
  storageBucket: "studyhive2026.firebasestorage.app",
  messagingSenderId: "811066101787",
  appId: "1:811066101787:web:611c6324a9fdd148a228be"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export const auth = getAuth(app);
export { db };




