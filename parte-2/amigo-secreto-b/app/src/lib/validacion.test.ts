import { describe, expect, it } from "vitest";
import { validarSolicitud } from "@/lib/validacion";

const OPCIONES_INDIVIDUAL = { tipo: "individual", exclusiones: [] };

describe("validarSolicitud (participantes)", () => {
  it("rechaza cuerpos que no son objetos", () => {
    expect(validarSolicitud(null)).toEqual({
      error: "Cuerpo de solicitud inválido.",
    });
    expect(validarSolicitud("no soy un objeto")).toEqual({
      error: "Cuerpo de solicitud inválido.",
    });
    expect(validarSolicitud(42)).toEqual({
      error: "Cuerpo de solicitud inválido.",
    });
  });

  it("rechaza la falta del campo participantes", () => {
    expect(validarSolicitud({})).toEqual({
      error: "La lista de participantes es inválida.",
    });
    expect(validarSolicitud({ participantes: "Ana" })).toEqual({
      error: "La lista de participantes es inválida.",
    });
  });

  it("rechaza participantes que no son objetos", () => {
    expect(
      validarSolicitud({ participantes: [{ nombre: "Ana", correo: "a@b.c" }, null] }),
    ).toEqual({ error: "Hay un participante con datos inválidos." });
    expect(validarSolicitud({ participantes: ["Ana"] })).toEqual({
      error: "Hay un participante con datos inválidos.",
    });
  });

  it("rechaza nombres vacíos", () => {
    expect(
      validarSolicitud({ participantes: [{ nombre: "   ", correo: "a@b.c" }] }),
    ).toEqual({ error: "Todos los participantes deben tener un nombre." });
    expect(
      validarSolicitud({ participantes: [{ correo: "a@b.c" }] }),
    ).toEqual({ error: "Todos los participantes deben tener un nombre." });
  });

  it("rechaza correos con formato inválido o vacíos", () => {
    expect(
      validarSolicitud({ participantes: [{ nombre: "Ana", correo: "sin-arroba" }] }),
    ).toEqual({ error: 'El correo "sin-arroba" no es válido.' });
    expect(
      validarSolicitud({ participantes: [{ nombre: "Ana", correo: "" }] }),
    ).toEqual({ error: 'El correo "(vacío)" no es válido.' });
  });

  it("rechaza correos duplicados sin distinguir mayúsculas de minúsculas", () => {
    const conDoble = validarSolicitud({
      participantes: [
        { nombre: "Ana", correo: "ana@ejemplo.com" },
        { nombre: "Ana 2", correo: "ANA@EJEMPLO.COM" },
      ],
    });
    expect(conDoble).toEqual({
      error: "El correo ANA@EJEMPLO.COM está repetido.",
    });
  });

  it("normaliza los campos recortando espacios alrededor", () => {
    const resultado = validarSolicitud({
      participantes: [
        { nombre: "  Ana  ", correo: " ana@ejemplo.com " },
      ],
    });
    expect(resultado).toEqual({
      participantes: [
        { nombre: "Ana", correo: "ana@ejemplo.com" },
      ],
      opciones: OPCIONES_INDIVIDUAL,
    });
  });

  it("acepta una lista válida conservando el orden de entrada", () => {
    const entrada = [
      { nombre: "Ana", correo: "ana@ejemplo.com" },
      { nombre: "Berto", correo: "berto@ejemplo.com" },
    ];
    const resultado = validarSolicitud({ participantes: entrada });

    expect(resultado).toEqual({
      participantes: entrada,
      opciones: OPCIONES_INDIVIDUAL,
    });
  });

  it("acepta una lista vacía (la regla de mínimo 2 pertenece al sorteo)", () => {
    expect(validarSolicitud({ participantes: [] })).toEqual({
      participantes: [],
      opciones: OPCIONES_INDIVIDUAL,
    });
  });
});

describe("validarSolicitud (opciones: tipo y cantidadAmigos)", () => {
  const participantes = [
    { nombre: "Ana", correo: "ana@ejemplo.com" },
    { nombre: "Berto", correo: "berto@ejemplo.com" },
    { nombre: "Carla", correo: "carla@ejemplo.com" },
  ];

  it("acepta el modo múltiple con cantidad válida (2 y n-1)", () => {
    const resultado = validarSolicitud({
      participantes,
      opciones: { tipo: "multiple", cantidadAmigos: 2 },
    });
    expect(resultado).toEqual({
      participantes,
      opciones: { tipo: "multiple", cantidadAmigos: 2, exclusiones: [] },
    });

    const alLimite = validarSolicitud({
      participantes,
      opciones: { tipo: "multiple", cantidadAmigos: participantes.length - 1 },
    });
    expect("error" in alLimite).toBe(false);
  });

  it("rechaza el modo múltiple sin cantidad", () => {
    expect(
      validarSolicitud({ participantes, opciones: { tipo: "multiple" } }),
    ).toEqual({
      error: "El sorteo multiple requiere indicar la cantidad de amigos secretos.",
    });
  });

  it.each([1, 0, -1])("rechaza la cantidad de amigos secretos menor que 2 (%i)", (cantidad) => {
    expect(
      validarSolicitud({
        participantes,
        opciones: { tipo: "multiple", cantidadAmigos: cantidad },
      }),
    ).toEqual({
      error: "El sorteo multiple requiere al menos 2 amigos secretos.",
    });
  });

  it("rechaza una cantidad mayor que el número de participantes menos uno", () => {
    expect(
      validarSolicitud({
        participantes,
        opciones: { tipo: "multiple", cantidadAmigos: participantes.length },
      }),
    ).toEqual({
      error:
        "La cantidad de amigos secretos debe ser menor que la cantidad de participantes.",
    });
  });

  it("rechaza una cantidad no entera y no numérica", () => {
    expect(
      validarSolicitud({
        participantes,
        opciones: { tipo: "multiple", cantidadAmigos: 1.5 },
      }),
    ).toEqual({
      error: "La cantidad de amigos secretos no es válida.",
    });
    expect(
      validarSolicitud({
        participantes,
        opciones: { tipo: "multiple", cantidadAmigos: "2" },
      }),
    ).toEqual({
      error: "La cantidad de amigos secretos no es válida.",
    });
  });

  it("rechaza un tipo desconocido", () => {
    expect(
      validarSolicitud({ participantes, opciones: { tipo: "grupal" } }),
    ).toEqual({
      error: 'El tipo de sorteo solo puede ser "individual" o "multiple".',
    });
  });

  it("ignora la cantidad si el tipo es individual", () => {
    const resultado = validarSolicitud({
      participantes,
      opciones: { tipo: "individual", cantidadAmigos: 9 },
    });
    expect(resultado).toEqual({
      participantes,
      opciones: OPCIONES_INDIVIDUAL,
    });
  });
});

describe("validarSolicitud (opciones: montoSugerido)", () => {
  const participantes = [
    { nombre: "Ana", correo: "ana@ejemplo.com" },
    { nombre: "Berto", correo: "berto@ejemplo.com" },
  ];

  it("acepta un solo mínimo o un rango completo", () => {
    const soloMinimo = validarSolicitud({
      participantes,
      opciones: { montoSugerido: { minimo: 10 } },
    });
    expect("error" in soloMinimo).toBe(false);
    if (!("error" in soloMinimo)) {
      expect(soloMinimo.opciones.montoSugerido).toEqual({ minimo: 10 });
    }

    const rango = validarSolicitud({
      participantes,
      opciones: { montoSugerido: { minimo: 10, maximo: 25 } },
    });
    if (!("error" in rango)) {
      expect(rango.opciones.montoSugerido).toEqual({ minimo: 10, maximo: 25 });
    }
  });

  it("rechaza un objeto vacío sin mínimo ni máximo", () => {
    expect(
      validarSolicitud({ participantes, opciones: { montoSugerido: {} } }),
    ).toEqual({
      error: "El monto sugerido debe indicar un mínimo y/o un máximo.",
    });
  });

  it.each([0, -5, "10", NaN])(
    "rechaza montos no positivos o no numéricos (%j)",
    (valor) => {
      const resultado = validarSolicitud({
        participantes,
        opciones: { montoSugerido: { minimo: valor } },
      });
      expect(resultado).toEqual({
        error: "El monto mínimo sugerido debe ser un número positivo.",
      });
    },
  );

  it("rechaza un máximo menor que el mínimo", () => {
    expect(
      validarSolicitud({
        participantes,
        opciones: { montoSugerido: { minimo: 20, maximo: 10 } },
      }),
    ).toEqual({
      error: "El monto máximo sugerido no puede ser menor que el mínimo.",
    });
  });

  it("rechaza montos que no son objetos", () => {
    expect(
      validarSolicitud({ participantes, opciones: { montoSugerido: 10 } }),
    ).toEqual({
      error: "El monto sugerido debe indicar un mínimo y/o un máximo.",
    });
  });
});

describe("validarSolicitud (opciones: exclusiones)", () => {
  const p = [
    { nombre: "Ana", correo: "ana@ejemplo.com" },
    { nombre: "Berto", correo: "berto@ejemplo.com" },
    { nombre: "Carla", correo: "carla@ejemplo.com" },
  ];

  it("acepta pares de correos existentes y los canoniza", () => {
    const resultado = validarSolicitud({
      participantes: p,
      opciones: {
        exclusiones: [
          {
            correo1: " BERTO@EJEMPLO.COM ",
            correo2: "ana@ejemplo.com",
          },
        ],
      },
    });
    if ("error" in resultado) {
      throw new Error("No debía fallar la validación");
    }
    expect(resultado.opciones.exclusiones).toEqual([
      { correo1: "berto@ejemplo.com", correo2: "ana@ejemplo.com" },
    ]);
  });

  it("rechaza correos que no son participantes", () => {
    const resultado = validarSolicitud({
      participantes: p,
      opciones: {
        exclusiones: [
          { correo1: "nadie@ejemplo.com", correo2: p[0]!.correo },
        ],
      },
    });
    expect(resultado).toEqual({
      error:
        'La exclusión menciona un correo que no pertenece a los participantes: "nadie@ejemplo.com".',
    });
  });

  it("rechaza que un participante quede excluido consigo mismo", () => {
    const resultado = validarSolicitud({
      participantes: p,
      opciones: {
        exclusiones: [
          { correo1: p[0]!.correo, correo2: p[0]!.correo },
        ],
      },
    });
    expect(resultado).toEqual({
      error: "Un participante no puede excluirse a sí mismo.",
    });
  });

  it("acepta un único par sin exclusión previa", () => {
    const resultado = validarSolicitud({
      participantes: p,
      opciones: {
        exclusiones: [
          { correo1: p[0]!.correo, correo2: p[1]!.correo },
        ],
      },
    });
    expect("error" in resultado).toBe(false);
    if (!("error" in resultado)) {
      expect(resultado.opciones.exclusiones).toEqual([
        { correo1: p[0]!.correo, correo2: p[1]!.correo },
      ]);
    }
  });

  it("rechaza la exclusión repetida en sentido contrario", () => {
    const resultado = validarSolicitud({
      participantes: p,
      opciones: {
        exclusiones: [
          { correo1: p[0]!.correo, correo2: p[1]!.correo },
          { correo1: p[1]!.correo, correo2: p[0]!.correo },
        ],
      },
    });
    expect("error" in resultado).toBe(true);
    if ("error" in resultado) {
      expect(resultado.error).toContain("está repetida");
    }
  });

  it("rechaza exclusiones que no son objetos o listas inválidas", () => {
    expect(
      validarSolicitud({ participantes: p, opciones: { exclusiones: "Ana y Berto" } }),
    ).toEqual({ error: "La lista de exclusiones es inválida." });
    expect(
      validarSolicitud({
        participantes: p,
        opciones: { exclusiones: [null] },
      }),
    ).toEqual({ error: "Hay una exclusión con datos inválidos." });
  });
});
