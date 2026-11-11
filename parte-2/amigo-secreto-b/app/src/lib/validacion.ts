import type {
  Exclusion,
  Participante,
  RangoMonto,
} from "@/lib/sorteo";

/** Regex de formato simple, suficiente para validar al ingreso. */
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Opciones del sorteo tras la validación (siempre completas). */
export interface OpcionesLimpias {
  tipo: "individual" | "multiple";
  /** Solo presente cuando tipo es "multiple". */
  cantidadAmigos?: number;
  montoSugerido?: RangoMonto;
  exclusiones: Exclusion[];
}

export type ResultadoOpciones =
  | { opciones: OpcionesLimpias }
  | { error: string };

export type ResultadoValidacion =
  | { participantes: Participante[]; opciones: OpcionesLimpias }
  | { error: string };

/**
 * Valida el monto sugerido (opcional): un mínimo y/o un máximo en números
 * positivos, con máximo mayor o igual que el mínimo.
 */
function validarMonto(crudo: unknown): ResultadoRangoMonto {
  if (crudo === undefined || crudo === null) {
    return { montoSugerido: undefined };
  }
  if (typeof crudo !== "object" || Array.isArray(crudo)) {
    return {
      error: "El monto sugerido debe indicar un mínimo y/o un máximo.",
    };
  }
  const { minimo, maximo } = crudo as {
    minimo?: unknown;
    maximo?: unknown;
  };
  const tieneMinimo = minimo !== undefined && minimo !== null;
  const tieneMaximo = maximo !== undefined && maximo !== null;
  if (!tieneMinimo && !tieneMaximo) {
    return {
      error: "El monto sugerido debe indicar un mínimo y/o un máximo.",
    };
  }
  for (const [campo, valor] of (
    [
      ["minimo", minimo],
      ["maximo", maximo],
    ] as const
  ).filter(([, v]) => v !== undefined && v !== null)) {
    if (typeof valor !== "number" || !Number.isFinite(valor) || valor <= 0) {
      return {
        error: `El monto ${campo === "minimo" ? "mínimo" : "máximo"} sugerido debe ser un número positivo.`,
      };
    }
  }
  if (tieneMinimo && tieneMaximo && (minimo as number) > (maximo as number)) {
    return {
      error: "El monto máximo sugerido no puede ser menor que el mínimo.",
    };
  }
  return {
    montoSugerido: {
      minimo: minimo as number,
      ...(tieneMaximo ? { maximo: maximo as number } : {}),
    },
  };
}

type ResultadoRangoMonto =
  | { montoSugerido: RangoMonto | undefined }
  | { error: string };

/**
 * Valida las opciones del sorteo: tipo, cantidad de amigos secretos en modo
 * múltiple, monto sugerido y exclusiones mutuas entre participantes.
 * La ausencia de `opciones` equivale al sorteo individual sin exclusiones.
 */
function validarOpciones(
  crudo: unknown,
  participantes: Participante[],
): ResultadoOpciones {
  if (crudo === undefined || crudo === null) {
    return {
      opciones: { tipo: "individual", exclusiones: [] },
    };
  }
  if (typeof crudo !== "object" || Array.isArray(crudo)) {
    return { error: "Las opciones del sorteo son inválidas." };
  }

  const { tipo, cantidadAmigos, montoSugerido, exclusiones } = crudo as {
    tipo?: unknown;
    cantidadAmigos?: unknown;
    montoSugerido?: unknown;
    exclusiones?: unknown;
  };

  let tipoLimpio: "individual" | "multiple" = "individual";
  if (tipo !== undefined && tipo !== null) {
    if (tipo !== "individual" && tipo !== "multiple") {
      return {
        error: 'El tipo de sorteo solo puede ser "individual" o "multiple".',
      };
    }
    tipoLimpio = tipo;
  }

  let cantidadValida: number | undefined;
  if (tipoLimpio === "multiple") {
    if (cantidadAmigos === undefined || cantidadAmigos === null) {
      return {
        error:
          "El sorteo multiple requiere indicar la cantidad de amigos secretos.",
      };
    }
    const n = participantes.length;
    if (
      typeof cantidadAmigos !== "number" ||
      !Number.isInteger(cantidadAmigos)
    ) {
      return { error: "La cantidad de amigos secretos no es válida." };
    }
    if (cantidadAmigos < 2) {
      return {
        error: "El sorteo multiple requiere al menos 2 amigos secretos.",
      };
    }
    if (cantidadAmigos > n - 1) {
      return {
        error:
          "La cantidad de amigos secretos debe ser menor que la cantidad de participantes.",
      };
    }
    cantidadValida = cantidadAmigos;
  }
  // En el sorteo individual `cantidadAmigos` se ignora (siempre es 1).

  const monto = validarMonto(montoSugerido);
  if ("error" in monto) return { error: monto.error };

  const exclusionesLimpias: Exclusion[] = [];
  if (exclusiones !== undefined && exclusiones !== null) {
    if (!Array.isArray(exclusiones)) {
      return { error: "La lista de exclusiones es inválida." };
    }
    const indice = new Map<string, string>();
    for (const p of participantes) {
      if (!indice.has(p.correo.toLowerCase())) {
        indice.set(p.correo.toLowerCase(), p.correo);
      }
    }
    const vistas = new Set<string>();
    for (const cruda of exclusiones) {
      if (cruda === null || typeof cruda !== "object") {
        return { error: "Hay una exclusión con datos inválidos." };
      }
      const correo1 = String((cruda as { correo1?: unknown }).correo1 ?? "").trim();
      const correo2 = String((cruda as { correo2?: unknown }).correo2 ?? "").trim();
      const canonica1 = indice.get(correo1.toLowerCase());
      const canonica2 = indice.get(correo2.toLowerCase());
      if (!canonica1 || !canonica2) {
        const desconocido = !canonica1 ? correo1 : correo2;
        return {
          error: `La exclusión menciona un correo que no pertenece a los participantes: "${desconocido || "(vacío)"}".`,
        };
      }
      if (canonica1.toLowerCase() === canonica2.toLowerCase()) {
        return {
          error: "Un participante no puede excluirse a sí mismo.",
        };
      }
      const clave =
        canonica1.toLowerCase() < canonica2.toLowerCase()
          ? `${canonica1.toLowerCase()}|${canonica2.toLowerCase()}`
          : `${canonica2.toLowerCase()}|${canonica1.toLowerCase()}`;
      if (vistas.has(clave)) {
        return {
          error: `La exclusión entre "${canonica1}" y "${canonica2}" está repetida.`,
        };
      }
      vistas.add(clave);
      exclusionesLimpias.push({ correo1: canonica1, correo2: canonica2 });
    }
  }

  const opciones: OpcionesLimpias = {
    tipo: tipoLimpio,
    exclusiones: exclusionesLimpias,
  };
  if (cantidadValida !== undefined) opciones.cantidadAmigos = cantidadValida;
  if (monto.montoSugerido !== undefined) {
    opciones.montoSugerido = monto.montoSugerido;
  }
  return { opciones };
}

/**
 * Valida y normaliza el cuerpo de la solicitud de sorteo.
 *
 * Acepta `{ participantes: [{ nombre, correo }], opciones?: {...} }` y devuelve
 * la lista limpia (con los campos recortados) junto con las opciones completas,
 * o un error descriptivo en español.
 * Los correos duplicados (sin distinguir mayúsculas/minúsculas) se rechazan.
 */
export function validarSolicitud(cuerpo: unknown): ResultadoValidacion {
  if (cuerpo === null || typeof cuerpo !== "object") {
    return { error: "Cuerpo de solicitud inválido." };
  }

  const { participantes, opciones } = cuerpo as {
    participantes?: unknown;
    opciones?: unknown;
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

  const opcionesLimpias = validarOpciones(opciones, limpios);
  if ("error" in opcionesLimpias) {
    return { error: opcionesLimpias.error };
  }

  return { participantes: limpios, opciones: opcionesLimpias.opciones };
}
