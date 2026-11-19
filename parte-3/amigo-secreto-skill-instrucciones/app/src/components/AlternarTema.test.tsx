import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AlternarTema from "@/components/AlternarTema";

afterEach(() => {
  document.documentElement.classList.remove("dark");
  localStorage.clear();
});

describe("AlternarTema", () => {
  it("activa el modo oscuro y persiste la elección", async () => {
    const usuario = userEvent.setup();
    render(<AlternarTema />);

    await usuario.click(
      screen.getByRole("button", {
        name: "Cambiar entre modo claro y oscuro",
      }),
    );

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("tema")).toBe("oscuro");
  });

  it("vuelve al modo claro en el segundo clic", async () => {
    const usuario = userEvent.setup();
    document.documentElement.classList.add("dark");
    render(<AlternarTema />);

    await usuario.click(
      screen.getByRole("button", {
        name: "Cambiar entre modo claro y oscuro",
      }),
    );

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("tema")).toBe("claro");
  });
});
