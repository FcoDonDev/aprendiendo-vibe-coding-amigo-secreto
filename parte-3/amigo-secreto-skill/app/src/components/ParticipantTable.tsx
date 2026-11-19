"use client";

import { Trash, Users } from "@phosphor-icons/react";
import type { Participante } from "@/components/ParticipantForm";

interface Props {
  participantes: Participante[];
  alEliminar: (indice: number) => void;
}

/** Inicial visible para el avatar del participante (o "?" si el nombre es vacío). */
function inicial(nombre: string): string {
  const recortado = nombre.trim();
  return recortado === "" ? "?" : recortado[0]!.toUpperCase();
}

/** Lista de participantes registrados con avatar de inicial, cada uno eliminable. */
export default function ParticipantTable({ participantes, alEliminar }: Props) {
  if (participantes.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-tinta-suave">
        <Users aria-hidden="true" weight="fill" className="size-4 text-oro" />
        Aún no hay participantes. Agrega al menos 2 para poder sortear.
      </p>
    );
  }

  return (
    <div>
      <ul className="divide-y divide-caramelo">
        {participantes.map((p, indice) => (
          <li key={`${p.correo}-${indice}`} className="flex items-center gap-3 py-2.5">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-oro-suave text-sm font-bold text-oro"
            >
              {inicial(p.nombre)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{p.nombre}</p>
              <p className="truncate text-sm text-tinta-suave">{p.correo}</p>
            </div>
            <button
              type="button"
              onClick={() => alEliminar(indice)}
              className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-regalo transition hover:bg-regalo-suave focus-visible:ring-2 focus-visible:ring-regalo focus-visible:outline-none"
              aria-label={`Eliminar a ${p.nombre}`}
            >
              <Trash aria-hidden="true" weight="fill" className="size-3.5" />
              Eliminar
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-tinta-suave">
        {participantes.length} participante{participantes.length !== 1 && "s"}
      </p>
    </div>
  );
}
