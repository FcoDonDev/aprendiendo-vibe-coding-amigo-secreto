# 🎁 Amigo Secreto

Aplicación web para organizar un sorteo de amigo secreto: introduces la lista de participantes y el sistema sortea quién le regala a quién y envía cada asignación por correo electrónico.

## Reglas del juego

- Se ingresa la lista de participantes (nombre y correo).
- Se requiere un mínimo de 2 participantes.
- El sorteo es aleatorio: nadie sale asignado a sí mismo.
- Cada participante regala a exactamente una persona y recibe exactamente un regalo (una permutación sin puntos fijos, *derangement*).
- Cada participante recibe su asignación por correo, y cada correo contiene exclusivamente la asignación de su destinatario.

## Stack

- **Lenguaje:** TypeScript
- **Framework:** Next.js (App Router, Server Actions)
- **UI:** React + Tailwind CSS
- **Envío de correos:** SMTP con Nodemailer
- **Persistencia:** sin base de datos; la lista se guarda en `localStorage` del navegador del organizador

## Puesta en marcha

```bash
npm install
cp .env.example .env   # completa la configuración SMTP
npm run dev
```

Abre http://localhost:3000.

### Configuración SMTP

El archivo `.env` (basado en `.env.example`) necesita:

| Variable     | Descripción                                                          |
| ------------ | -------------------------------------------------------------------- |
| `SMTP_HOST`  | Servidor SMTP (ej. `smtp.gmail.com`)                                 |
| `SMTP_PORT`  | Puerto del servidor (`587` STARTTLS, `465` SSL/TLS implícito)         |
| `SMTP_USER`  | Usuario para autenticación (opcional, según el servidor)             |
| `SMTP_PASS`  | Contraseña o contraseña de aplicación                                |
| `SMTP_FROM`  | Remitente visible (ej. `"Amigo Secreto <tucorreo@gmail.com>"`)       |

Si faltan variables, la acción de sorteo lo indica en pantalla y no se envía nada.

> Con Gmail, usa una [contraseña de aplicación](https://myaccount.google.com/apppasswords) en lugar de la contraseña habitual.

## Uso

1. Añade participantes con su nombre y correo (el correo debe ser único).
2. Cuando haya al menos 2 participantes, pulsa **Realizar sorteo**.
3. El servidor sortea de forma aleatoria (uso de `crypto` del sistema), envía un correo por persona y muestra un resumen:
   - correos entregados y, si los hubo, los fallos por destinatario;
   - un detalle plegable con la lista completa *solo para el organizador*.

## Estructura

```
app/
  actions.ts             # Server Action: sorteo + envío de correos
  components/
    organizador.tsx      # UI (cliente) de gestión de participantes y sorteo
  page.tsx               # Página principal
  layout.tsx             # Layout raíz
lib/
  sorteo.ts              # Validación y algoritmo de sorteo (derangement)
  mail.ts                # Transporte SMTP y plantilla de correo
```
