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

function construirCorreo(
  grupo: GrupoAsignaciones,
  montoSugerido?: RangoMonto,
) {
  const lista = grupo.para.map((p) => p.nombre).join(", ");
  const asignacionTexto =
    grupo.para.length > 1
      ? `Tus amigos secretos son: ${lista}`
      : `Te toca regalar a: ${lista}`;
  const asignacionHtml =
    grupo.para.length > 1
      ? `Tus amigos secretos son: <strong>${lista}</strong>`
      : `Te toca regalar a: <strong>${lista}</strong>`;
  const fraseMonto = montoSugerido
    ? `💵 Monto sugerido del regalo: ${formatearMonto(montoSugerido)}\n\n`
    : "";
  const fraseMontoHtml = montoSugerido
    ? `<p>💵 Monto sugerido del regalo: <strong>${formatearMonto(montoSugerido)}</strong></p>`
    : "";

  return {
    from: remitente(),
    to: grupo.de.correo,
    subject: "🎁 Asignación de tu amigo secreto",
    text:
      `Hola ${grupo.de.nombre}:\n\n` +
      `Ya se hizo el sorteo del amigo secreto 🎄\n\n` +
      `${asignacionTexto}\n\n` +
      `${fraseMonto}` +
      `Recuerda mantener en secreto tu asignación. ¡Felices fiestas!`,
    html:
      `<p>Hola <strong>${grupo.de.nombre}</strong>:</p>` +
      `<p>Ya se hizo el sorteo del amigo secreto 🎄</p>` +
      `<p>${asignacionHtml}</p>` +
      fraseMontoHtml +
      `<p>Recuerda mantener en secreto tu asignación. ¡Felices fiestas!</p>`,
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
