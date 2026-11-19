"use client";

import { useRef, useState } from "react";
import Campo from "@/components/Campo";

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface Participante {
  nombre: string;
  correo: string;
}

interface Props {
  alAgregar: (participante: Participante) => string | null;
}

type CampoConError = "nombre" | "correo";
type ErrorFormulario = { campo: CampoConError; texto: string } | null;

/** Formulario de alta de participante (nombre + correo) con validación en vivo. */
export default function ParticipantForm({ alAgregar }: Props) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState<ErrorFormulario>(null);
  const referenciaNombre = useRef<HTMLInputElement>(null);
  const referenciaCorreo = useRef<HTMLInputElement>(null);

  const nombreValido = nombre.trim().length > 0;
  const correoValido = REGEX_CORREO.test(correo.trim());

  function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    if (!nombreValido) {
      setError({ campo: "nombre", texto: "Ingresa el nombre del participante." });
      referenciaNombre.current?.focus();
      return;
    }
    if (!correoValido) {
      setError({ campo: "correo", texto: "Ingresa un correo válido." });
      referenciaCorreo.current?.focus();
      return;
    }

    const problema = alAgregar({ nombre: nombre.trim(), correo: correo.trim() });
    if (problema) {
      setError({ campo: "correo", texto: problema });
      referenciaCorreo.current?.focus();
      return;
    }

    setNombre("");
    setCorreo("");
    setError(null);
  }

  /** Validación al salir del campo: solo cuando ya se escribió algo. */
  function validarAlSalir() {
    if (correo.trim() !== "" && !correoValido) {
      setError({ campo: "correo", texto: "Ingresa un correo válido." });
    }
  }

  const errorNombre = error?.campo === "nombre" ? error.texto : null;
  const errorCorreo = error?.campo === "correo" ? error.texto : null;

  return (
    <form onSubmit={manejarEnvio} className="space-y-3" noValidate>
      <div className="grid gap-3 sm:grid-cols-[1fr_1.2fr_auto] sm:items-end">
        <Campo
          id="nombre-participante"
          etiqueta="Nombre del participante"
          placeholder="Nombre"
          value={nombre}
          error={errorNombre}
          ref={referenciaNombre}
          onChange={(e) => {
            setNombre(e.target.value);
            if (error?.campo === "nombre") setError(null);
          }}
          autoComplete="off"
        />
        <Campo
          id="correo-participante"
          etiqueta="Correo del participante"
          type="email"
          placeholder="correo@ejemplo.com"
          value={correo}
          error={errorCorreo}
          ref={referenciaCorreo}
          onChange={(e) => {
            setCorreo(e.target.value);
            if (error?.campo === "correo") setError(null);
          }}
          onBlur={validarAlSalir}
          autoComplete="off"
        />
        <button
          type="submit"
          className="h-10 cursor-pointer rounded-control bg-primario px-4 text-sm font-semibold text-sobre-primario transition-colors duration-200 hover:bg-primario-hover outline-none focus-visible:ring-2 focus-visible:ring-foco focus-visible:ring-offset-2 focus-visible:ring-offset-fondo"
        >
          Agregar
        </button>
      </div>
    </form>
  );
}
