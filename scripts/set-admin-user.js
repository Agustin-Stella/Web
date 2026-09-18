// scripts/set-admin-user.js
//
// Herramienta de mantenimiento: crea (o actualiza la contraseña de) un
// usuario de Firebase Auth y le asigna el custom claim admin=true, que es
// lo que exige admin.html para dejar entrar al panel.
//
// NO se commitea ninguna credencial acá: la service account key se pasa
// por variable de entorno y se lee de un archivo local que vos bajás de
// Firebase Console.
//
// Uso:
//   GOOGLE_APPLICATION_CREDENTIALS="C:\ruta\a\serviceAccountKey.json" \
//     node scripts/set-admin-user.js tu@email.com "unaPasswordNueva"
//
// En PowerShell:
//   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\ruta\a\serviceAccountKey.json"
//   node scripts/set-admin-user.js tu@email.com "unaPasswordNueva"

const admin = require("firebase-admin");

async function main() {
  const [, , email, password] = process.argv;

  if (!email || !password) {
    console.error("Uso: node set-admin-user.js <email> <password>");
    process.exit(1);
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error(
      "Falta GOOGLE_APPLICATION_CREDENTIALS apuntando al JSON de la service account.\n" +
      "Bajalo desde Firebase Console -> Configuración del proyecto -> Cuentas de servicio -> Generar nueva clave privada."
    );
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });

  let user;
  try {
    user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, { password });
    console.log(`Usuario existente actualizado: ${email} (uid: ${user.uid})`);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      user = await admin.auth().createUser({ email, password });
      console.log(`Usuario creado: ${email} (uid: ${user.uid})`);
    } else {
      throw error;
    }
  }

  await admin.auth().setCustomUserClaims(user.uid, { admin: true });
  console.log("Claim admin=true asignado correctamente.");
  console.log("Importante: si ese usuario ya tenía una sesión abierta, tiene que volver a loguearse para que el claim se refleje.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
  });
