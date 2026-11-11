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

interface CorreoPendiente {
  /** Correo de quien regala (destinatario del mensaje). */
  correo: string;
  /** Nombre de quien regala. */
  nombre: string;
  /** Nombres de quienes reciben sus regalos (sin repetir). */
  receptores: string[];
}

/**
 * Arma el correo de una persona según la cantidad de asignaciones que le tocó.
 * `montoSugerido` (opcional) se incluye siempre que el organizador lo definió.
 */
function construirCorreo(datos: CorreoPendiente, montoSugerido?: number) {
  const unico = datos.receptores.length === 1;
  const sujetos = unico
    ? "Te toca regalar a"
    : `Te toca regalar a ${datos.receptores.length} personas`;
  const listaTexto = unico
    ? datos.receptores[0]
    : `:\n${datos.receptores.map((r) => `- ${r}`).join("\n")}`;
  const listaHtml = unico
    ? `<strong>${datos.receptores[0]}</strong>`
    : `<ul>${datos.receptores
        .map((r) => `<li><strong>${r}</strong></li>`)
        .join("")}</ul>`;
  const monto =
    montoSugerido === undefined
      ? ""
      : `\nMonto sugerido del regalo: $${montoSugerido.toLocaleString("es")}`;
  const montoHtml =
    montoSugerido === undefined
      ? ""
      : `<p>Monto sugerido del regalo: <strong>$${montoSugerido.toLocaleString("es")}</strong></p>`;

  return {
    from: remitente(),
    to: datos.correo,
    subject: unico
      ? "🎁 Asignación de tu amigo secreto"
      : `🎁 Asignaciones de tus amigos secretos (${datos.receptores.length})`,
    text:
      `Hola ${datos.nombre}:\n\n` +
      `Ya se hizo el sorteo del amigo secreto 🎄\n\n` +
      `${sujetos}: ${listaTexto}\n` +
      `${monto}\n\n` +
      `Recuerda mantener en secreto tus asignaciones. ¡Felices fiestas!`,
    html:
      `<p>Hola <strong>${datos.nombre}</strong>:</p>` +
      `<p>Ya se hizo el sorteo del amigo secreto 🎄</p>` +
      `<p>${sujetos}: ${listaHtml}</p>` +
      montoHtml +
      `<p>Recuerda mantener en secreto tus asignaciones. ¡Felices fiestas!</p>`,
  };
}

/**
 * Envía un correo por cada participante con TODAS sus asignaciones agrupadas,
 * de forma secuencial. Solo expone los destinatarios dentro de su propio correo.
 * Lanza una excepción si algún correo no se pudo enviar (sin reintentos).
 */
export async function enviarAsignaciones(
  asignaciones: Asignacion[],
  montoSugerido?: number,
): Promise<number> {
  const cliente = obtenerTransporte();

  const porDador = new Map<string, CorreoPendiente>();
  for (const { de, para } of asignaciones) {
    const clave = de.correo.toLowerCase();
    const pendiente =
      porDador.get(clave) ??
      { correo: de.correo, nombre: de.nombre, receptores: [] };
    // El sorteo nunca repite receptores para el mismo dador.
    pendiente.receptores.push(para.nombre);
    porDador.set(clave, pendiente);
  }

  let enviados = 0;
  for (const pendiente of porDador.values()) {
    await cliente.sendMail(construirCorreo(pendiente, montoSugerido));
    enviados++;
  }

  return enviados;
}
