import { describe, expect, it } from "vitest";
import {
  sortearAmigoSecreto,
  type Asignacion,
  type OpcionesSorteo,
  type Participante,
} from "@/lib/sorteo";

/** Participantes creados una sola vez: el sorteo compara objetos por identidad. */
function preparar(n: number): Participante[] {
  return Array.from({ length: n }, (_, i) => ({
    nombre: `Persona ${i + 1}`,
    correo: `persona${i + 1}@ejemplo.com`,
  }));
}

/** Verifica TODAS las invariantes del reparto: K-regular, sin repetir pareja, sin autoasignación y sin exclusiones. */
function esperarRepartoValido(
  participantes: Participante[],
  opciones: OpcionesSorteo,
  asignaciones: Asignacion[],
) {
  const K = opciones.tipo === "multiple" ? opciones.cantidadAmigos! : 1;

  // Solo aparecen participantes reales, y los receptores y emisores guardan identidad.
  for (const { de, para } of asignaciones) {
    expect(participantes).toContain(de);
    expect(participantes).toContain(para);
    expect(de).not.toBe(para);
  }

  // Cada emisor regala exactamente K veces a receptores distintos...
  const regalando = new Map<string, Set<string>>();
  const recibiendo = new Map<string, number>();
  for (const { de, para } of asignaciones) {
    const emisor = regalando.get(de.correo) ?? new Set<string>();
    expect(emisor.has(para.correo)).toBe(false);
    emisor.add(para.correo);
    regalando.set(de.correo, emisor);
    recibiendo.set(para.correo, (recibiendo.get(para.correo) ?? 0) + 1);
  }

  for (const p of participantes) {
    expect(regalando.get(p.correo)?.size).toBe(K);
    expect(recibiendo.get(p.correo)).toBe(K);
  }

  // ...y ninguna exclusión (mutua) se cruza en ambas direcciones.
  for (const { correo1, correo2 } of opciones.exclusiones ?? []) {
    const bajo1 = correo1.toLowerCase();
    const bajo2 = correo2.toLowerCase();
    for (const { de, para } of asignaciones) {
      const cruce =
        (de.correo.toLowerCase() === bajo1 && para.correo.toLowerCase() === bajo2) ||
        (de.correo.toLowerCase() === bajo2 && para.correo.toLowerCase() === bajo1);
      expect(cruce).toBe(false);
    }
  }

  // El orden de emisores conserva el orden de la lista original.
  const emisores = [...new Set(asignaciones.map((a) => a.de.correo))];
  expect(emisores).toEqual(participantes.map((p) => p.correo));
}

describe("sortearAmigoSecreto (sin opciones: situación clásica)", () => {
  it("devuelve ok:false con 0 participantes", () => {
    const resultado = sortearAmigoSecreto([]);
    expect(resultado.ok).toBe(false);
  });

  it("devuelve ok:false con 1 participante", () => {
    const [solo] = preparar(1);
    const resultado = sortearAmigoSecreto([solo!]);
    expect(resultado.ok).toBe(false);
    expect(!resultado.ok && resultado.motivo).toContain("2 participantes");
  });

  it("con 2 participantes produce el intercambio directo (única opción posible)", () => {
    const participantes = preparar(2);
    const resultado = sortearAmigoSecreto(participantes);
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.asignaciones).toEqual([
      { de: participantes[0], para: participantes[1] },
      { de: participantes[1], para: participantes[0] },
    ]);
  });

  it.each([2, 5, 20, 100])("con %i participantes produce un reparto válido", (n) => {
    const participantes = preparar(n);
    const resultado = sortearAmigoSecreto(participantes);
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    esperarRepartoValido(participantes, {}, resultado.asignaciones);
  });

  it("nunca asigna a alguien consigo mismo en sorteos repetidos", () => {
    const participantes = preparar(6);

    for (let i = 0; i < 200; i++) {
      const resultado = sortearAmigoSecreto(participantes)!;
      expect(resultado.ok).toBe(true);
      if (!resultado.ok) continue;
      expect(
        resultado.asignaciones.some(({ de, para }) => de === para),
      ).toBe(false);
    }
  });
});

describe("sortearAmigoSecreto con exclusiones", () => {
  it("respeta la exclusión mutua en sorteos repetidos", () => {
    const participantes = preparar(6);
    const exclusiones = [
      { correo1: participantes[0]!.correo, correo2: participantes[1]!.correo },
      { correo1: participantes[2]!.correo, correo2: participantes[3]!.correo },
    ];
    const opciones: OpcionesSorteo = { exclusiones };

    for (let i = 0; i < 50; i++) {
      const resultado = sortearAmigoSecreto(participantes, opciones);
      expect(resultado.ok).toBe(true);
      if (!resultado.ok) continue;
      esperarRepartoValido(participantes, opciones, resultado.asignaciones);
    }
  });

  it("identifica los correos de exclusión sin distinguir mayúsculas", () => {
    const participantes = preparar(4);
    const opciones: OpcionesSorteo = {
      exclusiones: [
        {
          correo1: participantes[0]!.correo.toUpperCase(),
          correo2: participantes[1]!.correo,
        },
      ],
    };
    const resultado = sortearAmigoSecreto(participantes, opciones!);
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    esperarRepartoValido(participantes, opciones, resultado.asignaciones);
  });

  it("con solo dos participantes y exclusión entre ellos, es imposible", () => {
    const participantes = preparar(2);
    const resultado = sortearAmigoSecreto(participantes, {
      exclusiones: [
        { correo1: participantes[0]!.correo, correo2: participantes[1]!.correo },
      ],
    });
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.motivo).toContain("No existe un reparto posible");
      expect(resultado.motivo).toContain("exclusiones");
    }
  });

  it("con 3 participantes y exclusiones que aislaron a uno, es imposible", () => {
    // La persona 1 no tiene a quién regalarle: solo podía regalar a 2 y 3,
    // y está excluida con ambos.
    const participantes = preparar(3);
    const opciones: OpcionesSorteo = {
      exclusiones: [
        { correo1: participantes[0]!.correo, correo2: participantes[1]!.correo },
        { correo1: participantes[0]!.correo, correo2: participantes[2]!.correo },
      ],
    };
    const resultado = sortearAmigoSecreto(participantes, opciones);
    expect(resultado.ok).toBe(false);
  });

  it("encuentra un reparto válido con exclusiones cruzadas no evidentes (4, K=2)", () => {
    // 1-2 y 3-4 excluidos entre sí: cada quien deberá regalar al resto.
    const participantes = preparar(4);
    const opciones: OpcionesSorteo = {
      tipo: "multiple",
      cantidadAmigos: 2,
      exclusiones: [
        { correo1: participantes[0]!.correo, correo2: participantes[1]!.correo },
        { correo1: participantes[2]!.correo, correo2: participantes[3]!.correo },
      ],
    };
    const resultado = sortearAmigoSecreto(participantes, opciones!);
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    esperarRepartoValido(participantes, opciones, resultado.asignaciones);
  });

  it("las exclusiones de correos desconocidos se ignoran sin romper nada", () => {
    const participantes = preparar(3);
    const opciones: OpcionesSorteo = {
      exclusiones: [
        { correo1: "nadie@ejemplo.com", correo2: participantes[0]!.correo },
      ],
    };
    const resultado = sortearAmigoSecreto(participantes, opciones);
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    esperarRepartoValido(participantes, { exclusiones: [] }, resultado.asignaciones);
  });
});

describe("sortearAmigoSecreto en modo múltiple", () => {
  it.each([5, 12])(
    "con %i participantes y K=2 todos regalan y reciben exactamente 2 regalos",
    (n) => {
      const participantes = preparar(n);
      const opciones: OpcionesSorteo = { tipo: "multiple", cantidadAmigos: 2 };
      const resultado = sortearAmigoSecreto(participantes, opciones);
      expect(resultado.ok).toBe(true);
      if (!resultado.ok) return;
      expect(resultado.asignaciones).toHaveLength(n * 2);
      esperarRepartoValido(participantes, opciones, resultado.asignaciones);
    },
  );

  it("repite parejas nunca: con n=5 y K=3 no hay regalo doble", () => {
    const participantes = preparar(5);
    const opciones: OpcionesSorteo = { tipo: "multiple", cantidadAmigos: 3 };
    for (let i = 0; i < 20; i++) {
      const resultado = sortearAmigoSecreto(participantes, opciones);
      expect(resultado.ok).toBe(true);
      if (!resultado.ok) continue;
      esperarRepartoValido(participantes, opciones, resultado.asignaciones);
    }
  });

  it("con K igual al número de participantes, es imposible (nadie puede regalar a todos los demás sin repetirse)", () => {
    const participantes = preparar(4);
    const resultado = sortearAmigoSecreto(participantes, {
      tipo: "multiple",
      cantidadAmigos: 4,
    });
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.motivo).toContain("no es válida");
    }
  });

  it("con K que saturara el reparto por exclusiones, es imposible", () => {
    // 3 personas, K=2, y 1-2 excluidos: la persona 1 solo tiene 1 opción, pero necesita 2.
    const participantes = preparar(3);
    const resultado = sortearAmigoSecreto(participantes, {
      tipo: "multiple",
      cantidadAmigos: 2,
      exclusiones: [
        { correo1: participantes[0]!.correo, correo2: participantes[1]!.correo },
      ],
    });
    expect(resultado.ok).toBe(false);
  });

  it("con K no entera, es imposible", () => {
    const participantes = preparar(4);
    const resultado = sortearAmigoSecreto(participantes, {
      tipo: "multiple",
      cantidadAmigos: 1.5,
    });
    expect(resultado.ok).toBe(false);
  });

  it("con K 0 o ausente en modo múltiple, es imposible", () => {
    const participantes = preparar(4);
    expect(
      sortearAmigoSecreto(participantes, { tipo: "multiple", cantidadAmigos: 0 }).ok,
    ).toBe(false);
    expect(sortearAmigoSecreto(participantes, { tipo: "multiple" }).ok).toBe(false);
  });
});
