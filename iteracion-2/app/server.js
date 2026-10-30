require("dotenv").config();
const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");
const SMTPTransport = require("nodemailer/lib/smtp-transport");
const { drawAssignment } = require("./draw");
const { buildAssignmentEmail } = require("./email-template");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// Servir el frontend (sin exponer archivos ocultos como .env)
app.use(express.static(path.join(__dirname, "public"), { dotfiles: "ignore" }));

/** Crea el transportador SMTP a partir de las variables de entorno. */
function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (!SMTP_USER || !SMTP_PASS) {
    const err = new Error(
      "Falta la configuración SMTP. Copia .env.example a .env y define SMTP_USER y SMTP_PASS."
    );
    err.status = 500;
    throw err;
  }

  const options = {
    host: SMTP_HOST || "smtp.gmail.com",
    port: parseInt(SMTP_PORT || "465", 10),
    secure: SMTP_SECURE !== undefined ? SMTP_SECURE === "true" : true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  };

  return nodemailer.createTransport(new SMTPTransport(options));
}

/** Normaliza una dirección: minúsculas y sin espacios. */
function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Realiza el sorteo.
 * Body: { participantes: [{ nombre, correo }], organizador?: { nombre, correo } }
 * Cada participante recibe un correo con su asignación.
 */
app.post("/api/sorteo", async (req, res) => {
  try {
    const participantes = Array.isArray(req.body?.participantes)
      ? req.body.participantes
      : [];

    // ---- Validación de la lista de participantes ----
    const vista = new Map(); // correo normalizado -> nombre original
    for (const [i, p] of participantes.entries()) {
      const nombre = String(p?.nombre ?? "").trim();
      const correo = normalizeEmail(p?.correo ?? "");

      if (!nombre) {
        return res.status(400).json({ error: `El participante ${i + 1} no tiene nombre.` });
      }
      if (!EMAIL_RE.test(correo)) {
        return res
          .status(400)
          .json({ error: `El correo de "${nombre}" no es válido: "${p?.correo}".` });
      }
      if (vista.has(correo)) {
        return res.status(400).json({
          error: `"${nombre}" y "${vista.get(correo)}" tienen el mismo correo (${correo}). No se permite duplicar participantes.`,
        });
      }
      vista.set(correo, nombre);
    }

    if (participantes.length < 2) {
      return res
        .status(400)
        .json({ error: "Se necesitan al menos 2 participantes para hacer el sorteo." });
    }

    // ---- Sorteo: nadie se asigna a sí mismo ----
    const perm = drawAssignment(participantes.length);
    const asignaciones = participantes.map((p, i) => ({
      de: { nombre: String(p.nombre).trim(), correo: normalizeEmail(p.correo) },
      para: {
        nombre: String(participantes[perm[i]].nombre).trim(),
        correo: normalizeEmail(participantes[perm[i]].correo),
      },
    }));

    // ---- Envío de correos ----
    const transporter = createTransporter();
    const remitente = process.env.MAIL_FROM || process.env.SMTP_USER;
    const fecha = new Date().toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const resultados = await Promise.allSettled(
      asignaciones.map((a) =>
        transporter.sendMail({
          from: remitente,
          to: `"${a.de.nombre}" <${a.de.correo}>`,
          subject: `🎁 Tu asignación del Amigo Secreto (${fecha})`,
          text: buildAssignmentEmail({ ...a, fecha }).text,
          html: buildAssignmentEmail({ ...a, fecha }).html,
        })
      )
    );

    const fallidos = resultados
      .map((r, i) => (r.status === "rejected" ? { participante: asignaciones[i].de.nombre } : null))
      .filter(Boolean);

    const enviados = resultados.filter((r) => r.status === "fulfilled").length;

    if (enviados === 0) {
      return res.status(502).json({
        error: "El sorteo se realizó pero no se pudo enviar ningún correo. Revisa la configuración SMTP.",
      });
    }

    res.json({
      ok: true,
      enviados,
      fallidos,
      mensaje:
        fallidos.length > 0
          ? `Sorteo realizado: ${enviados} de ${asignaciones.length} correos enviados.`
          : `¡Sorteo realizado y asignaciones enviadas con éxito!`,
    });
  } catch (err) {
    const status = err.status || 500;
    console.error("Error en /api/sorteo:", err);
    res.status(status).json({ error: err.message || "Error interno del servidor." });
  }
});

app.listen(PORT, () => {
  console.log(`🎄 Amigo Secreto disponible en http://localhost:${PORT}`);
});
