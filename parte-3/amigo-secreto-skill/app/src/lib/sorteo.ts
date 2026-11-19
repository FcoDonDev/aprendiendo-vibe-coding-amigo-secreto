/**
 * Algoritmo de sorteo para el amigo secreto.
 *
 * Genera asignaciones aleatorias donde:
 * - Nadie se asigna a sí mismo (derangement).
 * - Todos regalan y reciben exactamente K veces (K = 1 en el modo individual).
 * - Nadie repite pareja: con K amigos secretos, a nadie le toca dos veces el
 *   mismo receptor.
 * - Se respetan las exclusiones mutuas entre pares de participantes.
 *
 * La existencia de un reparto válida se comprueba con un flujo máximo en la
 * red bipartita emisor → receptor con capacidad 1 por arista y capacidad K
 * por nodo. Así el "imposible" se detecta con certeza en lugar de depender
 * de re-mezcla al azar, y el reparto resultante se aleatoriza después con
 * intercambios que conservan todas las restricciones.
 */

export interface Participante {
  /** Nombre visible del participante. */
  nombre: string;
  /** Correo donde recibirá su asignación; es el identificador único. */
  correo: string;
}

export interface Asignacion {
  /** Quién regala. */
  de: Participante;
  /** A quién le regala. */
  para: Participante;
}

/** Par de correos de participantes que no pueden recibirse como asignación. */
export interface Exclusion {
  correo1: string;
  correo2: string;
}

/** Monto sugerido por regalo: un valor o un rango [mínimo, máximo]. */
export interface RangoMonto {
  minimo: number;
  maximo?: number;
}

export interface OpcionesSorteo {
  /** "individual" (clásico) o "multiple"; por defecto "individual". */
  tipo?: "individual" | "multiple";
  /**
   * Amigos secretos por participante en el modo múltiple: cada uno regala y
   * recibe exactamente esa cantidad, sin repetir pareja.
   */
  cantidadAmigos?: number;
  /** Monto sugerido por regalo; se anuncia en el correo, no altera el sorteo. */
  montoSugerido?: RangoMonto;
  /** Pares mutuos de participantes que no pueden asignarse entre sí. */
  exclusiones?: Exclusion[];
}

export type ResultadoSorteo =
  | { ok: true; asignaciones: Asignacion[] }
  | { ok: false; motivo: string };

/** Clave canónica (sin distinción de mayúsculas, ordenada) de un par de correos. */
function clavePar(correo1: string, correo2: string): string {
  const a = correo1.toLowerCase();
  const b = correo2.toLowerCase();
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Matriz `permitidas[i][j]`: puede el participante i asignar al j.
 * La exclusión es mutua, así que el par se bloquea en ambas direcciones.
 * Los pares que citan correos inexistentes o a sí mismo se ignoran; la
 * validación los rechaza antes.
 */
function construirPermitidas(
  participantes: Participante[],
  exclusiones: Exclusion[],
): boolean[][] {
  const indice = new Map<string, number>();
  participantes.forEach((p, i) => indice.set(p.correo.toLowerCase(), i));

  const bloqueada = new Set<string>([...exclusiones].map((e) => clavePar(e.correo1, e.correo2)));

  const n = participantes.length;
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      const self = i === j;
      const excluido = bloqueada.has(
        clavePar(participantes[i].correo, participantes[j].correo),
      );
      return !self && !excluido;
    }),
  );
}

interface Arista {
  destino: number;
  capacidad: number;
  flujo: number;
  /** Índice de la arista inversa (residual). */
  inversa: number;
}

/** Un entero aleatorio en [0, max) — único punto de azar. */
function aleatorio(max: number): number {
  return Math.floor(Math.random() * max);
}

/**
 * Resuelve el reparto como b-matching: cada emisor regala K veces, cada
 * receptor recibe K veces y ninguna pareja se repite (capacidad 1 por arista).
 * Devuelve por cada emisor la lista de receptores, o null si es imposible.
 *
 * Los caminos de aumento se recorren con vecinos en orden aleatorio, de modo
 * que la solución inicial varíe; los intercambios posteriores completan la
 * aleatorización.
 */
function resolverConFlujo(permitidas: boolean[][], K: number): number[][] | null {
  const n = permitidas.length;
  // Nodos: emisores 0..n-1, receptores n..2n-1, fuente 2n, sumidero 2n+1.
  const s = 2 * n;
  const t = 2 * n + 1;
  const aristas: Arista[] = [];
  const adyacentes: number[][] = Array.from({ length: 2 * n + 2 }, () => []);

  function crearArista(origen: number, destino: number, capacidad: number): void {
    const indice = aristas.length;
    aristas.push({ destino, capacidad, flujo: 0, inversa: indice + 1 });
    aristas.push({ destino: origen, capacidad: 0, flujo: 0, inversa: indice });
    adyacentes[origen].push(indice);
    adyacentes[destino].push(indice + 1);
  }

  for (let i = 0; i < n; i++) {
    crearArista(s, i, K);
    crearArista(n + i, t, K);
    for (let j = 0; j < n; j++) {
      if (permitidas[i][j]) crearArista(i, n + j, 1);
    }
  }

  const objetivo = n * K;
  let flujoTotal = 0;

  while (flujoTotal < objetivo) {
    // Aumento con recorrido aleatorio tipo DFS: los vecinos de cada nodo se
    // eligen al azar, así la solución encontrada varía entre sorteos.
    const visitado = new Uint8Array(2 * n + 2);
    const anterior = new Int32Array(2 * n + 2).fill(-1);
    visitado[s] = 1;
    const pila = [s];
    let encontrado = false;

    while (pila.length > 0 && !encontrado) {
      const u = pila[pila.length - 1];
      const opciones: number[] = [];
      for (const idx of adyacentes[u]) {
        const arista = aristas[idx];
        if (visitado[arista.destino] === 0 && arista.capacidad - arista.flujo > 0) {
          opciones.push(idx);
        }
      }
      if (opciones.length === 0) {
        pila.pop();
        continue;
      }
      const idx = opciones[aleatorio(opciones.length)]!;
      const v = aristas[idx].destino;
      visitado[v] = 1;
      anterior[v] = idx;
      if (v === t) {
        encontrado = true;
      } else {
        pila.push(v);
      }
    }

    if (!encontrado) break;

    // Reconstruye el camino de aristas y aumenta por el cuello de botella.
    const camino: number[] = [];
    let nodo = t;
    let caminoValido = true;
    while (nodo !== s) {
      const idx = anterior[nodo]!;
      if (idx < 0 || aristas[idx].destino !== nodo) {
        caminoValido = false;
        break;
      }
      camino.push(idx);
      nodo = aristas[aristas[idx].inversa].destino;
    }
    if (!caminoValido || camino.length < 2) break;

    const cuello = Math.min(
      ...camino.map((idx) => aristas[idx].capacidad - aristas[idx].flujo),
    );
    for (const idx of camino) {
      aristas[idx].flujo += cuello;
      aristas[aristas[idx].inversa].flujo -= cuello;
    }
    flujoTotal += cuello;
  }

  if (flujoTotal < objetivo) return null;

  // El flujo saturó: cada emisor tiene exactamente K aristas unitarias con flujo 1.
  const objetivos: number[][] = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) {
    for (const idx of adyacentes[i]) {
      const arista = aristas[idx];
      if (arista.capacidad === 1 && arista.flujo === 1) {
        objetivos[i].push(arista.destino - n);
      }
    }
  }
  return objetivos;
}

/**
 * Aplica intercambios aleatorios de receptores entre dos emisores. El
 * intercambio conserva todas las restricciones (cada quien regala y recibe
 * K veces, sin repetir pareja, sin autoasignación y sin exclusiones).
 * Las listas de objetivos y los conjuntos de "usados" quedan consistentes.
 */
function aleatorizarObjetivos(
  objetivos: number[][],
  permitidas: boolean[][],
): void {
  const n = objetivos.length;
  if (n < 2) return;
  const usados = objetivos.map((lista) => new Set(lista));
  const intentos = Math.min(10_000, 8 * n * usados[0].size + 50);

  for (let i = 0; i < intentos; i++) {
    const x = aleatorio(n);
    const y = aleatorio(n);
    if (x === y) continue;
    const listaX = objetivos[x]!;
    const listaY = objetivos[y]!;
    const a = listaX[aleatorio(listaX.length)];
    const b = listaY[aleatorio(listaY.length)];
    if (a === undefined || b === undefined) continue;
    if (a === b) continue; // el intercambio no cambia nada
    if (b === x || a === y) continue; // no permitir autoasignación
    if (!permitidas[x]![b] || !permitidas[y]![a]) continue;
    if (usados[x]!.has(b) || usados[y]!.has(a)) continue; // no repetir pareja

    // Determina los slots exactos que contienen a `a` y a `b`.
    const slotX = listaX.indexOf(a);
    const slotY = listaY.indexOf(b);
    if (slotX < 0 || slotY < 0) continue;
    listaX[slotX] = b;
    listaY[slotY] = a;
    usados[x]!.delete(a);
    usados[x]!.add(b);
    usados[y]!.delete(b);
    usados[y]!.add(a);
  }
}

/**
 * Sortea las asignaciones respetando las opciones.
 *
 * Devuelve `{ ok: true, asignaciones }` con la lista de asignaciones (una
 * por regalo, agrupada por emisor) o `{ ok: false, motivo }` si no hay
 * configuración válida o si el reparto es imposible (poco frecuente, típicamente
 * por exclusiones inconsistentes).
 */
export function sortearAmigoSecreto(
  participantes: Participante[],
  opciones: OpcionesSorteo = {},
): ResultadoSorteo {
  const n = participantes.length;
  if (n < 2) {
    return {
      ok: false,
      motivo: "Se requieren al menos 2 participantes para el sorteo.",
    };
  }

  if (
    opciones.tipo !== undefined &&
    opciones.tipo !== "individual" &&
    opciones.tipo !== "multiple"
  ) {
    return {
      ok: false,
      motivo: 'El tipo de sorteo solo puede ser "individual" o "multiple".',
    };
  }
  const tipo = opciones.tipo ?? "individual";
  const K = tipo === "multiple" ? opciones.cantidadAmigos : 1;
  if (typeof K !== "number" || !Number.isInteger(K) || K < 1 || K > n - 1) {
    return {
      ok: false,
      motivo: "La cantidad de amigos secretos no es válida.",
    };
  }

  const permitidas = construirPermitidas(participantes, opciones.exclusiones ?? []);
  const objetivos = resolverConFlujo(permitidas, K);
  if (!objetivos) {
    return {
      ok: false,
      motivo:
        (opciones.exclusiones?.length ?? 0) > 0
          ? "No existe un reparto posible con las exclusiones definidas. Revisa los pares excluidos o agrega más participantes."
          : "No existe un reparto posible con la configuración indicada.",
    };
  }

  aleatorizarObjetivos(objetivos, permitidas);

  const asignaciones: Asignacion[] = [];
  participantes.forEach((de, i) => {
    for (const j of objetivos[i]!) {
      asignaciones.push({ de, para: participantes[j]! });
    }
  });
  return { ok: true, asignaciones };
}
