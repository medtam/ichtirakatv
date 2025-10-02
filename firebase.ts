import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBsL8pUR4ygIV4_WUpE8-06-rqcpSFND4g",
  authDomain: "ichtirak-app.firebaseapp.com",
  projectId: "ichtirak-app",
  storageBucket: "ichtirak-app.firebasestorage.app",
  messagingSenderId: "686012843393",
  appId: "1:686012843393:web:8040e987181f3ac9bcd480",
  measurementId: "G-C510BPS9JV"
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
