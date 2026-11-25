// Configuración del proyecto Firebase.
// Reemplace estos valores por los de su proyecto:
// Consola de Firebase > Configuración del proyecto > Tus apps > App web > SDK setup and configuration.
// Estos datos identifican el proyecto; no son credenciales de usuario. La seguridad
// de los datos la garantizan Firebase Authentication y las reglas de firestore.rules.
export const firebaseConfig = {
  apiKey: "AIzaSyCdxn8qkAttLOcBHaJozM7FwGHCEM5FsM8",
  authDomain: "mediyasurverde.firebaseapp.com",
  projectId: "mediyasurverde",
  storageBucket: "mediyasurverde.firebasestorage.app",
  messagingSenderId: "1076592533581",
  appId: "1:1076592533581:web:a8d4a46b5dd9a1ca59bc04"
};

// Dominio con el que se construye el correo interno de los pacientes.
// El paciente ingresa con tipo y número de documento; la app lo convierte en
// un correo para Firebase Authentication, por ejemplo: cc12345678@pacientes.mediyasurverde.app
export const PATIENT_EMAIL_DOMAIN = "pacientes.mediyasurverde.app";
