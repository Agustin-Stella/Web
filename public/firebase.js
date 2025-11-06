import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js";

// Configuración de Firebase (cliente web)
const firebaseConfig = {
  apiKey: "AIzaSyBbTgPwzoyB4jMWmev1adZm78699fuf0uc",
  authDomain: "web-brondo.firebaseapp.com",
  projectId: "web-brondo",
  storageBucket: "web-brondo.appspot.com",
  messagingSenderId: "404206887647",
  appId: "1:404206887647:web:79bd574db778616bf0ff6a",
  measurementId: "G-YY5ZWDFDFE"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar instancias para usar en la app
export const db = getFirestore(app);
export const storage = getStorage(app);
