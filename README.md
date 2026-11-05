# Centro Odontológico Yenmar

Sitio estático (HTML/CSS/JS). Vista previa: config `dental-web` en `E:\codex\.claude\launch.json`, puerto 6200. Publicado en https://notseijas.github.io/dental-web/.

- `negocio.js`: nombre, WhatsApp, **turnos** (mañana, tarde y noche) y **odontólogos** (`DOCTORES`: nombre, foto, funciones y turnos fijos por día). El horario general de la clínica se arma solo con los turnos de los doctores.
- `main.js`: servicios (`SERVICIOS`), mensajes rápidos de WhatsApp (`CHIPS`), sección Equipo y la reserva.
- La reserva va así: odontólogo → servicio (solo los que realiza) → día → hora. Solo salen los días y horas en que atiende ese doctor, sin las que ya tiene ocupadas. La solicitud se envía por WhatsApp.
- Colores y logo tomados del logo YENMAR (`media/logo.png`, `logo-blanco.png`, `logo-yenmar.png`). Retratos de doctores: `media/doc-1..3.jpg`; fotos reales con pacientes: `media/r-*.jpg`.

## Por confirmar con el cliente

- Funciones de cada doctor y sus turnos/horarios reales (hoy son de ejemplo).
- Horas de cada turno (hoy: mañana 8–1, tarde 2–6, noche 6–9).
- Dirección y WhatsApp de la clínica.

## Panel de odontólogos (Firebase)

- `panel.html`: cada doctor entra con su propia cuenta y solo ve y edita **su** agenda (horas ocupadas, día completo y notas privadas).
- Turnos: en cada día ve quién atiende mañana, tarde y noche. Puede **pedir unirse** al turno de otro doctor; ese doctor acepta o rechaza desde su panel. Al aceptar, el turno queda compartido: los pacientes pueden reservar con cualquiera de los dos y el panel muestra las horas libres de ambos. Si nadie atiende un turno, puede tomarlo directo.
- Firebase: proyecto `clinica-dental-raiz` (cuenta de Diego). Registro público desactivado.
- Para dar acceso a un doctor:
  1. Firebase → Authentication → Users → Add user (su correo y una contraseña).
  2. Firestore → Data → colección `medicos` → Add document con ID = su correo en minúsculas y campo `doctor` (string) = `d1`, `d2` o `d3`. Los correos reales de los tres doctores ya están vinculados (se ven en Firestore, no se guardan en este repo público).
- La cuenta `diegoseijas@gmail.com` es administradora (`admin: true`): puede ver la agenda de cualquiera con el selector.
- Datos: `agenda/{doctor}/ocupado/{fecha}` (público), `agenda/{doctor}/notas/{fecha}` (privado), `solicitudes/{id}`, `medicos/{correo}`. Reglas en `firestore.rules` (pegadas en Firestore → Rules).
- Vista de prueba sin login (solo en la compu): `http://localhost:6200/panel.html?demo=d2` (añade `&admin` para ver el selector).
