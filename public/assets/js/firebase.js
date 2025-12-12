// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js";

import firebaseConfig from "./firebase-config.js";

// Inicializar Firebase una sola vez
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

let analytics;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.warn("Firebase Analytics no inicializado:", e.message || e);
}

export { app, analytics, db, storage };
