"use client";

import type { Participante } from "@/components/ParticipantForm";
import { IconoBasura } from "@/components/iconos";

interface Props {
  participantes: Participante[];
  alEliminar: (indice: number) => void;
}

/**
 * Lista de participantes registrados en formato de tarjetas (mejor que una
 * tabla en pantallas angostas); cada una eliminable con un icono accesible.
 */
export default function ParticipantTable({ participantes, alEliminar }: Props) {
  if (participantes.length === 0) {
    return (
      <p className="text-sm text-texto-suave">
        Aún no hay participantes. Agrega al menos 2 para poder sortear.
      </p>
    );
  }

  return (
    <div>
      <ul className="space-y-2">
        {participantes.map((p, indice) => (
          <li
            key={`${p.correo}-${indice}`}
            className="animar-entrada flex items-center gap-3 rounded-control border border-borde bg-superficie px-3 py-2.5"
            style={{ animationDelay: `${indice * 50}ms` }}
          >
            {/* Avatar con la inicial; decorativo, el nombre ya es texto. */}
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-superficie-suave font-display text-sm font-semibold text-primario"
            >
              {p.nombre.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-texto">{p.nombre}</p>
              <p className="truncate text-sm text-texto-suave">{p.correo}</p>
            </div>
            <span aria-hidden="true" className="text-xs text-texto-suave">
              #{indice + 1}
            </span>
            <button
              type="button"
              onClick={() => alEliminar(indice)}
              aria-label={`Eliminar a ${p.nombre}`}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-control text-peligro transition-colors duration-200 hover:bg-peligro-fondo outline-none focus-visible:ring-2 focus-visible:ring-foco focus-visible:ring-offset-2 focus-visible:ring-offset-fondo"
            >
              <IconoBasura className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-texto-suave">
        {participantes.length} participante{participantes.length !== 1 && "s"}
      </p>
    </div>
  );
}
