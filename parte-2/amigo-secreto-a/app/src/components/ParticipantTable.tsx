"use client";

import type { Participante } from "@/components/ParticipantForm";

interface Props {
  participantes: Participante[];
  alEliminar: (indice: number) => void;
}

/** Tabla de participantes registrados, cada uno eliminable. */
export default function ParticipantTable({ participantes, alEliminar }: Props) {
  if (participantes.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Aún no hay participantes. Agrega al menos 2 para poder sortear.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500">
            <th className="py-2 pr-4">#</th>
            <th className="py-2 pr-4">Nombre</th>
            <th className="py-2 pr-4">Correo</th>
            <th className="py-2" aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {participantes.map((p, indice) => (
            <tr key={`${p.correo}-${indice}`} className="border-b border-zinc-100">
              <td className="py-2 pr-4 text-zinc-400">{indice + 1}</td>
              <td className="py-2 pr-4 font-medium">{p.nombre}</td>
              <td className="py-2 pr-4 text-zinc-600">{p.correo}</td>
              <td className="py-2 text-right">
                <button
                  type="button"
                  onClick={() => alEliminar(indice)}
                  className="rounded px-2 py-1 text-xs text-red-600 transition hover:bg-red-50"
                  aria-label={`Eliminar a ${p.nombre}`}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-zinc-400">
        {participantes.length} participante{participantes.length !== 1 && "s"}
      </p>
    </div>
  );
}
