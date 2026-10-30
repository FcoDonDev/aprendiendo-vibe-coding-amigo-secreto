import { sortearAmigoSecreto, type Participante } from "@/lib/sorteo";
import { enviarAsignaciones } from "@/lib/mailer";

/** Regex de formato simple, suficiente para validar al ingreso. */
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ResultadoValidacion =
  | { participantes: Participante[] }
  | { error: string };

function validarSolicitud(cuerpo: unknown): ResultadoValidacion {
  if (cuerpo === null || typeof cuerpo !== "object") {
    return { error: "Cuerpo de solicitud inválido." };
  }

  const { participantes } = cuerpo as { participantes?: unknown };
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

  return { participantes: limpios };
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

  const asignaciones = sortearAmigoSecreto(resultado.participantes);
  if (!asignaciones) {
    return Response.json(
      { error: "Se requieren al menos 2 participantes para el sorteo." },
      { status: 400 },
    );
  }

  try {
    const enviados = await enviarAsignaciones(asignaciones);
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
