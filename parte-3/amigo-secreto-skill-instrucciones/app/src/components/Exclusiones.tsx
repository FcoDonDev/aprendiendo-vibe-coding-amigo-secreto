"use client";

import { useState } from "react";
import type { Participante } from "@/components/ParticipantForm";
import type { Exclusion } from "@/lib/sorteo";
import { IconoVinculo } from "@/components/iconos";

interface Props {
  participantes: Participante[];
  exclusiones: Exclusion[];
  /** Devuelve el mensaje de error, o null si la exclusión se agregó. */
  alAgregar: (correo1: string, correo2: string) => string | null;
  alEliminar: (indice: number) => void;
}

const CLASES_SELECT =
  "w-full cursor-pointer rounded-control border border-borde-fuerte bg-superficie px-3 py-2 text-sm text-texto outline-none transition-shadow duration-150 focus:ring-2 focus:ring-foco/40 focus:border-acentuado";

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
      <p className="text-sm text-texto-suave">
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
        {/* Nombre + correo en la opción: evita confusión con nombres repetidos. */}
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end">
          <div>
            <label
              htmlFor="exclusion-primera"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-texto-suave"
            >
              Primer participante del par excluido
            </label>
            <select
              id="exclusion-primera"
              value={correo1}
              onChange={(e) => {
                setCorreo1(e.target.value);
                setError(null);
              }}
              className={CLASES_SELECT}
            >
              <option value="">Elegir…</option>
              {participantes.map((p) => (
                <option key={p.correo} value={p.correo}>
                  {p.nombre} ({p.correo})
                </option>
              ))}
            </select>
          </div>
          <IconoVinculo
            aria-hidden="true"
            className="mx-auto mb-2 hidden h-5 w-5 text-acentuado sm:block"
          />
          <div>
            <label
              htmlFor="exclusion-segunda"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-texto-suave"
            >
              Segundo participante del par excluido
            </label>
            <select
              id="exclusion-segunda"
              value={correo2}
              onChange={(e) => {
                setCorreo2(e.target.value);
                setError(null);
              }}
              className={CLASES_SELECT}
            >
              <option value="">Elegir…</option>
              {participantes.map((p) => (
                <option key={p.correo} value={p.correo}>
                  {p.nombre} ({p.correo})
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="h-10 cursor-pointer rounded-control bg-primario px-4 text-sm font-semibold text-sobre-primario transition-colors duration-200 hover:bg-primario-hover outline-none focus-visible:ring-2 focus-visible:ring-foco focus-visible:ring-offset-2 focus-visible:ring-offset-fondo"
          >
            Añadir exclusión
          </button>
        </div>
        <p aria-live="polite" className="min-h-5 text-sm text-peligro">
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
                className="animar-entrada flex items-center justify-between gap-2 rounded-control bg-superficie-suave px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2 font-medium text-texto">
                  {primero}
                  {" "}
                  <IconoVinculo
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-acentuado"
                  />
                  {" "}
                  {segundo}
                </span>
                <button
                  type="button"
                  onClick={() => alEliminar(indice)}
                  aria-label={`Eliminar la exclusión entre ${primero} y ${segundo}`}
                  className="cursor-pointer rounded-control px-3 py-2 text-xs font-semibold text-peligro transition-colors duration-200 hover:bg-peligro-fondo outline-none focus-visible:ring-2 focus-visible:ring-foco"
                >
                  Quitar
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-texto-suave">
          Sin exclusiones: cualquier persona puede recibir a cualquiera.
        </p>
      )}
    </div>
  );
}
