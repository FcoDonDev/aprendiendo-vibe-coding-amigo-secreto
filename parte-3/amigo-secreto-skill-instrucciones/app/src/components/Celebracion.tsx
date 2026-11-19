"use client";

import { useEffect, useMemo } from "react";

const COLORES_CONFETI = ["#dc2626", "#d97706", "#ec4899", "#fbbf24", "#f472b6"];
const PIEZAS = 40;
const DURACION_MS = 2800;

interface Props {
  /** true mientras dura la celebración tras un sorteo exitoso. */
  activo: boolean;
  /** Avisa cuando la celebración termina (automáticamente o por timeout). */
  alTerminar: () => void;
}

/**
 * Momento revelación: capa de confeti que cae tras un sorteo exitoso.
 * Es puramente decorativa (aria-hidden, sin capturar puntero) y desaparece
 * sola; con `prefers-reduced-motion` las piezas se ocultan por CSS.
 *
 * Las posiciones se calculan de forma determinista con aritmética modular:
 * mismos valores en servidor y cliente (hidratación sin desajuste), sin
 * `Math.random()` durante el prerender y sin estado que sincronizar.
 */
export default function Celebracion({ activo, alTerminar }: Props) {
  const piezas = useMemo(
    () =>
      Array.from({ length: PIEZAS }, (_, i) => ({
        id: i,
        izquierda: `${(i * 53 + 7) % 100}%`,
        retraso: `${(i % 9) * 0.09}s`,
        duracion: `${1.9 + ((i * 7) % 11) * 0.1}s`,
        color: COLORES_CONFETI[i % COLORES_CONFETI.length]!,
      })),
    [],
  );

  // La celebración termina sola tras DURACION_MS.
  useEffect(() => {
    if (!activo) return;
    const temporizador = setTimeout(alTerminar, DURACION_MS);
    return () => clearTimeout(temporizador);
  }, [activo, alTerminar]);

  if (!activo) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
    >
      {piezas.map((pieza) => (
        <span
          key={pieza.id}
          className="pieza-confeti"
          style={{
            left: pieza.izquierda,
            backgroundColor: pieza.color,
            ["--retraso" as string]: pieza.retraso,
            ["--duracion" as string]: pieza.duracion,
          }}
        />
      ))}
    </div>
  );
}
