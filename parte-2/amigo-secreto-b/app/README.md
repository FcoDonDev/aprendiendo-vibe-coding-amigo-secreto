# 🎅 Amigo Secreto

Aplicación web para organizar un sorteo de amigo secreto.

El organizador registra los participantes (nombre + correo), ejecuta el sorteo
y cada persona recibe **por correo**, y de forma privada, el nombre de su
asignado.

## Reglas implementadas

- Mínimo de 2 participantes.
- Nadie queda asignado a sí mismo (el sorteo genera un *derangement*).
- Todos regalan exactamente una vez y todos reciben exactamente una vez.
- Cada correo contiene exclusivamente la asignación de su destinatario.
- Correos duplicados no son admitidos.

### Exclusiones entre participantes

- El organizador puede definir pares de participantes que no pueden tocarse
  (parejas, familiares directos…). La exclusión vale en **ambas
  direcciones**: si A–B quedan excluidos, ni A regala a B ni B a A.
- El sorteo respeta las exclusiones y sigue garantizando el *derangement*.
- Si con las exclusiones no existe un reparto posible, la API responde 400 y
  el organizador debe revisar los pares o agregar más participantes (no se
  envió ningún correo).

### Monto sugerido

- El organizador puede definir un monto sugerido por regalo: un solo valor
  (mínimo) o un rango (mínimo y máximo). Es opcional.
- Si está definido, cada correo anuncia "Monto sugerido del regalo: 10" o
  "Monto sugerido del regalo: entre 10 y 20".

### Cantidad de amigos secretos

- El sorteo puede ser **individual** (clásico) o **multiple**.
- En el modo múltiple el organizador define la cantidad K de amigos secretos
  (mínimo 2, máximo n−1): cada participante regala y recibe exactamente K
  regalos, a personas distintas y sin repetir parejas.
- Las exclusiones y las reglas de no autoasignación se respetan igual en
  ambos modos. Con 2+ regalos cada correo lista los K asignados de su
  destinatario.

## Tecnología

- Next.js (App Router) + TypeScript
- React + Tailwind CSS
- Sin base de datos
- Envío de correos con nodemailer vía SMTP

## Pruebas unitarias

La suite usa **Vitest**, con pruebas junto a cada módulo:

```bash
npm run test          # una pasada
npm run test:watch    # modo observación
```

- `*.test.ts` (librerías y API) corren en entorno Node; `*.test.tsx`
  (componentes) en jsdom con @testing-library.
- Cubren las reglas de negocio del sorteo (derangement, K-regularidad en el
  modo múltiple, exclusiones respetadas, casos imposibles, mínimo de 2), la
  validación de participantes y opciones, el envío de correos con el mock de
  nodemailer y toda la interfaz (agregar, eliminar, exclusiones,
  configuración, sortear, errores).
- Como opción, cobertura con `npx vitest run --coverage`.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completa los valores SMTP
npm run dev                  # http://localhost:3000
```

### Variables de entorno (.env.local)

| Variable    | Descripción                                                        |
| ----------- | ------------------------------------------------------------------ |
| `SMTP_HOST` | Servidor SMTP (obligatorio)                                        |
| `SMTP_PORT` | Puerto (587 STARTTLS por defecto; 465 implica TLS directo)          |
| `SMTP_USER` | Usuario SMTP (opcional)                                            |
| `SMTP_PASS` | Contraseña SMTP (opcional)                                         |
| `SMTP_FROM` | Remitente visible, p. ej. `Amigo Secreto <sorteo@ejemplo.com>`      |

## API: `POST /api/sorteo`

Cuerpo:

```json
{
  "participantes": [{ "nombre": "Ana", "correo": "ana@ejemplo.com" }],
  "opciones": {
    "tipo": "individual",
    "cantidadAmigos": 3,
    "montoSugerido": { "minimo": 10, "maximo": 20 },
    "exclusiones": [
      { "correo1": "ana@ejemplo.com", "correo2": "berto@ejemplo.com" }
    ]
  }
}
```

- `opciones` es opcional: si se omite, se sortea individual sin exclusiones.
- `montoSugerido` admite solo `minimo`, o `minimo` y `maximo` (números
  positivos, máximo ≥ mínimo).
- Respuestas: `{ ok: true, enviados }` en 200; 400 ante errores de
  validación, configuración inválida o reparto imposible; 502 si falló SMTP
  después del sorteo.

## Estructura

```
src/
├── app/
│   ├── page.tsx              # Página única del organizador
│   └── api/sorteo/route.ts   # POST: valida, sortea y envía correos
├── components/               # Formulario, tabla, exclusiones, configuración, orquestador
└── lib/
    ├── sorteo.ts             # Algoritmo de sorteo (flujo máximo, función pura)
    ├── validacion.ts         # Validación del cuerpo de la API
    └── mailer.ts             # Cliente nodemailer + plantilla del correo
```

Cada módulo tiene sus pruebas a su lado (`*.test.ts` / `*.test.tsx`).

## Notas

- Si algún correo falla, la respuesta HTTP indica el error y el organizador
  puede repetir el sorteo completo (no se persiste nada, no hay reintentos).
- Para probar sin un SMTP real, se puede usar cualquier servidor de prueba
  (Mailtrap, Ethereal) configurando las variables de entorno.
