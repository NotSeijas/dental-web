const CHIPS = [
  'Quiero agendar una evaluación.',
  'Tengo dolor de muela, ¿me pueden atender hoy?',
  '¿Cuánto cuesta el aclaramiento dental?',
  'Quiero información sobre ortodoncia con brackets.',
  'Quiero información sobre prótesis dental.',
  'Quiero una cita para mi hijo o hija.',
];

// ===== Utilidades =====
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const waLink = (txt) => `https://wa.me/${NEGOCIO.wa}?text=${encodeURIComponent(txt)}`;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function fmtHora(h) {
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'a. m.' : 'p. m.'}`;
}
const horaDecimal = (d) => d.getHours() + d.getMinutes() / 60;

// ===== Datos fijos en la página =====
$$('[data-nombre]').forEach((el) => (el.textContent = NEGOCIO.nombre));
$$('[data-anio]').forEach((el) => (el.textContent = new Date().getFullYear()));
$$('[data-wa]').forEach((a) => (a.href = waLink(a.dataset.wa)));
$$('[data-tel-txt]').forEach((a) => (a.textContent = `WhatsApp ${NEGOCIO.telefono}`));
$$('[data-direccion]').forEach((el) => (el.textContent = NEGOCIO.direccion));

const horarioEl = $('[data-horario]');
// Si el sábado tiene el mismo horario que la semana, se juntan en una sola fila
const igualSabado = JSON.stringify(NEGOCIO.horario[6]) === JSON.stringify(NEGOCIO.horario[1]);
(igualSabado ? [[1, 'Lunes a sábado'], [0, 'Domingo']] : [[1, 'Lunes a viernes'], [6, 'Sábado'], [0, 'Domingo']]).forEach(([d, etiqueta]) => {
  const tramos = NEGOCIO.horario[d];
  horarioEl.insertAdjacentHTML('beforeend',
    `<div><dt>${etiqueta}</dt><dd>${tramos ? tramos.map(([a, b]) => `${fmtHora(a)} – ${fmtHora(b)}`).join('<br>') : 'Cerrado'}</dd></div>`);
});

// Estado "abierto ahora"
(function estado() {
  const ahora = new Date();
  const h = horaDecimal(ahora);
  const tramos = NEGOCIO.horario[ahora.getDay()] || [];
  const abierto = tramos.find(([a, b]) => h >= a && h < b);
  const txt = $('[data-estado-txt]');
  const el = $('[data-estado]');
  if (abierto) {
    el.classList.add('es-abierto');
    txt.textContent = `Abierto ahora · hasta ${fmtHora(abierto[1])}`;
  } else {
    const prox = tramos.find(([a]) => h < a);
    if (prox) txt.textContent = `Abrimos hoy a las ${fmtHora(prox[0])}`;
    else {
      for (let i = 1; i <= 7; i++) {
        const d = new Date(ahora); d.setDate(d.getDate() + i);
        const t = NEGOCIO.horario[d.getDay()];
        if (t) { txt.textContent = `Abrimos ${i === 1 ? 'mañana' : 'el ' + DIAS[d.getDay()]} a las ${fmtHora(t[0][0])}`; break; }
      }
    }
  }
})();

// ===== Carga =====
// La sonrisa se dibuja en ~1.6 s; luego la pantalla sube y entra la portada
const inicio = performance.now();
let cargaHecha = false;
function terminarCarga() {
  if (cargaHecha) return;
  cargaHecha = true;
  document.body.classList.remove('cargando');
  setTimeout(() => $('.hero').classList.add('listo'), reduce ? 0 : 280);
}
// Gotita saluda en la carga con un consejo al azar; la carga dura un poco más para leerlo
const consejoCarga = $('[data-carga-consejo]');
if (consejoCarga) consejoCarga.textContent = 'Consejo: ' + CONSEJOS[Math.floor(Math.random() * CONSEJOS.length)];
window.addEventListener('load', () => setTimeout(terminarCarga, reduce ? 0 : Math.max(0, 3600 - (performance.now() - inicio))));
setTimeout(terminarCarga, 5200);

// ===== Menú móvil =====
const btnMenu = $('.top__menu');
const menu = $('#menu-movil');
btnMenu.addEventListener('click', () => {
  const abierto = btnMenu.getAttribute('aria-expanded') === 'true';
  btnMenu.setAttribute('aria-expanded', String(!abierto));
  menu.hidden = abierto;
});
$$('a', menu).forEach((a) => a.addEventListener('click', () => { menu.hidden = true; btnMenu.setAttribute('aria-expanded', 'false'); }));

const top_ = $('.top');
const alScroll = () => top_.classList.toggle('con-sombra', scrollY > 8);
addEventListener('scroll', alScroll, { passive: true });
alScroll();

// ===== Panel de servicios =====
const lista = $('[data-lista]');
const vista = $('[data-vista]');
const panel = $('.panel');
const movil = matchMedia('(max-width: 860px)');
SERVICIOS.forEach((s, i) => {
  lista.insertAdjacentHTML('beforeend', `
    <li><button type="button" role="tab" id="tab-${s.id}" data-id="${s.id}" aria-controls="vista" aria-selected="false">
      <span class="panel__nom">${s.nombre}</span>
      <svg class="ico panel__flecha" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </button></li>`);
  // precarga
  const im = new Image(); im.src = `media/${s.img}.jpg`;
});
vista.id = 'vista';

let actual = null;
function mostrar(id, { foco = false } = {}) {
  const s = SERVICIOS.find((x) => x.id === id);
  if (!s || actual === id) return;
  actual = id;
  $$("[data-id]", lista).forEach((b) => {
    const on = b.dataset.id === id;
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
  });
  vista.setAttribute('aria-labelledby', `tab-${id}`);

  const marco = $('.panel__marco', vista);
  const vieja = $('img', marco);
  const nueva = new Image();
  nueva.src = `media/${s.img}.jpg`; nueva.alt = s.alt; nueva.width = 1400; nueva.height = 933;
  nueva.dataset.vistaImg = '';
  nueva.className = 'entra';
  marco.appendChild(nueva);
  requestAnimationFrame(() => requestAnimationFrame(() => nueva.classList.remove('entra')));
  setTimeout(() => { if (vieja !== nueva && vieja.isConnected) vieja.remove(); }, reduce ? 0 : 700);

  $('[data-vista-titulo]').textContent = s.nombre;
  $('[data-vista-desc]').textContent = s.desc;
  $('[data-vista-incluye]').innerHTML = s.incluye.map((t) => `<li>${t}</li>`).join('');
  $('[data-vista-dur]').textContent = s.dur;
  $('[data-vista-wa]').href = waLink(`Hola, quisiera información sobre ${s.nombre.toLowerCase()}.`);
  const info = $('.panel__info', vista);
  info.classList.remove('cambia'); void info.offsetWidth; info.classList.add('cambia');

  // En celular la vista se abre debajo del servicio elegido
  if (movil.matches) {
    const li = $(`[data-id="${id}"]`, lista).parentElement;
    li.appendChild(vista);
  } else if (vista.parentElement !== panel) {
    panel.appendChild(vista);
  }
  if (foco) $(`[data-id="${id}"]`, lista).focus();
}
lista.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-id]');
  if (b) mostrar(b.dataset.id);
});
lista.addEventListener('mouseover', (e) => {
  if (movil.matches || !matchMedia('(hover: hover)').matches) return;
  const b = e.target.closest('button[data-id]');
  if (b) mostrar(b.dataset.id);
});
lista.addEventListener('keydown', (e) => {
  const idx = SERVICIOS.findIndex((s) => s.id === actual);
  let n = null;
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (idx + 1) % SERVICIOS.length;
  if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (idx - 1 + SERVICIOS.length) % SERVICIOS.length;
  if (e.key === 'Home') n = 0;
  if (e.key === 'End') n = SERVICIOS.length - 1;
  if (n !== null) { e.preventDefault(); mostrar(SERVICIOS[n].id, { foco: true }); }
});
movil.addEventListener('change', () => { const a = actual; actual = null; mostrar(a); });
mostrar(SERVICIOS[0].id);

$('[data-vista-reservar]').addEventListener('click', () => {
  elegirServicio(actual);
  $('#reservar').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
});

// ===== Equipo =====
const rangoDias = (dias) => {
  // [1,2,3,4,5,6] → "Lun a Sáb";  [1,3] → "Lun y Mié"
  const seguidos = dias.every((x, i) => i === 0 || x === dias[i - 1] + 1);
  if (dias.length > 2 && seguidos) return `${DIAS_CORTOS[dias[0]]} a ${DIAS_CORTOS[dias.at(-1)]}`;
  return dias.map((x) => DIAS_CORTOS[x]).join(dias.length === 2 ? ' y ' : ', ');
};
function resumenTurnos(doc) {
  return Object.keys(TURNOS).map((t) => {
    const dias = [1, 2, 3, 4, 5, 6, 0].filter((x) => (doc.turnos[x] || []).includes(t));
    if (!dias.length) return '';
    return `<li><b>${TURNOS[t].nombre}</b> ${rangoDias(dias)} · ${fmtHora(TURNOS[t].desde)} – ${fmtHora(TURNOS[t].hasta)}${porConfirmar(doc.id, t) ? ' <em>(por confirmar)</em>' : ''}</li>`;
  }).join('');
}
const nombreServ = nombreServicio;
const equipoEl = $('[data-equipo]');
function pintarEquipo(yaVisto = false) {
  equipoEl.innerHTML = DOCTORES.map((d) => `
    <article class="doc${yaVisto ? ' visto' : ''}" data-anim>
      <figure class="doc__foto"><img src="${d.foto}" alt="${d.nombre}" width="500" height="625" loading="lazy"></figure>
      <div class="doc__info">
        <p class="doc__cargo">${d.cargo}</p>
        <h3>${d.nombre}</h3>
        <p class="doc__resumen">${d.resumen}</p>
        <ul class="doc__funciones">${d.funciones.map((f) => `<li>${escHtml(nombreServ(f))}</li>`).join('')}</ul>
        <ul class="doc__turnos">${resumenTurnos(d)}</ul>
        <button class="btn btn--azul doc__btn" type="button" data-reservar-con="${d.id}">Reservar con ${d.cargo.includes('jano') ? 'él' : 'ella'}</button>
      </div>
    </article>`).join('');
  if (yaVisto) $$('.doc', equipoEl).forEach((el) => [...el.children].forEach((c, i) => c.style.setProperty('--i', i)));
}
if (equipoEl) {
  pintarEquipo();
  equipoEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-reservar-con]');
    if (!b) return;
    elegirDoctor(b.dataset.reservarCon);
    saludarDoctor(b.dataset.reservarCon, $(`.elige-doc[data-doc="${b.dataset.reservarCon}"]`));
    $('#reservar').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });
}

// ===== Reserva =====
const form = $('[data-reserva]');
const selServ = $('[data-campo-servicio]');
const docsEl = $('[data-doctores]');
const cita = { doctor: '', servicio: '', dia: null, hora: null, nombre: '', celular: '', comentario: '' };

docsEl.innerHTML = DOCTORES.map((d) => `
  <button type="button" class="elige-doc" role="radio" aria-checked="false" data-doc="${d.id}">
    <img src="${d.foto}" alt="" width="56" height="70">
    <span><strong>${d.nombre}</strong><small>${d.resumen}</small><em data-doc-aviso></em></span>
  </button>`).join('');

function pintarServicios() {
  const doc = doctor(cita.doctor);
  // Del catálogo de la clínica + los servicios propios que el doctor agregó en su panel
  const lista = doc
    ? [...SERVICIOS.filter((s) => doc.funciones.includes(s.id)),
      ...doc.funciones.filter((f) => !SERVICIOS.some((s) => s.id === f)).map((f) => ({ id: f, nombre: f }))]
    : SERVICIOS;
  selServ.innerHTML = `<option value="">${doc ? `Servicios de ${doc.nombre}…` : 'Elige un servicio…'}</option>` +
    lista.map((s) => `<option value="${escHtml(s.id)}">${escHtml(s.nombre)}</option>`).join('');
  selServ.value = lista.some((s) => s.id === cita.servicio) ? cita.servicio : '';
}
function pintarDoctores() {
  $$('.elige-doc', docsEl).forEach((b) => {
    const d = doctor(b.dataset.doc);
    const no = !!cita.servicio && !d.funciones.includes(cita.servicio);
    b.setAttribute('aria-checked', String(cita.doctor === d.id));
    b.disabled = no;
    $('[data-doc-aviso]', b).textContent = no ? `No realiza ${nombreServ(cita.servicio).toLowerCase()}` : '';
  });
}
function repintar() {
  pintarDoctores(); pintarServicios(); marcarDias(); pintarHoras(); pintarTarjeta();
  if (!cita.doctor) $('[data-doc-globo]').hidden = true;
}
function elegirDoctor(id) {
  cita.doctor = id;
  if (cita.servicio && !doctor(id).funciones.includes(cita.servicio)) cita.servicio = '';
  limpiarSiNoSirve();
  repintar();
}
function elegirServicio(id) {
  cita.servicio = id;
  if (cita.doctor && !doctor(cita.doctor).funciones.includes(id)) { cita.doctor = ''; cita.dia = null; cita.hora = null; }
  repintar();
}
// Burbuja de saludo: una frase al azar de cada doctor (sin repetir la anterior)
const globoDoc = $('[data-doc-globo]');
let ultimoSaludo = '';
function saludarDoctor(id, boton) {
  const d = doctor(id);
  const opciones = (d.saludos || []).filter((x) => x !== ultimoSaludo);
  if (!opciones.length) return;
  ultimoSaludo = opciones[Math.floor(Math.random() * opciones.length)];
  globoDoc.innerHTML = `<img src="${d.foto}" alt="" width="34" height="34"><span>${ultimoSaludo}</span>`;
  // la colita apunta al doctor elegido
  const r = boton.getBoundingClientRect(), p = docsEl.getBoundingClientRect();
  globoDoc.style.setProperty('--cola', `${r.left - p.left + r.width / 2}px`);
  globoDoc.hidden = false;
  globoDoc.classList.remove('sale'); void globoDoc.offsetWidth; globoDoc.classList.add('sale');
}
docsEl.addEventListener('click', (e) => {
  const b = e.target.closest('.elige-doc');
  if (!b || b.disabled) return;
  elegirDoctor(b.dataset.doc);
  saludarDoctor(b.dataset.doc, b);
});
$$('[data-preselect]').forEach((a) => a.addEventListener('click', () => elegirServicio(a.dataset.preselect)));

// Días: los próximos 12 días en que atiende la clínica
const diasEl = $('[data-dias]');
const horasEl = $('[data-horas]');
const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
const diasDisp = [];
for (let i = 0; diasDisp.length < 12 && i < 21; i++) {
  const d = new Date(hoy); d.setDate(d.getDate() + i);
  if (!NEGOCIO.horario[d.getDay()]) continue;
  if (i === 0 && horasDelDia(d).every((h) => h < horaDecimal(new Date()) + 1)) continue;
  diasDisp.push(d);
}

// Agenda que marcan los doctores en su panel (llega desde agenda.js)
let OCUPADO = {};   // { d1: { '2026-11-05': { completo, horas } } }
let EXTRAS = [];    // turnos a los que se unió cada doctor (solicitudes aceptadas)
function slotsDe(d) {
  if (!cita.doctor) return [];
  const limite = d.getTime() === hoy.getTime() ? horaDecimal(new Date()) + 1 : -1; // una hora de anticipación
  return horasDeDoctor(cita.doctor, d, EXTRAS).filter((h) => h >= limite);
}
const atiende = (d) => slotsDe(d).length > 0;
const ocupada = (d, h) => {
  const o = OCUPADO[cita.doctor]?.[claveFecha(d)];
  return !!o && (o.completo || o.horas.includes(h));
};
const diaLleno = (d) => slotsDe(d).every((h) => ocupada(d, h));
function limpiarSiNoSirve() {
  if (cita.dia && (!atiende(cita.dia) || diaLleno(cita.dia))) { cita.dia = null; cita.hora = null; }
  else if (cita.dia && cita.hora != null && (ocupada(cita.dia, cita.hora) || !slotsDe(cita.dia).includes(cita.hora))) cita.hora = null;
}
diasDisp.forEach((d, i) => {
  const etiqueta = i === 0 && d.getTime() === hoy.getTime() ? 'Hoy' : DIAS_CORTOS[d.getDay()];
  diasEl.insertAdjacentHTML('beforeend', `
    <button type="button" class="dia" role="radio" aria-checked="false" data-i="${i}"
      aria-label="${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}">
      <span>${etiqueta}</span><strong>${d.getDate()}</strong><small>${MESES[d.getMonth()].slice(0, 3)}</small>
    </button>`);
});
function marcarDias() {
  $$('.dia', diasEl).forEach((b) => {
    const d = diasDisp[+b.dataset.i];
    const no = !!cita.doctor && !atiende(d);
    const lleno = !!cita.doctor && !no && diaLleno(d);
    b.disabled = !cita.doctor || no || lleno;
    b.classList.toggle('lleno', no || lleno);
    b.setAttribute('aria-checked', String(cita.dia === d));
    $('small', b).textContent = no ? 'no atiende' : lleno ? 'lleno' : MESES[d.getMonth()].slice(0, 3);
  });
  diasEl.classList.toggle('apagado', !cita.doctor);
}

// La agenda llama a esto cada vez que un doctor cambia algo
function alCambiarAgenda() { limpiarSiNoSirve(); marcarDias(); pintarHoras(); pintarTarjeta(); }
window.rangoReserva = [diasDisp[0], diasDisp.at(-1)];
window.doctoresIds = DOCTORES.map((d) => d.id);
window.ponerOcupado = (todo) => { OCUPADO = todo; alCambiarAgenda(); };
// Servicios que cada doctor marcó en su panel
window.ponerServicios = (mapa) => {
  aplicarServicios(mapa);
  if (equipoEl) pintarEquipo(true);
  if (cita.doctor && cita.servicio && !doctor(cita.doctor).funciones.includes(cita.servicio)) cita.servicio = '';
  repintar();
};
window.ponerExtras = (lista) => { EXTRAS = lista; alCambiarAgenda(); };

function pintarHoras() {
  horasEl.innerHTML = '';
  if (!cita.doctor || !cita.dia) {
    horasEl.innerHTML = `<p class="horas__vacio">${cita.doctor ? 'Ahora elige un día.' : 'Primero elige con qué odontólogo quieres tu cita.'}</p>`;
    return;
  }
  const slots = slotsDe(cita.dia);
  Object.keys(TURNOS).forEach((t) => {
    const hs = slots.filter((h) => turnoDeHora(h) === t);
    if (!hs.length) return;
    horasEl.insertAdjacentHTML('beforeend', `<p class="horas__grupo">Turno ${TURNOS[t].nombre.toLowerCase()}${porConfirmar(cita.doctor, t) ? ' · por confirmar' : ''}</p>`
      + (porConfirmar(cita.doctor, t) ? `<p class="horas__nota horas__nota--conf">${doctor(cita.doctor).corto} viene algunas ${TURNOS[t].nombre.toLowerCase()}s: te confirmamos por WhatsApp si puede atenderte.</p>` : ''));
    const fila = document.createElement('div');
    fila.className = 'horas__fila';
    hs.forEach((h) => {
      const tomada = ocupada(cita.dia, h);
      fila.insertAdjacentHTML('beforeend',
        `<button type="button" class="hora${tomada ? ' tomada' : ''}" role="radio" aria-checked="${cita.hora === h}" data-h="${h}"
          ${tomada ? `disabled aria-label="${fmtHora(h)}, ocupada"` : ''}>${fmtHora(h)}</button>`);
    });
    horasEl.appendChild(fila);
  });
  if (slots.some((h) => ocupada(cita.dia, h))) {
    horasEl.insertAdjacentHTML('beforeend', '<p class="horas__nota">Las horas tachadas ya están reservadas.</p>');
  }
}

diasEl.addEventListener('click', (e) => {
  const b = e.target.closest('.dia');
  if (!b || b.disabled) return;
  cita.dia = diasDisp[+b.dataset.i];
  cita.hora = null;
  marcarDias(); pintarHoras(); pintarTarjeta();
});
horasEl.addEventListener('click', (e) => {
  const b = e.target.closest('.hora');
  if (!b || b.disabled) return;
  $$('.hora', horasEl).forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  cita.hora = +b.dataset.h;
  pintarTarjeta();
});
selServ.addEventListener('change', () => { cita.servicio = selServ.value; pintarDoctores(); pintarTarjeta(); });
form.addEventListener('input', (e) => {
  if (e.target.name === 'celular') e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
  if (['nombre', 'celular', 'comentario'].includes(e.target.name)) cita[e.target.name] = e.target.value.trim();
  pintarTarjeta();
});
form.addEventListener('submit', (e) => { e.preventDefault(); enviar(); });

const tarjeta = $('[data-tarjeta]');
function pon(sel, valor) {
  const el = $(sel, tarjeta);
  const nuevo = valor || '';
  if (el.textContent === nuevo) return;
  el.textContent = nuevo;
  el.classList.toggle('vacio', !nuevo);
  if (nuevo && !reduce) { el.classList.remove('escribe'); void el.offsetWidth; el.classList.add('escribe'); }
}
function fechaLarga(d) {
  return `${DIAS[d.getDay()][0].toUpperCase()}${DIAS[d.getDay()].slice(1)} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}
function pintarTarjeta() {
  pon('[data-t-nombre]', cita.nombre);
  pon('[data-t-doctor]', doctor(cita.doctor)?.nombre);
  pon('[data-t-servicio]', cita.servicio ? nombreServ(cita.servicio) : '');
  pon('[data-t-dia]', cita.dia ? fechaLarga(cita.dia) : '');
  pon('[data-t-hora]', cita.hora != null ? fmtHora(cita.hora) : '');
  tarjeta.classList.remove('enviada');
  $('[data-error]').textContent = '';
}

function enviar() {
  const faltan = [];
  if (!cita.doctor) faltan.push('el odontólogo');
  if (!cita.servicio) faltan.push('el servicio');
  if (!cita.dia) faltan.push('el día');
  if (cita.hora == null) faltan.push('la hora');
  if (cita.nombre.length < 3) faltan.push('tu nombre');
  if (!/^9\d{8}$/.test(cita.celular)) faltan.push('un celular de 9 dígitos que empiece con 9');
  const err = $('[data-error]');
  if (faltan.length) {
    const lista_ = faltan.length > 1 ? faltan.slice(0, -1).join(', ') + ' y ' + faltan.at(-1) : faltan[0];
    err.textContent = `Para enviar tu solicitud falta ${lista_}.`;
    tarjeta.classList.remove('sacude'); void tarjeta.offsetWidth; tarjeta.classList.add('sacude');
    return;
  }
  const msg = [
    'Hola, quiero reservar una cita:',
    `• Odontólogo: ${doctor(cita.doctor).nombre}`,
    `• Servicio: ${nombreServ(cita.servicio)}`,
    `• Día: ${fechaLarga(cita.dia)}`,
    `• Hora: ${fmtHora(cita.hora)} (turno ${TURNOS[turnoDeHora(cita.hora)].nombre.toLowerCase()})${porConfirmar(cita.doctor, turnoDeHora(cita.hora)) ? ' · por confirmar con el doctor' : ''}`,
    `• Nombre: ${cita.nombre}`,
    `• Celular: ${cita.celular}`,
    cita.comentario ? `• Comentario: ${cita.comentario}` : '',
  ].filter(Boolean).join('\n');
  tarjeta.classList.add('enviada');
  // Se abre en el mismo gesto del clic para que el navegador no lo bloquee
  window.open(waLink(msg), '_blank', 'noopener');
}
$('[data-enviar]').addEventListener('click', enviar);
pintarServicios();
marcarDias();
pintarHoras();
pintarTarjeta();

// ===== WhatsApp rápido =====
const chips = $('[data-chips]');
CHIPS.forEach((t) => chips.insertAdjacentHTML('beforeend',
  `<a class="chip" href="${waLink('Hola. ' + t)}" target="_blank" rel="noopener">${t}</a>`));
$('[data-wa-libre]').addEventListener('submit', (e) => {
  e.preventDefault();
  const t = e.target.texto.value.trim();
  window.open(waLink(t || 'Hola, quisiera hacer una consulta.'), '_blank', 'noopener');
});

// ===== Aparición al hacer scroll =====
const anims = $$('[data-anim]');
anims.forEach((el) => {
  if (el.dataset.anim !== 'revela') [...el.children].forEach((c, i) => c.style.setProperty('--i', i));
});
// Las fotos del bento entran en cascada
$$('.bento [data-anim]').forEach((el, i) => el.style.setProperty('--i', i % 3));
if (reduce || !('IntersectionObserver' in window)) {
  anims.forEach((el) => el.classList.add('visto'));
} else {
  const io = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('visto'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  anims.forEach((el) => io.observe(el));
}

// ===== Cinta de servicios: se duplica para que el giro no tenga corte =====
const pista = $('.cinta__pista');
pista.insertAdjacentHTML('beforeend', pista.innerHTML.replace(/<li>/g, '<li aria-hidden="true">'));

// ===== Carrusel de sonrisas: avanza solo y se puede arrastrar =====
(function carrusel() {
  const cont = $('[data-carrusel]');
  const p = $('.carrusel__pista', cont);
  p.insertAdjacentHTML('beforeend', p.innerHTML.replace(/<figure/g, '<figure aria-hidden="true"').replace(/alt="[^"]*"/g, 'alt=""'));
  let x = 0, vel = reduce ? 0 : 0.45, arrastre = null, pausa = false, visible = false, ultimo = 0;
  const mitad = () => p.scrollWidth / 2;
  const envolver = () => { const m = mitad(); if (m) { x %= m; if (x > 0) x -= m; } };
  function cuadro(t) {
    const dt = ultimo ? Math.min(48, t - ultimo) : 16;
    ultimo = t;
    if (!arrastre && !pausa) x -= vel * dt / 16;
    envolver();
    p.style.transform = `translate3d(${x}px,0,0)`;
    if (visible) requestAnimationFrame(cuadro); else ultimo = 0;
  }
  new IntersectionObserver(([en]) => {
    const antes = visible; visible = en.isIntersecting;
    if (visible && !antes) requestAnimationFrame(cuadro);
  }).observe(cont);
  cont.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') pausa = true; });
  cont.addEventListener('pointerleave', () => { pausa = false; });
  cont.addEventListener('pointerdown', (e) => {
    arrastre = { inicio: e.clientX, x0: x, v: 0, ult: e.clientX };
    cont.classList.add('arrastrando');
    cont.setPointerCapture(e.pointerId);
  });
  cont.addEventListener('pointermove', (e) => {
    if (!arrastre) return;
    arrastre.v = e.clientX - arrastre.ult; arrastre.ult = e.clientX;
    x = arrastre.x0 + (e.clientX - arrastre.inicio);
  });
  const soltar = () => {
    if (!arrastre) return;
    // inercia corta al soltar
    let v = arrastre.v;
    arrastre = null; cont.classList.remove('arrastrando');
    (function inercia() { if (Math.abs(v) < 0.3) return; x += v; v *= 0.92; requestAnimationFrame(inercia); })();
  };
  cont.addEventListener('pointerup', soltar);
  cont.addEventListener('pointercancel', soltar);
})();

// ===== Parallax suave en fotos grandes =====
const parallax = $$('[data-parallax]');
if (!reduce && parallax.length) {
  let pendiente = false;
  const mover = () => {
    pendiente = false;
    const vh = innerHeight;
    parallax.forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const d = (r.top + r.height / 2 - vh / 2) * parseFloat(img.dataset.parallax);
      img.style.transform = `translate3d(0,${d.toFixed(1)}px,0)`;
    });
  };
  parallax.forEach((img) => { if (!img.closest('.hero__marco')) img.style.scale = '1.14'; });
  addEventListener('scroll', () => { if (!pendiente) { pendiente = true; requestAnimationFrame(mover); } }, { passive: true });
  mover();
}

// ===== Pasos de la primera visita: la línea avanza con el scroll =====
const pasos = $('[data-pasos]');
if (pasos) {
  const items = $$('li', pasos);
  const actualizar = () => {
    const r = pasos.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.62 - r.top) / r.height));
    pasos.style.setProperty('--p', p.toFixed(3));
    items.forEach((li) => li.classList.toggle('activo', li.getBoundingClientRect().top < innerHeight * 0.62));
  };
  addEventListener('scroll', () => requestAnimationFrame(actualizar), { passive: true });
  actualizar();
}

// ===== Comparador antes / después =====
const comp = $('[data-comparador]');
if (comp) {
  const rango = $('.comparador__rango', comp);
  const poner = (v) => { comp.style.setProperty('--pos', v + '%'); rango.value = v; };
  rango.addEventListener('input', () => poner(rango.value));
  // Al aparecer, la barra se mueve sola para enseñar que se puede arrastrar
  if (!reduce) {
    let tocado = false;
    rango.addEventListener('pointerdown', () => (tocado = true), { once: true });
    new IntersectionObserver(([en], obs) => {
      if (!en.isIntersecting) return;
      obs.disconnect();
      const pasos_ = [[50, 22], [22, 78], [78, 50]];
      let i = 0, t0 = null;
      setTimeout(function paso(t) {
        requestAnimationFrame(function f(t) {
          if (tocado) return;
          t0 ??= t;
          const k = Math.min(1, (t - t0) / 700), e = k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;
          const [a, b] = pasos_[i];
          poner(Math.round(a + (b - a) * e));
          if (k < 1) requestAnimationFrame(f);
          else if (++i < pasos_.length) { t0 = null; requestAnimationFrame(f); }
        });
      }, 700);
    }, { threshold: 0.6 }).observe(comp);
  }
}

$$('[data-ir-servicio]').forEach((b) => b.addEventListener('click', () => {
  mostrar(b.dataset.irServicio);
  $('#servicios').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}));

// ===== Dientín: cuelga del hilo dental y se balancea =====
(function dientin() {
  const pendulo = $('[data-pendulo]');
  if (!pendulo) return;
  const diente = $('[data-dientin]', pendulo);
  const globo = $('[data-colgante-globo]');
  const frases = ['¡Hola!', '¡Wiii!', '¡Me mareo!', '¡Usa hilo dental!', '¡Sonríe!', '¡Otra vez!'];
  let ang = 0, vel = 0, activo = false, agarre = null, tGlobo;

  const decir = (txt) => {
    globo.textContent = txt;
    globo.classList.add('ver');
    clearTimeout(tGlobo);
    tGlobo = setTimeout(() => globo.classList.remove('ver'), 1800);
  };

  // Baja colgando cuando termina la carga
  pendulo.classList.add('bajando');
  const empezar = () => {
    pendulo.classList.remove('bajando');
    if (reduce) return;
    activo = true;
    vel = 2.2; // empujoncito inicial
    decir('¡Hola!');
    requestAnimationFrame(paso);
  };
  new MutationObserver((m, obs) => {
    if ($('.hero').classList.contains('listo')) { obs.disconnect(); setTimeout(empezar, 1500); }
  }).observe($('.hero'), { attributes: true, attributeFilter: ['class'] });

  // Péndulo amortiguado; el hero fuera de pantalla lo pausa
  let ultimo = 0, visible = true;
  new IntersectionObserver(([en]) => {
    const antes = visible; visible = en.isIntersecting;
    if (visible && !antes && activo) { ultimo = 0; requestAnimationFrame(paso); }
  }).observe($('.hero'));
  function paso(t) {
    const dt = ultimo ? Math.min(0.033, (t - ultimo) / 1000) : 0.016;
    ultimo = t;
    if (!agarre) {
      const brisa = Math.sin(t / 1400) * 0.9; // vaivén suave aunque nadie lo toque
      vel += (-26 * Math.sin(ang * Math.PI / 180) * 3 - vel * 1.1 + brisa) * dt * 3;
      ang += vel * dt * 12;
      ang = Math.max(-70, Math.min(70, ang));
    }
    pendulo.style.setProperty('--ang', ang.toFixed(2) + 'deg');
    if (visible && activo) requestAnimationFrame(paso); else ultimo = 0;
  }

  // El mouse lo empuja al pasar cerca
  let px = null;
  $('.hero').addEventListener('pointermove', (e) => {
    if (!activo || agarre || e.pointerType !== 'mouse') return;
    const r = diente.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (px !== null && Math.hypot(e.clientX - cx, e.clientY - cy) < r.width * 0.75) {
      vel += Math.max(-6, Math.min(6, (e.clientX - px) * 0.18));
    }
    px = e.clientX;
  });

  // Se puede agarrar y soltar; un toque lo hace girar
  diente.addEventListener('pointerdown', (e) => {
    if (!activo) return;
    const ancla = pendulo.getBoundingClientRect();
    agarre = { x: ancla.left, y: ancla.top, x0: e.clientX, mov: 0, prev: ang };
    diente.classList.add('agarrado');
    diente.setPointerCapture(e.pointerId);
  });
  diente.addEventListener('pointermove', (e) => {
    if (!agarre) return;
    agarre.mov += Math.abs(e.clientX - agarre.x0); agarre.x0 = e.clientX;
    const a = Math.atan2(e.clientX - agarre.x, e.clientY - agarre.y) * -180 / Math.PI;
    agarre.prev = ang;
    ang = Math.max(-70, Math.min(70, a));
  });
  const soltar = () => {
    if (!agarre) return;
    const toque = agarre.mov < 6;
    vel = (ang - agarre.prev) * 0.9;
    agarre = null;
    diente.classList.remove('agarrado');
    if (toque) {
      diente.classList.remove('gira'); void diente.offsetWidth; diente.classList.add('gira');
      vel += (Math.random() > 0.5 ? 1 : -1) * 5;
    }
    decir(frases[Math.floor(Math.random() * frases.length)]);
  };
  diente.addEventListener('pointerup', soltar);
  diente.addEventListener('pointercancel', soltar);
})();

// ===== Gotita: la pasta dental que camina mientras bajas =====
(function gotita() {
  const g = $('[data-gotita]');
  if (!g) return;
  const globo = $('[data-gotita-globo]', g);
  const btn = $('[data-gotita-btn]', g);
  const consejos = [...CONSEJOS, '¡Cosquillas no, que me derramo!', '¡Tu sonrisa me hace brillar!'];
  let x = 16, objetivo = 16, tGlobo, tHablar, ultimaFrase = '';

  const decir = (txt, ms = 3200) => {
    if (!txt) return;
    globo.textContent = txt;
    globo.classList.add('ver');
    clearTimeout(tGlobo);
    tGlobo = setTimeout(() => globo.classList.remove('ver'), ms);
  };

  // Recorre el ancho de la pantalla según cuánto has bajado (deja libre el botón de WhatsApp)
  const calcular = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? scrollY / max : 0;
    const libre = innerWidth - g.offsetWidth - 110;
    objetivo = 12 + Math.max(0, libre - 12) * p;
  };
  let quieto = 0;
  function cuadro() {
    const dx = objetivo - x;
    x += dx * 0.08;
    if (Math.abs(dx) > 0.6) {
      g.classList.add('camina');
      g.style.setProperty('--dir', dx > 0 ? 1 : -1);
      quieto = 0;
    } else if (++quieto > 8) g.classList.remove('camina');
    g.style.setProperty('--x', x.toFixed(1) + 'px');
    g.classList.toggle('a-la-derecha', x > innerWidth / 2);
    requestAnimationFrame(cuadro);
  }
  if (!reduce) {
    addEventListener('scroll', calcular, { passive: true });
    addEventListener('resize', calcular);
    calcular(); x = objetivo;
    requestAnimationFrame(cuadro);
  } else {
    g.style.setProperty('--x', '12px');
  }

  // Comenta cada sección cuando aparece
  const io = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (!en.isIntersecting) return;
    const frase = en.target.dataset.gotitaDice;
    if (frase === ultimaFrase) return;
    ultimaFrase = frase;
    clearTimeout(tHablar);
    tHablar = setTimeout(() => decir(frase), 350);
  }), { threshold: 0.35 });
  const secciones = $$('[data-gotita-dice]');

  // Bienvenida: al terminar la carga brinca, sonríe y saluda con el nombre del centro
  const saludar = () => {
    const nombre = ($('[data-nombre]')?.textContent || '').trim();
    const hero = $('#inicio');
    if (hero) ultimaFrase = hero.dataset.gotitaDice;
    g.classList.remove('brinca'); void g.offsetWidth; g.classList.add('brinca', 'feliz');
    setTimeout(() => g.classList.remove('feliz'), 1600);
    decir(`¡Hola, bienvenido${nombre ? ` al Centro Odontológico ${nombre}` : ''}! Soy Gotita y te acompaño por la página.`, 6000);
  };
  const arrancar = () => {
    setTimeout(saludar, 500);
    setTimeout(() => secciones.forEach((s) => io.observe(s)), 600);
  };
  if (document.body.classList.contains('cargando')) {
    new MutationObserver((m, obs) => {
      if (!document.body.classList.contains('cargando')) { obs.disconnect(); arrancar(); }
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  } else arrancar();

  // Al tocarla brinca y da un consejo
  btn.addEventListener('click', () => {
    g.classList.remove('brinca'); void g.offsetWidth; g.classList.add('brinca', 'feliz');
    setTimeout(() => g.classList.remove('feliz'), 1200);
    decir(consejos[Math.floor(Math.random() * consejos.length)]);
  });

  // Los ojos siguen al cursor
  const pupilas = $$('.gotita__pupila, .dientin__pupila');
  const base = pupilas.map((p) => [+p.getAttribute('cx'), +p.getAttribute('cy')]);
  addEventListener('pointermove', (e) => {
    pupilas.forEach((p, i) => {
      const svg = p.ownerSVGElement.getBoundingClientRect();
      const dx = e.clientX - (svg.left + svg.width / 2), dy = e.clientY - (svg.top + svg.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const dir = p.closest('.gotita') ? +getComputedStyle(g).getPropertyValue('--dir') || 1 : 1;
      p.setAttribute('cx', (base[i][0] + (dx / d) * 1.6 * dir).toFixed(2));
      p.setAttribute('cy', (base[i][1] + (dy / d) * 2.2 + 1.2).toFixed(2));
    });
  }, { passive: true });
})();
