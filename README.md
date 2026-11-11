# Aprendiendo "vibe-coding": hagamos una app para jugar al "amigo secreto"

Repositorio de aprendizaje que contiene los resultados de las iteraciones realizadas para la implementación de una aplicación estilo "Amigo Secreto" con *vibecoding*. El contenido está organizado en dos partes:

- **Parte 1**: cuatro iteraciones *single-shot* — una instrucción por sesión, desde un prompt simple hasta el flujo `plan + build` — que construyen la app desde cero.
- **Parte 2**: funcionalidades nuevas **sobre el juego base** (exclusiones, monto sugerido, múltiples amigos secretos), comparando el flujo `build` directo contra `AGENTS.md` + pruebas unitarias + `plan + build`. Ver `parte-2/readme.md`.

Forma parte de la evidencia del blog tutorial [Aprendiendo "vibe-coding": hagamos una app para jugar al "amigo secreto"](https://thetasydev.com/es/blog/vibe-coding-amigo-secreto/)

- **harness**: [OpenCode](https://opencode.ai)
- **modelo**: GLM 5.3 Flash (`opencode-go/glm-5.3-flash`) en [OpenCode](https://opencode.ai)
- **modo**: parte 1 en *single-shot* (una única instrucción por sesión, sin contexto compartido entre ejecuciones); parte 2 añade funcionalidades sobre lo existente con varias instrucciones por sesión.

## Estructura

```
├── iteracion-1/     
│   ├── readme.md    
│   ├── app/         
│   └── assets/      
├── iteracion-2/     
│   ├── readme.md    
│   ├── app/
│   └── assets/
├── iteracion-3/     
│   ├── readme.md    
│   ├── app/
│   └── assets/
├── iteracion-4/     
│   ├── readme.md    
│   ├── app/         
│   └── assets/
└── parte-2/                 
    ├── readme.md            
    ├── amigo-secreto-a/     
    │   ├── assets/
    │   └── app/
    └── amigo-secreto-b/     
        ├── assets/
        └── app/
```
Cada carpeta incluye:
- `readme.md`: el prompt utilizado y referencias a los resultados.
- `app/`: el código resultante de la sesión.
- `assets/`: capturas de pantalla y export del historial de la sesión.

## Métricas de las sesiones

Extraídas del export de cada sesión de OpenCode (`assets/sesion.json`).
El coste es el que registra OpenCode al terminar la sesión.

| Iteración | Duración | Mensajes (user/agente) | Tool calls | Tokens entrada | Tokens salida | Razonamiento | Caché leída | Coste |
|---|---|---|---|---|---|---|---|---|
| 1 — prompt simple | 1,4 min | 8 (1/6) | 5 | 10.404 | 5.890 | 512 | 42.432 | $0,0060 |
| 2 — + reglas del juego | 5,5 min | 22 (1/20) | 25 | 21.224 | 8.784 | 1.377 | 214.336 | $0,0147 |
| 3 — + reglas, alcance y stack | 5,7 min | 40 (1/36) | 38 | 49.530 | 11.371 | 2.904 | 708.288 | $0,0358 |
| 4 — plan + build (2 prompts) | 12,2 min | 53 (2/45) | 53 | 39.227 | 13.075 | 4.289 | 745.824 | $0,0369 |

### Parte 2 — funcionalidades sobre el juego base

Sesiones de la parte 2, calculadas desde sus exports (`parte-2/*/assets/`).

| Sesión | Duración | Mensajes (user/agente) | Tool calls | Tokens entrada | Tokens salida | Razonamiento | Caché leída | Coste |
|---|---|---|---|---|---|---|---|---|
| A — build directo (funcionalidades) | 8,3 min | 42 (1/40) | 47 | 71.585 | 16.627 | 13.193 | 1.302.336 | $0,00 |
| B1 — pruebas unitarias (plan + build) | 18,7 min | 62 (3/57) | 74 | 128.206 | 20.552 | 9.099 | 1.881.152 | $0,00 |
| B2 — funcionalidades (plan + build) | 41,6 min | 66 (2/62) | 86 | 161.226 | 39.039 | 26.788 | 3.866.752 | $0,1630 |

