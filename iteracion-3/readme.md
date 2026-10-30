# Iteración 3 — bases consolidadas: reglas + alcance + stack

El prompt de las iteraciones anteriores se complementa con el *alcance* del
producto (tipo de aplicación, autenticación omitida, rol de los correos) y,
por primera vez, con la **tecnología** fijada explícitamente. Sigue siendo
una única instrucción (one-shot).

## Prompt (verbatim)

```text
Crea una aplicación para jugar al amigo secreto.

# Diseño funcional:
  - Aplicación web.
  - Sin autenticación en esta fase (una persona organiza el sorteo y punto)
  - Reglas del juego:
    - Se ingresa la lista de participantes (nombre y correo)
    - Se requiere un mínimo de 2 participantes.
    - El sistema sortea de forma aleatoria quién le regala a quién
    - Nadie puede salir asignado a sí mismo
    - Cada participante debe regalar a exactamente una persona y recibir exactamente un regalo.
    - Cada participante recibe su asignación por correo electrónico
    - Cada correo debe contener exclusivamente la asignación del participante correspondiente.
  
# Implementación
- Lenguaje: TypeScript
- Framework: Next.js 
- UI: React + Tailwind CSS
- Persistencia: Sin base de datos
- Envío de correos: SMTP 
```

## Qué produjo

A diferencia de la iteración 2, esta vez **no hubo preguntas de aclaración**:
el prompt ya cerraba reglas, alcance y stack, así que el agente construyó
directamente una **aplicación Next.js** (App Router) con TypeScript, React,
Tailwind CSS y Nodemailer, siguiendo la especificación:

- Server Action (`app/actions.ts`): normaliza, valida, sortea y envía.
- Algoritmo de derangement (`lib/sorteo.ts`) con `crypto` del sistema.
- Plantilla de correo texto + HTML (`lib/mail.ts`), donde cada correo contiene
  exclusivamente la asignación de su destinatario.
- UI cliente (`app/components/organizador.tsx`): alta/baja de participantes,
  validación en caliente y resultados del sorteo.
- La lista se guarda en `localStorage` (sin base de datos).
- Manejo de errores de negocio y credenciales: si el SMTP no llega, la app lo
  indica en pantalla y no envía nada ni expone asignaciones por accidente.
- Incluye su propio `app/README.md` con reglas, stack, configuración SMTP,
  variable por variable, y uso. Ejecutarla: `npm install`, `cp .env.example .env`
  (completar credenciales) y `npm run dev` → http://localhost:3000.

Además hizo una prueba de humo real: con 4 participantes reales el sorteo
envió los correos y **reportó con detalle el fallo del servidor SMTP** para
las direcciones inexistentes (código 550), distinguiendo entregas de rebotes.

## Qué le faltó

- El prompt fijó el stack pero no el detalle del reporte de errores de envío;
  el modo de reportar rebotes por destinatario fue decisión del modelo (buena
  en esta ocasión, mas no garantizada en un prompt siguiente).
- El listado de fallos de envío mezcla severidad: un simple "550 No Such
  User" aparece como aviso del sistema, cuando la regla del negocio podría
  pedir validar los correos *antes* de sortear.
- Pequeño detalle de copy: el resumen dice "Se enviaron 1 correos".

## La lección

Con reglas + alcance + stack explícitos, el modelo **deja de preguntar y
construye**. Compara con la iteración 2: las preguntas del agente marcan los
huecos del prompt; aquí casi no hay huecos y el resultado es la app
más completa de las cuatro primeras. El contraste con la iteración 2
("reglas solas" vs "reglas + alcance + stack") es el que enseña.

## Métricas de la sesión (export `assets/sesion.json`)

| Dato | Valor |
|---|---|
| Modelo | `opencode-go/glm-5.3-flash` (GLM 5.3 Flash, de pago) |
| Duración | 5,7 min |
| Mensajes | 40 (1 del usuario, 36 del agente) |
| Tool calls | 38: shell ×16, write ×11, read ×6, edit ×4, execute ×1 |
| Tokens | entrada 49.530 · salida 11.371 · razonamiento 2.904 · caché leída 708.288 |
| Coste registrado | $0,0358 |

## Evidencia (`assets/`)

| Archivo | Qué muestra |
|---|---|
| `app-1.png` | Pantalla inicial: sorteo deshabilitado con el aviso "Se requieren al menos 2 participantes". |
| `app-2.png` | 4 participantes agregados con su correo; estado "Listo para sortear". |
| `app-3.png` | Tras sortear: resumen de correos entregados, detalle plegable del mapa completo "solo para el organizador" y la lista de rebotes SMTP por destinatario. |
| `app-4.png` | El correo recibido por un participante (HTML), con su asignación exclusiva y sin información de terceros. |
| `app-5.png` | Tras recargar la página, la lista de participantes persiste (localStorage): "Al recargar no se limpian". |
| `opencode-prompt-result.png` | La TUI de OpenCode con la respuesta final del agente: arquitectura, detalles de la experiencia y lanzamiento local (~$0.04). |

## Conversación completa

La sesión real de OpenCode está en `assets/sesion.json` (export del historial:
prompt, razonamiento, herramientas, archivos creados y respuesta final; rutas
locales anonimizadas).
