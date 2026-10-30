# Iteración 1 — el prompt simple

La primera prueba: le indicamos al agente lo primero que se nos ocurre,
sin dar ningún detalle adicional.

## Prompt (verbatim)

```text
crea una aplicación del amigo secreto
```

## Qué produjo

Una aplicación completa en **un solo archivo** (`app/index.html`, HTML + CSS +
JS embebidos, cero dependencias). Basta con abrirla en el navegador (doble clic
o `xdg-open index.html`).

Funcionalidades que el agente decidió incluir por su cuenta:

- Gestión de participantes: agregar con validación de duplicados y eliminar individualmente.
- Sorteo aleatorio justo (Fisher-Yates con reintentos) que garantiza que nadie
  se autoasigne — verificado por el agente con 2.000 simulaciones.
- **Exclusiones opcionales**: selector por persona de quiénes no pueden salir
  asignados entre sí ("parejas"; la app añadió esta feature sin pedirla).
- Resultados secretos: tarjetas ocultas que se revelan al tocarlas, con
  botones de revelar/ocultar/borrar sorteo.
- Persistencia en `localStorage` de participantes y sorteo.
- Tema oscuro, responsive.

## Qué le faltó

El prompt no decía nada de correos electrónicos ni persistencia real, así que:

- No hay envío de la asignación por correo (los resultados solo viven en el navegador).
- No pide nombre + correo de los participantes, solo nombre.

## La lección

Con un prompt mínimo el modelo "sabe" cómo funciona el juego y toma
iniciativa (añadió exclusiones y las tarjetas sorpresa por su cuenta), pero la
*pequeña* app resultante es local: guarda los sorteos solo en el navegador.
Punto de partida perfecto para comparar contra los prompts más específicos.

## Métricas de la sesión (export `assets/sesion.json`)

| Dato | Valor |
|---|---|
| Modelo | `opencode-go/glm-5.3-flash` (GLM 5.3 Flash, de pago) |
| Duración | 1,4 min |
| Mensajes | 8 (1 del usuario, 6 del agente) |
| Tool calls | 5: shell ×2, read ×1, write ×1, edit ×1 |
| Tokens | entrada 10.404 · salida 5.890 · razonamiento 512 · caché leída 42.432 |
| Coste registrado | $0,0060 |

## Evidencia (`assets/`)

| Archivo | Qué muestra |
|---|---|
| `app-1.png` | Pantalla inicial: lista de participantes vacía y botón de sorteo deshabilitado (mínimo 2 participantes). |
| `app-2.png` | 3 participantes agregados (Pedro, Juan, Diego) y los selectores de exclusiones por persona que la app generó por su cuenta. |
| `app-3.png` | Tras sortear: tarjetas secretas ocultas ("toca para revelar"), sin ver la del resto. |
| `app-4.png` | Asignaciones reveladas: Pedro → Juan, Juan → Diego, Diego → Pedro (derangement válido). |
| `opencode-prompt-result.png` | La TUI de OpenCode con la respuesta final del agente: lo que construyó, la verificación con simulaciones y el coste ($0,0060). |

## Conversación completa

La sesión real de OpenCode, `assets/sesion.json` (export del historial: prompt,
razonamiento, herramientas y respuesta; rutas locales anonimizadas).
