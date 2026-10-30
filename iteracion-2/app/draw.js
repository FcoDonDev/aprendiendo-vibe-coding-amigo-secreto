/**
 * Lógica del sorteo de Amigo Secreto.
 */

/**
 * Baraja un array in-place con el algoritmo Fisher-Yates.
 * @param {Array} array
 * @returns {Array} el mismo array, barajado
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Verifica si en la permutación propuesta alguna persona se asigna a sí misma.
 * @param {number[]} perm perm[i] = índice de a quién le regala la persona i
 * @returns {boolean}
 */
function hasFixedPoint(perm) {
  return perm.some((target, i) => target === i);
}

/**
 * Genera una asignación del amigo secreto garantizando que
 * nadie salga asignado a sí mismo.
 *
 * Estrategia: barajar índices repetidamente; si, por probabilidad baja,
 * no se consigue tras varios intentos, se aplica una rotación cíclica
 * (que siempre es un derangement).
 *
 * @param {number} n número de participantes (>= 2)
 * @returns {number[]} perm[i] = índice de la persona a quien la persona i le regala
 */
function drawAssignment(n) {
  if (!Number.isInteger(n) || n < 2) {
    throw new Error("Se necesitan al menos 2 participantes para el sorteo.");
  }

  for (let attempt = 0; attempt < 50; attempt++) {
    const perm = shuffle([...Array(n).keys()]);
    if (!hasFixedPoint(perm)) return perm;
  }

  // Solución garantizada: rotación cíclica barajada.
  // Se barajan los índices y cada uno le regala al siguiente en la lista.
  const order = shuffle([...Array(n).keys()]);
  const perm = new Array(n);
  for (let i = 0; i < n; i++) {
    perm[order[i]] = order[(i + 1) % n];
  }
  return perm;
}

module.exports = { shuffle, drawAssignment };
