import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// Configuración de Firebase (cliente web)
const firebaseConfig = {
  apiKey: "AIzaSyBbTgPwzoyB4jMWmev1adZm78699fuf0uc",
  authDomain: "web-brondo.firebaseapp.com",
  projectId: "web-brondo",
  storageBucket: "web-brondo.firebasestorage.app",
  messagingSenderId: "404206887647",
  appId: "1:404206887647:web:79bd574db778616bf0ff6a",
  measurementId: "G-YY5ZWDFDFE"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Analytics puede lanzar si no está disponible en el entorno; capturamos el error
let analytics;
try {
  analytics = getAnalytics(app);
} catch (e) {
  // No crítico en entorno de desarrollo sin permisos/soporte
  console.warn('Firebase Analytics no inicializado:', e.message || e);
}

// Exportar instancia de Firestore para usarla en la app
const db = getFirestore(app);

export { app, analytics, db };
