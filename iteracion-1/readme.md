# Iteración 1 — el prompt simple

## Prompt 

```text
crea una aplicación del amigo secreto
```

## Qué produjo

Una aplicación completa en un solo archivo que incluye: HTML + CSS + JS embebidos.
Cero dependencias.

Para ejecutar simplemente damos "doble clic" y la abrimos en el navegador.

## Métricas de la sesión (export `assets/sesion.json`)

| Dato | Valor |
|---|---|
| Modelo | `opencode-go/glm-5.3-flash` (GLM 5.3 Flash) |
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
| `opencode-prompt-result.png` | La TUI de OpenCode con la respuesta final del agente |
|`sesion.json` | Export del historial de la sesión de OpenCode (prompt, razonamiento, herramientas y respuesta). |
