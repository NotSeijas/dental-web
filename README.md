# Clínica Dental (muestra)

Sitio estático (HTML/CSS/JS). Vista previa: config `dental-web` en `E:\codex\.claude\launch.json`, puerto 6200.

- Datos del negocio, servicios y mensajes de WhatsApp: al inicio de `main.js` (`NEGOCIO`, `SERVICIOS`, `CHIPS`).
- La reserva en línea arma la solicitud (servicio, día, hora, nombre, celular) y la envía al WhatsApp del negocio; la clínica confirma por ahí.
- Fotos de `media/` son referenciales (Unsplash, licencia libre). Logo: `media/logo.png` y `media/logo-blanco.png` (recortados del logo del cliente).

## Por confirmar con el cliente

- Nombre de la clínica: Clínica Dental Seijas.
- Dirección, horario real y si atienden domingos.
- Lista final de servicios (y si quieren mostrar precios).
- Fotos propias del consultorio y del equipo.

## Panel de citas (Firebase)

- `panel.html` → panel del dentista (https://notseijas.github.io/dental-web/panel.html). Marca horas o días completos como ocupados y guarda notas privadas por hora.
- La web lee en vivo los horarios ocupados y los muestra tachados / "lleno"; la reserva sigue llegando por WhatsApp.
- Firebase: proyecto `clinica-dental-raiz` (cuenta de Diego), Firestore + Authentication con correo/contraseña. Registro público desactivado: las cuentas del dentista se crean en Firebase → Authentication → Users → Add user.
- Datos: `ocupado/{AAAA-MM-DD}` = `{ completo, horas[] }` (público, solo lectura) y `notas/{AAAA-MM-DD}` (privado). Reglas en Firestore → Rules.
- Vista de prueba sin login (solo en la compu): `http://localhost:6200/panel.html?demo`.
- `negocio.js` tiene nombre, WhatsApp y horario de atención (lo usan la web y el panel).
