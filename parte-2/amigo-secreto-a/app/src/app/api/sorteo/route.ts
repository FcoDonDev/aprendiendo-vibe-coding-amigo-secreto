import {
  sortearAmigoSecreto,
  type OpcionesSorteo,
  type Participante,
} from "@/lib/sorteo";
import { enviarAsignaciones } from "@/lib/mailer";

/** Regex de formato simple, suficiente para validar al ingreso. */
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ResultadoValidacion =
  | { participantes: Participante[]; opciones: OpcionesSorteo }
  | { error: string };

/**
 * Valida la solicitud completa: participantes + reglas del sorteo
 * (monto sugerido, cantidad de amigos secretos y exclusiones por correo).
 */
function validarSolicitud(cuerpo: unknown): ResultadoValidacion {
  if (cuerpo === null || typeof cuerpo !== "object") {
    return { error: "Cuerpo de solicitud inválido." };
  }

  const { participantes, exclusiones, montoSugerido, cantidadAmigos } = cuerpo as {
    participantes?: unknown;
    exclusiones?: unknown;
    montoSugerido?: unknown;
    cantidadAmigos?: unknown;
  };

  if (!Array.isArray(participantes)) {
    return { error: "La lista de participantes es inválida." };
  }

  const limpios: Participante[] = [];
  const correosVistos = new Set<string>();

  for (const crudo of participantes) {
    if (crudo === null || typeof crudo !== "object") {
      return { error: "Hay un participante con datos inválidos." };
    }

    const nombre = String((crudo as { nombre?: unknown }).nombre ?? "").trim();
    const correo = String((crudo as { correo?: unknown }).correo ?? "").trim();

    if (nombre.length === 0) {
      return { error: "Todos los participantes deben tener un nombre." };
    }
    if (!REGEX_CORREO.test(correo)) {
      return { error: `El correo "${correo || "(vacío)"}" no es válido.` };
    }
    if (correosVistos.has(correo.toLowerCase())) {
      return { error: `El correo ${correo} está repetido.` };
    }

    correosVistos.add(correo.toLowerCase());
    limpios.push({ nombre, correo });
  }

  // Cantidad de amigos secretos: 1 = individual; k = cada quien regala k veces.
  let amigos = 1;
  if (cantidadAmigos !== undefined) {
    if (typeof cantidadAmigos !== "number" || !Number.isInteger(cantidadAmigos) || cantidadAmigos < 1) {
      return {
        error: "La cantidad de amigos secretos debe ser un número entero de 1 o más.",
      };
    }
    amigos = cantidadAmigos;
  }

  // Monto sugerido: opcional; si viene, debe ser un número positivo razonable.
  let monto: number | undefined;
  if (montoSugerido !== undefined && montoSugerido !== null) {
    if (typeof montoSugerido !== "number" || !Number.isFinite(montoSugerido) || montoSugerido <= 0) {
      return { error: "El monto sugerido debe ser un número mayor a 0." };
    }
    if (montoSugerido > 1_000_000_000) {
      return { error: "El monto sugerido es demasiado grande." };
    }
    monto = montoSugerido;
  }

  // Exclusiones: pares de correos que no pueden asignarse entre sí.
  const pares: Array<[string, string]> = [];
  if (exclusiones !== undefined) {
    if (!Array.isArray(exclusiones)) {
      return { error: "La lista de exclusiones es inválida." };
    }
    for (const par of exclusiones) {
      if (
        !Array.isArray(par) ||
        par.length !== 2 ||
        !par.every((c) => typeof c === "string")
      ) {
        return { error: "Hay una exclusión con formato inválido." };
      }
      const [a, b] = par as [string, string];
      if (!REGEX_CORREO.test(a.trim()) || !REGEX_CORREO.test(b.trim())) {
        return { error: "Hay una exclusión con correos inválidos." };
      }
      pares.push([a, b]);
    }
  }

  return { participantes: limpios, opciones: { cantidadAmigos: amigos, montoSugerido: monto, exclusiones: pares } };
}

export async function POST(request: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json({ error: "El cuerpo no es JSON válido." }, { status: 400 });
  }

  const resultado = validarSolicitud(cuerpo);
  if ("error" in resultado) {
    return Response.json({ error: resultado.error }, { status: 400 });
  }

  const sorteo = sortearAmigoSecreto(resultado.participantes, resultado.opciones);
  if ("error" in sorteo) {
    // No existe asignación válida (exclusiones / cantidad incompatible):
    // se avisa al organizador sin realizar ningún sorteo.
    return Response.json({ error: sorteo.error }, { status: 422 });
  }

  try {
    const enviados = await enviarAsignaciones(
      sorteo.asignaciones,
      resultado.opciones.montoSugerido,
    );
    return Response.json({ ok: true, enviados });
  } catch (error) {
    console.error("Fallo al enviar correos del sorteo:", error);
    return Response.json(
      {
        error:
          "El sorteo se realizó pero falló el envío de correos. " +
          "Revisa la configuración SMTP y vuelve a realizar el sorteo.",
      },
      { status: 502 },
    );
  }
}
