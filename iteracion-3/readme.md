# Iteración 3 — bases consolidadas: reglas + tipo de app + alcance

El prompt de las iteraciones anteriores se complementa con el *alcance* del
producto: tipo de aplicación, la decisión de omitir autenticación y el rol de
los correos. Sigue siendo una única instrucción (one-shot), sin especificar
tecnología — esa decisión la deja al modelo.

## Prompt (verbatim)

```text
Crea una aplicación para jugar al amigo secreto.

Bases del proyecto:
- Reglas del juego:
  - Se ingresa la lista de participantes (nombre y correo)
  - El sistema sortea de forma aleatoria quién le regala a quién
  - Nadie puede salir asignado a sí mismo
  - Cada participante recibe su asignación por correo electrónico
- Tipo de aplicación: aplicación web
- Autenticación: omitida en esta fase (una persona organiza el sorteo y punto)
- Envío de correos: notificar a cada participante el resultado de su asignación
```

## Qué produjo

Sin preguntas de aclaración esta vez: el agente construyó directamente una
**aplicación Next.js** (App Router) con TypeScript, React, Tailwind CSS y
Nodemailer — eligió el stack por su cuenta, ya que el prompt no lo definía:

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

- Al no fijar el stack, el modelo eligió por sí solo (Next.js + Tailwind):
  una app más "grande" que la de la iteración 2 para el mismo alcance.
- El listado de fallos de envío mezcla severidad: un simple "550 No Such
  User" aparece como aviso del sistema, cuando la regla del negocio podría
  pedir validar los correos *antes* de sortear.
- Pequeño detalle de copy: el resumen dice "Se enviaron 1 correos" con 4
  participantes registrados cuando solo 1 llegó a entregarse.

## La lección

Dar el alcance (qué es la app, qué fase, qué hace) sin dar el stack tampoco
frena al modelo: improvisa el stack, ya no la funcionalidad. La calidad de la
evidencia de errores reportados (fallos por destinatario) supera a las
versiones anteriores; para el punto del blog de esta iteración, el contraste
"reglas solas" (iteración 2) vs "reglas + alcance" (esta) es el que enseña.

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
