# 🎁 Amigo Secreto

Aplicación web para organizar el intercambio de regalos del Amigo Secreto:

- Se ingresa la lista de participantes (nombre y correo).
- El sistema sortea de forma aleatoria quién le regala a quién.
- **Nadie puede salir asignado a sí mismo** (se garantiza un derangement).
- Cada participante recibe su asignación por correo electrónico (SMTP/Gmail).

## Requisitos

- Node.js 18 o superior

## Instalación

```bash
npm install
```

## Configuración del correo

Copia la plantilla de entorno y edita tus credenciales:

```bash
cp .env.example .env
```

Para **Gmail**:

1. Activa la verificación en dos pasos en tu cuenta de Google.
2. Crea una [contraseña de aplicación](https://myaccount.google.com/apppasswords).
3. En `.env`, usa:
   - `SMTP_USER=tucorreo@gmail.com`
   - `SMTP_PASS=<la contraseña de aplicación de 16 caracteres>`

Si usas otro provedor, ajusta `SMTP_HOST`, `SMTP_PORT` y `SMTP_SECURE`.

## Ejecución

```bash
npm start
```

Abre la aplicación en http://localhost:3000

## Cómo usar

1. Agrega los participantes con su nombre y correo (mínimo 2, correos sin repetir).
2. Pulsa **"Realizar sorteo"**.
3. El servidor baraja aleatoriamente las asignaciones y verifica que nadie se
   asigne a sí mismo, luego envía un correo a cada participante con el nombre
   de la persona a quien debe regalar.

## Estructura

```
├── server.js           # API (Express): validaciones, sorteo y envío de correos
├── draw.js             # Algoritmo del sorteo (Fisher-Yates + garantía anti-asignación propia)
├── email-template.js   # Plantilla de texto y HTML del correo
├── public/             # Frontend (HTML/CSS/JS sin dependencias)
└── .env.example        # Plantilla de configuración SMTP
```

## API

### `POST /api/sorteo`

```json
{
  "participantes": [
    { "nombre": "Ana", "correo": "ana@ejemplo.com" },
    { "nombre": "Luis", "correo": "luis@ejemplo.com" }
  ]
}
```

Respuesta exitosa:

```json
{
  "ok": true,
  "enviados": 2,
  "fallidos": [],
  "mensaje": "¡Sorteo realizado y asignaciones enviadas con éxito!"
}
```

Errores comunes: lista con menos de 2 participantes, correos inválidos o
duplicados, o credenciales SMTP no configuradas.
