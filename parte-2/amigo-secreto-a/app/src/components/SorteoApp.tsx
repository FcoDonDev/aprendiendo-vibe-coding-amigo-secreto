"use client";

import { useState } from "react";
import ParticipantForm, {
  type Participante,
} from "@/components/ParticipantForm";
import ParticipantTable from "@/components/ParticipantTable";
import ReglasSorteo, {
  type ConfiguracionSorteo,
  type ExclusionPar,
} from "@/components/ReglasSorteo";
import SorteoButton from "@/components/SorteoButton";

const CONFIG_POR_DEFECTO: ConfiguracionSorteo = {
  montoSugerido: null,
  cantidadAmigos: 1,
};

type EstadoMensaje =
  | { tipo: "exito"; texto: string }
  | { tipo: "error"; texto: string }
  | null;

/** Orquesta el flujo completo: agregar participantes → sortear → enviar correos. */
export default function SorteoApp() {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [config, setConfig] = useState<ConfiguracionSorteo>(CONFIG_POR_DEFECTO);
  const [exclusiones, setExclusiones] = useState<ExclusionPar[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<EstadoMensaje>(null);

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
    const correo = participantes[indice]?.correo.toLowerCase();
    setParticipantes((prev) => prev.filter((_, i) => i !== indice));
    // Una exclusión sin participante no tiene sentido: se descarta.
    if (correo) {
      setExclusiones((prev) =>
        prev.filter(
          (par) =>
            par.correoA.toLowerCase() !== correo &&
            par.correoB.toLowerCase() !== correo,
        ),
      );
    }
    setMensaje(null);
  }

  function agregarExclusion(correoA: string, correoB: string): string | null {
    const [a, b] = [correoA.toLowerCase(), correoB.toLowerCase()].sort();
    const duplicado = exclusiones.some(
      (par) =>
        par.correoA.toLowerCase() === a && par.correoB.toLowerCase() === b,
    );
    if (duplicado) {
      return "Esa exclusión ya está definida.";
    }
    setExclusiones((prev) => [...prev, { correoA, correoB }]);
    setMensaje(null);
    return null;
  }

  function quitarExclusion(indice: number) {
    setExclusiones((prev) => prev.filter((_, i) => i !== indice));
    setMensaje(null);
  }

  // La cantidad elegida debe caber en el grupo actual.
  const cantidadInvalida =
    config.cantidadAmigos > Math.max(1, participantes.length - 1);

  // Con las exclusiones actuales, alguien podría quedarse sin receptores.
  const excluidoDe = (correo: string) =>
    exclusiones.filter(
      (par) =>
        par.correoA.toLowerCase() === correo.toLowerCase() ||
        par.correoB.toLowerCase() === correo.toLowerCase(),
    ).length;
  const exclusionesImposibles = participantes.some(
    (p) =>
      participantes.length - 1 - excluidoDe(p.correo) < config.cantidadAmigos,
  );

  const deshabilitado =
    participantes.length < 2 || cantidadInvalida || exclusionesImposibles;

  const pistaDeshabilitado = cantidadInvalida
    ? `Con ${participantes.length} participante${participantes.length !== 1 ? "s" : ""} solo es posible hasta ${participantes.length - 1} amigo${participantes.length - 1 !== 1 ? "s" : ""} secreto${participantes.length - 1 !== 1 ? "s" : ""} por persona.`
    : exclusionesImposibles
      ? "Las exclusiones actuales hacen imposible el sorteo: alguien no tiene suficientes personas disponibles."
      : null;

  async function lanzarSorteo() {
    setCargando(true);
    setMensaje(null);
    try {
      const respuesta = await fetch("/api/sorteo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantes,
          exclusiones: exclusiones.map((par) => [par.correoA, par.correoB]),
          montoSugerido: config.montoSugerido ?? undefined,
          cantidadAmigos: config.cantidadAmigos,
        }),
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
        <h2 className="mb-4 text-lg font-semibold">3. Reglas del sorteo</h2>
        <ReglasSorteo
          participantes={participantes}
          config={config}
          exclusiones={exclusiones}
          alCambiarConfig={setConfig}
          alAgregarExclusion={agregarExclusion}
          alQuitarExclusion={quitarExclusion}
        />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">4. Sorteo</h2>
        <div className="flex flex-wrap items-center gap-4">
          <SorteoButton
            deshabilitado={deshabilitado}
            cargando={cargando}
            alLanzar={lanzarSorteo}
          />
          {participantes.length < 2 && (
            <span className="text-sm text-zinc-500">
              Se necesitan al menos 2 participantes para sortear.
            </span>
          )}
          {pistaDeshabilitado && (
            <span className="text-sm text-amber-700">{pistaDeshabilitado}</span>
          )}
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          {config.cantidadAmigos === 1
            ? "Nadie recibirá su propio nombre y cada persona regalará y recibirá exactamente una vez. "
            : `Cada persona regalará a ${config.cantidadAmigos} personas distintas y recibirá exactamente ${config.cantidadAmigos} regalos, sin asignaciones repetidas. `}
          Se respetan las exclusiones definidas. Cada participante recibirá su
          asignación por correo, y cada correo mostrará únicamente a quién le
          toca regalar.
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
