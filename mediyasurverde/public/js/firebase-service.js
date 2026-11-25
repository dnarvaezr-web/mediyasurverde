// Capa de acceso a Firebase (Authentication + Cloud Firestore).
// Es el único archivo que usa el SDK de Firebase; app.js trabaja con window.FB.
//
// La app del paciente y el portal del operador usan dos instancias separadas de
// Firebase. Así ambas sesiones pueden estar abiertas en la misma página (vista de
// prototipo) o en dispositivos distintos sin que una cierre la otra.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  initializeAuth,
  inMemoryPersistence,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, PATIENT_EMAIL_DOMAIN } from "./firebase-config.js";

const CANAL_APP = "App móvil";
const CANAL_WHATSAPP_ASISTIDO = "WhatsApp (asistido)";

const configured = !Object.values(firebaseConfig).some(value => String(value).includes("REEMPLAZAR"));

function createContext(name){
  const app = initializeApp(firebaseConfig, name);
  // Persistencia en memoria: la sesión no se guarda en el navegador.
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  const db = getFirestore(app);
  return { auth, db, profile: null };
}

const contexts = configured
  ? { paciente: createContext("mediya-paciente"), portal: createContext("mediya-portal") }
  : null;

class AccessError extends Error {
  constructor(code){
    super(code);
    this.code = code;
  }
}

function ctx(kind){
  if(!contexts) throw new AccessError("no-configurado");
  return contexts[kind];
}

function patientEmail(documentType, documentNumber){
  return `${String(documentType).toLowerCase()}${String(documentNumber).replace(/\D/g, "")}@${PATIENT_EMAIL_DOMAIN}`;
}

function toMillis(value){
  if(!value) return null;
  if(typeof value.toMillis === "function") return value.toMillis();
  return Number(value) || null;
}

function mapRequest(snapshot){
  const data = snapshot.data({ serverTimestamps: "estimate" });
  return {
    id: snapshot.id,
    codigo: `SOL-${snapshot.id.slice(0, 6).toUpperCase()}`,
    pacienteUid: data.pacienteUid,
    pacienteNombre: data.pacienteNombre || "",
    pacienteDocumento: data.pacienteDocumento || "",
    canal: data.canal || "",
    medicamentos: Array.isArray(data.medicamentos) ? data.medicamentos : [],
    direccion: data.direccion || "",
    fechaEntrega: data.fechaEntrega || "",
    notas: data.notas || "",
    estado: data.estado || "pendiente",
    tieneFormula: data.tieneFormula === true,
    formulaNombre: data.formulaNombre || "",
    motivoRechazo: data.motivoRechazo || "",
    decididaPorNombre: data.decididaPorNombre || "",
    creadaEn: toMillis(data.creadaEn),
    fechaDecision: toMillis(data.fechaDecision)
  };
}

function mapPatient(snapshot){
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: data.nombre || "",
    documentType: data.tipoDocumento || "CC",
    document: data.documento || "",
    phone: data.telefono || "",
    eps: data.eps || "EPS Sura",
    address: data.direccion || "",
    status: data.activo === true ? "activo" : "inactivo"
  };
}

// HU-01: valida credenciales en Firebase Auth y luego el rol y el estado en Firestore.
async function signInWithRole(kind, email, password, expectedRole){
  const context = ctx(kind);
  let credential;
  try{
    credential = await signInWithEmailAndPassword(context.auth, email, password);
  }catch(error){
    // No se informa si falló el usuario o la contraseña.
    if(error?.code === "auth/network-request-failed") throw new AccessError("red");
    if(error?.code === "auth/too-many-requests") throw new AccessError("bloqueado-temporal");
    throw new AccessError("credenciales");
  }
  const profileSnap = await getDoc(doc(context.db, "usuarios", credential.user.uid));
  const profile = profileSnap.exists() ? profileSnap.data() : null;
  if(!profile){
    await signOut(context.auth);
    throw new AccessError("credenciales");
  }
  if(profile.activo !== true){
    await signOut(context.auth);
    throw new AccessError("inactivo");
  }
  if(profile.rol !== expectedRole){
    await signOut(context.auth);
    throw new AccessError("rol");
  }
  context.profile = { uid: credential.user.uid, ...profile };
  return context.profile;
}

const FB = {
  configured,

  // ---------- Autenticación ----------
  loginPaciente(documentType, documentNumber, password){
    return signInWithRole("paciente", patientEmail(documentType, documentNumber), password, "paciente");
  },
  loginOperador(email, password){
    return signInWithRole("portal", String(email).trim().toLowerCase(), password, "operador");
  },
  async logout(kind){
    const context = ctx(kind);
    context.profile = null;
    await signOut(context.auth);
  },
  perfil(kind){
    return contexts ? contexts[kind].profile : null;
  },

  // ---------- HU-02: el paciente crea su solicitud ----------
  async crearSolicitudPaciente({ medicamentos, direccion, fechaEntrega }){
    const context = ctx("paciente");
    const profile = context.profile;
    if(!profile) throw new AccessError("sin-sesion");
    const ref = await addDoc(collection(context.db, "solicitudes"), {
      pacienteUid: profile.uid,
      pacienteNombre: profile.nombre,
      pacienteDocumento: `${profile.tipoDocumento} ${profile.documento}`,
      canal: CANAL_APP,
      medicamentos,
      direccion,
      fechaEntrega,
      estado: "pendiente",
      tieneFormula: false,
      creadaEn: serverTimestamp()
    });
    return ref.id;
  },

  // ---------- HU-05: el paciente consulta solo sus solicitudes ----------
  escucharSolicitudesPaciente(onData, onError){
    const context = ctx("paciente");
    const q = query(collection(context.db, "solicitudes"), where("pacienteUid", "==", context.profile.uid));
    return onSnapshot(q, snapshot => {
      const items = snapshot.docs.map(mapRequest).sort((a, b) => (b.creadaEn || 0) - (a.creadaEn || 0));
      onData(items);
    }, onError);
  },

  // ---------- HU-03: el portal recibe las solicitudes en tiempo real ----------
  escucharSolicitudesPortal(onData, onError){
    const context = ctx("portal");
    const q = query(collection(context.db, "solicitudes"), orderBy("creadaEn", "desc"));
    return onSnapshot(q, snapshot => {
      onData(snapshot.docs.map(mapRequest));
    }, onError);
  },

  // ---------- HU-04: decisión del operador ----------
  aprobarSolicitud(id){
    const context = ctx("portal");
    return updateDoc(doc(context.db, "solicitudes", id), {
      estado: "aprobada",
      decididaPor: context.profile.uid,
      decididaPorNombre: context.profile.nombre,
      fechaDecision: serverTimestamp()
    });
  },
  rechazarSolicitud(id, motivo){
    const context = ctx("portal");
    return updateDoc(doc(context.db, "solicitudes", id), {
      estado: "rechazada",
      motivoRechazo: motivo,
      decididaPor: context.profile.uid,
      decididaPorNombre: context.profile.nombre,
      fechaDecision: serverTimestamp()
    });
  },
  // Registro de la fórmula verificada por el operador. El archivo no se almacena:
  // la carga de archivos corresponde a HU-06, que quedó en el backlog.
  registrarFormula(id, nombreArchivo){
    const context = ctx("portal");
    return updateDoc(doc(context.db, "solicitudes", id), {
      tieneFormula: true,
      formulaNombre: nombreArchivo,
      formulaRegistradaPor: context.profile.uid,
      formulaRegistradaEn: serverTimestamp()
    });
  },

  // ---------- Solicitud registrada por el operador (canal asistido) ----------
  async listarPacientesActivos(){
    const context = ctx("portal");
    const q = query(collection(context.db, "usuarios"), where("rol", "==", "paciente"), where("activo", "==", true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapPatient);
  },
  async crearSolicitudOperador({ paciente, medicamentos, direccion, fechaEntrega, notas, formulaNombre }){
    const context = ctx("portal");
    const ref = await addDoc(collection(context.db, "solicitudes"), {
      pacienteUid: paciente.id,
      pacienteNombre: paciente.name,
      pacienteDocumento: `${paciente.documentType} ${paciente.document}`,
      canal: CANAL_WHATSAPP_ASISTIDO,
      medicamentos,
      direccion,
      fechaEntrega,
      notas,
      estado: "pendiente",
      tieneFormula: Boolean(formulaNombre),
      formulaNombre: formulaNombre || "",
      registradaPor: context.profile.uid,
      creadaEn: serverTimestamp()
    });
    return ref.id;
  }
};

window.FB = FB;
window.dispatchEvent(new Event("fb-ready"));
