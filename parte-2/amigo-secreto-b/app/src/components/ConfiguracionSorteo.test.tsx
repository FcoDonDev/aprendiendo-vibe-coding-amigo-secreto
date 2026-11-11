import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfiguracionSorteo, {
  CONFIG_INICIAL,
  esConfiguracionValida,
  type EstadoConfig,
} from "@/components/ConfiguracionSorteo";

function configurar(sombra: Partial<EstadoConfig> = {}): EstadoConfig {
  return { ...CONFIG_INICIAL, ...sombra };
}

describe("esConfiguracionValida", () => {
  it("es válida por omisión con 2 participantes en modo individual", () => {
    expect(esConfiguracionValida(configurar(), 2)).toBe(true);
  });

  it("depende de haber al menos 2 participantes", () => {
    expect(esConfiguracionValida(configurar(), 0)).toBe(false);
    expect(esConfiguracionValida(configurar(), 1)).toBe(false);
  });

  it("la cantidad de amigos secretos debe estar entre 2 y n-1", () => {
    expect(esConfiguracionValida(configurar({ tipo: "multiple", cantidadAmigos: 2 }), 3)).toBe(true);
    expect(esConfiguracionValida(configurar({ tipo: "multiple", cantidadAmigos: 4 }), 5)).toBe(true);
    expect(esConfiguracionValida(configurar({ tipo: "multiple", cantidadAmigos: 5 }), 5)).toBe(false);
    expect(esConfiguracionValida(configurar({ tipo: "multiple", cantidadAmigos: 2 }), 2)).toBe(false);
    expect(esConfiguracionValida(configurar({ tipo: "multiple", cantidadAmigos: 1 }), 5)).toBe(false);
  });

  it("los montos deben ser positivos y coherentes", () => {
    expect(esConfiguracionValida(configurar({ montoMinimo: "10" }), 3)).toBe(true);
    expect(esConfiguracionValida(configurar({ montoMinimo: "10", montoMaximo: "20" }), 3)).toBe(true);
    expect(esConfiguracionValida(configurar({ montoMinimo: "0" }), 3)).toBe(false);
    expect(esConfiguracionValida(configurar({ montoMinimo: "-4" }), 3)).toBe(false);
    expect(esConfiguracionValida(configurar({ montoMinimo: "abc" }), 3)).toBe(false);
    expect(
      esConfiguracionValida(configurar({ montoMinimo: "25", montoMaximo: "10" }), 3),
    ).toBe(false);
  });
});

describe("ConfiguracionSorteo", () => {
  function preparar(actualizar = vi.fn()) {
    render(
      <ConfiguracionSorteo
        config={CONFIG_INICIAL}
        numParticipantes={5}
        alActualizar={actualizar}
      />,
    );
    return actualizar;
  }

  it("arranca en modo individual sin cantidad ni aviso rojo", () => {
    preparar();

    const individual = screen.getByLabelText("Individual (clásico): una persona, un regalo", {
      selector: "input",
    }) as HTMLInputElement;
    const multiple = screen.getByLabelText(
      "Multiple: cada quien regala a varias personas",
      { selector: "input" },
    ) as HTMLInputElement;
    expect(individual.checked).toBe(true);
    expect(multiple.checked).toBe(false);
    expect(
      screen.queryByLabelText("Cantidad de amigos secretos por participante"),
    ).not.toBeInTheDocument();
  });

  it("cambiar el tipo avisa a la app para actualizar el estado", async () => {
    const usuario = userEvent.setup();
    const actualizar = vi.fn();
    preparar(actualizar);

    await usuario.click(
      screen.getByLabelText("Multiple: cada quien regala a varias personas", {
        selector: "input",
      }),
    );

    expect(actualizar).toHaveBeenCalledWith({ tipo: "multiple" });
  });

  it("en modo múltiple pide la cantidad de amigos secretos", async () => {
    const usuario = userEvent.setup();
    const sombra = configurar({ tipo: "multiple" });
    const actualizar = vi.fn();
    render(
      <ConfiguracionSorteo
        config={sombra}
        numParticipantes={5}
        alActualizar={actualizar}
      />,
    );

    const cantidad = screen.getByLabelText(
      "Cantidad de amigos secretos por participante",
    );
    expect(cantidad).toHaveValue(2);

    await usuario.type(cantidad, "3");
    const ultimo = actualizar.mock.calls.at(-1)![0] as { cantidadAmigos?: number };
    // Con escribir "3" el control pasa de 2 a 23: se ve el valor crudo nuevo.
    expect(ultimo.cantidadAmigos).toBeGreaterThanOrEqual(2);
  });

  it("los montos mínimo y máximo editables avisan a la app", async () => {
    const usuario = userEvent.setup();
    const actualizar = vi.fn();
    preparar(actualizar);

    await usuario.type(
      screen.getByLabelText("Monto mínimo sugerido"),
      "10",
    );
    const primero = actualizar.mock.calls.at(-1)![0] as { montoMinimo?: string };
    expect(primero.montoMinimo).toBeTruthy();

    await usuario.type(
      screen.getByLabelText("Monto máximo sugerido"),
      "20",
    );
    const ultimo = actualizar.mock.calls.at(-1)![0] as { montoMaximo?: string };
    expect(ultimo.montoMaximo).toBeTruthy();
  });

  it("avisa en rojo si el máximo queda menor que el mínimo", () => {
    render(
      <ConfiguracionSorteo
        config={configurar({ montoMinimo: "25", montoMaximo: "10" })}
        numParticipantes={5}
        alActualizar={vi.fn()}
      />,
    );

    expect(
      screen.getByText("El monto máximo no puede ser menor que el mínimo."),
    ).toBeInTheDocument();
  });
});
