import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Transporter } from "nodemailer";
import type { Asignacion } from "@/lib/sorteo";

/**
 * `vi.hoisted` garantiza que el mock exista antes de que Vitest cargue el
 * módulo falsificado de `nodemailer`.
 */
const mocks = vi.hoisted(() => ({
  sendMail: vi.fn<(carta: unknown) => Promise<unknown>>(),
  createTransport: vi.fn<(opciones: unknown) => Transporter>(),
}));

vi.mock("nodemailer", () => ({
  createTransport: mocks.createTransport,
}));

/**
 * Importa una copia fresca del módulo: `enviarAsignaciones` cachea el
 * transporte a nivel de módulo, así que cada escenario reimporta.
 */
function importarMailer() {
  vi.resetModules();
  return import("@/lib/mailer");
}

/** Limpia las variables SMTP que configuran la creación del transporte. */
function limpiarEntorno() {
  for (const clave of [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
  ]) {
    delete process.env[clave];
  }
}

/** Tres asignaciones cerradas en ciclo: Ana→Berto, Berto→Carla, Carla→Ana. */
function asignacionesDeEjemplo(): Asignacion[] {
  const ana = { nombre: "Ana", correo: "ana@ejemplo.com" };
  const berto = { nombre: "Berto", correo: "berto@ejemplo.com" };
  const carla = { nombre: "Carla", correo: "carla@ejemplo.com" };
  return [
    { de: ana, para: berto },
    { de: berto, para: carla },
    { de: carla, para: ana },
  ];
}

beforeEach(() => {
  vi.clearAllMocks();
  limpiarEntorno();
  mocks.createTransport.mockImplementation(
    () => ({ sendMail: mocks.sendMail }) as unknown as Transporter,
  );
});

describe("enviarAsignaciones", () => {
  it("configura el transporte con SMTP_HOST y los valores por defecto", async () => {
    process.env.SMTP_HOST = "smtp.ejemplo.com";
    const { enviarAsignaciones } = await importarMailer();

    await enviarAsignaciones([]);

    expect(mocks.createTransport).toHaveBeenCalledWith({
      host: "smtp.ejemplo.com",
      port: 587,
      secure: false,
      auth: undefined,
    });
  });

  it("usa TLS implícito (secure: true) solo con el puerto 465", async () => {
    process.env.SMTP_HOST = "smtp.ejemplo.com";
    process.env.SMTP_PORT = "465";
    const { enviarAsignaciones } = await importarMailer();

    await enviarAsignaciones([]);

    expect(mocks.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 465, secure: true }),
    );

    process.env.SMTP_PORT = "587";
    const conPuertoEstandar = await importarMailer();
    await conPuertoEstandar.enviarAsignaciones([]);

    expect(mocks.createTransport).toHaveBeenLastCalledWith(
      expect.objectContaining({ secure: false }),
    );
  });

  it("incluye las credenciales solo si hay usuario y contraseña", async () => {
    process.env.SMTP_HOST = "smtp.ejemplo.com";
    const sinCredenciales = await importarMailer();
    await sinCredenciales.enviarAsignaciones([]);
    expect(mocks.createTransport).toHaveBeenLastCalledWith(
      expect.objectContaining({ auth: undefined }),
    );

    process.env.SMTP_USER = "sorteo@ejemplo.com";
    process.env.SMTP_PASS = "secreto";
    const conCredenciales = await importarMailer();
    await conCredenciales.enviarAsignaciones([]);
    expect(mocks.createTransport).toHaveBeenLastCalledWith(
      expect.objectContaining({
        auth: { user: "sorteo@ejemplo.com", pass: "secreto" },
      }),
    );
  });

  it("envía un correo por asignación, en orden, y devuelve el conteo", async () => {
    process.env.SMTP_HOST = "smtp.ejemplo.com";
    mocks.sendMail.mockResolvedValue(undefined);
    const { enviarAsignaciones } = await importarMailer();

    const asignaciones = asignacionesDeEjemplo();
    const enviados = await enviarAsignaciones(asignaciones);

    expect(enviados).toBe(3);
    expect(mocks.sendMail).toHaveBeenCalledTimes(3);
    // El orden coincide con el de entrada: Ana, luego Berto, luego Carla.
    expect(mocks.sendMail.mock.calls.map((c) => (c[0] as { to: string }).to)).toEqual([
      "ana@ejemplo.com",
      "berto@ejemplo.com",
      "carla@ejemplo.com",
    ]);
  });

  it("el correo contiene el asunto, el destinatario y la asignación", async () => {
    process.env.SMTP_FROM = "Amigo Secreto <sorteo@ejemplo.com>";
    process.env.SMTP_HOST = "smtp.ejemplo.com";
    mocks.sendMail.mockResolvedValue(undefined);
    const { enviarAsignaciones } = await importarMailer();

    await enviarAsignaciones([{ de: asignacionesDeEjemplo()[0]!.de, para: asignacionesDeEjemplo()[0]!.para }]);

    const correo = mocks.sendMail.mock.calls[0]![0] as {
      from: string;
      to: string;
      subject: string;
      text: string;
      html: string;
    };
    expect(correo.to).toBe("ana@ejemplo.com");
    expect(correo.from).toBe("Amigo Secreto <sorteo@ejemplo.com>");
    expect(correo.subject).toBe("Tu asignación de Amigo Secreto");
    expect(correo.text).toContain("Hola Ana");
    expect(correo.text).toContain("Te toca regalar a: Berto");
    expect(correo.html).toContain("Te toca regalar a:");
    // El nombre llega destacado en la tarjeta (peso 700, no un strong plano).
    expect(correo.html).toMatch(
      /<p style="[^"]*font-weight:700;color:#0f172a;">Berto<\/p>/,
    );
  });

  it("el remitente cae en SMTP_USER y al final en un valor por omisión", async () => {
    process.env.SMTP_HOST = "smtp.ejemplo.com";
    process.env.SMTP_USER = "sorteo@ejemplo.com";
    mocks.sendMail.mockResolvedValue(undefined);
    const sinFrom = await importarMailer();

    await sinFrom.enviarAsignaciones(asignacionesDeEjemplo().slice(0, 1));
    expect(
      (mocks.sendMail.mock.calls.at(-1)![0] as { from: string }).from,
    ).toBe("sorteo@ejemplo.com");

    limpiarEntorno();
    process.env.SMTP_HOST = "smtp.ejemplo.com";
    const { enviarAsignaciones } = await importarMailer();
    await enviarAsignaciones(asignacionesDeEjemplo().slice(0, 1));
    expect(
      (mocks.sendMail.mock.calls.at(-1)![0] as { from: string }).from,
    ).toBe("amigo-secreto@localhost");
  });

  it("cada correo revela solo la asignación de su destinatario", async () => {
    process.env.SMTP_HOST = "smtp.ejemplo.com";
    mocks.sendMail.mockResolvedValue(undefined);
    const { enviarAsignaciones } = await importarMailer();

    await enviarAsignaciones(asignacionesDeEjemplo());

    const lineas = mocks.sendMail.mock.calls.map(
      (c) => (c[0] as { to: string; text: string }).text,
    );
    // Cada correo muestra exactamente un "Te toca regalar a:", y nunca la
    // asignación de otra persona (el saludo incluye el propio nombre, así
    // que la comprobación usa la línea de la asignación, no el nombre).
    expect(lineas[0]).toContain("Te toca regalar a: Berto");
    expect(lineas[0]).not.toContain("Te toca regalar a: Carla");
    expect(lineas[1]).toContain("Te toca regalar a: Carla");
    expect(lineas[1]).not.toContain("Te toca regalar a: Berto");
    expect(lineas[2]).toContain("Te toca regalar a: Ana");
    expect(lineas[2]).not.toContain("Te toca regalar a: Berto");
  });

  it("no se reintentan los envíos fallidos y el error se propaga", async () => {
    process.env.SMTP_HOST = "smtp.ejemplo.com";
    mocks.sendMail
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("SMTP caído"));
    const { enviarAsignaciones } = await importarMailer();

    await expect(enviarAsignaciones(asignacionesDeEjemplo())).rejects.toThrow(
      "SMTP caído",
    );
    // Sin reintentos: exactamente 2 intentos (el segundo falla y se detiene).
    expect(mocks.sendMail).toHaveBeenCalledTimes(2);
  });

  it("falla de manera diferida al faltar SMTP_HOST", async () => {
    const { enviarAsignaciones } = await importarMailer();

    await expect(enviarAsignaciones(asignacionesDeEjemplo())).rejects.toThrow(
      /SMTP_HOST/,
    );
    expect(mocks.createTransport).not.toHaveBeenCalled();
  });
});

describe("enviarAsignaciones (monto sugerido y modo múltiple)", () => {
  beforeEach(() => {
    process.env.SMTP_HOST = "smtp.ejemplo.com";
    mocks.sendMail.mockResolvedValue(undefined);
  });

  it("anuncia el monto sugerido con un solo valor", async () => {
    const { enviarAsignaciones } = await importarMailer();

    await enviarAsignaciones(asignacionesDeEjemplo(), {
      montoSugerido: { minimo: 10 },
    });

    const texto = (mocks.sendMail.mock.calls[0]![0] as { text: string }).text;
    expect(texto).toContain("Monto sugerido del regalo: 10");
    const html = (mocks.sendMail.mock.calls[0]![0] as { html: string }).html;
    expect(html).toContain("Monto sugerido del regalo:");
    expect(html).toMatch(/<strong[^>]*>10<\/strong>/);
  });

  it("anuncia el monto sugerido como rango cuando hay máximo", async () => {
    const { enviarAsignaciones } = await importarMailer();
    const { formatearMonto } = await importarMailer();

    expect(formatearMonto({ minimo: 10, maximo: 20 })).toBe("entre 10 y 20");

    await enviarAsignaciones(asignacionesDeEjemplo(), {
      montoSugerido: { minimo: 10, maximo: 20 },
    });

    const texto = (mocks.sendMail.mock.calls[0]![0] as { text: string }).text;
    expect(texto).toContain("Monto sugerido del regalo: entre 10 y 20");
  });

  it("sin monto sugerido no se menciona el monto en el correo", async () => {
    const { enviarAsignaciones } = await importarMailer();

    await enviarAsignaciones(asignacionesDeEjemplo(), {});

    const texto = (mocks.sendMail.mock.calls[0]![0] as { text: string }).text;
    expect(texto).not.toContain("Monto sugerido");
  });

  it("en modo múltiple agrupa todos los amigos secretos en un correo por emisor", async () => {
    const { enviarAsignaciones } = await importarMailer();

    // Ana regala a Berto y a Carla; Berto, a Ana y a Carla; Carla, a Ana y a Berto.
    const ana = { nombre: "Ana", correo: "ana@ejemplo.com" };
    const berto = { nombre: "Berto", correo: "berto@ejemplo.com" };
    const carla = { nombre: "Carla", correo: "carla@ejemplo.com" };
    const asignaciones: Asignacion[] = [
      { de: ana, para: berto },
      { de: ana, para: carla },
      { de: berto, para: ana },
      { de: berto, para: carla },
      { de: carla, para: ana },
      { de: carla, para: berto },
    ];

    const enviados = await enviarAsignaciones(asignaciones);

    // Tres emisores, puesto que cada uno da exactamente 2 regalos → 3 correos.
    expect(enviados).toBe(3);
    expect(mocks.sendMail).toHaveBeenCalledTimes(3);

    const texto = (mocks.sendMail.mock.calls[0]![0] as { text: string }).text;
    expect(texto).toContain("Hola Ana:");
    expect(texto).toContain("Tus amigos secretos son:\nBerto\nCarla");
    expect(texto).not.toContain("Te toca regalar a:");
  });

  it("no mezcla asignaciones de otros emisores tampoco en modo múltiple", async () => {
    const { enviarAsignaciones } = await importarMailer();

    const ana = { nombre: "Ana", correo: "ana@ejemplo.com" };
    const berto = { nombre: "Berto", correo: "berto@ejemplo.com" };
    const carla = { nombre: "Carla", correo: "carla@ejemplo.com" };
    await enviarAsignaciones([
      { de: ana, para: berto },
      { de: ana, para: carla },
      { de: berto, para: ana },
      { de: berto, para: carla },
    ]);

    const textos = mocks.sendMail.mock.calls.map(
      (c) => (c[0] as { to: string; text: string }),
    );
    expect(textos[0]!.to).toBe("ana@ejemplo.com");
    expect(textos[0]!.text).toContain("Tus amigos secretos son:\nBerto\nCarla");
    expect(textos[1]!.to).toBe("berto@ejemplo.com");
    expect(textos[1]!.text).toContain("Tus amigos secretos son:\nAna\nCarla");
  });
});

describe("plantilla del correo", () => {
  beforeEach(() => {
    process.env.SMTP_HOST = "smtp.ejemplo.com";
    mocks.sendMail.mockResolvedValue(undefined);
  });

  it("el asunto y el cuerpo no contienen emojis", async () => {
    const { enviarAsignaciones } = await importarMailer();

    await enviarAsignaciones(asignacionesDeEjemplo(), {
      montoSugerido: { minimo: 10 },
    });

    const correo = mocks.sendMail.mock.calls[0]![0] as {
      subject: string;
      text: string;
      html: string;
    };
    // Cualquier símbolo pictográfico de la gama de emojis queda excluido.
    const emoji = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;
    expect(correo.subject).not.toMatch(emoji);
    expect(correo.text).not.toMatch(emoji);
    expect(correo.html).not.toMatch(emoji);
  });

  it("escapa el HTML en los nombres de los participantes", async () => {
    const { enviarAsignaciones } = await importarMailer();

    const malicioso = { nombre: "<b>Azul & Cía</b>", correo: "azul@ejemplo.com" };
    await enviarAsignaciones([{ de: malicioso, para: { nombre: "Berto", correo: "berto@ejemplo.com" } }]);

    const correo = mocks.sendMail.mock.calls[0]![0] as {
      to: string;
      text: string;
      html: string;
    };
    // El HTML muestra el nombre como texto, no como marcado inyectado.
    expect(correo.html).toContain("&lt;b&gt;Azul &amp; Cía&lt;/b&gt;");
    expect(correo.html).not.toContain("<b>Azul");
    expect(correo.html).not.toMatch(/<(?!\/?(?:p|strong|table|tr|td|html|body|!DOCTYPE)\b)[a-zA-Z]/);
    // El texto plano conserva el nombre tal cual.
    expect(correo.text).toContain("<b>Azul & Cía</b>");
    expect(correo.to).toBe("azul@ejemplo.com");
  });

  it("el HTML lleva la estructura de marca de la aplicación", async () => {
    const { enviarAsignaciones } = await importarMailer();

    await enviarAsignaciones(asignacionesDeEjemplo().slice(0, 1));

    const html = (mocks.sendMail.mock.calls[0]![0] as { html: string }).html;
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("lang=\"es\"");
    // Cabecera roja de marca, tarjeta de asignación y pie de privacidad.
    expect(html).toContain("background-color:#dc2626");
    expect(html).toContain("Amigo Secreto");
    expect(html).toContain("background-color:#ffe4e6");
    expect(html).toContain(
      "Los correos se usan únicamente para enviar la asignación; no se guarda ninguna información en el servidor.",
    );
  });
});
