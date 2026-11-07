# Centro Odontológico Yenmar

Sitio estático (HTML/CSS/JS). Vista previa: config `dental-web` en `E:\codex\.claude\launch.json`, puerto 6200. Publicado en https://odontologiayenmar.com (GitHub Pages con archivo CNAME; dominio comprado en Squarespace, DNS: 4 A @ → 185.199.108-111.153 y CNAME www → notseijas.github.io).

- `negocio.js`: nombre, WhatsApp, dirección, **servicios** (`SERVICIOS`), **turnos** (mañana 8–1, tarde 3–6, noche 6–9) y **odontólogos** (`DOCTORES`: nombre, foto, funciones y turnos fijos por día). El horario general de la clínica se arma solo con los turnos de los doctores. Roxana y Yenny: mañana, tarde y noche; Iván: tarde y noche, y algunas mañanas (`porConfirmar`): se puede pedir cita, con un aviso de que viene solo algunos días.
- `main.js`: mensajes rápidos de WhatsApp (`CHIPS`), sección Equipo y la reserva.
- La reserva va así: odontólogo → servicio (solo los que realiza) → día → hora. Solo salen los días y horas en que atiende ese doctor, sin las que ya tiene ocupadas. Toda cita es una **solicitud por confirmar**: se guarda en Firebase (`citas/{id}`) y le llega al panel del odontólogo elegido, que la aprueba o rechaza. Si Firebase falla, se ofrece enviarla por WhatsApp.
- Colores y logo tomados del logo YENMAR (`media/logo.png`, `logo-blanco.png`, `logo-yenmar.png`). Retratos de doctores: `media/doc-1..3.jpg`; fotos reales con pacientes: `media/r-*.jpg`.

## Por confirmar con el cliente

- Fotos reales de los ambientes del consultorio (sección Consultorio).

## Panel de odontólogos (Firebase)

- `panel.html`: cada doctor entra con su propia cuenta y solo ve y edita **su** agenda (horas ocupadas, día completo y notas privadas).
- Citas por confirmar: arriba del panel salen las solicitudes de los pacientes (nombre, celular, servicio, día, hora y comentario). **Aprobar** abre WhatsApp con la confirmación para el paciente, marca la hora como ocupada y guarda la nota; **Rechazar** abre WhatsApp para ofrecer otro horario. Soporte las ve todas.
- Mis servicios: cada doctor marca los servicios que realiza y puede agregar otros propios. Se guardan en `agenda/{doctor}` (`servicios`) y la web los usa al instante (tarjeta del equipo y reserva).
- Turnos: en cada día ve quién atiende mañana, tarde y noche. Puede **pedir unirse** al turno de otro doctor; ese doctor acepta o rechaza desde su panel. Al aceptar, el turno queda compartido: los pacientes pueden reservar con cualquiera de los dos y el panel muestra las horas libres de ambos. Si nadie atiende un turno, puede tomarlo directo.
- Firebase: proyecto `clinica-dental-raiz` (cuenta de Diego). Registro público desactivado.
- Para dar acceso a un doctor:
  1. Firebase → Authentication → Users → Add user (su correo y una contraseña).
  2. Firestore → Data → colección `medicos` → Add document con ID = su correo en minúsculas y campo `doctor` (string) = `d1`, `d2` o `d3`. Los correos reales de los tres doctores ya están vinculados (se ven en Firestore, no se guardan en este repo público).
- La cuenta `diegoseijas@gmail.com` es administradora (`admin: true`): puede ver la agenda de cualquiera con el selector. Las cuentas con `soporte: true` (además de `admin: true`) entran directo a la **Vista general**: los tres doctores, sus horas y notas, y las solicitudes entre doctores, en vivo.
- Datos: `agenda/{doctor}/ocupado/{fecha}` (público), `agenda/{doctor}/notas/{fecha}` (privado), `solicitudes/{id}`, `citas/{id}` (la crea el paciente, solo la lee su doctor), `medicos/{correo}`. Reglas en `firestore.rules` (pegadas en Firestore → Rules).
- Vista de prueba sin login (solo en la compu): `http://localhost:6200/panel.html?demo=d2` (añade `&admin` para ver el selector).
