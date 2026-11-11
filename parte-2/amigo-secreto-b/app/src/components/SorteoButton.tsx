"use client";

interface Props {
  deshabilitado: boolean;
  cargando: boolean;
  alLanzar: () => void;
}

/** Botón que dispara el sorteo y el envío de correos. */
export default function SorteoButton({ deshabilitado, cargando, alLanzar }: Props) {
  return (
    <button
      type="button"
      onClick={alLanzar}
      disabled={deshabilitado || cargando}
      className="rounded-md bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow transition enabled:hover:bg-emerald-700 enabled:active:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
    >
      {cargando ? "Sorteando y enviando correos…" : "🎁 Realizar sorteo"}
    </button>
  );
}
