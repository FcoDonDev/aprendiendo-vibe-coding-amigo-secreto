import { createTransport, type Transporter } from "nodemailer";
import type { Asignacion } from "@/lib/sorteo";

let transporte: Transporter;

function obtenerTransporte(): Transporter {
  if (transporte) return transporte;

  const host = process.env.SMTP_HOST;
  const puerto = Number(process.env.SMTP_PORT ?? "587");

  if (!host) {
    throw new Error(
      "Falta la variable SMTP_HOST en la configuración (.env.local).",
    );
  }

  transporte = createTransport({
    host,
    port: puerto,
    // El puerto 465 usa TLS implícito; el resto negocia con STARTTLS.
    secure: puerto === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });

  return transporte;
}

function remitente(): string {
  return process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "amigo-secreto@localhost";
}

function construirCorreo(asignacion: Asignacion) {
  return {
    from: remitente(),
    to: asignacion.de.correo,
    subject: "🎁 Asignación de tu amigo secreto",
    text:
      `Hola ${asignacion.de.nombre}:\n\n` +
      `Ya se hizo el sorteo del amigo secreto 🎄\n\n` +
      `Te toca regalar a: ${asignacion.para.nombre}\n\n` +
      `Recuerda mantener en secreto tu asignación. ¡Felices fiestas!`,
    html:
      `<p>Hola <strong>${asignacion.de.nombre}</strong>:</p>` +
      `<p>Ya se hizo el sorteo del amigo secreto 🎄</p>` +
      `<p>Te toca regalar a: <strong>${asignacion.para.nombre}</strong></p>` +
      `<p>Recuerda mantener en secreto tu asignación. ¡Felices fiestas!</p>`,
  };
}

/**
 * Envía un correo por cada asignación, de forma secuencial.
 * Solo expone el nombre del destinatario dentro de su propio correo.
 * Lanza una excepción si algún correo no se pudo enviar (sin reintentos).
 */
export async function enviarAsignaciones(asignaciones: Asignacion[]): Promise<number> {
  const cliente = obtenerTransporte();
  let enviados = 0;

  for (const asignacion of asignaciones) {
    await cliente.sendMail(construirCorreo(asignacion));
    enviados++;
  }

  return enviados;
}
