import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Exclusiones from "@/components/Exclusiones";
import type { Participante, Exclusion } from "@/lib/sorteo";

const participantes: Participante[] = [
  { nombre: "Ana", correo: "ana@ejemplo.com" },
  { nombre: "Berto", correo: "berto@ejemplo.com" },
  { nombre: "Carla", correo: "carla@ejemplo.com" },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Exclusiones", () => {
  it("pide al menos 2 participantes antes de definir exclusiones", () => {
    render(
      <Exclusiones
        participantes={[participantes[0]!]}
        exclusiones={[]}
        alAgregar={vi.fn()}
        alEliminar={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/Agrega al menos 2 participantes/),
    ).toBeInTheDocument();
  });

  it("agrega una exclusión válida y limpia la selección", async () => {
    const usuario = userEvent.setup();
    const alAgregar = vi.fn(() => null);
    render(
      <Exclusiones
        participantes={participantes}
        exclusiones={[]}
        alAgregar={alAgregar}
        alEliminar={vi.fn()}
      />,
    );

    await usuario.selectOptions(
      screen.getByLabelText("Primer participante del par excluido"),
      "ana@ejemplo.com",
    );
    await usuario.selectOptions(
      screen.getByLabelText("Segundo participante del par excluido"),
      "berto@ejemplo.com",
    );
    await usuario.click(screen.getByRole("button", { name: "Añadir exclusión" }));

    expect(alAgregar).toHaveBeenCalledWith("ana@ejemplo.com", "berto@ejemplo.com");
    await waitFor(() => {
      expect(
        (screen.getByLabelText("Primer participante del par excluido") as HTMLSelectElement).value,
      ).toBe("");
    });
  });

  it("muestra el error devuelto por la app y conserva la selección", async () => {
    const usuario = userEvent.setup();
    const alAgregar = vi.fn(() => "Esa exclusión ya está definida.");
    render(
      <Exclusiones
        participantes={participantes}
        exclusiones={[]}
        alAgregar={alAgregar}
        alEliminar={vi.fn()}
      />,
    );

    await usuario.selectOptions(
      screen.getByLabelText("Primer participante del par excluido"),
      "ana@ejemplo.com",
    );
    await usuario.selectOptions(
      screen.getByLabelText("Segundo participante del par excluido"),
      "berto@ejemplo.com",
    );
    await usuario.click(screen.getByRole("button", { name: "Añadir exclusión" }));

    expect(
      screen.getByText("Esa exclusión ya está definida."),
    ).toBeInTheDocument();
    expect(
      (screen.getByLabelText("Primer participante del par excluido") as HTMLSelectElement).value,
    ).toBe("ana@ejemplo.com");
  });

  it("avisa si se omitió elegir alguna de las dos personas", async () => {
    const usuario = userEvent.setup();
    render(
      <Exclusiones
        participantes={participantes}
        exclusiones={[]}
        alAgregar={vi.fn()}
        alEliminar={vi.fn()}
      />,
    );

    await usuario.click(screen.getByRole("button", { name: "Añadir exclusión" }));

    expect(
      screen.getByText("Selecciona a ambas personas del par excluido."),
    ).toBeInTheDocument();
  });

  it("lista las exclusiones con nombres y permite quitarlas", async () => {
    const usuario = userEvent.setup();
    const alEliminar = vi.fn();
    const exclusiones: Exclusion[] = [
      { correo1: "ana@ejemplo.com", correo2: "berto@ejemplo.com" },
      { correo1: "carla@ejemplo.com", correo2: "ana@ejemplo.com" },
    ];
    render(
      <Exclusiones
        participantes={participantes}
        exclusiones={exclusiones}
        alAgregar={vi.fn()}
        alEliminar={alEliminar}
      />,
    );

    expect(screen.getByText(/^Ana\s+Berto$/)).toBeInTheDocument();
    expect(screen.getByText(/^Carla\s+Ana$/)).toBeInTheDocument();

    await usuario.click(
      screen.getByRole("button", {
        name: "Eliminar la exclusión entre Ana y Berto",
      }),
    );
    expect(alEliminar).toHaveBeenCalledWith(0);
  });

  it("muestra el aviso cuando la lista está vacía", () => {
    render(
      <Exclusiones
        participantes={participantes}
        exclusiones={[]}
        alAgregar={vi.fn()}
        alEliminar={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Sin exclusiones: cualquier persona puede recibir a cualquiera."),
    ).toBeInTheDocument();
  });
});
