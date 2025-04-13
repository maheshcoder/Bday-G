// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from 'firebase/auth';


const firebaseConfig = {
    apiKey: "AIzaSyACCDqnlnjfaUHGgBNiUpldZUa72Nil7FM",
    authDomain: "birthadaygift-4e998.firebaseapp.com",
    projectId: "birthadaygift-4e998",
    storageBucket: "birthadaygift-4e998.firebasestorage.app",
    messagingSenderId: "186585309994",
    appId: "1:186585309994:web:cbad9981beb843a666b453",
    measurementId: "G-3E0HRMRGGH"
  };


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const auth = getAuth(app);
export { auth };