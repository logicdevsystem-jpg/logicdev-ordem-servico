/* ============================================================
   LogicDev SYSTEM — AOS
   firebase-config.js
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyDdGvDt5bckocFyAkNSojTWGsA1PU7gYKw",
  authDomain: "aos-logicdev.firebaseapp.com",
  projectId: "aos-logicdev",
  storageBucket: "aos-logicdev.firebasestorage.app",
  messagingSenderId: "609874644265",
  appId: "1:609874644265:web:bd5dc3a5344473b37fb38"
};

firebase.initializeApp(firebaseConfig);
const AUTH = firebase.auth();
const FIRESTORE = firebase.firestore();