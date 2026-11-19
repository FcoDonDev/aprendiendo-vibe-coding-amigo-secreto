import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Celebracion from "@/components/Celebracion";

describe("Celebracion", () => {
  it("no muestra nada mientras no está activa", () => {
    const { container } = render(
      <Celebracion activo={false} alTerminar={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("monta una capa decorativa oculta para lectores de pantalla", () => {
    render(<Celebracion activo={true} alTerminar={vi.fn()} />);

    const capa = document.querySelector(".pointer-events-none.fixed");
    expect(capa).not.toBeNull();
    expect(capa).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
