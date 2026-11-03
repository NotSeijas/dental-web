// ===== Agenda compartida (Firebase) =====
// La web solo lee qué días y horas están ocupados; el panel del dentista los edita.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore, collection, doc, onSnapshot, query, where, documentId, setDoc, deleteDoc,
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

// ocupado/{fecha} = { completo: bool, horas: [9, 9.5, …] }  → público, solo lectura
// notas/{fecha}   = { '9': 'Ana Pérez · limpieza', … }      → privado, solo el dentista
export function escucharOcupado(desde, hasta, cb) {
  if (!db) return () => {};
  const q = query(collection(db, 'ocupado'),
    where(documentId(), '>=', claveFecha(desde)), where(documentId(), '<=', claveFecha(hasta)));
  return onSnapshot(q, (snap) => {
    const mapa = {};
    snap.forEach((d) => (mapa[d.id] = { completo: !!d.data().completo, horas: d.data().horas || [] }));
    cb(mapa);
  }, (err) => console.warn('Agenda no disponible:', err.message));
}

export function escucharNotas(desde, hasta, cb) {
  if (!db) return () => {};
  const q = query(collection(db, 'notas'),
    where(documentId(), '>=', claveFecha(desde)), where(documentId(), '<=', claveFecha(hasta)));
  return onSnapshot(q, (snap) => {
    const mapa = {};
    snap.forEach((d) => (mapa[d.id] = d.data()));
    cb(mapa);
  }, (err) => console.warn('Notas no disponibles:', err.message));
}

export function guardarOcupado(fecha, { completo, horas }) {
  const ref = doc(db, 'ocupado', fecha);
  if (!completo && !horas.length) return deleteDoc(ref);
  return setDoc(ref, { completo, horas: [...horas].sort((a, b) => a - b) });
}

export function guardarNota(fecha, hora, texto) {
  return setDoc(doc(db, 'notas', fecha), { [String(hora)]: texto }, { merge: true });
}
