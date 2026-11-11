"use client";

import { useState } from "react";
import type { Participante } from "@/components/ParticipantForm";

export interface ConfiguracionSorteo {
  /** Monto sugerido del regalo; null = sin definir. */
  montoSugerido: number | null;
  /** Cantidad de amigos secretos por participante (1 = sorteo individual). */
  cantidadAmigos: number;
}

/** Par de participantes que no pueden salir asignados entre sí. */
export interface ExclusionPar {
  correoA: string;
  correoB: string;
}

interface Props {
  participantes: Participante[];
  config: ConfiguracionSorteo;
  exclusiones: ExclusionPar[];
  alCambiarConfig: (config: ConfiguracionSorteo) => void;
  alAgregarExclusion: (correoA: string, correoB: string) => string | null;
  alQuitarExclusion: (indice: number) => void;
}

function nombreDe(participantes: Participante[], correo: string): string {
  return (
    participantes.find((p) => p.correo.toLowerCase() === correo.toLowerCase())
      ?.nombre ?? correo
  );
}

/** Configuración del sorteo: monto sugerido, tipo/cantidad y exclusiones. */
export default function ReglasSorteo({
  participantes,
  config,
  exclusiones,
  alCambiarConfig,
  alAgregarExclusion,
  alQuitarExclusion,
}: Props) {
  const [textoMonto, setTextoMonto] = useState(
    config.montoSugerido === null ? "" : String(config.montoSugerido),
  );
  const [correoA, setCorreoA] = useState("");
  const [correoB, setCorreoB] = useState("");
  const [error, setError] = useState<string | null>(null);

  const multiple = config.cantidadAmigos > 1;
  // Máximo teórico: nadie puede regalar a sí mismo.
  const maximoAmigos = Math.max(2, participantes.length - 1);

  function cambiarMonto(texto: string) {
    setTextoMonto(texto);
    if (texto.trim() === "") {
      alCambiarConfig({ ...config, montoSugerido: null });
      return;
    }
    const numero = Number(texto);
    if (Number.isFinite(numero) && numero > 0) {
      alCambiarConfig({ ...config, montoSugerido: numero });
    }
  }

  function cambiarTipo(multiple: boolean) {
    alCambiarConfig({
      ...config,
      cantidadAmigos: multiple ? Math.max(2, config.cantidadAmigos) : 1,
    });
  }

  function agregarExclusion() {
    if (!correoA || !correoB) {
      setError("Elegí a las dos personas a excluir.");
      return;
    }
    if (correoA.toLowerCase() === correoB.toLowerCase()) {
      setError("Elegí dos personas distintas.");
      return;
    }
    const problema = alAgregarExclusion(correoA, correoB);
    if (problema) {
      setError(problema);
      return;
    }
    setCorreoA("");
    setCorreoB("");
    setError(null);
  }

  return (
    <div className="space-y-6">
      {/* Monto sugerido */}
      <div>
        <label
          htmlFor="monto-sugerido"
          className="mb-1 block text-sm font-medium text-zinc-700"
        >
          Monto sugerido del regalo (opcional)
        </label>
        <input
          id="monto-sugerido"
          type="number"
          min="1"
          step="any"
          placeholder="Ej: 300"
          value={textoMonto}
          onChange={(e) => cambiarMonto(e.target.value)}
          className="max-w-40 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Se incluirá como referencia en el correo de cada participante.
        </p>
      </div>

      {/* Tipo de sorteo */}
      <div>
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Tipo de sorteo
        </span>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="tipo-sorteo"
              checked={!multiple}
              onChange={() => cambiarTipo(false)}
            />
            Individual (tradicional)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="tipo-sorteo"
              checked={multiple}
              onChange={() => cambiarTipo(true)}
            />
            Múltiple
          </label>
        </div>

        {multiple && (
          <div className="mt-3">
            <label
              htmlFor="cantidad-amigos"
              className="mb-1 block text-sm text-zinc-700"
            >
              Cantidad de amigos secretos por persona
            </label>
            <select
              id="cantidad-amigos"
              value={Math.min(config.cantidadAmigos, maximoAmigos)}
              onChange={(e) =>
                alCambiarConfig({ ...config, cantidadAmigos: Number(e.target.value) })
              }
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              {Array.from({ length: maximoAmigos - 1 }, (_, i) => i + 2).map((n) => (
                <option key={n} value={n}>
                  {n} amigos secretos
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-zinc-500">
              Cada participante regalará a {config.cantidadAmigos} personas
              distintas y recibirá exactamente {config.cantidadAmigos} regalos,
              sin asignaciones repetidas.
            </p>
            {participantes.length > 0 && participantes.length < 3 && (
              <p className="mt-1 text-xs text-amber-600">
                El sorteo múltiple necesita al menos 3 participantes.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Exclusiones */}
      <div>
        <span className="mb-1 block text-sm font-medium text-zinc-700">
          Exclusiones (opcional)
        </span>
        <p className="mb-2 text-xs text-zinc-500">
          Pares de participantes que no pueden salir asignados entre sí (parejas,
          familiares directos, etc.).
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={correoA}
            onChange={(e) => {
              setCorreoA(e.target.value);
              setError(null);
            }}
            aria-label="Participante a excluir"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-zinc-100"
            disabled={participantes.length === 0}
          >
            <option value="">Elegir persona…</option>
            {participantes.map((p) => (
              <option key={p.correo} value={p.correo}>
                {p.nombre}
              </option>
            ))}
          </select>
          <span className="text-sm text-zinc-400">↔</span>
          <select
            value={correoB}
            onChange={(e) => {
              setCorreoB(e.target.value);
              setError(null);
            }}
            aria-label="Participante a excluir (contraparte)"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-zinc-100"
            disabled={participantes.length === 0}
          >
            <option value="">Elegir persona…</option>
            {participantes.map((p) => (
              <option key={p.correo} value={p.correo}>
                {p.nombre}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={agregarExclusion}
            disabled={!correoA || !correoB}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition enabled:hover:bg-indigo-700 enabled:active:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            Añadir exclusión
          </button>
        </div>

        {exclusiones.length > 0 && (
          <ul className="mt-3 space-y-1">
            {exclusiones.map((par, indice) => (
              <li
                key={`${par.correoA}-${par.correoB}`}
                className="flex items-center justify-between gap-4 rounded-md bg-zinc-50 px-3 py-1.5 text-sm"
              >
                <span>
                  {nombreDe(participantes, par.correoA)} ↔{" "}
                  {nombreDe(participantes, par.correoB)}
                </span>
                <button
                  type="button"
                  onClick={() => alQuitarExclusion(indice)}
                  className="rounded px-2 py-0.5 text-xs text-red-600 transition hover:bg-red-50"
                  aria-label={`Quitar la exclusión entre ${nombreDe(participantes, par.correoA)} y ${nombreDe(participantes, par.correoB)}`}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p aria-live="polite" className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
