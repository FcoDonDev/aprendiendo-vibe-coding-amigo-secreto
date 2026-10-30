# Iteración 2 — añadimos las reglas del juego

El prompt de la iteración 1, extendido con el detalle de cómo funciona el
amigo secreto "de verdad". Sigue siendo una única instrucción (one-shot).

## Prompt (verbatim)

```text
crea una aplicación del amigo secreto.

Reglas del juego:
- Se ingresa la lista de participantes (nombre y correo)
- El sistema sortea de forma aleatoria quién le regala a quién
- Nadie puede salir asignado a sí mismo
- Cada participante recibe su asignación por correo electrónico
```

## Qué produjo

El agente **hizo preguntas de aclaración antes de construir**: pidió confirmar
la tecnología y el mecanismo de envío de correos (capturas
`opencode-prompt-1.png` a `opencode-prompt-3.png`). Con las respuestas
(Node.js + Express, SMTP real) generó una **aplicación cliente-servidor**:

- Frontend (`app/public/`): formulario de participantes con nombre + correo,
  validación de correos y detección de duplicados.
- Backend (`app/server.js`, Express): API REST con
  `POST /api/sorteo` (validaciones, sorteo y envío).
- `app/draw.js`: algoritmo del sorteo (Fisher-Yates + rotación cíclica
  barajada) que garantiza un derangement válido.
- `app/email-template.js`: plantilla de correo en texto plano y HTML.
- `app/.env.example`: plantilla de configuración SMTP (credenciales fuera del código).
- El agente probó el envío de extremo a extremo con una cuenta desechable de
  [Ethereal](https://ethereal.email) y simuló 2.500 sorteos (grupos de 2 a 100
  personas): cero autoasignaciones.

**Cómo ejecutarla:** ver `app/README.md` (resumen: `npm install`, copiar
`.env.example` a `.env` con tus credenciales SMTP, `npm start`, abrir
`http://localhost:3000`).

## Qué le faltó

- No hay mínimo de participantes explícito en el prompt → el agente lo resolvió
  igual (mínimo 2, con validación) pero fue una decisión propia.
- No se definió la tecnología → el agente la preguntó a mitad de sesión
  (con una instrucción "perfecta" esa pregunta no existiría: la iteración 3
  del blog especifica el stack).
- El correo es de texto + HTML sencillo; sin acciones por parte del receptor.

## La lección

Las reglas del juego movieron al agente de "app de juguete" a "aplicación
real": servidor, API, credenciales en variables de entorno y pruebas de
extremo a extremo. Y la "iniciativa" del modelo cambió de forma: en vez de
decidir en silencio (como en la iteración 1), ahora **pregunta** lo que el
prompt no cerró. Sus preguntas de claridad son el mapa de lo que falta en tu
propio prompt.

## Evidencia (`assets/`)

| Archivo | Qué muestra |
|---|---|
| `app-1.png` | App recién abierta: formulario Nombre + Correo electrónico y botón de sorteo. |
| `app-2.png` | Cuatro participantes agregados con su correo; el backend valida duplicados. |
| `app-3.png` | El correo real recibido por un participante con su asignación (HTML, sin spoiler). |
| `opencode-prompt-1.png` | El agente hace preguntas de aclaración antes de construir: ¿qué tecnología? |
| `opencode-prompt-2.png` | Segunda pregunta: ¿cómo enviar los correos? (SMTP/Gmail, Ethereal demo, o pendiente). |
| `opencode-prompt-3.png` | Las dos respuestas registradas (Node.js + Express, SMTP/Gmail) antes del build. |
| `opencode-prompt-4.png` | Respuesta final del agente: arquitectura resultante, pruebas hechas (2.500 simulaciones, E2E con Ethereal) e instrucciones de uso (~$0.01). |

## Conversación completa

La sesión real de OpenCode está en `assets/session.json` (export del historial:
prompt, preguntas, razonamiento, herramientas y respuesta final; rutas locales
anonimizadas).
