# Iteración 2 — añadimos las reglas del juego

## Prompt

```text
crea una aplicación del amigo secreto.

Reglas del juego:
- Se ingresa la lista de participantes (nombre y correo)
- El sistema sortea de forma aleatoria quién le regala a quién
- Nadie puede salir asignado a sí mismo
- Cada participante recibe su asignación por correo electrónico
```

## Qué produjo

El agente **hizo preguntas de aclaración antes de construir** para confirmar la tecnología y el mecanismo de envío de correos. 
Las respuetas fueron: 
- Node.js + Express
- SMTP real

El resultado es una aplicación estilo **cliente-servidor** que se descomponee en varios archivos y carpetas:

- Frontend (`app/public/`): formulario de participantes con nombre + correo,  validación de correos y detección de duplicados.
- Backend (`app/server.js`, Express): API REST con `POST /api/sorteo` (validaciones, sorteo y envío).
- `app/draw.js`: algoritmo del sorteo (Fisher-Yates + rotación cíclica barajada).
- `app/email-template.js`: plantilla de correo en texto plano y HTML.
- `app/.env.example`: plantilla de configuración SMTP (credenciales fuera del código).
- `app/README.md`: Archivo con instrucciónes generales que incluyen los pasos para su ejecución.


## Métricas de la sesión (export `assets/session.json`)

| Dato | Valor |
|---|---|
| Modelo | `opencode-go/glm-5.3-flash` (GLM 5.3 Flash, de pago) |
| Duración | 5,5 min |
| Mensajes | 22 (1 del usuario, 20 del agente) |
| Tool calls | 25: shell ×12, write ×10, read ×1, glob ×1, question ×1 |
| Tokens | entrada 21.224 · salida 8.784 · razonamiento 1.377 · caché leída 214.336 |
| Coste registrado | $0,0147 |

## Evidencia (`assets/`)

| Archivo | Qué muestra |
|---|---|
| `app-1.png` | App recién abierta: formulario Nombre + Correo electrónico y botón de sorteo. |
| `app-2.png` | Cuatro participantes agregados con su correo; el backend valida duplicados. |
| `app-3.png` | El correo recibido por un participante con su asignación. |
| `opencode-prompt-1.png` | Primera pregunta del agente: ¿qué tecnología? |
| `opencode-prompt-2.png` | Segunda pregunta: ¿cómo enviar los correos? (SMTP/Gmail, Ethereal demo, o pendiente). |
| `opencode-prompt-3.png` | Las dos respuestas registradas (Node.js + Express, SMTP/Gmail) antes del build. |
| `opencode-prompt-4.png` | Respuesta final del agente: arquitectura resultante, pruebas hechas e instrucciones de uso . |
| `sesion.json` | Export del historial de la sesión de OpenCode (prompt, razonamiento, herramientas y respuesta). |
