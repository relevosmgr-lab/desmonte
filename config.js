// config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCmoEIcKX3AYAE3IMepAyatcVlKDVe5Hfo",
  authDomain: "desmonte-eb7cf.firebaseapp.com",
  projectId: "desmonte-eb7cf",
  storageBucket: "desmonte-eb7cf.firebasestorage.app",
  messagingSenderId: "727279216158",
  appId: "1:727279216158:web:1426271888b2a95d34f00f",
  measurementId: "G-P2V24MXFWS"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export { 
    auth, db, provider, signInWithPopup, 
    doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, orderBy
};