// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBbTgPwzoyB4jMWmev1adZm78699fuf0uc",
  authDomain: "web-brondo.firebaseapp.com",
  projectId: "web-brondo",
  storageBucket: "web-brondo.firebasestorage.app",
  messagingSenderId: "404206887647",
  appId: "1:404206887647:web:79bd574db778616bf0ff6a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };