import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SorteoButton from "@/components/SorteoButton";

describe("SorteoButton", () => {
  it("lanza el sorteo al hacer clic", async () => {
    const usuario = userEvent.setup();
    const alLanzar = vi.fn();
    render(<SorteoButton deshabilitado={false} cargando={false} alLanzar={alLanzar} />);

    await usuario.click(screen.getByRole("button", { name: "Realizar sorteo" }));

    expect(alLanzar).toHaveBeenCalledTimes(1);
  });

  it("se deshabilita con menos de 2 participantes", () => {
    const alLanzar = vi.fn();
    render(<SorteoButton deshabilitado={true} cargando={false} alLanzar={alLanzar} />);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("muestra el estado de carga y evita clics mientras sorteando", async () => {
    const usuario = userEvent.setup();
    const alLanzar = vi.fn();
    render(<SorteoButton deshabilitado={false} cargando={true} alLanzar={alLanzar} />);

    const boton = screen.getByRole("button");
    expect(boton).toHaveTextContent("Sorteando y enviando correos…");
    expect(boton).toBeDisabled();

    await usuario.click(boton);
    expect(alLanzar).not.toHaveBeenCalled();
  });
});
