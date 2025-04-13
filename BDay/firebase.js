import firebase from 'firebase/app';
import 'firebase/firestore';  // For Firestore

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyACCDqnlnjfaUHGgBNiUpldZUa72Nil7FM",
    authDomain: "birthadaygift-4e998.firebaseapp.com",
    projectId: "birthadaygift-4e998",
    storageBucket: "birthadaygift-4e998.firebasestorage.app",
    messagingSenderId: "186585309994",
    appId: "1:186585309994:web:cbad9981beb843a666b453",
    measurementId: "G-3E0HRMRGGH"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
