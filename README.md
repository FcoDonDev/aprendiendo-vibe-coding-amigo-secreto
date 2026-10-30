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
│   ├── assets/
│   └── ...
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

> Nota: las rutas locales dentro de los exports de sesión fueron anonimizadas
> (`/home/franc` → `/home/dev`). El resto del historial está intacto.
