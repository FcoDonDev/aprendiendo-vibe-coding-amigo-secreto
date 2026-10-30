import nodemailer, { type Transporter } from "nodemailer";
import type { Asignacion } from "./sorteo";

export type ConfiguracionSMTP = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
};

export type ResultadoEnvio = {
  entregados: number;
  fallidos: { correo: string; error: string }[];
};

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM;

/**
 * Indica si hay configuración SMTP suficiente para enviar correos.
 */
export function smtpConfigurado(): boolean {
  return Boolean(SMTP_HOST && SMTP_FROM);
}

function crearTransporte(config: ConfiguracionSMTP): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure, // true para 465, STARTTLS en 587 va con secure:false
    auth:
      config.user && config.pass
        ? { user: config.user, pass: config.pass }
        : undefined,
  });
}

function cuerpoHtml(asignacion: Asignacion): string {
  return [
    `<!DOCTYPE html>`,
    `<html lang="es">`,
    `<body style="font-family: Arial, Helvetica, sans-serif; color: #171717;">`,
    `  <div style="max-width: 480px; margin: 0 auto; padding: 24px;">`,
    `    <h1 style="font-size: 22px;">🎁 Tu amigo secreto</h1>`,
    `    <p style="font-size: 16px;">Hola ${asignacion.de.nombre},</p>`,
    `    <p style="font-size: 16px;">Esta vez te toca regalarle a:</p>`,
    `    <p style="font-size: 20px; font-weight: bold; background: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center;">`,
    `      ${asignacion.para.nombre}`,
    `    </p>`,
    `    <p style="font-size: 14px; color: #71717a;">`,
    `      Este mensaje contiene solo tu asignación. ¡Guárdatelo bien secreto!`,
    `    </p>`,
    `  </div>`,
    `</body>`,
    `</html>`,
  ].join("\n");
}

function cuerpoTexto(asignacion: Asignacion): string {
  return [
    `Hola ${asignacion.de.nombre},`,
    ``,
    `Esta vez te toca regalarle a: ${asignacion.para.nombre}`,
    ``,
    `Este mensaje contiene solo tu asignación. ¡Guárdatelo bien secreto!`,
  ].join("\n");
}

/**
 * Envía un correo por participante. Cada correo contiene exclusivamente
 * la asignación del participante correspondiente (no se revela el resto).
 */
export async function enviarCorreos(
  asignaciones: Asignacion[],
  config: ConfiguracionSMTP,
): Promise<ResultadoEnvio> {
  const transporte = crearTransporte(config);
  const fallidos: ResultadoEnvio["fallidos"] = [];
  let entregados = 0;

  for (const asignacion of asignaciones) {
    try {
      await transporte.sendMail({
        from: config.from,
        to: asignacion.de.correo,
        subject: "🎁 Tu amigo secreto",
        text: cuerpoTexto(asignacion),
        html: cuerpoHtml(asignacion),
      });
      entregados += 1;
    } catch (error) {
      fallidos.push({
        correo: asignacion.de.correo,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  transporte.close();

  return { entregados, fallidos };
}

export { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM };
