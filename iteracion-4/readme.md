# Iteración 4 — plan primero, build después

El mismo prompt de la iteración 3 (verbatim idéntico, revisado contra la
transcripción de la sesión), pero **en dos fases**: primero el modo `plan` de
OpenCode (arquitectura y pasos antes de tocar código) y, en la misma sesión,
el cambio a build con una única segunda instrucción.

## Prompt (verbatim)

La instrucción de planificación:

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

Y, una vez entregado el plan y cambiado al modo build:

```text
Procede con la implementacion completa del proyecto
```

## Qué produjo

**Fase plan** (sin escribir código):

- El agente entregó un plan completo y legible: stack (Next.js App Router +
  TypeScript + React + Tailwind), estructura de carpetas archivo por archivo
  con su rol, y el comportamiento paso a paso de la app (validaciones,
  algoritmo de derangement con Fisher-Yates + rotación, envío secuencial,
  nunca mostrar asignaciones en la UI).
- **Hizo 2 preguntas de decisión antes de construir**: qué proveedor SMTP
  (respondí: genérico por variables de entorno) y si quería reintentos de
  envío (respondí: no, simple). Sus recomendaciones de por qué son parte del
  valor del modo plan.
- El plan es "gratis" comparado con el build: la fase plan marcaba $0.00 en
  la TUI; la sesión completa terminó en $0.04 (plan + build).

**Fase build** (misma sesión, tras la instrucción de construir):

- Implementó exactamente lo planificado: API `POST /api/sorteo`
  (validación → sorteo → envío secuencial), sorteo como función pura en
  `src/lib/sorteo.ts`, plantilla y transporte SMTP en `src/lib/mailer.ts`, y
  la UI dividida en componentes (`SorteoApp`, `ParticipantForm`,
  `ParticipantTable`, `SorteoButton`).
- Verificaciones propias: compila (`tsc --noEmit`, `eslint` 0 warnings,
  `npm run build`), API probada contra casos de error, y prueba end-to-end
  con un servidor SMTP falso (puerto 2525): 4 participantes → 4 correos,
  derangement válido, cada correo con solo su asignación.
- Detectó y reportó que el puerto 3000 estaba ocupado y probó en el 3001.

**Cómo ejecutarla:** ver `app/README.md` (resumen: `npm install`, `cp
.env.example .env.local` con tus credenciales SMTP, `npm run dev` →
http://localhost:3000).

## Qué le faltó

- Con la decisión "no, simple" del plan, la app **no reporta fallas por
  destinatario**: si el SMTP rechaza un correo, la UI dice "El sorteo se
  realizó pero falló el envío de correos. Revisa la configuración SMTP y
  vuelve a realizar el sorteo" y a lo más te toca re-sortear completo — la
  iteración 3, sin plan, reportaba cada dirección rechazada con su código.
- El sorteo "fallido" (SMTP caído) consume el sorteo: no queda registro de
  la asignación ya efectuada.

## La lección

El plan convierte la improvisación del modelo en decisiones tuyas: el modo
plan pregunta antes de construir, y la calidad final depende de las decisiones
que entregas. Aquí la instrucción "simple" en reintentos produjo una app más
frágil en la devolución de errores que su versión improvisada de la iteración
3: plan no es "mejor", es "más controlado" — ambos se editan después.
Vale también revisar el detalle: el plan aparece con coste $0.00 y estructura
completa, ideal para iterar barato el diseño antes de gastar en build.

## Métricas de la sesión (export `assets/sesion.json`)

Único agente del experimento con **dos instrucciones del usuario** (plan +
build) en la misma sesión.

| Dato | Valor |
|---|---|
| Modelo | `opencode-go/glm-5.3-flash` (GLM 5.3 Flash, de pago) |
| Duración | 12,2 min (≈5,9 min hasta la instrucción de build + ≈6,3 min de build) |
| Mensajes | 53 (2 del usuario, 45 del agente) |
| Tool calls | 53: shell ×27, write ×15, edit ×5, read ×3, glob ×1, grep ×1, question ×1 |
| Tokens | entrada 39.227 · salida 13.075 · razonamiento 4.289 · caché leída 745.824 |
| Coste registrado | $0,0369 (fase plan ≈$0,00; fase build el resto) |

## Evidencia (`assets/`)

| Archivo | Qué muestra |
|---|---|
| `app-1.png` | Pantalla inicial con el flujo en 3 bloques numerados (participantes, lista, sorteo), botón deshabilitado y la explicación de las reglas. |
| `app-2.png` | Tras sortear con el SMTP mal configurado: el aviso de que el sorteo se hizo pero el envío falló, sin detalle por destinatario. |
| `app-3.png` | En un segundo intento con el SMTP correcto: el correo recibido por el participante con la asignación exclusiva. |
| `opencode-prompt-1.png` | Plan: preguntas del agente antes de construir (proveedor SMTP: genérico/Gmail/Mailtrap-Ethereal). |
| `opencode-prompt-2.png` | Plan: segunda pregunta (reintentos de envío: simple vs reintentos + reporte). |
| `opencode-prompt-3.png` | Plan: las dos respuestas registradas (genérico + no/simple) y decisiones cerradas. |
| `opencode-prompt-4.png` | El plan final del agente: stack, estructura archivo por archivo, comportamiento y notas que pide cambiar a build. |
| `opencode-prompt-5.png` | Cierre del build: tabla de archivos con su rol, verificaciones hechas (tsc/eslint/build, API, E2E con SMTP falso) y notas del puerto ocupado. |

## Conversación completa

La sesión real de OpenCode está en `assets/sesion.json` (export del historial
de las dos fases: plan, preguntas, razonamiento, build y verificaciones; rutas
locales anonimizadas).
