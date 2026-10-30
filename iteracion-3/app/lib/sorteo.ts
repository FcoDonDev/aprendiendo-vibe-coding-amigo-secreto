import { randomInt } from "node:crypto";

export type Participante = {
  nombre: string;
  correo: string;
};

export type Asignacion = {
  de: Participante;
  para: Participante;
};

export type ResultadoValidacion = {
  ok: boolean;
  errores: string[];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida la lista de participantes antes del sorteo:
 * - mínimo 2 participantes
 * - nombre no vacío
 * - correo con formato válido
 * - sin correos duplicados (cada participante debe tener su propia casilla)
 */
export function validarParticipantes(
  participantes: Participante[],
): ResultadoValidacion {
  const errores: string[] = [];

  if (participantes.length < 2) {
    errores.push("Se requiere un mínimo de 2 participantes.");
  }

  const correosVistos = new Set<string>();

  participantes.forEach((p, i) => {
    const etiqueta = `Participante ${i + 1}`;
    if (!p.nombre.trim()) {
      errores.push(`${etiqueta}: el nombre no puede estar vacío.`);
    }
    if (!EMAIL_RE.test(p.correo.trim())) {
      errores.push(
        `${etiqueta} (${p.nombre || "sin nombre"}): el correo no es válido.`,
      );
    } else {
      const normalizado = p.correo.trim().toLowerCase();
      if (correosVistos.has(normalizado)) {
        errores.push(
          `${etiqueta}: el correo ${p.correo.trim()} está repetido.`,
        );
      }
      correosVistos.add(normalizado);
    }
  });

  return { ok: errores.length === 0, errores };
}

/**
 * Fisher–Yates criptográficamente aleatorio.
 */
function mezclar<T>(items: T[], aleatorio: (max: number) => number): T[] {
  const copia = [...items];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = aleatorio(i + 1);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Sortea asignaciones giftor→gifted como un derangement perfecto:
 * - nadie se asigna a sí mismo
 * - cada participante regala exactamente una vez y recibe exactamente una vez
 *
 * Estrategia: mezclar aleatoriamente y reintentar si hay algún punto fijo.
 * Para n ≥ 2 la probabilidad de derangement es ≈ 1/e ≈ 0.368, así que el
 * número esperado de intentos es constante (~e).
 */
export function sortearAmigoSecreto(
  participantes: Participante[],
  aleatorio: (max: number) => number = (max) => randomInt(max),
): Asignacion[] {
  if (participantes.length < 2) {
    throw new Error("Se requiere un mínimo de 2 participantes.");
  }

  while (true) {
    const mezclados = mezclar(participantes, aleatorio);

    const hayAutoasignados = participantes.some(
      (p, i) => p.correo.toLowerCase() === mezclados[i].correo.toLowerCase(),
    );
    if (hayAutoasignados) continue;

    return participantes.map((de, i) => ({ de, para: mezclados[i] }));
  }
}
