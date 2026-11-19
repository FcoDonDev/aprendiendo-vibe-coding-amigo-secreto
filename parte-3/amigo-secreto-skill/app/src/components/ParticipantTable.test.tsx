import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ParticipantTable from "@/components/ParticipantTable";

describe("ParticipantTable", () => {
  it("muestra un aviso cuando no hay participantes", () => {
    render(<ParticipantTable participantes={[]} alEliminar={vi.fn()} />);

    expect(
      screen.getByText(/Aún no hay participantes/),
    ).toBeInTheDocument();
  });

  it("lista los participantes con su número, nombre y correo", () => {
    const participantes = [
      { nombre: "Ana", correo: "ana@ejemplo.com" },
      { nombre: "Berto", correo: "berto@ejemplo.com" },
    ];
    render(
      <ParticipantTable participantes={participantes} alEliminar={vi.fn()} />,
    );

    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("ana@ejemplo.com")).toBeInTheDocument();
    expect(screen.getByText("Berto")).toBeInTheDocument();
    // Contador correcto en plural.
    expect(screen.getByText("2 participantes")).toBeInTheDocument();
  });

  it("usa el singular del contador con un solo participante", () => {
    render(
      <ParticipantTable
        participantes={[{ nombre: "Ana", correo: "ana@ejemplo.com" }]}
        alEliminar={vi.fn()}
      />,
    );

    expect(screen.getByText("1 participante")).toBeInTheDocument();
  });

  it("permite eliminar a un participante concreto", async () => {
    const usuario = userEvent.setup();
    const alEliminar = vi.fn();
    const participantes = [
      { nombre: "Ana", correo: "ana@ejemplo.com" },
      { nombre: "Berto", correo: "berto@ejemplo.com" },
    ];
    render(
      <ParticipantTable participantes={participantes} alEliminar={alEliminar} />,
    );

    await usuario.click(
      screen.getByRole("button", { name: "Eliminar a Berto" }),
    );

    expect(alEliminar).toHaveBeenCalledTimes(1);
    expect(alEliminar).toHaveBeenCalledWith(1);
  });
});
