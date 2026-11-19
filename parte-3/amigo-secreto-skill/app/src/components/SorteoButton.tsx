"use client";

import { Gift, SpinnerGap } from "@phosphor-icons/react";

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
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-regalo px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-regalo/25 transition enabled:hover:bg-regalo-oscuro enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none focus-visible:ring-2 focus-visible:ring-regalo focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      {cargando ? (
        <>
          <SpinnerGap
            aria-hidden="true"
            weight="bold"
            className="size-4 animate-spin"
          />
          Sorteando y enviando correos…
        </>
      ) : (
        <>
          <Gift aria-hidden="true" weight="fill" className="size-4" />
          Realizar sorteo
        </>
      )}
    </button>
  );
}
