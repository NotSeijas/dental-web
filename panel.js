// ===== Panel de cada odontólogo: su agenda, sus turnos y solicitudes para unirse =====
import {
  app, configurado, escucharTodos, escucharNotas, escucharSolicitudes,
  guardarOcupado, guardarNota, crearSolicitud, cambiarSolicitud, leerPerfil, escucharServicios, guardarServicios,
} from './agenda.js';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence,
  EmailAuthProvider, reauthenticateWithCredential, updatePassword,
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
const nombre = (id) => doctor(id)?.nombre || 'Otro doctor';
// Nombre con aviso si ese turno es "por confirmar" para ese doctor
const conConf = (id, t, txt) => (porConfirmar(id, t) ? `${txt} (algunos días)` : txt);
const fechaCorta = (f) => { const [y, m, d] = f.split('-').map(Number); const x = new Date(y, m - 1, d); return `${DIAS_CORTOS[x.getDay()]} ${d} ${MESES[m - 1].slice(0, 3)}`; };
const juntar = (xs) => xs.length > 1 ? xs.slice(0, -1).join(', ') + ' y ' + xs.at(-1) : xs[0] || '';
$$('[data-nombre]').forEach((el) => (el.textContent = NEGOCIO.nombre));

// Vista de prueba sin Firebase, solo en la compu (localhost/panel.html?demo o ?demo=d2)
const params = new URLSearchParams(location.search);
const demo = params.has('demo') && ['localhost', '127.0.0.1'].includes(location.hostname);

// Próximos 30 días en que abre la clínica
const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
const dias = [];
for (let i = 0; i < 31; i++) {
  const d = new Date(hoy); d.setDate(d.getDate() + i);
  if (NEGOCIO.horario[d.getDay()]) dias.push(d);
}

let YO = null;          // id del doctor cuya agenda se ve (d1, d2, d3)
let ADMIN = false;      // la cuenta de administración puede ver la agenda de cualquiera
let TODOS = {};         // ocupados de todos los doctores
let NOTAS = {};         // notas privadas del doctor
let SOLIC = [];         // solicitudes para unirse a turnos
let sel = dias[0];

const ocup = (id, d) => TODOS[id]?.[claveFecha(d)] || { completo: false, horas: [] };
const estado = (d) => ocup(YO, d);
const misTurnos = (d) => turnosDe(YO, d, SOLIC);
const misHoras = (d) => horasDeDoctor(YO, d, SOLIC);
const pasada = (d, h) => d.getTime() === hoy.getTime() && h + 0.5 <= new Date().getHours() + new Date().getMinutes() / 60;
const estaOcupado = (id, d, h) => { const e = ocup(id, d); return e.completo || e.horas.includes(h); };

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
    guardadoEl.textContent = err.code === 'permission-denied' ? 'No tienes permiso para esto.' : 'No se pudo guardar. Revisa tu internet.';
    guardadoEl.classList.add('mal');
  }
  clearTimeout(tGuardado);
  tGuardado = setTimeout(() => (guardadoEl.textContent = ''), 2500);
}
let idDemo = 0;
const api = demo
  ? {
    ocupado: async (id, f, v) => { (TODOS[id] ||= {})[f] = v; pintarTodo(); },
    nota: async (id, f, h, t) => { (NOTAS[f] ||= {})[h] = t; },
    crear: async (s) => { SOLIC = [...SOLIC, { id: 'demo' + ++idDemo, ...s }]; pintarTodo(); },
    cambiar: async (id, e) => { SOLIC = SOLIC.map((s) => (s.id === id ? { ...s, estado: e } : s)); pintarTodo(); },
    servicios: async () => {},
  }
  : {
    ocupado: guardarOcupado, nota: guardarNota,
    crear: crearSolicitud, cambiar: cambiarSolicitud, servicios: guardarServicios,
  };

// ----- Mis servicios: cada doctor marca los que realiza y puede agregar otros -----
const servEl = $('[data-servicios]');
const misServicios = () => doctor(YO)?.funciones || [];
const esDelCatalogo = (x) => SERVICIOS.some((s) => s.id === x);
function pintarMisServicios() {
  if (!doctor(YO)) { servEl.hidden = true; return; }
  servEl.hidden = false;
  const mios = misServicios();
  $('[data-serv-resumen]').textContent = `· ${mios.length} servicio${mios.length === 1 ? '' : 's'}`;
  $('[data-serv-lista]').innerHTML = SERVICIOS.map((x) => `
    <label class="serv"><input type="checkbox" value="${x.id}"${mios.includes(x.id) ? ' checked' : ''}><span>${x.nombre}</span></label>`).join('')
    + mios.filter((x) => !esDelCatalogo(x)).map((x) => `
    <span class="serv serv--otro"><span>${escHtml(x)}</span><button type="button" data-quitar="${escHtml(x)}" aria-label="Quitar ${escHtml(x)}">×</button></span>`).join('');
}
function guardarMisServicios(lista) {
  // Primero los del catálogo (en su orden), luego los propios
  const orden = [...SERVICIOS.map((x) => x.id).filter((id) => lista.includes(id)), ...lista.filter((x) => !esDelCatalogo(x))];
  doctor(YO).funciones = orden;
  pintarMisServicios();
  guardar(api.servicios(YO, orden));
}
servEl.addEventListener('change', (e) => {
  if (!e.target.matches('input[type="checkbox"]')) return;
  const mios = misServicios().filter((x) => x !== e.target.value);
  if (e.target.checked) mios.push(e.target.value);
  guardarMisServicios(mios);
});
servEl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-quitar]');
  if (b) guardarMisServicios(misServicios().filter((x) => x !== b.dataset.quitar));
});
$('[data-serv-otro]').addEventListener('submit', (e) => {
  e.preventDefault();
  const t = e.target.nombre.value.trim().replace(/\s+/g, ' ');
  if (!t) return;
  const igual = SERVICIOS.find((x) => x.nombre.toLowerCase() === t.toLowerCase());
  const valor = igual ? igual.id : t;
  if (!misServicios().includes(valor)) guardarMisServicios([...misServicios(), valor]);
  e.target.reset();
});

function cambiarOcupado(d, cambio) {
  const f = claveFecha(d);
  const v = { ...estado(d), ...cambio };
  (TODOS[YO] ||= {})[f] = v; // se ve al instante; Firestore confirma después
  pintarTodo();
  guardar(api.ocupado(YO, f, v));
}

// ----- Solicitudes que me llegan y las que envié -----
const bandejaEl = $('[data-bandeja]');
function pintarBandeja() {
  const desde = claveFecha(hoy);
  const vigentes = SOLIC.filter((s) => s.estado === 'pendiente' && s.fecha >= desde);
  const llegan = vigentes.filter((s) => s.para === YO);
  const envie = vigentes.filter((s) => s.de === YO);
  bandejaEl.hidden = !llegan.length && !envie.length;
  bandejaEl.innerHTML = [
    ...llegan.map((s) => `<div class="aviso-sol aviso-sol--llega">
      <p><b>${nombre(s.de)}</b> quiere unirse a tu turno <b>${TURNOS[s.turno].nombre.toLowerCase()}</b> del ${fechaCorta(s.fecha)}.</p>
      <div><button class="boton boton--chico" type="button" data-resp="aceptada" data-id="${s.id}">Aceptar</button>
      <button class="boton boton--chico boton--suave" type="button" data-resp="rechazada" data-id="${s.id}">Rechazar</button></div>
    </div>`),
    ...envie.map((s) => `<div class="aviso-sol">
      <p>Pediste unirte al turno <b>${TURNOS[s.turno].nombre.toLowerCase()}</b> de <b>${nombre(s.para)}</b> el ${fechaCorta(s.fecha)}. Esperando respuesta…</p>
      <div><button class="boton boton--chico boton--suave" type="button" data-resp="cancelada" data-id="${s.id}">Cancelar</button></div>
    </div>`),
  ].join('');
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-resp]');
  if (!b) return;
  guardar(api.cambiar(b.dataset.id, b.dataset.resp));
});

// ----- Lista de días -----
const listaEl = $('[data-lista-dias]');
function pintarLista() {
  listaEl.innerHTML = dias.map((d, i) => {
    const e = estado(d), horas = misHoras(d), total = horas.length;
    const n = e.completo ? total : horas.filter((h) => e.horas.includes(h)).length;
    const etiqueta = d.getTime() === hoy.getTime() ? 'Hoy' : DIAS_CORTOS[d.getDay()];
    const turnos = misTurnos(d).map((t) => TURNOS[t].nombre).join(' + ');
    const pend = SOLIC.some((s) => s.para === YO && s.estado === 'pendiente' && s.fecha === claveFecha(d));
    const txt = !total ? 'Sin turno' : e.completo ? 'Día cerrado' : n ? `${turnos} · ${n} de ${total} ocupadas` : `${turnos} · todo libre`;
    return `<button type="button" class="dia-item${d === sel ? ' activo' : ''}${e.completo && total ? ' cerrado' : ''}${!total ? ' sin-mi-turno' : ''}" data-i="${i}">
      <span class="dia-item__fecha"><b>${etiqueta}</b> ${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}${pend ? ' <i class="punto" title="Solicitud nueva"></i>' : ''}</span>
      <span class="dia-item__txt">${txt}</span>
      <span class="dia-item__barra"><span style="width:${total ? (n / total) * 100 : 0}%"></span></span>
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

// ----- Turnos del día: unirse al turno de otro doctor -----
const turnosEl = $('[data-turnos]');
function pintarTurnos() {
  const f = claveFecha(sel);
  const pasado = sel.getTime() < hoy.getTime();
  turnosEl.innerHTML = Object.keys(TURNOS).filter((t) => horasDeTurno(t).length).map((t) => {
    const fijos = DOCTORES.filter((x) => (x.turnos[sel.getDay()] || []).includes(t)).map((x) => x.id);
    const en = doctoresEnTurno(t, sel, SOLIC);
    const otros = en.filter((x) => x !== YO);
    const mia = SOLIC.find((s) => s.de === YO && s.fecha === f && s.turno === t && ['pendiente', 'aceptada', 'abierto'].includes(s.estado));
    const rechazada = SOLIC.find((s) => s.de === YO && s.fecha === f && s.turno === t && s.estado === 'rechazada');
    const horario = `${fmtHora(TURNOS[t].desde)} – ${fmtHora(TURNOS[t].hasta)}`;
    let clase = '', estadoTxt, accion = '';
    if (en.includes(YO)) {
      clase = 'mio';
      estadoTxt = fijos.includes(YO) ? conConf(YO, t, 'Tu turno') : 'Te uniste a este turno';
      if (otros.length) estadoTxt += ` · con ${juntar(otros.map((o) => conConf(o, t, nombre(o))))}`;
      if (mia && !fijos.includes(YO)) accion = `<button class="enlace" type="button" data-resp="cancelada" data-id="${mia.id}">Dejar turno</button>`;
    } else if (mia?.estado === 'pendiente') {
      clase = 'espera';
      estadoTxt = `Solicitud enviada a ${nombre(mia.para)}`;
      accion = `<button class="enlace" type="button" data-resp="cancelada" data-id="${mia.id}">Cancelar</button>`;
    } else if (otros.length) {
      estadoTxt = `Atiende ${juntar(otros.map(nombre))}${rechazada ? ' · rechazó tu solicitud' : ''}`;
      const para = fijos.find((x) => x !== YO) || otros[0];
      if (!pasado) accion = `<button class="boton boton--chico" type="button" data-unirme="${t}" data-para="${para}">Pedir unirme</button>`;
    } else {
      clase = 'libre';
      estadoTxt = 'Nadie atiende este turno';
      if (!pasado) accion = `<button class="boton boton--chico" type="button" data-tomar="${t}">Tomar turno</button>`;
    }
    return `<div class="turno ${clase}">
      <p class="turno__nom">${TURNOS[t].nombre} <small>${horario}</small></p>
      <p class="turno__estado">${estadoTxt}</p>
      ${accion ? `<div class="turno__accion">${accion}</div>` : ''}
    </div>`;
  }).join('');
}
turnosEl.addEventListener('click', (e) => {
  const u = e.target.closest('[data-unirme]');
  const t = e.target.closest('[data-tomar]');
  const fecha = claveFecha(sel);
  if (u) guardar(api.crear({ de: YO, para: u.dataset.para, fecha, turno: u.dataset.unirme, estado: 'pendiente' }));
  if (t) guardar(api.crear({ de: YO, para: null, fecha, turno: t.dataset.tomar, estado: 'abierto' }));
});

// ----- Horas del día elegido -----
const horarioEl = $('[data-horario]');
const completoEl = $('[data-completo]');
let firma = '';
function pintarDia(nuevo = false) {
  const e = estado(sel), f = claveFecha(sel);
  $('[data-dia-sub]').textContent = sel.getTime() === hoy.getTime() ? 'Hoy' : DIAS[sel.getDay()];
  $('[data-dia-titulo]').textContent = `${DIAS[sel.getDay()][0].toUpperCase()}${DIAS[sel.getDay()].slice(1)} ${sel.getDate()} de ${MESES[sel.getMonth()]}`;
  pintarTurnos();
  const turnos = misTurnos(sel);
  const horas = misHoras(sel);
  $('[data-con-turno]').hidden = !horas.length;
  $('[data-sin-turno]').hidden = !!horas.length;
  completoEl.checked = e.completo;
  completoEl.closest('label').hidden = !horas.length;
  const ocupadas = horas.filter((h) => e.horas.includes(h)).length;
  const libres = e.completo ? 0 : horas.filter((h) => !e.horas.includes(h) && !pasada(sel, h)).length;
  $('[data-resumen]').innerHTML = e.completo
    ? '<span class="pastilla pastilla--cerrado">Los pacientes ven este día como lleno</span>'
    : `<span class="pastilla">${libres} horas libres</span><span class="pastilla pastilla--ocupada">${ocupadas} ocupadas</span>`;

  // Se rearma la grilla solo si cambió el día o los turnos (para no perder lo que se escribe)
  const nuevaFirma = f + YO + turnos.join() + turnos.map((t) => doctoresEnTurno(t, sel, SOLIC).join()).join('|');
  if (nuevo || nuevaFirma !== firma) {
    firma = nuevaFirma;
    horarioEl.innerHTML = turnos.map((t) => {
      const otros = doctoresEnTurno(t, sel, SOLIC).filter((x) => x !== YO);
      return `<div class="grupo"><p class="grupo__titulo">Turno ${TURNOS[t].nombre.toLowerCase()}${otros.length ? ` · compartido con ${juntar(otros.map((o) => conConf(o, t, nombre(o))))}` : ''}</p>
        ${otros.length ? '<p class="grupo__juntos" data-juntos></p>' : ''}
        ${horasDeTurno(t).map((h) => `<div class="fila" data-h="${h}">
          <button type="button" class="hora" data-toggle aria-pressed="false">
            <span class="hora__t">${fmtHora(h)}</span><span class="hora__estado"></span>
          </button>
          <input class="nota" type="text" maxlength="80" placeholder="Paciente o tratamiento (opcional)" aria-label="Nota de las ${fmtHora(h)}">
          ${otros.length ? `<span class="otros">${otros.map((o) => `<span data-otro="${o}"></span>`).join('')}</span>` : ''}
        </div>`).join('')}
      </div>`;
    }).join('');
  }
  const notas = NOTAS[f] || {};
  $$('.fila', horarioEl).forEach((fila) => {
    const h = +fila.dataset.h;
    const oc = e.completo || e.horas.includes(h);
    const paso = pasada(sel, h);
    const b = $('.hora', fila);
    b.setAttribute('aria-pressed', String(oc));
    b.disabled = e.completo || paso;
    fila.classList.toggle('ocupada', oc);
    fila.classList.toggle('pasada', paso);
    $('.hora__estado', b).textContent = paso ? 'Pasó' : oc ? 'Ocupada' : 'Libre';
    const nota = $('.nota', fila);
    if (document.activeElement !== nota) nota.value = notas[String(h)] || '';
    $$('[data-otro]', fila).forEach((s) => {
      const o = estaOcupado(s.dataset.otro, sel, h);
      s.className = o ? 'otro otro--ocupado' : 'otro';
      s.textContent = `${doctor(s.dataset.otro).corto}: ${o ? 'ocupada' : 'libre'}`;
    });
  });
  // Turno compartido: cuántas horas quedan libres entre todos
  $$('[data-juntos]', horarioEl).forEach((p) => {
    const grupo = p.closest('.grupo');
    const hs = $$('.fila', grupo).map((x) => +x.dataset.h).filter((h) => !pasada(sel, h));
    const en = [YO, ...$$('[data-otro]', $('.fila', grupo)).map((s) => s.dataset.otro)];
    const libresJuntos = hs.reduce((n, h) => n + en.filter((id) => !estaOcupado(id, sel, h)).length, 0);
    p.textContent = `Entre los ${en.length} hay ${libresJuntos} horas libres en este turno.`;
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
  guardar(api.nota(YO, f, h, texto));
  const { horas, completo } = estado(sel);
  if (texto && !completo && !horas.includes(h)) cambiarOcupado(sel, { horas: [...horas, h] });
});
horarioEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('.nota')) e.target.blur(); });
completoEl.addEventListener('change', () => cambiarOcupado(sel, { completo: completoEl.checked }));
$('[data-liberar]').addEventListener('click', () => {
  const e = estado(sel);
  if (!e.completo && !e.horas.length) return;
  if (confirm('¿Liberar todas tus horas de este día? Los pacientes podrán volver a reservarlas.')) {
    cambiarOcupado(sel, { completo: false, horas: [] });
  }
});

function pintarTodo() {
  if (YO === 'todos') { pintarGeneral(); return; }
  pintarBandeja(); pintarLista(); pintarDia();
}

// ----- Vista general (soporte / administración): los 3 doctores en vivo -----
const generalEl = $('[data-general]'), cuerpoEl = $('.cuerpo');
let NOTAS_TODOS = {}, selGen = dias[0], apagarGen = [];
const ESTADOS = { pendiente: 'Pendiente', aceptada: 'Aceptada', rechazada: 'Rechazada', cancelada: 'Cancelada', abierto: 'Tomó el turno' };
function pintarGeneral() {
  const f = claveFecha(selGen);
  $('[data-gen-dias]').innerHTML = dias.slice(0, 14).map((d, i) => {
    const total = DOCTORES.reduce((n, x) => n + horasDeDoctor(x.id, d, SOLIC).filter((h) => estaOcupado(x.id, d, h)).length, 0);
    return `<button type="button" class="gen-dia${d === selGen ? ' activo' : ''}" data-gi="${i}">
      <b>${d.getTime() === hoy.getTime() ? 'Hoy' : DIAS_CORTOS[d.getDay()]}</b> ${d.getDate()}
      <small>${total ? `${total} citas` : 'libre'}</small></button>`;
  }).join('');
  $('[data-gen-titulo]').textContent = `${DIAS[selGen.getDay()][0].toUpperCase()}${DIAS[selGen.getDay()].slice(1)} ${selGen.getDate()} de ${MESES[selGen.getMonth()]}`;
  $('[data-gen-cols]').innerHTML = DOCTORES.map((x) => {
    const turnos = turnosDe(x.id, selGen, SOLIC);
    const e = ocup(x.id, selGen), notas = NOTAS_TODOS[x.id]?.[f] || {};
    const horas = turnos.flatMap(horasDeTurno);
    const n = horas.filter((h) => estaOcupado(x.id, selGen, h)).length;
    const cuerpo = !turnos.length ? '<p class="gen-vacio">No atiende este día.</p>'
      : e.completo ? '<p class="gen-vacio gen-vacio--lleno">Día completo ocupado.</p>'
      : turnos.map((t) => {
        const otros = doctoresEnTurno(t, selGen, SOLIC).filter((o) => o !== x.id);
        return `<p class="gen-turno">Turno ${TURNOS[t].nombre.toLowerCase()}${porConfirmar(x.id, t) ? ' (algunos días)' : ''}${otros.length ? ` · con ${juntar(otros.map((o) => conConf(o, t, doctor(o).corto)))}` : ''}</p>
        <ul class="gen-horas">${horasDeTurno(t).map((h) => {
          const oc = estaOcupado(x.id, selGen, h), nota = notas[String(h)];
          return `<li class="${oc ? 'oc' : ''}${pasada(selGen, h) ? ' paso' : ''}"><span>${fmtHora(h)}</span><em>${oc ? (nota || 'Ocupada') : 'Libre'}</em></li>`;
        }).join('')}</ul>`;
      }).join('');
    return `<article class="gen-col">
      <header><img src="${x.foto}" alt="" width="44" height="44"><div><strong>${x.nombre}</strong>
      <span>${turnos.length ? `${turnos.map((t) => TURNOS[t].nombre).join(' + ')} · ${n} de ${horas.length} ocupadas` : 'Sin turno'}</span></div></header>
      ${cuerpo}</article>`;
  }).join('');
  const lista = [...SOLIC].sort((a, b) => (b.creada?.seconds || 0) - (a.creada?.seconds || 0)).slice(0, 15);
  $('[data-gen-actividad]').innerHTML = lista.length ? lista.map((x) => `<li>
    <span class="gen-estado gen-estado--${x.estado}">${ESTADOS[x.estado] || x.estado}</span>
    ${x.estado === 'abierto'
      ? `<b>${doctor(x.de)?.corto}</b> tomó el turno ${TURNOS[x.turno]?.nombre.toLowerCase()} del ${fechaCorta(x.fecha)}`
      : `<b>${doctor(x.de)?.corto}</b> pidió unirse al turno ${TURNOS[x.turno]?.nombre.toLowerCase()} de <b>${doctor(x.para)?.corto}</b> · ${fechaCorta(x.fecha)}`}
  </li>`).join('') : '<li class="gen-vacio">Todavía no hay solicitudes entre doctores.</li>';
}
generalEl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-gi]');
  if (b) { selGen = dias[+b.dataset.gi]; pintarGeneral(); }
});
function escucharNotasTodos() {
  apagarGen.forEach((f) => f()); apagarGen = [];
  if (demo) return;
  apagarGen = DOCTORES.map((x) => escucharNotas(x.id, hoy, dias.at(-1), (m) => { NOTAS_TODOS[x.id] = m; if (YO === 'todos') pintarGeneral(); }));
}

// ----- Quién soy -----
const selDoc = $('[data-elegir-doc]');
let SOPORTE = false;
function ponerDoctor(id) {
  YO = id;
  selDoc.value = id;
  pintarMisServicios();
  const general = id === 'todos';
  generalEl.hidden = !general;
  cuerpoEl.hidden = general;
  $('[data-bandeja]').hidden = true;
  if (general) {
    $('[data-yo-nombre]').textContent = SOPORTE ? 'Soporte' : 'Administración';
    $('[data-yo-foto]').src = 'media/logo.png';
    $('[data-yo-cargo]').textContent = 'Vista general en vivo';
    apagarNotas(); apagarNotas = () => {};
    escucharNotasTodos();
    pintarGeneral();
    return;
  }
  apagarGen.forEach((f) => f()); apagarGen = [];
  const d = doctor(id);
  $('[data-yo-nombre]').textContent = d.nombre;
  $('[data-yo-foto]').src = d.foto;
  $('[data-yo-cargo]').textContent = SOPORTE ? `${d.cargo} · viendo como soporte` : d.cargo;
  if (!misHoras(sel).length) sel = dias.find((x) => misHoras(x).length) || dias[0];
  NOTAS = {};
  escucharMisNotas();
  pintarBandeja(); pintarLista(); pintarDia(true);
}
selDoc.innerHTML = '<option value="todos">Vista general (todos)</option>' + DOCTORES.map((d) => `<option value="${d.id}">${d.nombre}</option>`).join('');
selDoc.addEventListener('change', () => ponerDoctor(selDoc.value));

// ----- Ingreso -----
const ingreso = $('[data-ingreso]'), panel = $('[data-panel]');
let apagar = [], apagarNotas = () => {};
function escucharMisNotas() {
  apagarNotas();
  if (demo) return;
  apagarNotas = escucharNotas(YO, hoy, dias.at(-1), (m) => { NOTAS = m; pintarDia(); });
}
function abrirPanel(perfil) {
  ingreso.hidden = true;
  panel.hidden = false;
  ADMIN = !!(perfil.admin || perfil.soporte);
  SOPORTE = !!perfil.soporte;
  $('[data-solo-admin]').hidden = !ADMIN;
  if (!demo) {
    const hasta = dias.at(-1);
    apagar = [
      escucharTodos(DOCTORES.map((d) => d.id), hoy, hasta, (m) => { TODOS = m; pintarTodo(); }),
      escucharSolicitudes(hoy, hasta, (l) => { SOLIC = l; pintarTodo(); }),
      escucharServicios(DOCTORES.map((d) => d.id), (m) => { aplicarServicios(m); pintarMisServicios(); }),
    ];
  }
  ponerDoctor(perfil.doctor || 'todos');
}
function sinVincular(u) {
  ingreso.hidden = false;
  panel.hidden = true;
  $('[data-form-ingreso]').hidden = true;
  const v = $('[data-sin-vincular]');
  v.hidden = false;
  $('[data-correo]').textContent = u.email;
}

if (demo) {
  $('[data-abrir-clave]').hidden = true;
  const yo = doctor(params.get('demo')) ? params.get('demo') : 'd1';
  const f = (i) => claveFecha(dias[i]);
  TODOS = {
    d1: { [f(0)]: { completo: false, horas: [10, 10.5, 12] }, [f(3)]: { completo: true, horas: [] } },
    d2: { [f(0)]: { completo: false, horas: [15, 16, 16.5] }, [f(1)]: { completo: false, horas: [15.5, 17] } },
    d3: { [f(0)]: { completo: false, horas: [19, 20] }, [f(1)]: { completo: false, horas: [18, 18.5] } },
  };
  NOTAS = { [f(0)]: { '10': 'Ana Torres · limpieza', '12': 'Luis Rojas · restauración' } };
  SOLIC = [
    { id: 's1', de: 'd3', para: 'd2', fecha: f(1), turno: 'tarde', estado: 'aceptada' },
    { id: 's2', de: 'd2', para: 'd1', fecha: f(2), turno: 'manana', estado: 'pendiente' },
    { id: 's3', de: 'd1', para: 'd3', fecha: f(4), turno: 'noche', estado: 'pendiente' },
  ];
  NOTAS_TODOS = { d1: NOTAS, d2: {}, d3: {} };
  abrirPanel(params.has('soporte') ? { soporte: true } : { doctor: yo, admin: params.has('admin') });
} else if (!configurado) {
  const aviso = $('[data-aviso]');
  aviso.hidden = false;
  aviso.textContent = 'Falta conectar Firebase en agenda.js.';
} else {
  const auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence);
  onAuthStateChanged(auth, async (u) => {
    apagar.forEach((f) => f()); apagar = []; apagarNotas();
    if (!u) {
      panel.hidden = true; ingreso.hidden = false;
      $('[data-form-ingreso]').hidden = false; $('[data-sin-vincular]').hidden = true;
      return;
    }
    let perfil = null;
    try { perfil = await leerPerfil(u.email); } catch (err) { console.error(err); }
    if (perfil && (perfil.admin || perfil.soporte || doctor(perfil.doctor))) abrirPanel(perfil);
    else sinVincular(u);
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
  $$('[data-salir]').forEach((b) => b.addEventListener('click', () => signOut(auth)));

  // ----- Cambiar contraseña (para reemplazar la temporal) -----
  const dlg = $('[data-clave]'), formClave = $('[data-form-clave]'), errClave = $('[data-error-clave]');
  $('[data-abrir-clave]').addEventListener('click', () => { formClave.reset(); errClave.textContent = ''; dlg.showModal(); });
  $('[data-cerrar-clave]').addEventListener('click', () => dlg.close());
  formClave.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { actual, nueva, repite } = formClave;
    if (nueva.value !== repite.value) { errClave.textContent = 'Las dos contraseñas nuevas no coinciden.'; return; }
    if (nueva.value === actual.value) { errClave.textContent = 'La nueva debe ser distinta a la actual.'; return; }
    const btn = $('button[type="submit"]', formClave);
    btn.disabled = true; btn.textContent = 'Guardando…'; errClave.textContent = '';
    try {
      const u = auth.currentUser;
      await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, actual.value));
      await updatePassword(u, nueva.value);
      dlg.close();
      guardadoEl.className = 'guardado ok'; guardadoEl.textContent = 'Contraseña cambiada';
      clearTimeout(tGuardado); tGuardado = setTimeout(() => (guardadoEl.textContent = ''), 3000);
    } catch (err) {
      errClave.textContent = ['auth/invalid-credential', 'auth/wrong-password'].includes(err.code) ? 'La contraseña actual no es correcta.'
        : err.code === 'auth/weak-password' ? 'La nueva contraseña debe tener al menos 6 caracteres.'
        : err.code === 'auth/too-many-requests' ? 'Demasiados intentos. Espera unos minutos.' : 'No se pudo cambiar. Revisa tu internet.';
    }
    btn.disabled = false; btn.textContent = 'Guardar';
  });
}
