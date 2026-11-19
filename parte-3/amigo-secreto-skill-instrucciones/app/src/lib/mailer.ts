import { createTransport, type Transporter } from "nodemailer";
import type { Asignacion, Participante, RangoMonto } from "@/lib/sorteo";

/** Opciones extra para los correos del sorteo. */
export interface OpcionesCorreo {
  /** Monto sugerido por regalo; se anuncia en el correo si está definido. */
  montoSugerido?: RangoMonto;
}

/** Un emisor con todos sus regalos agrupados (1 en individual, K en múltiple). */
interface GrupoAsignaciones {
  de: Participante;
  para: Participante[];
}

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

/** Representa el monto sugerido: "10" o "entre 10 y 20". */
export function formatearMonto(monto: RangoMonto): string {
  if (monto.maximo !== undefined) return `entre ${monto.minimo} y ${monto.maximo}`;
  return `${monto.minimo}`;
}

/** Agrupa las asignaciones por emisor conservando el orden de llegada. */
function agruparPorEmisor(asignaciones: Asignacion[]): GrupoAsignaciones[] {
  const orden: GrupoAsignaciones[] = [];
  const indice = new Map<string, GrupoAsignaciones>();

  for (const asignacion of asignaciones) {
    const clave = asignacion.de.correo.toLowerCase();
    let grupo = indice.get(clave);
    if (!grupo) {
      grupo = { de: asignacion.de, para: [] };
      indice.set(clave, grupo);
      orden.push(grupo);
    }
    grupo.para.push(asignacion.para);
  }

  return orden;
}

/** Escapa los caracteres sensibles de HTML en texto provisto por usuarios. */
function escaparHtml(texto: string): string {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Pila de fuentes del sistema: los clientes de correo no cargan fuentes web
 * de forma fiable (Gmail y Outlook las ignoran o las eliminan).
 */
const FUENTE_CORREO =
  "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Fila destacada de la tarjeta de asignación, un amigo secreto por fila. */
function filaNombre(nombre: string, indice: number, multiple: boolean): string {
  return (
    `<p style="margin:${indice === 0 ? "0" : "10px"} 0 0;` +
    `padding-top:${indice === 0 ? "0" : "10px"};` +
    `border-top:${indice === 0 ? "none" : "1px solid #fecdd3"};` +
    `font-size:${multiple ? "20px" : "26px"};font-weight:700;color:#0f172a;">` +
    `${escaparHtml(nombre)}</p>`
  );
}

function construirCorreo(
  grupo: GrupoAsignaciones,
  montoSugerido?: RangoMonto,
) {
  const multiple = grupo.para.length > 1;
  const lista = grupo.para.map((p) => p.nombre).join(", ");

  // Texto plano: misma información que el HTML, sin emojis.
  const asignacionTexto = multiple
    ? `Tus amigos secretos son:\n${grupo.para.map((p) => p.nombre).join("\n")}`
    : `Te toca regalar a: ${lista}`;

  // HTML: tablas anidadas con estilos inline (Gmail/Outlook no procesan la
  // etiqueta style de forma fiable) y los colores del tema claro de la app.
  const etiquetaHtml = multiple ? "Tus amigos secretos son" : "Te toca regalar a:";
  const nombresHtml = grupo.para
    .map((p, indice) => filaNombre(p.nombre, indice, multiple))
    .join("");
  const cajaMonto = montoSugerido
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;background-color:#fffbeb;border:1px solid #d97706;border-radius:12px;"><tr><td style="padding:14px 16px;font-family:${FUENTE_CORREO};font-size:14px;color:#475569;">Monto sugerido del regalo: <strong style="color:#0f172a;">${escaparHtml(formatearMonto(montoSugerido))}</strong></td></tr></table>`
    : "";

  return {
    from: remitente(),
    to: grupo.de.correo,
    subject: "Tu asignación de Amigo Secreto",
    text:
      `Hola ${grupo.de.nombre}:\n\n` +
      `Ya se hizo el sorteo del amigo secreto.\n\n` +
      `${asignacionTexto}\n\n` +
      (montoSugerido
        ? `Monto sugerido del regalo: ${formatearMonto(montoSugerido)}\n\n`
        : "") +
      `Recuerda mantener en secreto tu asignación. ¡Felices fiestas!`,
    html:
      `<!DOCTYPE html>` +
      `<html lang="es">` +
      `<body style="margin:0;padding:0;background-color:#fff1f2;">` +
      // Preheader oculto para la vista previa de la bandeja de entrada.
      `<p style="display:none;max-height:0;overflow:hidden;color:#fff1f2;font-size:1px;">Ya conoces a quién le toca tu regalo.</p>` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff1f2;">` +
      `<tr><td align="center" style="padding:24px 12px;">` +
      `<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">` +
      // Cabecera de marca
      `<tr><td style="background-color:#dc2626;border-radius:16px 16px 0 0;padding:32px 24px;text-align:center;font-family:${FUENTE_CORREO};">` +
      `<p style="margin:0;font-size:26px;font-weight:700;color:#ffffff;">Amigo Secreto</p>` +
      `<p style="margin:8px 0 0;font-size:14px;color:#ffe4e6;">Ya se realizó el sorteo</p>` +
      `</td></tr>` +
      // Cuerpo
      `<tr><td style="background-color:#ffffff;padding:32px 24px;font-family:${FUENTE_CORREO};">` +
      `<p style="margin:0 0 20px;font-size:15px;color:#0f172a;">Hola <strong>${escaparHtml(grupo.de.nombre)}</strong>:</p>` +
      // Tarjeta de asignación destacada
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffe4e6;border:1px solid #fecdd3;border-radius:12px;">` +
      `<tr><td style="padding:16px 20px;font-family:${FUENTE_CORREO};">` +
      `<p style="margin:0 0 8px;font-size:13px;color:#475569;">${etiquetaHtml}</p>` +
      nombresHtml +
      `</td></tr></table>` +
      cajaMonto +
      `<p style="margin:20px 0 0;font-size:15px;color:#0f172a;">Recuerda mantener en secreto tu asignación. ¡Felices fiestas!</p>` +
      `</td></tr>` +
      // Pie con la misma nota de privacidad de la aplicación
      `<tr><td style="background-color:#fff1f2;border-radius:0 0 16px 16px;padding:16px 24px;text-align:center;font-family:${FUENTE_CORREO};">` +
      `<p style="margin:0;font-size:12px;color:#475569;">Los correos se usan únicamente para enviar la asignación; no se guarda ninguna información en el servidor.</p>` +
      `</td></tr>` +
      `</table></td></tr></table></body></html>`,
  };
}

/**
 * Envía un correo por cada participante que regala, de forma secuencial. En el
 * modo múltiple, el correo de cada emisor lista la totalidad de sus amigos
 * secretos; en el individual, la persona asignada. Solo expone los nombres
 * dentro del propio correo del destinatario.
 * Lanza una excepción si algún correo no se pudo enviar (sin reintentos).
 */
export async function enviarAsignaciones(
  asignaciones: Asignacion[],
  opciones: OpcionesCorreo = {},
): Promise<number> {
  const cliente = obtenerTransporte();
  let enviados = 0;

  for (const grupo of agruparPorEmisor(asignaciones)) {
    await cliente.sendMail(construirCorreo(grupo, opciones.montoSugerido));
    enviados++;
  }

  return enviados;
}
