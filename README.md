# aprendiendo-vibe-coding-amigo-secreto

Repositorio de aprendizaje. Encapsula los resultados de las iteraciones para crear
una aplicación estilo "Amigo Secreto" con *vibecoding*, como evidencia del
[tutorial del blog](https://thetastydev.com/es/blog/vibe-coding-amigo-secreto/).

**Modelo único:** todas las iteraciones fueron ejecutadas con **GLM 5.3 Flash (de pago)**
(`opencode-go/glm-5.3-flash`) en [OpenCode](https://opencode.ai), modo one-shot:
una única instrucción por sesión, sin contexto compartido entre ejecuciones.

## Estructura

```
├── iteracion-1/     # Prompt simple: "crea una aplicación del amigo secreto"
│   ├── readme.md    # El prompt verbatim + qué produjo + evidencia
│   ├── app/         # La app resultante
│   └── assets/      # Capturas de pantalla y conversación real de la sesión
├── iteracion-2/     # Prompt 1 + reglas del juego (participantes con correo, sorteo
│   ├── readme.md    # sin autoasignación, envío por email)
│   ├── app/
│   └── assets/
├── iteracion-3/     # Prompt 2 + reglas, alcance (web, sin auth, correos) y stack
│   ├── readme.md    # (TypeScript, Next.js, React + Tailwind, SMTP)
│   ├── app/
│   └── assets/
└── iteracion-4/     # Prompt 3 en dos fases: modo plan (arquitectura + preguntas)
    ├── readme.md    # y luego build en la misma sesión ("Procede con la implementacion
    ├── app/         # completa del proyecto")
    └── assets/
```

Cada carpeta incluye:

- `readme.md` — el prompt original verbatim, qué produjo y la referencia a la evidencia.
- `app/` — el código resultante, tal como lo generó el agente.
- `assets/` — capturas de pantalla de la app y/o del agente, más la conversación
  real de la sesión OpenCode (export del historial).

## Cómo reproducir

1. Instala OpenCode ([guía](https://thetastydev.com/es/blog/instalar-opencode/)).
2. Crea una carpeta vacía, entra en ella y abre `opencode`.
3. Pega el prompt verbatim del `readme.md` de la iteración tal cual, como única instrucción.
4. Prueba el resultado de `app/` con las instrucciones de su `app/README.md`.

## Métricas de las sesiones

Extraídas del export de sesión de OpenCode (`assets/sesion.json` de cada
iteración). Todas con el mismo modelo: **GLM 5.3 Flash (de pago)**
(`opencode-go/glm-5.3-flash`). El coste es el que registra OpenCode al
terminar la sesión.

| Iteración | Duración | Mensajes (user/agente) | Tool calls | Tokens entrada | Tokens salida | Raz. | Caché leída | Coste |
|---|---|---|---|---|---|---|---|---|
| 1 — prompt simple | 1,4 min | 8 (1/6) | 5 | 10.404 | 5.890 | 512 | 42.432 | $0,0060 |
| 2 — + reglas del juego | 5,5 min | 22 (1/20) | 25 | 21.224 | 8.784 | 1.377 | 214.336 | $0,0147 |
| 3 — + reglas, alcance y stack | 5,7 min | 40 (1/36) | 38 | 49.530 | 11.371 | 2.904 | 708.288 | $0,0358 |
| 4 — plan + build (2 prompts) | 12,2 min | 53 (2/45) | 53 | 39.227 | 13.075 | 4.289 | 745.824 | $0,0369 |
| **Total** | **24,8 min** | **123 (5/107)** | **121** | **120.385** | **39.120** | **9.082** | **1.710.880** | **$0,0934** |

Tool calls por iteración: 1: shell ×2, read, write, edit · 2: shell ×12, write ×10, glob, read, question ×1 · 3: shell ×16, write ×11, read ×6, edit ×4, execute ×1 · 4: shell ×27, write ×15, read ×3, edit ×5, glob, grep, question ×1.

> Nota: las rutas locales dentro de los exports de sesión fueron anonimizadas
> (`/home/franc` → `/home/dev`). El resto del historial está intacto.
