"use client";

import Boton from "@/components/Boton";
import { IconoRegalo, IconoCargando } from "@/components/iconos";

interface Props {
  deshabilitado: boolean;
  cargando: boolean;
  alLanzar: () => void;
}

/** Botón que dispara el sorteo y el envío de correos. */
export default function SorteoButton({ deshabilitado, cargando, alLanzar }: Props) {
  return (
    <Boton
      tamaño="grande"
      onClick={alLanzar}
      disabled={deshabilitado || cargando}
      className="shadow-cta"
    >
      {cargando ? (
        <IconoCargando className="h-5 w-5 animate-spin" />
      ) : (
        <IconoRegalo className="h-5 w-5" />
      )}
      {cargando ? "Sorteando y enviando correos…" : "Realizar sorteo"}
    </Boton>
  );
}
