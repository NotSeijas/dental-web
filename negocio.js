// ===== Datos del negocio (editar aquí) =====
const NEGOCIO = {
  nombre: 'Seijas',
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

// Todas las horas de atención de un día (cada media hora)
function horasDelDia(d) {
  const out = [];
  (NEGOCIO.horario[d.getDay()] || []).forEach(([a, b]) => {
    for (let h = a; h <= b - 0.5; h += 0.5) out.push(h);
  });
  return out;
}
const claveFecha = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
