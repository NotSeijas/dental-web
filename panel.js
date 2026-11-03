// ===== Panel del dentista: marca días y horas ocupados =====
import { app, configurado, escucharOcupado, escucharNotas, guardarOcupado, guardarNota } from './agenda.js';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fmtHora = (h) => {
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'a. m.' : 'p. m.'}`;
};
$$('[data-nombre]').forEach((el) => (el.textContent = NEGOCIO.nombre));

// Vista de prueba sin Firebase, solo en la compu (localhost/?demo)
const demo = new URLSearchParams(location.search).has('demo') && ['localhost', '127.0.0.1'].includes(location.hostname);

// Próximos 30 días con atención
const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
const dias = [];
for (let i = 0; i < 31; i++) {
  const d = new Date(hoy); d.setDate(d.getDate() + i);
  if (horasDelDia(d).length) dias.push(d);
}

let OCUPADO = {}, NOTAS = {}, sel = dias[0];
const estado = (d) => OCUPADO[claveFecha(d)] || { completo: false, horas: [] };
const pasada = (d, h) => d.getTime() === hoy.getTime() && h + 0.5 <= new Date().getHours() + new Date().getMinutes() / 60;

// ----- Guardado -----
const guardadoEl = $('[data-guardado]');
let tGuardado;
async function guardar(promesa) {
  guardadoEl.textContent = 'Guardando…';
  guardadoEl.className = 'guardado';
  try {
    await promesa;
    guardadoEl.textContent = 'Guardado';
    guardadoEl.classList.add('ok');
  } catch (err) {
    console.error(err);
    guardadoEl.textContent = 'No se pudo guardar. Revisa tu internet.';
    guardadoEl.classList.add('mal');
  }
  clearTimeout(tGuardado);
  tGuardado = setTimeout(() => (guardadoEl.textContent = ''), 2500);
}
const api = demo
  ? { ocupado: async (f, v) => { OCUPADO[f] = v; pintarTodo(); }, nota: async (f, h, t) => { (NOTAS[f] ||= {})[h] = t; } }
  : { ocupado: guardarOcupado, nota: guardarNota };

function cambiarOcupado(d, cambio) {
  const f = claveFecha(d);
  const v = { ...estado(d), ...cambio };
  OCUPADO[f] = v; // se ve al instante; Firestore confirma después
  pintarTodo();
  guardar(api.ocupado(f, v));
}

// ----- Lista de días -----
const listaEl = $('[data-lista-dias]');
function pintarLista() {
  listaEl.innerHTML = dias.map((d, i) => {
    const e = estado(d), total = horasDelDia(d).length;
    const n = e.completo ? total : e.horas.length;
    const etiqueta = d.getTime() === hoy.getTime() ? 'Hoy' : DIAS_CORTOS[d.getDay()];
    const txt = e.completo ? 'Día cerrado' : n ? `${n} de ${total} ocupadas` : 'Todo libre';
    return `<button type="button" class="dia-item${d === sel ? ' activo' : ''}${e.completo ? ' cerrado' : ''}" data-i="${i}">
      <span class="dia-item__fecha"><b>${etiqueta}</b> ${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}</span>
      <span class="dia-item__txt">${txt}</span>
      <span class="dia-item__barra"><span style="width:${(n / total) * 100}%"></span></span>
    </button>`;
  }).join('');
}
listaEl.addEventListener('click', (e) => {
  const b = e.target.closest('.dia-item');
  if (!b) return;
  sel = dias[+b.dataset.i];
  pintarDia(true);
  pintarLista();
  if (matchMedia('(max-width: 860px)').matches) $('[data-dia]').scrollIntoView({ behavior: 'smooth' });
});

// ----- Día elegido -----
const horarioEl = $('[data-horario]');
const completoEl = $('[data-completo]');
function pintarDia(nuevo = false) {
  const e = estado(sel), f = claveFecha(sel);
  $('[data-dia-sub]').textContent = sel.getTime() === hoy.getTime() ? 'Hoy' : DIAS[sel.getDay()];
  $('[data-dia-titulo]').textContent = `${DIAS[sel.getDay()][0].toUpperCase()}${DIAS[sel.getDay()].slice(1)} ${sel.getDate()} de ${MESES[sel.getMonth()]}`;
  completoEl.checked = e.completo;
  const horas = horasDelDia(sel);
  const libres = e.completo ? 0 : horas.filter((h) => !e.horas.includes(h) && !pasada(sel, h)).length;
  $('[data-resumen]').innerHTML = e.completo
    ? '<span class="pastilla pastilla--cerrado">Los pacientes ven este día como lleno</span>'
    : `<span class="pastilla">${libres} horas libres</span><span class="pastilla pastilla--ocupada">${e.horas.length} ocupadas</span>`;

  if (nuevo || !horarioEl.children.length) {
    const grupos = { 'Mañana': horas.filter((h) => h < 13), 'Tarde': horas.filter((h) => h >= 13) };
    horarioEl.innerHTML = Object.entries(grupos).filter(([, hs]) => hs.length).map(([nom, hs]) => `
      <div class="grupo"><p class="grupo__titulo">${nom}</p>
        ${hs.map((h) => `<div class="fila" data-h="${h}">
          <button type="button" class="hora" data-toggle aria-pressed="false">
            <span class="hora__t">${fmtHora(h)}</span><span class="hora__estado"></span>
          </button>
          <input class="nota" type="text" maxlength="80" placeholder="Paciente o tratamiento (opcional)" aria-label="Nota de las ${fmtHora(h)}">
        </div>`).join('')}
      </div>`).join('');
  }
  const notas = NOTAS[f] || {};
  $$('.fila', horarioEl).forEach((fila) => {
    const h = +fila.dataset.h;
    const ocup = e.completo || e.horas.includes(h);
    const paso = pasada(sel, h);
    const b = $('.hora', fila);
    b.setAttribute('aria-pressed', String(ocup));
    b.disabled = e.completo || paso;
    fila.classList.toggle('ocupada', ocup);
    fila.classList.toggle('pasada', paso);
    $('.hora__estado', b).textContent = paso ? 'Pasó' : ocup ? 'Ocupada' : 'Libre';
    const nota = $('.nota', fila);
    if (document.activeElement !== nota) nota.value = notas[String(h)] || '';
  });
}
horarioEl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-toggle]');
  if (!b || b.disabled) return;
  const h = +b.closest('.fila').dataset.h;
  const { horas } = estado(sel);
  cambiarOcupado(sel, { horas: horas.includes(h) ? horas.filter((x) => x !== h) : [...horas, h] });
});
// Al escribir una nota, la hora queda ocupada
horarioEl.addEventListener('change', (e) => {
  if (!e.target.matches('.nota')) return;
  const h = +e.target.closest('.fila').dataset.h;
  const texto = e.target.value.trim();
  const f = claveFecha(sel);
  (NOTAS[f] ||= {})[String(h)] = texto;
  guardar(api.nota(f, h, texto));
  const { horas, completo } = estado(sel);
  if (texto && !completo && !horas.includes(h)) cambiarOcupado(sel, { horas: [...horas, h] });
});
horarioEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('.nota')) e.target.blur(); });
completoEl.addEventListener('change', () => cambiarOcupado(sel, { completo: completoEl.checked }));
$('[data-liberar]').addEventListener('click', () => {
  const e = estado(sel);
  if (!e.completo && !e.horas.length) return;
  if (confirm('¿Liberar todas las horas de este día? Los pacientes podrán volver a reservarlas.')) {
    cambiarOcupado(sel, { completo: false, horas: [] });
  }
});

function pintarTodo() { pintarLista(); pintarDia(); }

// ----- Ingreso -----
const ingreso = $('[data-ingreso]'), panel = $('[data-panel]');
let apagar = [];
function abrirPanel() {
  ingreso.hidden = true;
  panel.hidden = false;
  pintarLista();
  pintarDia(true);
  if (demo) return;
  const hasta = dias.at(-1);
  apagar = [
    escucharOcupado(hoy, hasta, (m) => { OCUPADO = m; pintarTodo(); }),
    escucharNotas(hoy, hasta, (m) => { NOTAS = m; pintarDia(); }),
  ];
}

if (demo) {
  OCUPADO[claveFecha(dias[0])] = { completo: false, horas: [10, 10.5, 16] };
  OCUPADO[claveFecha(dias[2])] = { completo: true, horas: [] };
  NOTAS[claveFecha(dias[0])] = { '10': 'Ana Torres · limpieza', '16': 'Luis Rojas · control de brackets' };
  abrirPanel();
} else if (!configurado) {
  const aviso = $('[data-aviso]');
  aviso.hidden = false;
  aviso.textContent = 'Falta conectar Firebase en agenda.js.';
} else {
  const auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence);
  onAuthStateChanged(auth, (u) => {
    if (u) abrirPanel();
    else { apagar.forEach((f) => f()); panel.hidden = true; ingreso.hidden = false; }
  });
  const errEl = $('[data-error-ingreso]');
  $('[data-form-ingreso]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('button', e.target);
    btn.disabled = true; btn.textContent = 'Entrando…'; errEl.textContent = '';
    try {
      await signInWithEmailAndPassword(auth, e.target.correo.value.trim(), e.target.clave.value);
    } catch (err) {
      errEl.textContent = ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'].includes(err.code)
        ? 'Correo o contraseña incorrectos.'
        : err.code === 'auth/too-many-requests' ? 'Demasiados intentos. Espera unos minutos.' : 'No se pudo entrar. Revisa tu internet.';
    }
    btn.disabled = false; btn.textContent = 'Entrar';
  });
  $('[data-salir]').addEventListener('click', () => signOut(auth));
}
