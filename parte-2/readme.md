# Parte 2 — más allá del "single-shot": dos flujos sobre el juego base

El punto de partida es el resultado de la [iteración 4](../iteracion-4/readme.md) de la parte 1: el juego base funciona. En esta parte añadimos funcionalidades **sobre lo existente** — exclusiones entre participantes, monto sugerido del regalo y cantidad de amigos secretos — reutilizando **el mismo prompt de requerimientos** en dos flujos distintos:

1. **Flujo `build` directo**: se envía el listado de requerimientos y el agente genera el código completo. Resultado en `amigo-secreto-a/`.
2. **Flujo `AGENTS.md` + pruebas unitarias + `plan + build`**: se da contexto al agente con `AGENTS.md`, se agrega una suite de pruebas contra regresiones y recién entonces se implementa, en dos fases. Resultado en `amigo-secreto-b/`.

Forma parte de la evidencia del artículo [Aprendiendo "vibe-coding" — Parte 2: más allá del "single-shot"](https://thetasydev.com/es/blog/vibe-coding-amigo-secreto-exclusiones/).

- **harness**: [OpenCode](https://opencode.ai)
- **modelo**: GLM 5.3 Flash (`opencode-go/glm-5.3-flash`)

## Prompt (verbatim) — el mismo para las dos apps

```text
El juego base funciona. Ahora añadamos las siguientes funcionalidades:
- Exclusiones entre participantes:
    - El organizador puede definir pares de participantes que NO pueden asignarse entre sí (parejas, familiares directos, etc.)
    - El sorteo debe tener en cuenta estas exclusiones y seguir garantizando que nadie se autoasigne
    - Si con las exclusiones no existe una asignación válida, avisar al organizador
- Monto sugerido para los regalos:
    - El organizador puede definir un monto sugerido aplicable a los regalos.
    - Se debe notificar en el correo.
- Cantidad de amigos secretos:
    - El organizador puede definir si el sorteo será individual (tradicional) o con múltiples amigos secretos.
    - Sorteo individual: juego tradicional, es lo que ya se tiene implementado.
    - Sorteo múltiple: 
        - Cada participante puede tener 2 o más amigos secretos.
        - La cantidad de amigos secretos debe ser definida por el organizador.
        - Todos los participantes reciben la misma cantidad de regalos (asignaciones).
        - Si se definen 2 amigos secretos entonces cada participante tambien recibe exactamente 2 regalos
        - No se deben repetir las asignaciones
```

## App A — flujo `build` directo (`amigo-secreto-a/`)

Una sola instrucción en modo `build`. El agente no hizo preguntas.

**Qué produjo:**

- Implementó las tres funcionalidades sobre el juego base:
  - **Exclusiones**: nuevo componente `ReglasSorteo.tsx` (selección de pares por listas desplegables, tarjetas con "Quitar"); el algoritmo convierte los pares en bloqueos internos. Si no existe reparto válido, responde **422** y no se envía ningún correo.
  - **Monto sugerido**: campo opcional que aparece en cada correo ("Monto sugerido del regalo: $300").
  - **Cantidad de amigos secretos**: modo individual (tradicional) o múltiple (K asignaciones por participante, sin repetir parejas).
- Realizó verificaciones propias: compilación limpia, 187 verificaciones del algoritmo y un sorteo real end-to-end con SMTP.
- Sin plan previo y sin suite de pruebas.

**Métricas de la sesión** (`amigo-secreto-a/assets/session-a.json`)

| Duración | Mensajes (user/agente) | Tool calls | Tokens entrada | Tokens salida | Razonamiento | Caché leída | Coste |
|---|---|---|---|---|---|---|---|
| 8,3 min | 42 (1/40) | 47 (shell ×24, edit ×8, read ×7, write ×7, subagent ×1) | 71.585 | 16.627 | 13.193 | 1.302.336 | $0,00 |

**Evidencia** (`amigo-secreto-a/assets/`)

| Archivo | Qué muestra |
|---|---|
| `opencode-result.png` | La app con las funcionalidades nuevas (exclusiones, monto, modo del sorteo). |
| `session-a.json` | Historial completo de la sesión. |

## App B — flujo `AGENTS.md` + pruebas + `plan + build` (`amigo-secreto-b/`)

Tres pasos, cada uno con una sesión nueva de OpenCode para no mezclar contextos.

### Paso 0 — archivo `AGENTS.md` (sin export)

Con el comando `/init` de OpenCode, el agente generó el `AGENTS.md` con el contexto de la aplicación, la verificación y las convenciones. Como la sesión no conocía lo anterior, el archivo quedó en inglés; una instrucción adicional lo tradujo y dejó la directriz de documentar e interactuar en español. Capturas en `amigo-secreto-b/assets/`.

### Paso 1 — pruebas unitarias (sesión con 3 instrucciones)

La instrucción de planificación:

```text
Lista las funcionalidades existentes y planifica la incorporación de pruebas unitarias.
```

Preguntas del agente (fase plan) y respuestas registradas:

| Pregunta | Respuesta |
|---|---|
| ¿Qué alcance quieres para las pruebas unitarias? | Fases 1–5 completas (con UI) |
| ¿Qué framework de pruebas prefieres? | Vitest |
| Para probar la validación de la ruta API, ¿cómo prefieres acceder a ella? | Ambas (unitarias + integración) |

La instrucción de build (y un "continua" para terminar la respuesta que quedó cortada):

```text
Procede con la implementación.
Incorpora la directriz en el archivo AGENTS.md de incluir pruebas unitarias en los desarrollos con el proposito de evitar regresiones.
```

**Qué produjo:**

- Suite de pruebas con **Vitest 5**: `vitest.config.mts` con dos proyectos (Node para lib/API, jsdom + @testing-library para UI) y `vitest.setup.ts` con matchers de jest-dom.
- **54 pruebas en 8 archivos**, junto a cada módulo: reglas del sorteo (derangement, respaldo de rotación circular forzado), mailer con nodemailer simulado, validación de la ruta API y componentes.
- Directriz agregada al `AGENTS.md`: todo cambio de lógica debe ir acompañado de pruebas unitarias para evitar regresiones.
- Verificaciones en verde: `npm run test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.

**Métricas de la sesión** (`amigo-secreto-b/assets/session-pruebas.json`)

| Duración | Mensajes (user/agente) | Tool calls | Tokens entrada | Tokens salida | Razonamiento | Caché leída | Coste |
|---|---|---|---|---|---|---|---|
| 18,7 min | 62 (3/57) | 74 (edit ×22, shell ×18, write ×13, read ×12, grep ×5, glob ×3, question ×1) | 128.206 | 20.552 | 9.099 | 1.881.152 | $0,00 |

### Paso 2 — funcionalidades (`plan + build`)

El mismo prompt de requerimientos de la App A, esta vez en modo `plan`.

Preguntas del agente (fase plan) y respuestas registradas:

| Pregunta | Respuesta |
|---|---|
| ¿Cómo capturar el monto sugerido para los regalos? | Campo numérico con la posibilidad de especificar un rango |
| ¿Cómo funcionan las exclusiones entre participantes? | Mutua (ni A→B ni B→A) |
| ¿Validamos en la UI si es imposible con las exclusiones? | Solo servidor |

La instrucción de build:

```text
Procede con la implementacion
```

**Qué produjo:**

- Reescritura de `src/lib/sorteo.ts` con **flujo máximo** sobre la red bipartita emisor → receptor (capacidad K por nodo, 1 por arista): garantiza con certeza la existencia del reparto antes de asignar; el "reparto imposible" por exclusiones se detecta con exactitud (400). El respaldo de rotación circular del juego base ya no era correcto con exclusiones y fue eliminado.
- Nueva `src/lib/validacion.ts`: validación del cuerpo de la API aislada de `route.ts` (que solo orquesta).
- Soporta los tres modos (individual, múltiple con K amigos, exclusiones mutuas), retrocompatible con el juego base.
- Suite de pruebas ampliada: **117 pruebas** pasando, más lint, `tsc` y build en verde.
- Convención actualizada en `AGENTS.md` (garantía por flujo máximo, no "simplificar" con re-mezcla).

**Métricas de la sesión** (`amigo-secreto-b/assets/session-b-funcionalidades.json`)

| Duración | Mensajes (user/agente) | Tool calls | Tokens entrada | Tokens salida | Razonamiento | Caché leída | Coste |
|---|---|---|---|---|---|---|---|
| 41,6 min | 66 (2/62) | 86 (edit ×40, read ×18, write ×13, shell ×12, grep ×1, glob ×1, question ×1) | 161.226 | 39.039 | 26.788 | 3.866.752 | $0,1630 |

**Evidencia** (`amigo-secreto-b/assets/`)

| Archivo | Qué muestra |
|---|---|
| `opencode-init-agents.png` | Comando `/init` para generar el `AGENTS.md`. |
| `opencode-init-agents-result.png` | `AGENTS.md` generado y contextualizado. |
| `opencode-plan-pruebas-pregunta-1/2/3.PNG` | Las tres preguntas del plan de pruebas. |
| `opencode-plan-pruebas-pregunta-resumen.PNG` | Resumen de las decisiones registradas. |
| `opencode-plan-pruebas-resultado.PNG` | El plan de pruebas entregado por el agente. |
| `opencode-build-pruebas-resultado.PNG` | Cierre del build: 54 pruebas en 8 archivos, verificaciones en verde. |
| `opencode-plan-funcionalidades-pregunta-1/2/3.PNG` | Las tres preguntas del plan de funcionalidades. |
| `opencode-plan-funcionalidades-resumen.PNG` | Resumen de las decisiones registradas. |
| `opencode-plan-funcionalidades-resultado.PNG` | El plan de funcionalidades entregado por el agente. |
| `session-pruebas.json` | Historial de la sesión de pruebas. |
| `session-b-funcionalidades.json` | Historial de la sesión de funcionalidades. |

## Comparación de los dos flujos

| | App A — `build` directo | App B — `AGENTS.md` + pruebas + `plan + build` |
|---|---|---|
| Instrucciones del usuario | 1 | 6, en 3 sesiones (1 sin export) |
| Duración | 8,3 min | ≈60 min entre la sesión de pruebas y la de funcionalidades |
| Coste registrado | $0,00 | $0,00 + $0,1630 |
| Preguntas del agente | ninguna | 3 + 3 (una por cada fase plan) |
| Pruebas unitarias | no | sí: 54 tras el paso 1, 117 al cerrar el paso 2 |
| Reparto imposible por exclusiones | 422 | 400, detectado con certeza (flujo máximo) |
| Directrices de proyecto (`AGENTS.md`) | el autogenerado por Next.js | contexto en español + directriz de pruebas para evitar regresiones |

Notas:

- El coste es el que registra OpenCode al terminar cada sesión; $0,00 es el valor registrado en esas dos sesiones.
- Los exports de `assets/` fueron regenerados desde el almacen local de OpenCode y **sanitizados** (direcciones de correo de pruebas, dominios y rutas locales). El export de la sesión de pruebas incluye solo las 3 instrucciones del flujo documentado en el artículo.
- El `app/README.md` de la App A quedó desactualizado respecto a su código (no documenta las funcionalidades nuevas ni la API); el de la App B sí está al día.

**Cómo ejecutarlas:** ver `amigo-secreto-a/app/README.md` y `amigo-secreto-b/app/README.md` (la App B incluye además `npm run test`).
