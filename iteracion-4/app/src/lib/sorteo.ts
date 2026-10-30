/**
 * Algoritmo de sorteo para el amigo secreto.
 *
 * Genera una asignación aleatoria donde:
 * - Nadie se asigna a sí mismo (derangement).
 * - Todos regalan exactamente una vez y todos reciben exactamente una vez.
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

/** Movimiento tipo Fisher-Yates: ordena el array en su lugar, uniformemente al azar. */
function mezclar<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/**
 * Sortea las asignaciones.
 *
 * Se mezcla aleatoriamente la lista de "receptores"; si la mezcla deja a
 * alguien emparejado consigo mismo (punto fijo), se re-mezcla completa.
 * Con 2 participantes la única posibilidad válida es que intercambien.
 * Devuelve null si no es posible (menos de 2 participantes).
 */
export function sortearAmigoSecreto(participantes: Participante[]): Asignacion[] | null {
  if (participantes.length < 2) {
    return null;
  }

  const maxIntentos = 1000;
  for (let intento = 0; intento < maxIntentos; intento++) {
    const receptores = mezclar([...participantes]);
    const hayPuntoFijo = participantes.some((p, i) => p === receptores[i]);
    if (hayPuntoFijo) continue;

    return participantes.map((de, i) => ({ de, para: receptores[i] }));
  }

  // Prácticamente inalcanzable: la probabilidad de fallar 1000 intentos es baja,
  // pero la caída ordenada (rotación circular) siempre es un derangement válido.
  const rotados = participantes.slice(1).concat(participantes[0]);
  return participantes.map((de, i) => ({ de, para: rotados[i] }));
}
