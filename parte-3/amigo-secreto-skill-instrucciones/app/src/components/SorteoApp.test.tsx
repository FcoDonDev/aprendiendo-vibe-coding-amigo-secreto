import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SorteoApp from "@/components/SorteoApp";

/** Agrega un participante completo por el formulario. */
async function agregarParticipante(
  usuario: ReturnType<typeof userEvent.setup>,
  nombre: string,
  correo: string,
) {
  await usuario.type(screen.getByLabelText("Nombre del participante"), nombre);
  await usuario.type(screen.getByLabelText("Correo del participante"), correo);
  await usuario.click(screen.getByRole("button", { name: "Agregar" }));
}

/** Mockea `fetch` con una respuesta JSON concreta. */
function responderFetch(cuerpo: unknown, estado: number) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(JSON.stringify(cuerpo), {
        status: estado,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SorteoApp", () => {
  it("empieza con el botón deshabilitado y el aviso de mínimo 2", () => {
    render(<SorteoApp />);

    expect(screen.getByRole("button", { name: "Realizar sorteo" })).toBeDisabled();
    expect(
      screen.getByText("Se necesitan al menos 2 participantes para sortear."),
    ).toBeInTheDocument();
  });

  it("agrega participantes y habilita el botón al llegar a dos", async () => {
    const usuario = userEvent.setup();
    render(<SorteoApp />);

    await agregarParticipante(usuario, "Ana", "ana@ejemplo.com");
    expect(screen.getByRole("button", { name: "Realizar sorteo" })).toBeDisabled();

    await agregarParticipante(usuario, "Berto", "berto@ejemplo.com");
    expect(screen.getByRole("button", { name: "Realizar sorteo" })).toBeEnabled();
    expect(screen.getByText("2 participantes")).toBeInTheDocument();
  });

  it("rechaza correos duplicados aunque cambien mayúsculas y minúsculas", async () => {
    const usuario = userEvent.setup();
    render(<SorteoApp />);

    await agregarParticipante(usuario, "Ana", "ana@ejemplo.com");
    await agregarParticipante(usuario, "Ana 2", "ANA@EJEMPLO.COM");

    expect(
      screen.getByText("Ese correo ya está registrado."),
    ).toBeInTheDocument();
    expect(screen.getByText("1 participante")).toBeInTheDocument();
  });

  it("realiza el sorteo, informa el éxito y limpia la lista", async () => {
    responderFetch({ ok: true, enviados: 2 }, 200);
    const usuario = userEvent.setup();
    render(<SorteoApp />);

    await agregarParticipante(usuario, "Ana", "ana@ejemplo.com");
    await agregarParticipante(usuario, "Berto", "berto@ejemplo.com");
    await usuario.click(screen.getByRole("button", { name: "Realizar sorteo" }));

    await waitFor(() => {
      expect(screen.getByText(/Se enviaron 2 correos/)).toBeInTheDocument();
    });

    // El cuerpo de la solicitud llevó la lista completa con las opciones por omisión.
    expect(fetch).toHaveBeenCalledWith(
      "/api/sorteo",
      expect.objectContaining({ method: "POST" }),
    );
    const cuerpo = (vi.mocked(fetch).mock.calls[0][1] as { body: string });
    expect(JSON.parse(cuerpo.body)).toEqual({
      participantes: [
        { nombre: "Ana", correo: "ana@ejemplo.com" },
        { nombre: "Berto", correo: "berto@ejemplo.com" },
      ],
      opciones: { tipo: "individual", exclusiones: [] },
    });

    // La lista vuelve a estar vacía tras el éxito.
    expect(screen.getByText(/Aún no hay participantes/)).toBeInTheDocument();
    const restos = screen.queryAllByText(/^(Ana|Berto)$/);
    expect(restos).toHaveLength(0);
  });

  it("muestra el error del servidor cuando la respuesta no es correcta", async () => {
    responderFetch({ error: "El correo ana@ejemplo.com está repetido." }, 400);
    const usuario = userEvent.setup();
    render(<SorteoApp />);

    await agregarParticipante(usuario, "Ana", "ana@ejemplo.com");
    await agregarParticipante(usuario, "Berto", "berto@ejemplo.com");
    await usuario.click(screen.getByRole("button", { name: "Realizar sorteo" }));

    await waitFor(() => {
      expect(
        screen.getByText("El correo ana@ejemplo.com está repetido."),
      ).toBeInTheDocument();
    });
    // La lista se conserva para poder corregir y repetir.
    expect(screen.getByText("2 participantes")).toBeInTheDocument();
  });

  it("avisa cuando no se pudo contactar al servidor", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("sin red");
    }));
    const usuario = userEvent.setup();
    render(<SorteoApp />);

    await agregarParticipante(usuario, "Ana", "ana@ejemplo.com");
    await agregarParticipante(usuario, "Berto", "berto@ejemplo.com");
    await usuario.click(screen.getByRole("button", { name: "Realizar sorteo" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "No se pudo contactar al servidor. Vuelve a intentarlo.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("muestra un error genérico si el servidor responde sin mensaje", async () => {
    responderFetch({}, 500);
    const usuario = userEvent.setup();
    render(<SorteoApp />);

    await agregarParticipante(usuario, "Ana", "ana@ejemplo.com");
    await agregarParticipante(usuario, "Berto", "berto@ejemplo.com");
    await usuario.click(screen.getByRole("button", { name: "Realizar sorteo" }));

    await waitFor(() => {
      expect(
        screen.getByText("Ocurrió un error inesperado."),
      ).toBeInTheDocument();
    });
  });

  it("agrega una exclusión, la manda a la API y la limpia tras el éxito", async () => {
    responderFetch({ ok: true, enviados: 2 }, 200);
    const usuario = userEvent.setup();
    render(<SorteoApp />);

    await agregarParticipante(usuario, "Ana", "ana@ejemplo.com");
    await agregarParticipante(usuario, "Berto", "berto@ejemplo.com");
    expect(
      screen.getByText("Sin exclusiones: cualquier persona puede recibir a cualquiera."),
    ).toBeInTheDocument();

    await usuario.selectOptions(
      screen.getByLabelText("Primer participante del par excluido"),
      "ana@ejemplo.com",
    );
    await usuario.selectOptions(
      screen.getByLabelText("Segundo participante del par excluido"),
      "berto@ejemplo.com",
    );
    await usuario.click(screen.getByRole("button", { name: "Añadir exclusión" }));
    expect(screen.getByText(/^Ana\s+Berto$/)).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Realizar sorteo" }));

    await waitFor(() => {
      expect(screen.getByText(/Se enviaron 2 correos/)).toBeInTheDocument();
    });
    const cuerpo = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as { body: string }).body,
    );
    expect(cuerpo.opciones.exclusiones).toEqual([
      { correo1: "ana@ejemplo.com", correo2: "berto@ejemplo.com" },
    ]);

    // Tras el éxito las exclusiones también se reinician: al volver a
    // registrar a las mismas personas no reaparece el par excluido.
    await agregarParticipante(usuario, "Ana", "ana@ejemplo.com");
    await agregarParticipante(usuario, "Berto", "berto@ejemplo.com");
    expect(
      screen.getByText("Sin exclusiones: cualquier persona puede recibir a cualquiera."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^Ana\s+Berto$/)).not.toBeInTheDocument();
  });

  it("rechaza definir dos veces la misma exclusión", async () => {
    const usuario = userEvent.setup();
    render(<SorteoApp />);

    await agregarParticipante(usuario, "Ana", "ana@ejemplo.com");
    await agregarParticipante(usuario, "Berto", "berto@ejemplo.com");

    for (let vueltas = 0; vueltas < 2; vueltas++) {
      await usuario.selectOptions(
        screen.getByLabelText("Primer participante del par excluido"),
        "ana@ejemplo.com",
      );
      await usuario.selectOptions(
        screen.getByLabelText("Segundo participante del par excluido"),
        "berto@ejemplo.com",
      );
      await usuario.click(screen.getByRole("button", { name: "Añadir exclusión" }));
    }

    expect(screen.getByText("Esa exclusión ya está definida.")).toBeInTheDocument();
    // Solo quedó registrada una vez.
    expect(screen.getAllByText(/^Ana\s+Berto$/)).toHaveLength(1);
  });

  it("elimina a un participante y con él sus exclusiones", async () => {
    const usuario = userEvent.setup();
    render(<SorteoApp />);

    await agregarParticipante(usuario, "Ana", "ana@ejemplo.com");
    await agregarParticipante(usuario, "Berto", "berto@ejemplo.com");
    await agregarParticipante(usuario, "Carla", "carla@ejemplo.com");

    await usuario.selectOptions(
      screen.getByLabelText("Primer participante del par excluido"),
      "ana@ejemplo.com",
    );
    await usuario.selectOptions(
      screen.getByLabelText("Segundo participante del par excluido"),
      "berto@ejemplo.com",
    );
    await usuario.click(screen.getByRole("button", { name: "Añadir exclusión" }));
    expect(screen.getByText(/^Ana\s+Berto$/)).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Eliminar a Berto" }));

    expect(
      screen.getByText("Sin exclusiones: cualquier persona puede recibir a cualquiera."),
    ).toBeInTheDocument();
  });

  it("envía el modo múltiple, la cantidad y el monto sugerido a la API", async () => {
    responderFetch({ ok: true, enviados: 3 }, 200);
    const usuario = userEvent.setup();
    render(<SorteoApp />);

    await agregarParticipante(usuario, "Ana", "ana@ejemplo.com");
    await agregarParticipante(usuario, "Berto", "berto@ejemplo.com");
    await agregarParticipante(usuario, "Carla", "carla@ejemplo.com");

    await usuario.click(
      screen.getByLabelText(/Multiple/, {
        selector: "input",
      }),
    );
    // La cantidad por omisión (2) ya es válida con 3 participantes.
    await usuario.type(screen.getByLabelText("Monto mínimo sugerido"), "10");
    await usuario.type(screen.getByLabelText("Monto máximo sugerido"), "20");

    await usuario.click(screen.getByRole("button", { name: "Realizar sorteo" }));

    await waitFor(() => {
      expect(screen.getByText(/Se enviaron 3 correos/)).toBeInTheDocument();
    });
    const cuerpo = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as { body: string }).body,
    );
    expect(cuerpo.opciones.tipo).toBe("multiple");
    expect(cuerpo.opciones.cantidadAmigos).toBe(2);
    expect(cuerpo.opciones.montoSugerido).toEqual({ minimo: 10, maximo: 20 });
  });

  it("desactiva el botón y avisa cuando la configuración no es válida", async () => {
    const usuario = userEvent.setup();
    render(<SorteoApp />);

    await agregarParticipante(usuario, "Ana", "ana@ejemplo.com");
    await agregarParticipante(usuario, "Berto", "berto@ejemplo.com");
    expect(screen.getByRole("button", { name: "Realizar sorteo" })).toBeEnabled();

    // Dos participantes no bastan para el modo múltiple con K=2.
    await usuario.click(
      screen.getByLabelText(/Multiple/, {
        selector: "input",
      }),
    );

    expect(screen.getByRole("button", { name: "Realizar sorteo" })).toBeDisabled();
    expect(
      screen.getByText("Revisa la configuración: hay opciones incompletas o sin sentido con la lista de participantes actual."),
    ).toBeInTheDocument();

    // En modo individual todo vuelve a estar bien.
    await usuario.click(
      screen.getByLabelText(/Individual \(clásico\)/, {
        selector: "input",
      }),
    );
    expect(screen.getByRole("button", { name: "Realizar sorteo" })).toBeEnabled();
  });

  it("muestra el aviso del servidor cuando el reparto es imposible con exclusiones", async () => {
    responderFetch(
      {
        error:
          "No existe un reparto posible con las exclusiones definidas. Revisa los pares excluidos o agrega más participantes.",
      },
      400,
    );
    const usuario = userEvent.setup();
    render(<SorteoApp />);

    await agregarParticipante(usuario, "Ana", "ana@ejemplo.com");
    await agregarParticipante(usuario, "Berto", "berto@ejemplo.com");
    await usuario.click(screen.getByRole("button", { name: "Realizar sorteo" }));

    await waitFor(() => {
      expect(
        screen.getByText(/No existe un reparto posible con las exclusiones definidas/),
      ).toBeInTheDocument();
    });
    // La lista se conserva para corregir y repetir.
    expect(screen.getByText("2 participantes")).toBeInTheDocument();
  });

  it("mueve el foco al anuncio tras un sorteo exitoso", async () => {
    responderFetch({ ok: true, enviados: 2 }, 200);
    const usuario = userEvent.setup();
    render(<SorteoApp />);

    await agregarParticipante(usuario, "Ana", "ana@ejemplo.com");
    await agregarParticipante(usuario, "Berto", "berto@ejemplo.com");
    await usuario.click(screen.getByRole("button", { name: "Realizar sorteo" }));

    await waitFor(() => {
      const anuncio = screen.getByText(/Se enviaron 2 correos/).closest("p");
      // El banner es enfocable y recibe el foco para ser anunciado.
      expect(anuncio).toHaveAttribute("tabindex", "-1");
      expect(anuncio).toHaveFocus();
    });
  });
});
