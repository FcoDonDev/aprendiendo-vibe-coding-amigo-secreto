"use client";

import { useState } from "react";
import type { Participante } from "@/components/ParticipantForm";
import type { Exclusion } from "@/lib/sorteo";

interface Props {
  participantes: Participante[];
  exclusiones: Exclusion[];
  /** Devuelve el mensaje de error, o null si la exclusión se agregó. */
  alAgregar: (correo1: string, correo2: string) => string | null;
  alEliminar: (indice: number) => void;
}

/** Nombre visible de un participante por su correo (sin mayúsculas/minúsculas). */
function nombreDe(participantes: Participante[], correo: string): string {
  return (
    participantes.find(
      (p) => p.correo.toLowerCase() === correo.toLowerCase(),
    )?.nombre ?? correo
  );
}

/**
 * Sección para registrar pares de participantes que no pueden recibirse como
 * asignación (la exclusión funciona en ambas direcciones).
 */
export default function Exclusiones({
  participantes,
  exclusiones,
  alAgregar,
  alEliminar,
}: Props) {
  const [correo1, setCorreo1] = useState("");
  const [correo2, setCorreo2] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (participantes.length < 2) {
    return (
      <p className="text-sm text-zinc-500">
        Agrega al menos 2 participantes para poder definir exclusiones.
      </p>
    );
  }

  function manejarAgregado(e: React.FormEvent) {
    e.preventDefault();
    if (!correo1 || !correo2) {
      setError("Selecciona a ambas personas del par excluido.");
      return;
    }
    const problema = alAgregar(correo1, correo2);
    if (problema) {
      setError(problema);
      return;
    }
    setCorreo1("");
    setCorreo2("");
    setError(null);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={manejarAgregado} className="space-y-2" noValidate>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Primer participante del par excluido"
            value={correo1}
            onChange={(e) => {
              setCorreo1(e.target.value);
              setError(null);
            }}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            <option value="">Elegir…</option>
            {participantes.map((p) => (
              <option key={p.correo} value={p.correo}>
                {p.nombre}
              </option>
            ))}
          </select>
          <span aria-hidden="true" className="text-sm text-zinc-500">
            ↔
          </span>
          <select
            aria-label="Segundo participante del par excluido"
            value={correo2}
            onChange={(e) => {
              setCorreo2(e.target.value);
              setError(null);
            }}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            <option value="">Elegir…</option>
            {participantes.map((p) => (
              <option key={p.correo} value={p.correo}>
                {p.nombre}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 active:bg-indigo-800"
          >
            Añadir exclusión
          </button>
        </div>
        <p aria-live="polite" className="min-h-5 text-sm text-red-600">
          {error}
        </p>
      </form>

      {exclusiones.length > 0 ? (
        <ul className="space-y-1">
          {exclusiones.map((excluida, indice) => {
            const primero = nombreDe(participantes, excluida.correo1);
            const segundo = nombreDe(participantes, excluida.correo2);
            return (
              <li
                key={`${excluida.correo1}|${excluida.correo2}`}
                className="flex items-center justify-between gap-2 rounded-md bg-zinc-50 px-3 py-2 text-sm"
              >
                <span>
                  {primero} ↔ {segundo}
                </span>
                <button
                  type="button"
                  onClick={() => alEliminar(indice)}
                  className="rounded px-2 py-1 text-xs text-red-600 transition hover:bg-red-50"
                  aria-label={`Eliminar la exclusión entre ${primero} y ${segundo}`}
                >
                  Quitar
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500">
          Sin exclusiones: cualquier persona puede recibir a cualquiera.
        </p>
      )}
    </div>
  );
}
