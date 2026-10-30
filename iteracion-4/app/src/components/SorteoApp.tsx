"use client";

import { useState } from "react";
import ParticipantForm, {
  type Participante,
} from "@/components/ParticipantForm";
import ParticipantTable from "@/components/ParticipantTable";
import SorteoButton from "@/components/SorteoButton";

type EstadoMensaje =
  | { tipo: "exito"; texto: string }
  | { tipo: "error"; texto: string }
  | null;

/** Orquesta el flujo completo: agregar participantes → sortear → enviar correos. */
export default function SorteoApp() {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
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
    setParticipantes((prev) => prev.filter((_, i) => i !== indice));
    setMensaje(null);
  }

  async function lanzarSorteo() {
    setCargando(true);
    setMensaje(null);
    try {
      const respuesta = await fetch("/api/sorteo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantes }),
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
        <h2 className="mb-4 text-lg font-semibold">3. Sorteo</h2>
        <div className="flex flex-wrap items-center gap-4">
          <SorteoButton
            deshabilitado={participantes.length < 2}
            cargando={cargando}
            alLanzar={lanzarSorteo}
          />
          {participantes.length < 2 && (
            <span className="text-sm text-zinc-500">
              Se necesitan al menos 2 participantes para sortear.
            </span>
          )}
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          Nadie recibirá su propio nombre y cada persona regalará y recibirá exactamente una vez. Cada participante recibirá su asignación por correo, y cada correo mostrará únicamente a quién le toca regalar.
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
