"use client";

import { useState } from "react";
import { ArrowsLeftRight, Plus, X } from "@phosphor-icons/react";
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
      <p className="text-sm text-tinta-suave">
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
            className="campo w-auto min-w-36 flex-1"
          >
            <option value="">Elegir…</option>
            {participantes.map((p) => (
              <option key={p.correo} value={p.correo}>
                {p.nombre}
              </option>
            ))}
          </select>
          <ArrowsLeftRight
            aria-hidden="true"
            weight="bold"
            className="size-4 shrink-0 text-tinta-suave"
          />
          <select
            aria-label="Segundo participante del par excluido"
            value={correo2}
            onChange={(e) => {
              setCorreo2(e.target.value);
              setError(null);
            }}
            className="campo w-auto min-w-36 flex-1"
          >
            <option value="">Elegir…</option>
            {participantes.map((p) => (
              <option key={p.correo} value={p.correo}>
                {p.nombre}
              </option>
            ))}
          </select>
          <button type="submit" className="boton-accion">
            <Plus aria-hidden="true" weight="bold" className="size-4" />
            Añadir exclusión
          </button>
        </div>
        <p aria-live="polite" className="min-h-5 text-sm text-regalo">
          {error}
        </p>
      </form>

      {exclusiones.length > 0 ? (
        <ul className="space-y-2">
          {exclusiones.map((excluida, indice) => {
            const primero = nombreDe(participantes, excluida.correo1);
            const segundo = nombreDe(participantes, excluida.correo2);
            return (
              <li
                key={`${excluida.correo1}|${excluida.correo2}`}
                aria-label={`${primero} ↔ ${segundo}`}
                className="flex items-center justify-between gap-2 rounded-xl bg-oro-suave/60 px-3 py-2 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-semibold">{primero}</span>
                  <ArrowsLeftRight
                    aria-hidden="true"
                    weight="bold"
                    className="size-3.5 shrink-0 text-oro"
                  />
                  <span className="truncate font-semibold">{segundo}</span>
                </span>
                <button
                  type="button"
                  onClick={() => alEliminar(indice)}
                  className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-regalo transition hover:bg-regalo-suave focus-visible:ring-2 focus-visible:ring-regalo focus-visible:outline-none"
                  aria-label={`Eliminar la exclusión entre ${primero} y ${segundo}`}
                >
                  <X aria-hidden="true" weight="bold" className="size-3.5" />
                  Quitar
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-tinta-suave">
          Sin exclusiones: cualquier persona puede recibir a cualquiera.
        </p>
      )}
    </div>
  );
}
