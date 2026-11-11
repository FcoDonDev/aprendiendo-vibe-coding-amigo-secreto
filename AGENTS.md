# AGENTS.md

## Qué es este repo

Repositorio de aprendizaje/evidencia del tutorial de blog [Aprendiendo "vibe-coding"](https://thetasydev.com/es/blog/vibe-coding-amigo-secreto/): varias implementaciones one-shot de una app "Amigo Secreto" (OpenCode + GLM Flash), una por iteración.

- Todo el contenido del repo (docs, prompts, commits, comentarios) está en **español**.
- Cada `iteracion-N[-tema]/` es un artefacto histórico de una sesión concreta: **no lo modifiques** (código, prompt, métricas ni capturas) salvo que el usuario lo pida explícitamente. El contenido nuevo va en una carpeta de iteración nueva.

## Estructura y stacks

Las iteraciones **no comparten código, dependencias ni tooling**. Cada una es independiente:

| Iteración | Stack | Cómo ejecutarla |
|---|---|---|
| `iteracion-1/` | HTML estático (`app/index.html`) | abrir en el navegador |
| `iteracion-2/` | Node plano, CommonJS | `npm install && npm run dev` (Node ≥ 18) |
| `iteracion-3/` a `iteracion-4/` | Next.js 16.4.3 (App Router) + TS + React 19 + Tailwind 4 + nodemailer | `npm install` y `npm run dev` desde su `app/` |
| `parte-2/amigo-secreto-a/` y `parte-2/amigo-secreto-b/` | Next.js 16.4.3 (App Router) + TS + React 19 + Tailwind 4 + nodemailer | `npm install` y `npm run dev` desde su `app/`; **amigo-secreto-b** además tiene `npm run test` (Vitest) |

Ejecuta siempre los comandos dentro del `app/` de la iteración concreta (no hay workspace raíz ni `node_modules` compartido): `npm run dev` (desarrollo), `npm run build` y `npm run lint` (verificación; los apps Next.js **no tienen suite de tests**).

## Reglas importantes

- **Next.js 16.4.3 es más reciente que tu entrenamiento**: cada app tiene su propio `AGENTS.md` generado por `next dev` y debe leerse, junto con `node_modules/next/dist/docs/` de esa app, antes de escribir código Next.js. Ese bloque lo re-escribe `next dev`: no lo borres y déjalo committeado para mantener el árbol limpio.
- **Credenciales SMTP nunca al repo**: `.env` / `.env.local` están en `.gitignore` (regla `*.env` a nivel raíz y por app). `.env.example` es la plantilla con las variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`; sin proveedor fijo, genéricas).
- **Nueva iteración**: crea `iteracion-N[-tema]/` con el mismo patrón que las anteriores — `readme.md` (prompt verbatim + métricas de `assets/sesion.json`), `app/` (código), `assets/` (capturas + export de sesión) — y añade su fila a la tabla de métricas del README raíz.
- `parte-2/` documenta dos flujos para añadir funcionalidades sobre el juego base (el resultado de `iteracion-4/`): `amigo-secreto-a/` (`build` directo) y `amigo-secreto-b/` (`AGENTS.md` + pruebas + `plan + build`, con suite Vitest). Sus `readme.md` y los exports de `assets/` están **sanitizados** (sin correos de pruebas reales, dominios ni rutas locales); el export de la sesión de pruebas incluye solo las 3 instrucciones del flujo documentado. El `app/README.md` de `amigo-secreto-a/` quedó desactualizado respecto a su código: no lo uses como referencia de sus funcionalidades.
