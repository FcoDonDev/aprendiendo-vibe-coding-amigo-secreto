# Iteración 4 — plan primero, build después

El mismo prompt de la iteración 3, separado en 2 fases: modo `plan`+ `build`. 

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

Una vez entregado el plan se cambia a modo build y se ejecuta la instrucción:

```text
Procede con la implementacion completa del proyecto
```

## Qué produjo

**Fase plan** :

- No se realiza ninguna implementación.
- El agente entrega un plan completo y legible que incluye: 
  - stack tecnologico: Next.js + TypeScript + React + Tailwind
  - estructura de carpetas propuesta, archivo por archivo
  - el comportamiento paso a paso de la app (validaciones, algoritmo, envío secuencial, nunca mostrar asignaciones en la UI,etc).
- Hizo 2 preguntas: 
  - ¿qué proveedor SMTP? --> Resp: genérico por variables de entorno
  - ¿reintentos de envío? --> Resp: no, simple

**Fase build**

- Implementó lo planificado
- Realiza verificaciones propias


**Cómo ejecutarla:** ver `app/README.md`

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
| `app-2.png` | Resultado del sorteo. Se aprecia un error que solicita revisar la configuración del SMTP. El problema real es que no todas las casillas especificas existen pero el error desplegado oculta ese detalle por destinatario. |
| `app-3.png` | El correo recibido por el participante con la asignación exclusiva. |
| `opencode-prompt-1.png` | Plan: preguntas del agente antes de construir (proveedor SMTP: genérico/Gmail/Mailtrap-Ethereal). |
| `opencode-prompt-2.png` | Plan: segunda pregunta (reintentos de envío: simple vs reintentos + reporte). |
| `opencode-prompt-3.png` | Plan: las dos respuestas registradas (genérico + no/simple) y decisiones cerradas. |
| `opencode-prompt-4.png` | El plan final del agente: stack, estructura archivo por archivo, comportamiento y notas que pide cambiar a build. |
| `opencode-prompt-5.png` | Cierre del build: tabla de archivos con su rol, verificaciones hechas, etc. |
|`sesion.json`| Historial completo de la sesión de OpenCode. |
