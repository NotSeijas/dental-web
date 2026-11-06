// ===== Datos del negocio (editar aquí) =====
const NEGOCIO = {
  nombre: 'Yenmar',
  wa: '51972845629',
  telefono: '972 845 629',
  direccion: 'Jr. 7 de Junio N° 1026',
};

// ===== Turnos de la clínica (horas decimales: 14.5 = 2:30 p. m.) =====
const TURNOS = {
  manana: { nombre: 'Mañana', desde: 8, hasta: 13 },
  tarde: { nombre: 'Tarde', desde: 15, hasta: 18 },
  noche: { nombre: 'Noche', desde: 18, hasta: 21 },
};

// ===== Servicios de la clínica =====
const SERVICIOS = [
  {
    id: 'evaluacion', nombre: 'Evaluación y diagnóstico', img: 'r-ivan-atiende',
    alt: 'El Dr. Iván evaluando a una paciente',
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
    id: 'blanqueamiento', nombre: 'Aclaramiento dental', img: 'blanqueamiento',
    alt: 'Sonrisa con dientes más claros',
    desc: 'Aclaramos el tono de tus dientes de forma segura, en consultorio y con indicaciones para mantener el resultado en casa.',
    incluye: ['Evaluación previa del esmalte', 'Sesión en consultorio', 'Cuidados para casa'],
    dur: '60 a 90 minutos',
  },
  {
    id: 'restauracion', nombre: 'Restauración dental', img: 'g-herramientas',
    alt: 'Espejo y explorador dental',
    desc: 'Reparamos dientes con caries, fracturas o desgaste con resina del color natural del diente, para que recuperen su forma y su función.',
    incluye: ['Retiro de la caries', 'Resina del color del diente', 'Ajuste de la mordida'],
    dur: '30 a 60 minutos',
  },
  {
    id: 'estetica', nombre: 'Carillas', img: 'estetica',
    alt: 'Primer plano de una sonrisa cuidada',
    desc: 'Mejoramos la forma, el tamaño y el color de tus dientes con carillas de resina o porcelana, planificadas según tu rostro.',
    incluye: ['Diseño de la sonrisa', 'Carillas de resina o porcelana', 'Ajustes finales'],
    dur: 'Según el plan de tratamiento',
  },
  {
    id: 'endodoncia', nombre: 'Endodoncias', img: 'restauracion',
    alt: 'Modelo de un diente mostrando la raíz y el nervio',
    desc: 'Tratamiento de conducto para salvar dientes con dolor o con el nervio dañado, sin tener que sacarlos.',
    incluye: ['Anestesia local', 'Tratamiento de conducto', 'Reconstrucción del diente'],
    dur: '60 a 90 minutos',
  },
  {
    id: 'protesis', nombre: 'Prótesis dental', img: 'implantes',
    alt: 'Modelos de coronas y prótesis dentales',
    desc: 'Reponemos los dientes que faltan con prótesis fijas o removibles hechas a tu medida, para volver a masticar y sonreír con confianza.',
    incluye: ['Toma de medidas', 'Prótesis fija o removible', 'Controles y ajustes'],
    dur: 'Según el plan de tratamiento',
  },
  {
    id: 'ninos', nombre: 'Odontopediatría', img: 'r-yenny-nino',
    alt: 'La Dra. Yenny revisando los dientes de un niño',
    desc: 'Atención para los más pequeños con paciencia y sin apuros, para que sus primeras visitas al dentista sean una buena experiencia.',
    incluye: ['Control y limpieza', 'Sellantes y flúor', 'Curaciones de dientes de leche'],
    dur: '30 a 45 minutos',
  },
  {
    id: 'radiografia', nombre: 'Radiografía periapical', img: 'diagnostico',
    alt: 'Odontólogo revisando radiografías dentales',
    desc: 'Una radiografía pequeña y rápida que muestra el diente completo, de la corona a la raíz, para ver caries ocultas, infecciones o el estado del hueso.',
    incluye: ['Toma en el consultorio', 'Resultado al momento', 'Revisión con tu odontólogo'],
    dur: '10 minutos',
  },
  {
    id: 'cirugia', nombre: 'Extracción dental', img: 'cirugia',
    alt: 'Odontólogos realizando un procedimiento',
    desc: 'Extracciones simples y de muelas del juicio con anestesia local, indicaciones claras y control posterior.',
    incluye: ['Extracciones simples', 'Muelas del juicio', 'Control posterior'],
    dur: '30 a 60 minutos',
  },
  {
    id: 'ortodoncia', nombre: 'Ortodoncia con brackets', img: 'ortodoncia',
    alt: 'Paciente con brackets durante un control',
    desc: 'Alineamos tus dientes y corregimos la mordida con brackets metálicos o estéticos, con controles mensuales durante todo el tratamiento.',
    incluye: ['Estudio de ortodoncia', 'Brackets metálicos o estéticos', 'Controles mensuales'],
    dur: 'Controles de 20 a 30 minutos',
  },
];
const nombreServicio = (id) => SERVICIOS.find((x) => x.id === id)?.nombre || id;
// Todos los servicios menos los indicados
const serviciosSin = (...no) => SERVICIOS.map((s) => s.id).filter((id) => !no.includes(id));
const escHtml = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ===== Odontólogos (turnos POR CONFIRMAR) =====
// funciones: ids de servicios que realiza (cada doctor los cambia desde su panel)
// turnos: 0 = domingo … 6 = sábado → turnos fijos de cada día
const DOCTORES = [
  {
    id: 'd1', nombre: 'Dra. Roxana Seijas Figueroa', corto: 'Dra. Roxana', cargo: 'Cirujana dentista', foto: 'media/doc-1.jpg',
    resumen: 'Atención integral para niños y adultos.',
    saludos: [
      '¡Hola! Soy la Dra. Roxana. Te atiendo con calma y te explico cada paso.',
      '¡Qué gusto! Soy Roxana: juntos vamos a cuidar esa sonrisa.',
      'Hola, soy la Dra. Roxana. Pregúntame lo que quieras, sin vergüenza.',
      '¡Bienvenido! Soy Roxana y me encanta ver sonrisas sanas.',
    ],
    funciones: serviciosSin('cirugia', 'ortodoncia'),
    turnos: { 1: ['manana'], 2: ['manana'], 3: ['manana'], 4: ['manana'], 5: ['manana'], 6: ['manana'] },
  },
  {
    id: 'd2', nombre: 'Dra. Yenny Meza Morales', corto: 'Dra. Yenny', cargo: 'Cirujana dentista', foto: 'media/doc-2.jpg',
    resumen: 'Estética dental y tratamientos para toda la familia.',
    saludos: [
      '¡Hola! Soy la Dra. Yenny. Aquí estás en buenas manos.',
      'Soy Yenny: hagamos que tu sonrisa brille todavía más.',
      '¡Qué bueno verte! Soy la Dra. Yenny, cuéntame qué necesitas.',
      'Hola, soy Yenny. Tranquilo, vamos a tu ritmo.',
    ],
    funciones: serviciosSin('ortodoncia'),
    turnos: { 1: ['tarde'], 2: ['tarde'], 3: ['tarde'], 4: ['tarde'], 5: ['tarde'], 6: ['tarde'] },
  },
  {
    id: 'd3', nombre: 'Dr. Iván Meza Morales', corto: 'Dr. Iván', cargo: 'Cirujano dentista', foto: 'media/doc-3.jpg',
    resumen: 'Ortodoncia con brackets y atención integral.',
    saludos: [
      '¡Hola! Soy el Dr. Iván. Sin dolor y sin apuros, te lo prometo.',
      'Soy Iván: te explico todo antes de empezar, sin sorpresas.',
      '¡Bienvenido! Soy el Dr. Iván, aquí te sentirás en confianza.',
      'Hola, soy Iván. Vamos a devolverle la fuerza a tu sonrisa.',
    ],
    funciones: serviciosSin(),
    turnos: { 1: ['noche'], 2: ['noche'], 3: ['noche'], 4: ['noche'], 5: ['noche'], 6: ['noche'] },
  },
];
const doctor = (id) => DOCTORES.find((x) => x.id === id);
// Servicios que cada doctor guardó en su panel (agenda/{doctor}.servicios): reemplazan a los de arriba
function aplicarServicios(mapa) {
  DOCTORES.forEach((d) => {
    const lista = mapa[d.id];
    if (Array.isArray(lista)) d.funciones = lista.filter((x) => typeof x === 'string' && x.trim());
  });
}

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
