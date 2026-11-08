// ===== Agenda compartida (Firebase) =====
// La web solo lee la agenda de cada doctor; cada doctor edita la suya desde el panel.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore, collection, doc, onSnapshot, query, where, documentId, setDoc, deleteDoc, addDoc, updateDoc, getDoc, serverTimestamp, writeBatch, runTransaction, Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export const FIREBASE = {
  // Clave pública de la app web; la seguridad la dan las reglas de Firestore
  apiKey: 'AIzaSyBKBhv_CFG1lv3lHH6nBPb5SpiYMZVmT5w',
  authDomain: 'clinica-dental-raiz.firebaseapp.com',
  projectId: 'clinica-dental-raiz',
  storageBucket: 'clinica-dental-raiz.firebasestorage.app',
  messagingSenderId: '693919900667',
  appId: '1:693919900667:web:0ba937d071a805337da15e',
};

export const configurado = Boolean(FIREBASE.apiKey);
export const app = configurado ? initializeApp(FIREBASE) : null;
export const db = configurado ? getFirestore(app) : null;

// Fecha local en formato 2026-11-05 (sirve de id del documento)
export const claveFecha = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;


// agenda/{doctor}/ocupado/{fecha} = { completo, horas: [9, 9.5, …] }   → público, solo lectura
// agenda/{doctor}/notas/{fecha}   = { '9': 'Ana Pérez · limpieza', … }  → privado, solo ese doctor
// solicitudes/{id}                 = { de, para, fecha, turno, estado }  → unirse al turno de otro doctor
// medicos/{correo}                 = { doctor: 'd1' } o { admin: true }  → qué doctor es cada cuenta
// agenda/{doctor}                  = { servicios: ['limpieza', …] }     → público, solo ese doctor lo cambia
// citas/{id}                       = { doctor, servicio, fecha, hora, turno, nombre, celular, comentario, estado }
//                                    → la crea el paciente desde la web; solo la ve y responde su doctor
const rango = (col, desde, hasta) =>
  query(col, where(documentId(), '>=', claveFecha(desde)), where(documentId(), '<=', claveFecha(hasta)));

const aHora = (h) => (typeof aBloque === 'function' ? aBloque(h) : Math.floor(h));
export function escucharOcupado(docId, desde, hasta, cb) {
  if (!db) return () => {};
  return onSnapshot(rango(collection(db, 'agenda', docId, 'ocupado'), desde, hasta), (snap) => {
    const mapa = {};
    // Las medias horas antiguas (9.5) se cuentan en su hora (9)
    snap.forEach((d) => (mapa[d.id] = { completo: !!d.data().completo, horas: [...new Set((d.data().horas || []).map(aHora))] }));
    cb(mapa);
  }, (err) => console.warn('Agenda no disponible:', err.message));
}

// Ocupados de todos los doctores: { d1: { '2026-11-05': {…} }, d2: … }
export function escucharTodos(ids, desde, hasta, cb) {
  const todo = Object.fromEntries(ids.map((id) => [id, {}]));
  const apagar = ids.map((id) => escucharOcupado(id, desde, hasta, (m) => { todo[id] = m; cb({ ...todo }); }));
  return () => apagar.forEach((f) => f());
}

export function escucharNotas(docId, desde, hasta, cb) {
  if (!db) return () => {};
  return onSnapshot(rango(collection(db, 'agenda', docId, 'notas'), desde, hasta), (snap) => {
    const mapa = {};
    snap.forEach((d) => {
      // Notas antiguas de las 9:30 se muestran en las 9 si esa hora no tiene nota
      const n = { ...d.data() };
      Object.keys(n).filter((k) => +k % 1).forEach((k) => { const h = String(aHora(+k)); if (!n[h]) n[h] = n[k]; });
      mapa[d.id] = n;
    });
    cb(mapa);
  }, (err) => console.warn('Notas no disponibles:', err.message));
}

export function guardarOcupado(docId, fecha, { completo, horas }) {
  const ref = doc(db, 'agenda', docId, 'ocupado', fecha);
  if (!completo && !horas.length) return deleteDoc(ref);
  return setDoc(ref, { completo, horas: [...horas].sort((a, b) => a - b) });
}

export function guardarNota(docId, fecha, hora, texto) {
  return setDoc(doc(db, 'agenda', docId, 'notas', fecha), { [String(hora)]: texto }, { merge: true });
}

// ----- Solicitudes para unirse al turno de otro doctor -----
export function escucharSolicitudes(desde, hasta, cb) {
  if (!db) return () => {};
  const q = query(collection(db, 'solicitudes'),
    where('fecha', '>=', claveFecha(desde)), where('fecha', '<=', claveFecha(hasta)));
  return onSnapshot(q, (snap) => {
    const lista = [];
    snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
    cb(lista);
  }, (err) => console.warn('Solicitudes no disponibles:', err.message));
}

export function crearSolicitud({ de, para, fecha, turno, estado }) {
  return addDoc(collection(db, 'solicitudes'), { de, para, fecha, turno, estado, creada: serverTimestamp() });
}

export function cambiarSolicitud(id, estado) {
  return updateDoc(doc(db, 'solicitudes', id), { estado, respondida: serverTimestamp() });
}

export async function leerPerfil(correo) {
  const s = await getDoc(doc(db, 'medicos', correo.toLowerCase()));
  return s.exists() ? s.data() : null;
}

// ----- Servicios que realiza cada doctor (los edita desde su panel) -----
export function escucharServicios(ids, cb) {
  if (!db) return () => {};
  const todo = {};
  const apagar = ids.map((id) => onSnapshot(doc(db, 'agenda', id), (s) => {
    if (s.exists() && Array.isArray(s.data().servicios)) todo[id] = s.data().servicios; else delete todo[id];
    cb({ ...todo });
  }, (err) => console.warn('Servicios no disponibles:', err.message)));
  return () => apagar.forEach((f) => f());
}

export function guardarServicios(docId, servicios) {
  return setDoc(doc(db, 'agenda', docId), { servicios, actualizado: serverTimestamp() });
}

// ----- Solicitudes de cita de los pacientes (las aprueba el doctor) -----
// La cita se guarda junto con una marca por celular (limite/{celular}). Las reglas de Firestore
// solo aceptan las dos juntas y no dejan renovar la marca antes de 24 horas: un mismo número no
// puede mandar solicitudes seguidas (sale el error "permission-denied").
export async function crearCita(c) {
  const ref = doc(collection(db, 'citas'));
  const lote = writeBatch(db);
  lote.set(ref, { ...c, estado: 'pendiente', creada: serverTimestamp() });
  // merge: se conservan los rechazos del día que haya acumulado ese número
  lote.set(doc(db, 'limite', c.celular), { ultima: serverTimestamp(), cita: ref.id, libre: false }, { merge: true });
  await lote.commit();
  return ref.id;
}

// El paciente sigue el estado de su propia cita (pendiente → aprobada | rechazada)
export function escucharMiCita(id, cb) {
  if (!db) return () => {};
  return onSnapshot(doc(db, 'citas', id), (s) => { if (s.exists()) cb(s.data().estado); },
    (err) => console.warn('Estado de la cita no disponible:', err.message));
}

export function escucharCitas(docId, cb) {
  if (!db) return () => {};
  const q = query(collection(db, 'citas'), where('doctor', '==', docId), where('estado', '==', 'pendiente'));
  return onSnapshot(q, (snap) => {
    const lista = [];
    snap.forEach((d) => lista.push({ id: d.id, ...d.data() }));
    cb(lista);
  }, (err) => console.warn('Citas no disponibles:', err.message));
}

export function responderCita(id, estado) {
  return updateDoc(doc(db, 'citas', id), { estado, respondida: serverTimestamp() });
}

// Al rechazar una cita se libera el número del paciente para que pueda pedir otra de inmediato,
// y se cuentan sus rechazos del día: al llegar a MAX_RECHAZOS no puede pedir más citas hasta mañana.
// Las reglas solo lo permiten si la marca apunta a esa cita, ya rechazada, y lo hace su doctor.
export const MAX_RECHAZOS = 3;
export function liberarCelular(celular) {
  const ref = doc(db, 'limite', celular);
  return runTransaction(db, async (tx) => {
    const s = await tx.get(ref);
    if (!s.exists() || s.data().libre) return;
    const hoy = claveFecha(new Date());
    const rechazos = (s.data().dia === hoy ? s.data().rechazos || 0 : 0) + 1;
    const cambio = { libre: true, rechazos, dia: hoy };
    if (rechazos >= MAX_RECHAZOS) {
      const manana = new Date(); manana.setHours(24, 0, 0, 0);
      cambio.bloqueoHasta = Timestamp.fromDate(manana);
    }
    tx.update(ref, cambio);
  });
}
