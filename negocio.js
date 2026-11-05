// ===== Datos del negocio (editar aquí) =====
const NEGOCIO = {
  nombre: 'Yenmar',
  wa: '51972845629',
  telefono: '972 845 629',
  direccion: 'Dirección por confirmar',
};

// ===== Turnos de la clínica (horas decimales: 14.5 = 2:30 p. m.) =====
const TURNOS = {
  manana: { nombre: 'Mañana', desde: 8, hasta: 13 },
  tarde: { nombre: 'Tarde', desde: 14, hasta: 18 },
  noche: { nombre: 'Noche', desde: 18, hasta: 21 },
};

// ===== Odontólogos (funciones y turnos POR CONFIRMAR) =====
// funciones: ids de servicios que realiza (ver SERVICIOS en main.js)
// turnos: 0 = domingo … 6 = sábado → turnos fijos de cada día
const DOCTORES = [
  {
    id: 'd1', nombre: 'Dra. Roxana Seijas Figueroa', corto: 'Dra. Roxana', cargo: 'Cirujana dentista', foto: 'media/doc-1.jpg',
    resumen: 'Ortodoncia y alineadores. Atiende a niños y adultos.',
    saludos: [
      '¡Hola! Soy la Dra. Roxana. Te atiendo con calma y te explico cada paso.',
      '¡Qué gusto! Soy Roxana: juntos vamos a cuidar esa sonrisa.',
      'Hola, soy la Dra. Roxana. Pregúntame lo que quieras, sin vergüenza.',
      '¡Bienvenido! Soy Roxana y me encanta ver sonrisas alineadas.',
    ],
    funciones: ['evaluacion', 'limpieza', 'ortodoncia', 'alineadores', 'ninos'],
    turnos: { 1: ['manana'], 2: ['manana'], 3: ['manana'], 4: ['manana'], 5: ['manana'], 6: ['manana'] },
  },
  {
    id: 'd2', nombre: 'Dra. Yenny Meza Morales', corto: 'Dra. Yenny', cargo: 'Cirujana dentista', foto: 'media/doc-2.jpg',
    resumen: 'Estética dental, blanqueamiento y endodoncia.',
    saludos: [
      '¡Hola! Soy la Dra. Yenny. Aquí estás en buenas manos.',
      'Soy Yenny: hagamos que tu sonrisa brille todavía más.',
      '¡Qué bueno verte! Soy la Dra. Yenny, cuéntame qué necesitas.',
      'Hola, soy Yenny. Tranquilo, vamos a tu ritmo.',
    ],
    funciones: ['evaluacion', 'limpieza', 'blanqueamiento', 'estetica', 'endodoncia'],
    turnos: { 1: ['tarde'], 2: ['tarde'], 3: ['tarde'], 4: ['tarde'], 5: ['tarde'] },
  },
  {
    id: 'd3', nombre: 'Dr. Iván Meza Morales', corto: 'Dr. Iván', cargo: 'Cirujano dentista', foto: 'media/doc-3.jpg',
    resumen: 'Implantes, cirugía y extracciones.',
    saludos: [
      '¡Hola! Soy el Dr. Iván. Sin dolor y sin apuros, te lo prometo.',
      'Soy Iván: te explico todo antes de empezar, sin sorpresas.',
      '¡Bienvenido! Soy el Dr. Iván, aquí te sentirás en confianza.',
      'Hola, soy Iván. Vamos a devolverle la fuerza a tu sonrisa.',
    ],
    funciones: ['evaluacion', 'limpieza', 'implantes', 'cirugia', 'endodoncia'],
    turnos: { 1: ['noche'], 2: ['noche'], 3: ['noche'], 4: ['noche'], 5: ['noche'] },
  },
];
const doctor = (id) => DOCTORES.find((x) => x.id === id);

// Horario general de la clínica: se arma solo con los turnos de los doctores
NEGOCIO.horario = {};
for (let dia = 0; dia < 7; dia++) {
  const ts = Object.keys(TURNOS).filter((t) => DOCTORES.some((d) => (d.turnos[dia] || []).includes(t)));
  const tramos = [];
  ts.forEach((t) => {
    const { desde, hasta } = TURNOS[t];
    const ult = tramos.at(-1);
    if (ult && ult[1] === desde) ult[1] = hasta; else tramos.push([desde, hasta]);
  });
  if (tramos.length) NEGOCIO.horario[dia] = tramos;
}

// Consejos que Gotita da al azar (pantalla de carga y al tocarla)
const CONSEJOS = [
  'Cepíllate 2 minutos, dos veces al día.',
  'Usa hilo dental todas las noches.',
  'Cambia tu cepillo cada 3 meses.',
  'Haz tu limpieza dental cada 6 meses.',
  'Cepilla también tu lengua.',
  'Toma agua después de comer dulces.',
  'Espera 30 minutos para cepillarte después de algo ácido.',
  'Usa pasta con flúor.',
  'Si te sangran las encías, ven a una revisión.',
  'Los niños deben ir al dentista desde su primer diente.',
];

// Medias horas de un turno
function horasDeTurno(t) {
  const out = [];
  for (let h = TURNOS[t].desde; h <= TURNOS[t].hasta - 0.5; h += 0.5) out.push(h);
  return out;
}
const turnoDeHora = (h) => Object.keys(TURNOS).find((t) => h >= TURNOS[t].desde && h < TURNOS[t].hasta);

// Todas las horas en que atiende la clínica un día
function horasDelDia(d) {
  const out = [];
  (NEGOCIO.horario[d.getDay()] || []).forEach(([a, b]) => {
    for (let h = a; h <= b - 0.5; h += 0.5) out.push(h);
  });
  return out;
}

// ===== Agenda por doctor =====
// extras = solicitudes de la agenda: { de, para, fecha, turno, estado }
// estado: pendiente → aceptada | rechazada | cancelada;  'abierto' = tomó un turno que nadie atendía
const ACTIVAS = ['aceptada', 'abierto'];
// Turnos que atiende un doctor ese día: los fijos + los que se unió
function turnosDe(docId, d, extras = []) {
  const f = claveFecha(d);
  const fijos = doctor(docId)?.turnos[d.getDay()] || [];
  const unidos = extras.filter((s) => s.de === docId && s.fecha === f && ACTIVAS.includes(s.estado)).map((s) => s.turno);
  return Object.keys(TURNOS).filter((t) => fijos.includes(t) || unidos.includes(t));
}
// Doctores que atienden un turno ese día
function doctoresEnTurno(t, d, extras = []) {
  return DOCTORES.filter((x) => turnosDe(x.id, d, extras).includes(t)).map((x) => x.id);
}
// Medias horas de un doctor ese día
function horasDeDoctor(docId, d, extras = []) {
  return turnosDe(docId, d, extras).flatMap(horasDeTurno);
}
const claveFecha = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
