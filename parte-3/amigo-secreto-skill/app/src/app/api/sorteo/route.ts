import { sortearAmigoSecreto } from "@/lib/sorteo";
import { enviarAsignaciones } from "@/lib/mailer";
import { validarSolicitud } from "@/lib/validacion";

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

  const resultadoSorteo = sortearAmigoSecreto(
    resultado.participantes,
    resultado.opciones,
  );
  if (!resultadoSorteo.ok) {
    // Imposible o config inválida: nada se envió, el organizador corregirá.
    return Response.json({ error: resultadoSorteo.motivo }, { status: 400 });
  }

  try {
    const enviados = await enviarAsignaciones(resultadoSorteo.asignaciones, {
      montoSugerido: resultado.opciones.montoSugerido,
    });
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
