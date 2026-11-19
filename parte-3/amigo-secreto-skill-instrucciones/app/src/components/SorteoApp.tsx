"use client";

import { useEffect, useRef, useState } from "react";
import ParticipantForm, {
  type Participante,
} from "@/components/ParticipantForm";
import ParticipantTable from "@/components/ParticipantTable";
import ConfiguracionSorteo, {
  esConfiguracionValida,
  type EstadoConfig,
} from "@/components/ConfiguracionSorteo";
import Exclusiones from "@/components/Exclusiones";
import SorteoButton from "@/components/SorteoButton";
import Celebracion from "@/components/Celebracion";
import {
  IconoAdvertencia,
  IconoAjustes,
  IconoChispa,
  IconoRegalo,
  IconoSobre,
  IconoUsuarios,
} from "@/components/iconos";
import type { Exclusion } from "@/lib/sorteo";

type EstadoMensaje =
  | { tipo: "exito"; texto: string }
  | { tipo: "error"; texto: string }
  | null;

const PASOS = [
  { id: "paso-participantes", etiqueta: "Participantes" },
  { id: "paso-opciones", etiqueta: "Opciones del sorteo" },
  { id: "paso-sorteo", etiqueta: "Sorteo" },
] as const;

/** Clave canónica de un par de correos, sin distinguir mayúsculas/minúsculas. */
function clavePar(correo1: string, correo2: string): string {
  const a = correo1.toLowerCase();
  const b = correo2.toLowerCase();
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** Número válido (> 0) desde el texto crudo del formulario, o undefined. */
function aMonto(crudo: string): number | undefined {
  if (crudo.trim() === "") return undefined;
  const valor = Number(crudo);
  return Number.isFinite(valor) && valor > 0 ? valor : undefined;
}

/** Encabezado de bloque: icono temático + numeración + título. */
function EncabezadoSeccion({
  numero,
  titulo,
  icono,
}: {
  numero: number;
  titulo: string;
  icono: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-superficie-suave text-primario"
      >
        {icono}
      </span>
      <h2 className="font-display text-xl font-semibold text-texto">
        <span aria-hidden="true" className="mr-1 text-texto-suave">
          {numero}.
        </span>
        {titulo}
      </h2>
    </div>
  );
}

/** Clase común de los bloques destacados del flujo. */
const CLASES_BLOQUE =
  "scroll-mt-20 rounded-tarjeta border border-borde bg-superficie p-6 shadow-tarjeta sm:p-8";

/** Orquesta el flujo completo: agregar participantes → opciones → sortear. */
export default function SorteoApp() {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [config, setConfig] = useState<EstadoConfig>({
    tipo: "individual",
    cantidadAmigos: 2,
    montoMinimo: "",
    montoMaximo: "",
  });
  const [exclusiones, setExclusiones] = useState<Exclusion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<EstadoMensaje>(null);
  const [celebrando, setCelebrando] = useState(false);
  const referenciaMensaje = useRef<HTMLParagraphElement>(null);

  const configValida = esConfiguracionValida(config, participantes.length);

  // Tras un sorteo exitoso el anuncio debe ser visible y anunciado: se mueve
  // el foco al banner y se desplaza la vista hacia él.
  useEffect(() => {
    if (mensaje?.tipo !== "exito" || !referenciaMensaje.current) return;
    referenciaMensaje.current.focus();
    if (typeof referenciaMensaje.current.scrollIntoView === "function") {
      referenciaMensaje.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [mensaje]);

  function agregar(p: Participante): string | null {
    const duplicado = participantes.some(
      (x) => x.correo.toLowerCase() === p.correo.toLowerCase(),
    );
    if (duplicado) {
      return "Ese correo ya está registrado.";
    }
    setParticipantes((prev) => [...prev, p]);
    setMensaje(null);
    return null;
  }

  function eliminar(indice: number) {
    const eliminado = participantes[indice];
    setParticipantes((prev) => prev.filter((_, i) => i !== indice));
    // Las exclusiones que citaban al eliminado ya no tienen sentido.
    if (eliminado) {
      setExclusiones((prev) =>
        prev.filter(
          (e) =>
            e.correo1.toLowerCase() !== eliminado.correo.toLowerCase() &&
            e.correo2.toLowerCase() !== eliminado.correo.toLowerCase(),
        ),
      );
    }
    setMensaje(null);
  }

  function actualizarConfig(actualizacion: Partial<EstadoConfig>) {
    setConfig((prev) => ({ ...prev, ...actualizacion }));
    setMensaje(null);
  }

  function agregarExclusion(correo1: string, correo2: string): string | null {
    if (correo1.toLowerCase() === correo2.toLowerCase()) {
      return "No se puede excluir a un participante consigo mismo.";
    }
    const clave = clavePar(correo1, correo2);
    if (exclusiones.some((e) => clavePar(e.correo1, e.correo2) === clave)) {
      return "Esa exclusión ya está definida.";
    }
    setExclusiones((prev) => [...prev, { correo1, correo2 }]);
    setMensaje(null);
    return null;
  }

  function eliminarExclusion(indice: number) {
    setExclusiones((prev) => prev.filter((_, i) => i !== indice));
    setMensaje(null);
  }

  /** Arma el objeto `opciones` solo con las elecciones definidas. */
  function construirOpciones() {
    const minimo = aMonto(config.montoMinimo);
    const maximo = aMonto(config.montoMaximo);
    const opciones: Record<string, unknown> = {
      tipo: config.tipo,
      exclusiones,
    };
    if (config.tipo === "multiple") {
      opciones.cantidadAmigos = config.cantidadAmigos;
    }
    if (minimo !== undefined || maximo !== undefined) {
      opciones.montoSugerido = {
        ...(minimo !== undefined ? { minimo } : {}),
        ...(maximo !== undefined ? { maximo } : {}),
      };
    }
    return opciones;
  }

  async function lanzarSorteo() {
    setCargando(true);
    setMensaje(null);
    setCelebrando(false);
    try {
      const respuesta = await fetch("/api/sorteo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantes, opciones: construirOpciones() }),
      });
      const cuerpo = await respuesta.json();

      if (!respuesta.ok) {
        setMensaje({
          tipo: "error",
          texto: cuerpo.error ?? "Ocurrió un error inesperado.",
        });
      } else {
        setMensaje({
          tipo: "exito",
          texto: `¡Sorteo realizado! Se enviaron ${cuerpo.enviados} correos con las asignaciones.`,
        });
        setCelebrando(true);
        setParticipantes([]);
        setExclusiones([]);
      }
    } catch {
      setMensaje({
        tipo: "error",
        texto: "No se pudo contactar al servidor. Vuelve a intentarlo.",
      });
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      {/* Barra fija de pasos: orientación sin bloquear el contenido. */}
      <nav
        aria-label="Pasos del sorteo"
        className="sticky top-0 z-30 -mx-4 mb-8 border-b border-borde bg-fondo/85 px-4 py-2.5 backdrop-blur"
      >
        <ol className="mx-auto flex max-w-2xl items-center justify-center gap-1 sm:gap-3">
          {PASOS.map((paso, indice) => (
            <li key={paso.id} className="flex items-center">
              <a
                href={`#${paso.id}`}
                className="flex cursor-pointer items-center gap-2 rounded-pildora px-3 py-1.5 text-sm font-medium text-texto-suave transition-colors duration-200 hover:bg-superficie-suave hover:text-texto outline-none focus-visible:ring-2 focus-visible:ring-foco"
              >
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-superficie-suave text-xs font-bold text-primario"
                >
                  {indice + 1}
                </span>
                <span className="hidden sm:inline">{paso.etiqueta}</span>
              </a>
              {indice < PASOS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="mx-1 hidden h-px w-4 bg-borde-fuerte sm:block"
                />
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-8">
        {/* 1. Participantes: alta en línea + lista de tarjetas. */}
        <section id="paso-participantes" className={CLASES_BLOQUE}>
          <EncabezadoSeccion
            numero={1}
            titulo="Participantes"
            icono={<IconoUsuarios className="h-5 w-5" />}
          />
          <ParticipantForm alAgregar={agregar} />
          <div className="mt-6 border-t border-borde pt-5">
            <ParticipantTable participantes={participantes} alEliminar={eliminar} />
          </div>
        </section>

        {/* 2. Opciones: configuración del sorteo + exclusiones. */}
        <section id="paso-opciones" className={CLASES_BLOQUE}>
          <EncabezadoSeccion
            numero={2}
            titulo="Opciones del sorteo"
            icono={<IconoAjustes className="h-5 w-5" />}
          />
          <ConfiguracionSorteo
            config={config}
            numParticipantes={participantes.length}
            alActualizar={actualizarConfig}
          />
          <div className="mt-6 border-t border-borde pt-5">
            <h3 className="mb-1 text-sm font-semibold text-texto">
              Exclusiones (opcional)
            </h3>
            <p className="mb-4 text-sm text-texto-suave">
              Define parejas que no pueden tocarse entre sí (parejas,
              familiares directos, etc.). La exclusión vale en ambas
              direcciones del regalo.
            </p>
            <Exclusiones
              participantes={participantes}
              exclusiones={exclusiones}
              alAgregar={agregarExclusion}
              alEliminar={eliminarExclusion}
            />
          </div>
        </section>

        {/* 3. Sorteo: protagonista con el CTA y el anuncio del resultado. */}
        <section id="paso-sorteo" className={CLASES_BLOQUE}>
          <EncabezadoSeccion
            numero={3}
            titulo="Sorteo"
            icono={<IconoRegalo className="h-5 w-5" />}
          />

          {mensaje && (
            <p
              ref={referenciaMensaje}
              tabIndex={-1}
              aria-live="polite"
              className={`mb-5 flex items-start gap-2 rounded-control border px-4 py-3 text-sm outline-none ${
                mensaje.tipo === "exito"
                  ? "border-exito-texto/30 bg-exito-fondo text-exito-texto"
                  : "border-peligro-borde bg-peligro-fondo text-peligro"
              }`}
            >
              {mensaje.tipo === "exito" ? (
                <IconoChispa className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <IconoAdvertencia className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{mensaje.texto}</span>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <SorteoButton
              deshabilitado={!configValida}
              cargando={cargando}
              alLanzar={lanzarSorteo}
            />
            {participantes.length < 2 && (
              <span className="text-sm text-texto-suave">
                Se necesitan al menos 2 participantes para sortear.
              </span>
            )}
            {participantes.length >= 2 && !configValida && (
              <span className="text-sm text-peligro">
                Revisa la configuración: hay opciones incompletas o sin sentido
                con la lista de participantes actual.
              </span>
            )}
          </div>
          <p className="mt-3 flex items-start gap-2 text-sm text-texto-suave">
            <IconoSobre
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-acentuado"
            />
            <span>
              {config.tipo === "multiple" && configValida
                ? `Cada persona regalará y recibirá exactamente ${config.cantidadAmigos} regalos, a personas distintas y sin repetir parejas.`
                : "Nadie recibirá su propio nombre y cada persona regalará y recibirá exactamente una vez."}{" "}
              Si definiste exclusiones, el sorteo las respeta; si con ellas no
              existe reparto posible, la API lo avisará sin enviar nada. Cada
              participante recibirá su asignación por correo, mostrando
              únicamente a quién le toca regalar.
            </span>
          </p>
        </section>
      </div>

      <Celebracion activo={celebrando} alTerminar={() => setCelebrando(false)} />
    </div>
  );
}
