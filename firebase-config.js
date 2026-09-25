// ================================
// ASILI COFFEE NURSERY
// FIREBASE CONFIGURATION
// ================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getFirestore
} from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {

   apiKey: "AIzaSyCjTLpa2nV7zB2v-aPeOQTgXFiTcydW_Xo",
  authDomain: "asili-coffee-nursery.firebaseapp.com",
  projectId: "asili-coffee-nursery",
  storageBucket: "asili-coffee-nursery.firebasestorage.app",
  messagingSenderId: "642283668896",
  appId: "1:642283668896:web:6db30ade7a714c193c50c5"

};


// Initialize Firebase

const app =
    initializeApp(firebaseConfig);

const db =
    getFirestore(app);    


// Make Firebase app available

window.asiliFirebase = app;
window.asiliDB = db;