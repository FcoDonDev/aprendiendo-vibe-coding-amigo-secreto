import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ParticipantForm from "@/components/ParticipantForm";

describe("ParticipantForm", () => {
  it("muestra los campos de nombre y correo", () => {
    render(<ParticipantForm alAgregar={vi.fn()} />);

    expect(
      screen.getByLabelText("Nombre del participante"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Correo del participante")).toBeInTheDocument();
  });

  it("exige un nombre antes de agregar", async () => {
    const usuario = userEvent.setup();
    const alAgregar = vi.fn();
    render(<ParticipantForm alAgregar={alAgregar} />);

    await usuario.type(screen.getByLabelText("Correo del participante"), "a@b.c");
    await usuario.click(screen.getByRole("button", { name: "Agregar" }));

    expect(
      screen.getByText("Ingresa el nombre del participante."),
    ).toBeInTheDocument();
    expect(alAgregar).not.toHaveBeenCalled();
  });

  it("exige un correo con formato válido", async () => {
    const usuario = userEvent.setup();
    const alAgregar = vi.fn();
    render(<ParticipantForm alAgregar={alAgregar} />);

    await usuario.type(screen.getByLabelText("Nombre del participante"), "Ana");
    await usuario.type(screen.getByLabelText("Correo del participante"), "correo-malo");
    await usuario.click(screen.getByRole("button", { name: "Agregar" }));

    expect(screen.getByText("Ingresa un correo válido.")).toBeInTheDocument();
    expect(alAgregar).not.toHaveBeenCalled();
  });

  it("entrega los datos recortados y limpia el formulario al éxito", async () => {
    const usuario = userEvent.setup();
    const alAgregar = vi.fn().mockReturnValue(null);
    render(<ParticipantForm alAgregar={alAgregar} />);

    await usuario.type(screen.getByLabelText("Nombre del participante"), "  Ana  ");
    await usuario.type(screen.getByLabelText("Correo del participante"), " ana@ejemplo.com ");
    await usuario.click(screen.getByRole("button", { name: "Agregar" }));

    expect(alAgregar).toHaveBeenCalledWith({
      nombre: "Ana",
      correo: "ana@ejemplo.com",
    });
    expect(screen.getByLabelText("Nombre del participante")).toHaveValue("");
    expect(screen.getByLabelText("Correo del participante")).toHaveValue("");
  });

  it("muestra el problema devuelto por el componente padre", async () => {
    const usuario = userEvent.setup();
    const alAgregar = vi.fn().mockReturnValue("Ese correo ya está registrado.");
    render(<ParticipantForm alAgregar={alAgregar} />);

    await usuario.type(screen.getByLabelText("Nombre del participante"), "Ana");
    await usuario.type(screen.getByLabelText("Correo del participante"), "a@b.c");
    await usuario.click(screen.getByRole("button", { name: "Agregar" }));

    expect(screen.getByText("Ese correo ya está registrado.")).toBeInTheDocument();
    // No limpia los campos cuando el alta se rechaza.
    expect(screen.getByLabelText("Nombre del participante")).toHaveValue("Ana");
  });

  it("borra el error previo al seguir escribiendo", async () => {
    const usuario = userEvent.setup();
    const alAgregar = vi.fn();
    render(<ParticipantForm alAgregar={alAgregar} />);

    await usuario.click(screen.getByRole("button", { name: "Agregar" }));
    expect(screen.getByText("Ingresa el nombre del participante.")).toBeInTheDocument();

    await usuario.type(screen.getByLabelText("Nombre del participante"), "A");
    expect(screen.queryByText("Ingresa el nombre del participante.")).not.toBeInTheDocument();
  });
});
