/**
 * Algoritmo de sorteo para el amigo secreto.
 *
 * Genera una asignación aleatoria donde:
 * - Nadie se asigna a sí mismo.
 * - Todos regalan exactamente `cantidadAmigos` veces y todos reciben
 *   exactamente `cantidadAmigos` veces, con receptores distintos.
 * - Se respetan las exclusiones entre participantes (pares que no pueden
 *   salir asignados entre sí).
 */

export interface Participante {
  /** Nombre visible del participante. */
  nombre: string;
  /** Correo donde recibirá su asignación. */
  correo: string;
}

export interface Asignacion {
  /** Quién regala. */
  de: Participante;
  /** A quién le regala. */
  para: Participante;
}

export interface OpcionesSorteo {
  /**
   * Pares de correos que no pueden asignarse entre sí (en ningún sentido).
   * Se identifican por correo para no depender de índices que cambian
   * cuando se edita la lista de participantes.
   */
  exclusiones?: Array<[string, string]>;
  /** Cantidad de amigos secretos por participante. 1 = sorteo individual. */
  cantidadAmigos?: number;
  /** Monto sugerido del regalo, referencial, para incluir en el correo. */
  montoSugerido?: number;
}

export type ResultadoSorteo =
  | { asignaciones: Asignacion[] }
  | { error: string };

/** Movimiento tipo Fisher-Yates: ordena el array en su lugar, uniformemente al azar. */
function mezclar<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/**
 * Intento de sorteo por búsqueda voraz con heurística de "más restringido primero".
 *
 * Reparte los n*k "slots" de regalo uno a uno: en cada paso elige el dador
 * pendiente con menos receptores posibles y le asigna uno al azar. Si algún
 * dador tiene menos opciones que slots pendientes, el intento es irrecuperable.
 *
 * Devuelve, para cada participante (por índice), la lista de receptores;
 * o null si este intento quedó sin salida (se reintenta desde afuera).
 */
function intentarSorteo(n: number, k: number, bloqueado: boolean[][]): number[][] | null {
  const asignados: number[][] = Array.from({ length: n }, () => []);
  // Receptores que aún pueden recibir, y slots que cada quien aún debe regalar.
  const capacidad = new Array(n).fill(k);
  const pendiente = new Array(n).fill(k);
  // Orden aleatorio para desempatar dadores con igual cantidad de opciones.
  const orden = mezclar([...Array(n).keys()]);

  for (let slot = 0; slot < n * k; slot++) {
    let mejorDador = -1;
    let mejoresReceptores: number[] = [];

    for (const i of orden) {
      if (pendiente[i] === 0) continue;

      const receptores: number[] = [];
      for (let j = 0; j < n; j++) {
        if (
          capacidad[j] > 0 &&
          !bloqueado[i][j] &&
          !asignados[i].includes(j)
        ) {
          receptores.push(j);
        }
      }

      // Sin salida: este dador no puede completar sus slots pendientes.
      if (receptores.length < pendiente[i]) return null;

      if (mejorDador === -1 || receptores.length < mejoresReceptores.length) {
        mejorDador = i;
        mejoresReceptores = receptores;
      }
    }

    const receptor =
      mejoresReceptores[Math.floor(Math.random() * mejoresReceptores.length)];
    asignados[mejorDador].push(receptor);
    capacidad[receptor]--;
    pendiente[mejorDador]--;
  }

  return asignados;
}

/**
 * Sortea las asignaciones según la configuración del intercambio.
 *
 * Devuelve `{ asignaciones }` (una entrada por cada regalo: cada dador aparece
 * `cantidadAmigos` veces) o `{ error }` con un mensaje pensado para el
 * organizador cuando no existe una asignación válida.
 */
export function sortearAmigoSecreto(
  participantes: Participante[],
  opciones: OpcionesSorteo = {},
): ResultadoSorteo {
  const n = participantes.length;
  if (n < 2) {
    return { error: "Se requieren al menos 2 participantes para el sorteo." };
  }

  const k = opciones.cantidadAmigos ?? 1;
  if (!Number.isInteger(k) || k < 1) {
    return { error: "La cantidad de amigos secretos debe ser 1 o más." };
  }
  if (k > n - 1) {
    return {
      error: `Con ${n} participantes cada persona puede tener como máximo ${n - 1} amigo${n - 1 !== 1 ? "s" : ""} secreto${n - 1 !== 1 ? "s" : ""}.`,
    };
  }

  // Matriz de bloqueos: nadie regala consigo mismo ni con sus exclusiones.
  const bloqueado: boolean[][] = Array.from({ length: n }, () =>
    new Array(n).fill(false),
  );
  for (let i = 0; i < n; i++) bloqueado[i][i] = true;

  const indicePorCorreo = new Map<string, number>();
  participantes.forEach((p, i) => indicePorCorreo.set(p.correo.toLowerCase(), i));

  for (const [correoA, correoB] of opciones.exclusiones ?? []) {
    const a = indicePorCorreo.get(correoA.trim().toLowerCase());
    const b = indicePorCorreo.get(correoB.trim().toLowerCase());
    if (a === undefined || b === undefined) {
      return {
        error: "Una exclusión menciona a un participante que ya no está en la lista.",
      };
    }
    bloqueado[a][b] = true;
    bloqueado[b][a] = true;
  }

  // Verificación temprana: cada dador necesita k receptores disponibles.
  for (let i = 0; i < n; i++) {
    const disponibles = bloqueado[i].filter((b) => !b).length;
    if (disponibles < k) {
      return {
        error:
          "Las exclusiones hacen imposible el sorteo: hay participantes con demasiadas exclusiones " +
          "para la cantidad de amigos secretos elegida. Revisa las exclusiones o reduce la cantidad.",
      };
    }
  }

  const maxIntentos = 400;
  for (let intento = 0; intento < maxIntentos; intento++) {
    const resultado = intentarSorteo(n, k, bloqueado);
    if (resultado) {
      return {
        asignaciones: resultado.flatMap((receptores, i) =>
          receptores.map((j) => ({ de: participantes[i], para: participantes[j] })),
        ),
      };
    }
  }

  return {
    error:
      "No se encontró una asignación válida con las exclusiones y la cantidad de amigos " +
      "secretos definidas. Revisa las exclusiones o reduce la cantidad e intenta de nuevo.",
  };
}
