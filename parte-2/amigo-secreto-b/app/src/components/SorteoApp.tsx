"use client";

import { useState } from "react";
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
    <div className="space-y-8">
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">1. Agrega participantes</h2>
        <ParticipantForm alAgregar={agregar} />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">2. Lista de participantes</h2>
        <ParticipantTable participantes={participantes} alEliminar={eliminar} />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">3. Exclusiones (opcional)</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Define parejas que no pueden tocarse entre sí (parejas, familiares
          directos, etc.). La exclusión vale en ambas direcciones del regalo.
        </p>
        <Exclusiones
          participantes={participantes}
          exclusiones={exclusiones}
          alAgregar={agregarExclusion}
          alEliminar={eliminarExclusion}
        />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">
          4. Configuración del sorteo
        </h2>
        <ConfiguracionSorteo
          config={config}
          numParticipantes={participantes.length}
          alActualizar={actualizarConfig}
        />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">5. Sorteo</h2>
        <div className="flex flex-wrap items-center gap-4">
          <SorteoButton
            deshabilitado={!configValida}
            cargando={cargando}
            alLanzar={lanzarSorteo}
          />
          {participantes.length < 2 && (
            <span className="text-sm text-zinc-500">
              Se necesitan al menos 2 participantes para sortear.
            </span>
          )}
          {participantes.length >= 2 && !configValida && (
            <span className="text-sm text-red-600">
              Revisa la configuración: hay opciones incompletas o sin sentido
              con la lista de participantes actual.
            </span>
          )}
        </div>
        <p className="mt-3 text-sm text-zinc-500">
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
                ? "mt-4 rounded-md bg-emerald-50 px-4 py-2 text-sm text-emerald-700"
                : "mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700"
            }
          >
            {mensaje.texto}
          </p>
        )}
      </section>
    </div>
  );
}
