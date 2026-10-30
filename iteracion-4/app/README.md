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

## Tecnología

- Next.js (App Router) + TypeScript
- React + Tailwind CSS
- Sin base de datos
- Envío de correos con nodemailer vía SMTP

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

## Estructura

```
src/
├── app/
│   ├── page.tsx              # Página única del organizador
│   └── api/sorteo/route.ts   # POST: valida, sortea y envía correos
├── components/               # Formulario, tabla, botón y orquestador
└── lib/
    ├── sorteo.ts             # Algoritmo de sorteo (función pura)
    └── mailer.ts             # Cliente nodemailer + plantilla del correo
```

## Notas

- Si algún correo falla, la respuesta HTTP indica el error y el organizador
  puede repetir el sorteo completo (no se persiste nada, no hay reintentos).
- Para probar sin un SMTP real, se puede usar cualquier servidor de prueba
  (Mailtrap, Ethereal) configurando las variables de entorno.
