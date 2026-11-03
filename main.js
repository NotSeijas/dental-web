// ===== Datos del negocio (editar aquí) =====
const NEGOCIO = {
  nombre: 'Raíz', // nombre provisional, confirmar con el cliente
  wa: '51972845629',
  telefono: '972 845 629',
  direccion: 'Dirección por confirmar',
  // 0 = domingo … 6 = sábado; tramos en horas decimales
  horario: {
    1: [[9, 13], [15, 20]],
    2: [[9, 13], [15, 20]],
    3: [[9, 13], [15, 20]],
    4: [[9, 13], [15, 20]],
    5: [[9, 13], [15, 20]],
    6: [[9, 14]],
  },
};

const SERVICIOS = [
  {
    id: 'evaluacion', nombre: 'Evaluación y diagnóstico', img: 'diagnostico',
    alt: 'Odontólogo revisando radiografías dentales',
    desc: 'El punto de partida: revisamos dientes, encías y mordida, y te damos un plan claro con presupuesto antes de empezar cualquier tratamiento.',
    incluye: ['Examen clínico completo', 'Radiografías si hacen falta', 'Plan de tratamiento y presupuesto'],
    dur: '30 a 40 minutos',
  },
  {
    id: 'limpieza', nombre: 'Limpieza dental', img: 'limpieza',
    alt: 'Limpieza dental con espejo y explorador',
    desc: 'Retiramos el sarro y la placa que el cepillo no alcanza, pulimos y protegemos tus dientes con flúor. Recomendada cada seis meses.',
    incluye: ['Destartraje con ultrasonido', 'Pulido y profilaxis', 'Aplicación de flúor'],
    dur: '45 minutos',
  },
  {
    id: 'blanqueamiento', nombre: 'Blanqueamiento', img: 'blanqueamiento',
    alt: 'Sonrisa con dientes blancos',
    desc: 'Aclaramos el tono de tus dientes de forma segura, en consultorio y con indicaciones para mantener el resultado en casa.',
    incluye: ['Evaluación previa del esmalte', 'Sesión en consultorio', 'Cuidados para casa'],
    dur: '60 a 90 minutos',
  },
  {
    id: 'ortodoncia', nombre: 'Ortodoncia con brackets', img: 'ortodoncia',
    alt: 'Paciente con brackets durante un control',
    desc: 'Alineamos tus dientes y corregimos la mordida con brackets metálicos o estéticos, con controles mensuales durante todo el tratamiento.',
    incluye: ['Estudio de ortodoncia', 'Brackets metálicos o estéticos', 'Controles mensuales'],
    dur: 'Controles de 20 a 30 minutos',
  },
  {
    id: 'alineadores', nombre: 'Alineadores invisibles', img: 'alineadores',
    alt: 'Persona colocándose un alineador transparente',
    desc: 'Placas transparentes que mueven tus dientes poco a poco, casi sin que se noten. Te las quitas para comer y cepillarte.',
    incluye: ['Escaneo y plan digital', 'Juego de alineadores', 'Controles de avance'],
    dur: 'Evaluación de 40 minutos',
  },
  {
    id: 'implantes', nombre: 'Implantes dentales', img: 'implantes',
    alt: 'Modelo de un implante dental entre dientes naturales',
    desc: 'Reemplazamos el diente que falta con una raíz de titanio y una corona fija que se ve y se siente como un diente propio.',
    incluye: ['Evaluación con radiografía', 'Colocación del implante', 'Corona definitiva'],
    dur: 'Según el plan de tratamiento',
  },
  {
    id: 'endodoncia', nombre: 'Endodoncia y curaciones', img: 'restauracion',
    alt: 'Modelo de un diente mostrando la raíz y el nervio',
    desc: 'Tratamos caries y dientes con dolor para conservarlos: curaciones con resina del color del diente y tratamiento de conducto.',
    incluye: ['Curaciones con resina', 'Tratamiento de conducto', 'Reconstrucción del diente'],
    dur: '45 a 90 minutos',
  },
  {
    id: 'ninos', nombre: 'Odontopediatría', img: 'ninos',
    alt: 'Odontólogo revisando los dientes de un niño',
    desc: 'Atención para los más pequeños con paciencia y sin apuros, para que sus primeras visitas al dentista sean una buena experiencia.',
    incluye: ['Control y limpieza', 'Sellantes y flúor', 'Curaciones de dientes de leche'],
    dur: '30 a 45 minutos',
  },
  {
    id: 'estetica', nombre: 'Carillas y diseño de sonrisa', img: 'estetica',
    alt: 'Primer plano de una sonrisa cuidada',
    desc: 'Mejoramos la forma, el tamaño y el color de tus dientes con carillas de resina o porcelana, planificadas según tu rostro.',
    incluye: ['Diseño de sonrisa', 'Carillas de resina o porcelana', 'Ajustes finales'],
    dur: 'Según el plan de tratamiento',
  },
  {
    id: 'cirugia', nombre: 'Cirugía y extracciones', img: 'cirugia',
    alt: 'Odontólogos realizando un procedimiento',
    desc: 'Extracciones simples y de muelas del juicio con anestesia local, indicaciones claras y control posterior.',
    incluye: ['Extracciones simples', 'Muelas del juicio', 'Control postoperatorio'],
    dur: '30 a 60 minutos',
  },
];

const CHIPS = [
  'Quiero agendar una evaluación.',
  'Tengo dolor de muela, ¿me pueden atender hoy?',
  '¿Cuánto cuesta el blanqueamiento?',
  'Quiero información sobre ortodoncia.',
  'Quiero información sobre implantes.',
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
[[1, 5, 'Lunes a viernes'], [6, 6, 'Sábado'], [0, 0, 'Domingo']].forEach(([d, , etiqueta]) => {
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
window.addEventListener('load', () => {
  setTimeout(() => document.body.classList.remove('cargando'), reduce ? 0 : 650);
});
setTimeout(() => document.body.classList.remove('cargando'), 3000);

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

// ===== Reserva =====
const form = $('[data-reserva]');
const selServ = $('[data-campo-servicio]');
selServ.innerHTML = `<option value="">Elige un servicio…</option>` +
  SERVICIOS.map((s) => `<option value="${s.id}">${s.nombre}</option>`).join('');

const cita = { servicio: '', dia: null, hora: null, nombre: '', celular: '', comentario: '' };

function elegirServicio(id) {
  selServ.value = id;
  cita.servicio = id;
  pintarTarjeta();
}
$$('[data-preselect]').forEach((a) => a.addEventListener('click', () => elegirServicio(a.dataset.preselect)));

// Días: los próximos 14 días con atención
const diasEl = $('[data-dias]');
const horasEl = $('[data-horas]');
const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
const diasDisp = [];
for (let i = 0; diasDisp.length < 12 && i < 21; i++) {
  const d = new Date(hoy); d.setDate(d.getDate() + i);
  if (!NEGOCIO.horario[d.getDay()]) continue;
  if (i === 0 && slotsDe(d).length === 0) continue;
  diasDisp.push(d);
}
function slotsDe(d) {
  const out = [];
  const esHoy = d.getTime() === hoy.getTime();
  const limite = esHoy ? horaDecimal(new Date()) + 1 : -1; // mínimo una hora de anticipación
  (NEGOCIO.horario[d.getDay()] || []).forEach(([a, b]) => {
    for (let h = a; h <= b - 0.5; h += 0.5) if (h >= limite) out.push(h);
  });
  return out;
}
diasDisp.forEach((d, i) => {
  const etiqueta = i === 0 && d.getTime() === hoy.getTime() ? 'Hoy' : DIAS_CORTOS[d.getDay()];
  diasEl.insertAdjacentHTML('beforeend', `
    <button type="button" class="dia" role="radio" aria-checked="false" data-i="${i}"
      aria-label="${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}">
      <span>${etiqueta}</span><strong>${d.getDate()}</strong><small>${MESES[d.getMonth()].slice(0, 3)}</small>
    </button>`);
});

function pintarHoras() {
  horasEl.innerHTML = '';
  if (!cita.dia) {
    horasEl.innerHTML = '<p class="horas__vacio">Primero elige un día.</p>';
    return;
  }
  const slots = slotsDe(cita.dia);
  const grupos = { 'Mañana': slots.filter((h) => h < 13), 'Tarde': slots.filter((h) => h >= 13) };
  Object.entries(grupos).forEach(([nom, hs]) => {
    if (!hs.length) return;
    horasEl.insertAdjacentHTML('beforeend', `<p class="horas__grupo">${nom}</p>`);
    const fila = document.createElement('div');
    fila.className = 'horas__fila';
    hs.forEach((h) => fila.insertAdjacentHTML('beforeend',
      `<button type="button" class="hora" role="radio" aria-checked="${cita.hora === h}" data-h="${h}">${fmtHora(h)}</button>`));
    horasEl.appendChild(fila);
  });
}

diasEl.addEventListener('click', (e) => {
  const b = e.target.closest('.dia');
  if (!b) return;
  $$('.dia', diasEl).forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  cita.dia = diasDisp[+b.dataset.i];
  cita.hora = null;
  pintarHoras();
  pintarTarjeta();
});
horasEl.addEventListener('click', (e) => {
  const b = e.target.closest('.hora');
  if (!b) return;
  $$('.hora', horasEl).forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  cita.hora = +b.dataset.h;
  pintarTarjeta();
});
selServ.addEventListener('change', () => { cita.servicio = selServ.value; pintarTarjeta(); });
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
  const s = SERVICIOS.find((x) => x.id === cita.servicio);
  pon('[data-t-nombre]', cita.nombre);
  pon('[data-t-servicio]', s ? s.nombre : '');
  pon('[data-t-dia]', cita.dia ? fechaLarga(cita.dia) : '');
  pon('[data-t-hora]', cita.hora != null ? fmtHora(cita.hora) : '');
  tarjeta.classList.remove('enviada');
  $('[data-error]').textContent = '';
}

function enviar() {
  const faltan = [];
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
  const s = SERVICIOS.find((x) => x.id === cita.servicio);
  const msg = [
    'Hola, quiero reservar una cita:',
    `• Servicio: ${s.nombre}`,
    `• Día: ${fechaLarga(cita.dia)}`,
    `• Hora: ${fmtHora(cita.hora)}`,
    `• Nombre: ${cita.nombre}`,
    `• Celular: ${cita.celular}`,
    cita.comentario ? `• Comentario: ${cita.comentario}` : '',
  ].filter(Boolean).join('\n');
  tarjeta.classList.add('enviada');
  // Se abre en el mismo gesto del clic para que el navegador no lo bloquee
  window.open(waLink(msg), '_blank', 'noopener');
}
$('[data-enviar]').addEventListener('click', enviar);
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
if (!reduce && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('visto'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -12% 0px' });
  $$('.cabeza, .visita__txt, .visita__foto, .reservar__txt, .wa__txt, .cierre__txt').forEach((el) => {
    el.classList.add('aparece'); io.observe(el);
  });
}
