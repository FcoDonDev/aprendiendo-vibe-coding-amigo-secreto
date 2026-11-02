# Aprendiendo "vibe-coding": hagamos una app para jugar al "amigo secreto"

Repositorio de aprendizaje que contiene los resultados de las iteraciones realizadas para la implementación de una aplicación estilo "Amigo Secreto" con *vibecoding*. 

Forma parte de la evidencia del blog tutorial [Aprendiendo "vibe-coding": hagamos una app para jugar al "amigo secreto"](https://thetasydev.com/es/blog/vibe-coding-amigo-secreto/)

- **harness**: [OpenCode](https://opencode.ai)
- **modelo**: GLM 5.3 Flash (`opencode-go/glm-5.3-flash`) en [OpenCode](https://opencode.ai)
- **modo**: *one-shot*, es decir, una única instrucción por sesión, sin contexto compartido entre ejecuciones.

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
└── iteracion-4/     
    ├── readme.md    
    ├── app/         
    └── assets/
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
