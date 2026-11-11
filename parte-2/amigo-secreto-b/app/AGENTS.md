<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reglas del proyecto

**Idioma obligatorio:** toda la documentación (README, comentarios, `AGENTS.md`) y las interacciones con el usuario (respuestas, mensajes, preguntas) se escriben **en español**. Los identificadores y los mensajes visibles del código también van en español (ver Convenciones).

Aplicación "Amigo Secreto": app de página única con Next.js 16 App Router e interfaz en español. Sin base de datos ni persistencia: un sorteo valida los participantes, calcula las asignaciones y las envía por correo con nodemailer/SMTP. Paquete único, sin workspaces, sin metadatos git en este directorio.

## Puesta en marcha
- Instalar paquetes ejecutando `npm install`.
- Ejecutar `npm run dev`.

## Pruebas y validaciones.
- **Suite de pruebas:** existe una suite de Vitest. Ejecutar `npm run test` (una pasada) o `npm run test:watch` (observación). El README documenta su uso.
- **Directriz de regresiones:** todo desarrollo nuevo o cambio de lógica (librerías, API, componentes) debe ir acompañado de **pruebas unitarias** que cubran los casos felices, los bordes y los errores, con el propósito de evitar regresiones. Actualizar las pruebas existentes cuando cambie un comportamiento.
- Convención: archivos de pruebas junto al módulo (`*.test.ts` para código de servidor, `*.test.tsx` para componentes React con @testing-library/jsdom).
- No hay script de `typecheck`; ejecutar `npx tsc --noEmit` explícitamente para verificar tipos. (Nota: `LayoutProps` en `layout.tsx` se genera en `.next/types/` con la primera `next build`/`next dev`; si `tsc` falla por ese símbolo, correr `npm run build` primero.)
- Comprobaciones: `npm run lint` (eslint, flat config), `npx tsc --noEmit`, `npm run test` y `npm run build` para una verificación completa. `next dev`/`next build` usan Turbopack.

## Entorno y comportamientos a tener en cuenta

- La configuración SMTP vive en `.env` en la raíz de la app. 
- Variables requeridas: `SMTP_HOST` (+ opcionales `SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM`). Si falta `SMTP_HOST`, el fallo es diferido: solo aparece cuando la API intenta enviar por primera vez.
- Cuerpo de `POST /api/sorteo`: `{ participantes: [{ nombre, correo }], opciones?: { tipo, cantidadAmigos, montoSugerido, exclusiones } }`. Devuelve `{ ok, enviados }`, 400 si la configuración es inválida o el reparto es imposible por exclusiones, o 502 si falla el SMTP — en caso de fallo el usuario simplemente repite el sorteo; por diseño no se persiste nada ni se reintentan envíos.

## Convenciones

- Cadenas visibles, mensajes de error e identificadores en español (`sortearAmigoSecreto`, `Participante`, `Asignacion`, `de`/`para`, `enviarAsignaciones`). Mantener en español todo lo nuevo.
- Reglas de negocio respetarlas al tocar `src/lib/sorteo.ts`: el resultado debe ser un *derangement* K-regular (nadie se asigna a sí mismo, todos regalan y reciben exactamente K veces sin repetir pareja, con K=1 en el modo individual) y respeta las exclusiones mutuas entre pares; con ≤ 1 participante o reparto imposible devuelve `{ ok: false, motivo }`; los correos duplicados se rechazan en `validacion.ts`.
- `src/lib/sorteo.ts` es una función pura que garantiza la existencia del reparto con un flujo máximo sobre la red bipartita emisor → receptor (capacidad K por nodo, 1 por arista) antes de asignar, y luego aleatoriza con intercambios válidos entre emisores — no "simplificarlo" con re-mezcla al azar ni eliminar la comprobación de factibilidad.
- La validación del cuerpo de `POST /api/sorteo` vive en `src/lib/validacion.ts` (extraída para poder probarla aislada del App Router; `route.ts` solo orquesta).
- Tailwind CSS v4 se integra vía `turbopack.rules` en `next.config.ts`, no por la configuración de PostCSS. `cacheComponents: true` y `partialPrefetching: true` están activados.
