import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Asignacion } from "@/lib/sorteo";

// El mailer se simula: la prueba de la ruta no debe depender de SMTP real.
const mocks = vi.hoisted(() => ({
  enviarAsignaciones: vi.fn<
    (asignaciones: Asignacion[], opciones: unknown) => Promise<number>
  >(),
}));

vi.mock("@/lib/mailer", () => ({
  enviarAsignaciones: mocks.enviarAsignaciones,
}));

import { POST } from "@/app/api/sorteo/route";

function solicitud(cuerpo: unknown): Request {
  return new Request("http://localhost:3000/api/sorteo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.enviarAsignaciones.mockResolvedValue(2);
});

describe("POST /api/sorteo", () => {
  it("rechaza un cuerpo que no es JSON válido", async () => {
    const respuesta = await POST(
      new Request("http://localhost:3000/api/sorteo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{no es json",
      }),
    );

    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toEqual({
      error: "El cuerpo no es JSON válido.",
    });
  });

  it("propaga los errores de validación con estado 400", async () => {
    const casos = [
      // Correo duplicado (aunque cambie la capitalización).
      {
        participantes: [
          { nombre: "Ana", correo: "ana@ejemplo.com" },
          { nombre: "Ana 2", correo: "ANA@ejemplo.com" },
        ],
      },
      // Solo un participante.
      { participantes: [{ nombre: "Ana", correo: "ana@ejemplo.com" }] },
      // Sin lista de participantes.
      { algo: true },
      // Configuración de sorteo inválida.
      {
        participantes: [
          { nombre: "Ana", correo: "ana@ejemplo.com" },
          { nombre: "Berto", correo: "berto@ejemplo.com" },
        ],
        opciones: { tipo: "multiple", cantidadAmigos: 9 },
      },
    ];

    for (const cuerpo of casos) {
      const respuesta = await POST(solicitud(cuerpo));
      expect(respuesta.status).toBe(400);
      const cuerpoActual = (await respuesta.json()) as { error: string };
      expect(typeof cuerpoActual.error).toBe("string");
      expect(cuerpoActual.error.length).toBeGreaterThan(0);
      expect(mocks.enviarAsignaciones).not.toHaveBeenCalled();
    }
  });

  it("exige al menos 2 participantes para sortear", async () => {
    const respuesta = await POST(
      // Un único participante pasa la validación, pero el sorteo no puede
      // generarse y la ruta responde con el mensaje del mínimo.
      solicitud({ participantes: [{ nombre: "Ana", correo: "ana@ejemplo.com" }] }),
    );

    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toEqual({
      error: "Se requieren al menos 2 participantes para el sorteo.",
    });
    expect(mocks.enviarAsignaciones).not.toHaveBeenCalled();
  });

  it("informa al organizador cuando las exclusiones hacen imposible el reparto", async () => {
    // Solo hay dos personas y no pueden tocarse: no existe solución.
    const respuesta = await POST(
      solicitud({
        participantes: [
          { nombre: "Ana", correo: "ana@ejemplo.com" },
          { nombre: "Berto", correo: "berto@ejemplo.com" },
        ],
        opciones: {
          exclusiones: [
            { correo1: "ana@ejemplo.com", correo2: "berto@ejemplo.com" },
          ],
        },
      }),
    );

    expect(respuesta.status).toBe(400);
    const cuerpo = (await respuesta.json()) as { error: string };
    expect(cuerpo.error).toContain("No existe un reparto posible");
    expect(cuerpo.error).toContain("exclusiones");
    // Sin solución, ningún correo se envió.
    expect(mocks.enviarAsignaciones).not.toHaveBeenCalled();
  });

  it("sortea y devuelve el número de correos enviados (modo individual por omisión)", async () => {
    const respuesta = await POST(
      solicitud({
        participantes: [
          { nombre: "Ana", correo: "ana@ejemplo.com" },
          { nombre: "Berto", correo: "berto@ejemplo.com" },
        ],
      }),
    );

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({ ok: true, enviados: 2 });
    expect(mocks.enviarAsignaciones).toHaveBeenCalledTimes(1);

    // Las asignaciones recibidas son coherentes: 2 personas, 2 correos.
    const asignaciones = mocks.enviarAsignaciones.mock.calls[0]![0];
    expect(asignaciones).toHaveLength(2);
    expect(asignaciones[0].de.correo).toBe("ana@ejemplo.com");
    expect(asignaciones[0].de).not.toBe(asignaciones[0].para);
    expect(asignaciones[1].de).not.toBe(asignaciones[1].para);
  });

  it("normaliza los nombres y correos antes de sortear", async () => {
    await POST(
      solicitud({
        participantes: [
          { nombre: "  Ana  ", correo: " ana@ejemplo.com " },
          { nombre: "Berto ", correo: " Berto@ejemplo.com" },
        ],
      }),
    );

    // La validación recorta los campos; el sorteo trabaja con datos limpios.
    const asignaciones = mocks.enviarAsignaciones.mock.calls[0]![0];
    for (const { de } of asignaciones) {
      expect(de.nombre).not.toMatch(/^\s|\s$/);
      expect(de.correo).not.toMatch(/^\s|\s$/);
    }
  });

  it("sortea en modo múltiple con el monto sugerido llega al mailer", async () => {
    mocks.enviarAsignaciones.mockResolvedValue(3);

    const respuesta = await POST(
      solicitud({
        participantes: [
          { nombre: "Ana", correo: "ana@ejemplo.com" },
          { nombre: "Berto", correo: "berto@ejemplo.com" },
          { nombre: "Carla", correo: "carla@ejemplo.com" },
        ],
        opciones: {
          tipo: "multiple",
          cantidadAmigos: 2,
          montoSugerido: { minimo: 10, maximo: 20 },
        },
      }),
    );

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({ ok: true, enviados: 3 });

    // El mailer recibe K*n = 6 asignaciones y el monto sugerido.
    const [asignaciones, opcionesRecibidas] = mocks.enviarAsignaciones.mock.calls[0]!;
    expect(asignaciones).toHaveLength(6);
    expect(opcionesRecibidas).toEqual({ montoSugerido: { minimo: 10, maximo: 20 } });
  });

  it("respeta exclusiones válidas y genera un sorteo posible", async () => {
    mocks.enviarAsignaciones.mockResolvedValue(4);

    const respuesta = await POST(
      solicitud({
        participantes: [
          { nombre: "Ana", correo: "ana@ejemplo.com" },
          { nombre: "Berto", correo: "berto@ejemplo.com" },
          { nombre: "Carla", correo: "carla@ejemplo.com" },
          { nombre: "Dani", correo: "dani@ejemplo.com" },
        ],
        opciones: {
          exclusiones: [
            { correo1: "ana@ejemplo.com", correo2: "berto@ejemplo.com" },
          ],
        },
      }),
    );

    expect(respuesta.status).toBe(200);
    const [asignaciones] = mocks.enviarAsignaciones.mock.calls[0]!;
    for (const { de, para } of asignaciones) {
      const cruza =
        (de.correo === "ana@ejemplo.com" && para.correo === "berto@ejemplo.com") ||
        (de.correo === "berto@ejemplo.com" && para.correo === "ana@ejemplo.com");
      expect(cruza).toBe(false);
    }
  });

  it("devuelve 502 cuando el envío de correos falla", async () => {
    mocks.enviarAsignaciones.mockRejectedValue(new Error("SMTP caído"));

    const respuesta = await POST(
      solicitud({
        participantes: [
          { nombre: "Ana", correo: "ana@ejemplo.com" },
          { nombre: "Berto", correo: "berto@ejemplo.com" },
        ],
      }),
    );

    expect(respuesta.status).toBe(502);
    const cuerpo = (await respuesta.json()) as { error: string };
    // El mensaje orienta al organizador a repetir el sorteo.
    expect(cuerpo.error).toContain("falló el envío");
    expect(cuerpo.error).toContain("vuelve a realizar el sorteo");
  });
});
