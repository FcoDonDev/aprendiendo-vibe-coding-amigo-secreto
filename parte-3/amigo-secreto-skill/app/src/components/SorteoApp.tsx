"use client";

import { useState } from "react";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";
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
import type { Exclusion } from "@/lib/sorteo";

type EstadoMensaje =
  | { tipo: "exito"; texto: string }
  | { tipo: "error"; texto: string }
  | null;

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

/** Encabezado de bloque con el número de paso decorativo. */
function TituloBloque({ paso, texto }: { paso: string; texto: string }) {
  return (
    <h2 className="mb-4 flex items-center gap-3 font-titulos text-xl font-semibold">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-regalo-suave text-sm font-bold text-regalo"
      >
        {paso}
      </span>
      {texto}
    </h2>
  );
}

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

  const configValida = esConfiguracionValida(config, participantes.length);

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
    <div className="relative space-y-8 pb-32 sm:pb-0">
      {/* 1 · Participantes: alta y lista en un mismo bloque */}
      <section className="tarjeta">
        <TituloBloque paso="1" texto="Participantes" />
        <ParticipantForm alAgregar={agregar} />
        <div className="my-5 border-t border-caramelo" />
        <ParticipantTable participantes={participantes} alEliminar={eliminar} />
      </section>

      {/* 2 · Opciones: exclusiones y reglas del sorteo */}
      <section className="tarjeta">
        <TituloBloque paso="2" texto="Opciones del sorteo" />
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-x-10">
          <div>
            <h3 className="mb-2 text-sm font-bold tracking-wide text-regalo uppercase">
              Exclusiones (opcional)
            </h3>
            <p className="mb-4 text-sm text-tinta-suave">
              Define parejas que no pueden tocarse entre sí (parejas,
              familiares directos, etc.). La exclusión vale en ambas direcciones
              del regalo.
            </p>
            <Exclusiones
              participantes={participantes}
              exclusiones={exclusiones}
              alAgregar={agregarExclusion}
              alEliminar={eliminarExclusion}
            />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-bold tracking-wide text-regalo uppercase">
              Configuración
            </h3>
            <ConfiguracionSorteo
              config={config}
              numParticipantes={participantes.length}
              alActualizar={actualizarConfig}
            />
          </div>
        </div>
      </section>

      {/* 3 · El sorteo: resumen de reglas y resultado */}
      <section className="tarjeta">
        <TituloBloque paso="3" texto="El sorteo" />
        <p className="text-sm text-tinta-suave">
          {config.tipo === "multiple" && configValida
            ? `Cada persona regalará y recibirá exactamente ${config.cantidadAmigos} regalos, a personas distintas y sin repetir parejas.`
            : "Nadie recibirá su propio nombre y cada persona regalará y recibirá exactamente una vez."}{" "}
          Si definiste exclusiones, el sorteo las respeta; si con ellas no
          existe reparto posible, la API lo avisará sin enviar nada. Cada
          participante recibirá su asignación por correo, mostrando únicamente
          a quién le toca regalar.
        </p>
        {mensaje && (
          <p
            aria-live="polite"
            className={
              mensaje.tipo === "exito"
                ? "mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
                : "mt-4 flex items-start gap-2 rounded-2xl border border-regalo-suave bg-regalo-suave px-4 py-3 text-sm font-medium text-regalo"
            }
          >
            {mensaje.tipo === "exito" ? (
              <CheckCircle
                aria-hidden="true"
                weight="fill"
                className="mt-0.5 size-4 shrink-0"
              />
            ) : (
              <WarningCircle
                aria-hidden="true"
                weight="fill"
                className="mt-0.5 size-4 shrink-0"
              />
            )}
            {mensaje.texto}
          </p>
        )}
      </section>

      {/* CTA del sorteo: barra fija en móvil, cierre del flujo en pantallas grandes */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-caramelo bg-white/95 px-4 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:static sm:rounded-3xl sm:border sm:px-6 sm:py-5 sm:shadow-none">
        <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center gap-x-4 gap-y-2 sm:max-w-none">
          <SorteoButton
            deshabilitado={!configValida}
            cargando={cargando}
            alLanzar={lanzarSorteo}
          />
          {participantes.length < 2 && (
            <span className="text-sm text-tinta-suave">
              Se necesitan al menos 2 participantes para sortear.
            </span>
          )}
          {participantes.length >= 2 && !configValida && (
            <span className="text-sm font-medium text-regalo">
              Revisa la configuración: hay opciones incompletas o sin sentido
              con la lista de participantes actual.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
