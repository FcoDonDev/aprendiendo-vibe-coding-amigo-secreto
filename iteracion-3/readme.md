# Iteración 3 — bases consolidadas: reglas + alcance + stack

## Prompt 

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

A diferencia de la iteración 2, esta vez **no hubo preguntas de aclaración**. Esto se debe a que el prompt ya cerraba reglas, alcance y stack tecnologico, así que el agente construyó directamente una **aplicación Next.js** con TypeScript, React, Tailwind CSS y Nodemailer, siguiendo dicha especificación:

- Server Action (`app/actions.ts`): normaliza, valida, sortea y envía.
- Algoritmo (`lib/sorteo.ts`) con `crypto` del sistema.
- Plantilla de correo texto + HTML (`lib/mail.ts`), donde cada correo contiene exclusivamente la asignación de su destinatario.
- UI cliente (`app/components/organizador.tsx`): alta/baja de participantes, validación en caliente y resultados del sorteo.
- La lista se guarda en `localStorage` (sin base de datos).
- Manejo de errores de negocio y credenciales: si el SMTP no llega, la app lo indica en pantalla y no envía nada ni expone asignaciones por accidente.
- Incluye su propio `app/README.md` con reglas, stack, configuración SMTP, variable por variable, y uso. Ejecutarla: `npm install`, `cp .env.example .env` y `npm run dev` → http://localhost:3000.


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
| `app-4.png` | El correo recibido por un participante, con su asignación y sin información de terceros. |
| `app-5.png` | Tras recargar la página, la lista de participantes persiste (localStorage): "Al recargar no se limpian". |
| `opencode-prompt-result.png` | La TUI de OpenCode con la respuesta final del agente. |
|`sesion.json`| Export del historial de la sesión de OpenCode (prompt, razonamiento, herramientas y respuesta). |
