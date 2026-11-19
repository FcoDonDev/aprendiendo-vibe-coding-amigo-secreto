"use client";

import { useState } from "react";
import { UserPlus } from "@phosphor-icons/react";

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface Participante {
  nombre: string;
  correo: string;
}

interface Props {
  alAgregar: (participante: Participante) => string | null;
}

/** Formulario de alta de participante (nombre + correo) con validación en vivo. */
export default function ParticipantForm({ alAgregar }: Props) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const nombreValido = nombre.trim().length > 0;
  const correoValido = REGEX_CORREO.test(correo.trim());

  function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    if (!nombreValido) {
      setError("Ingresa el nombre del participante.");
      return;
    }
    if (!correoValido) {
      setError("Ingresa un correo válido.");
      return;
    }

    const problema = alAgregar({ nombre: nombre.trim(), correo: correo.trim() });
    if (problema) {
      setError(problema);
      return;
    }

    setNombre("");
    setCorreo("");
    setError(null);
  }

  return (
    <form onSubmit={manejarEnvio} className="space-y-2" noValidate>
      <div className="grid gap-2 sm:grid-cols-[1fr_1.2fr_auto]">
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            setError(null);
          }}
          autoComplete="off"
          className="campo"
          aria-label="Nombre del participante"
        />
        <input
          type="email"
          placeholder="correo@ejemplo.com"
          value={correo}
          onChange={(e) => {
            setCorreo(e.target.value);
            setError(null);
          }}
          autoComplete="off"
          className="campo"
          aria-label="Correo del participante"
        />
        <button type="submit" className="boton-accion">
          <UserPlus aria-hidden="true" weight="bold" className="size-4" />
          Agregar
        </button>
      </div>
      <p aria-live="polite" className="min-h-5 text-sm text-regalo">
        {error}
      </p>
    </form>
  );
}
