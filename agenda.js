// ===== Agenda compartida (Firebase) =====
// La web solo lee la agenda de cada doctor; cada doctor edita la suya desde el panel.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore, collection, doc, onSnapshot, query, where, documentId, setDoc, deleteDoc, addDoc, updateDoc, getDoc, serverTimestamp,
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

export function escucharOcupado(docId, desde, hasta, cb) {
  if (!db) return () => {};
  return onSnapshot(rango(collection(db, 'agenda', docId, 'ocupado'), desde, hasta), (snap) => {
    const mapa = {};
    snap.forEach((d) => (mapa[d.id] = { completo: !!d.data().completo, horas: d.data().horas || [] }));
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
    snap.forEach((d) => (mapa[d.id] = d.data()));
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
export function crearCita(c) {
  return addDoc(collection(db, 'citas'), { ...c, estado: 'pendiente', creada: serverTimestamp() });
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
