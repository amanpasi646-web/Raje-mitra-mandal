import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAcmRzoVQf7nGg4dzzSFeeZk5erfdAv2kc",
  authDomain: "raje-mitra-mandal.firebaseapp.com",
  projectId: "raje-mitra-mandal",
  storageBucket: "raje-mitra-mandal.firebasestorage.app",
  messagingSenderId: "117119760527",
  appId: "1:117119760527:web:888b628b5ec8108fbb18fa",
  measurementId: "G-KBF9K6805B"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);