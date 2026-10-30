"use server";

import { enviarCorreos, smtpConfigurado, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } from "@/lib/mail";
import { sortearAmigoSecreto, validarParticipantes, type Asignacion, type Participante } from "@/lib/sorteo";

export type SorteoRequest = {
  participantes: Participante[];
};

export type SorteoResponse =
  | {
      ok: true;
      entregados: number;
      fallidos: { correo: string; error: string }[];
      asignaciones: Asignacion[];
    }
  | { ok: false; errores: string[] };

export async function realizarSorteo(
  participantes: Participante[],
): Promise<SorteoResponse> {
  // Normalizamos los datos de entrada
  const normalizados = participantes.map((p) => ({
    nombre: p.nombre.trim(),
    correo: p.correo.trim(),
  }));

  const validacion = validarParticipantes(normalizados);
  if (!validacion.ok) {
    return { ok: false, errores: validacion.errores };
  }

  if (!smtpConfigurado()) {
    return {
      ok: false,
      errores: [
        "El servidor SMTP no está configurado. Define SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS y SMTP_FROM en el archivo .env.",
      ],
    };
  }

  const asignaciones = sortearAmigoSecreto(normalizados);

  const resultado = await enviarCorreos(asignaciones, {
    host: SMTP_HOST!,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    user: SMTP_USER,
    pass: SMTP_PASS,
    from: SMTP_FROM!,
  });

  return {
    ok: true,
    entregados: resultado.entregados,
    fallidos: resultado.fallidos,
    asignaciones,
  };
}
