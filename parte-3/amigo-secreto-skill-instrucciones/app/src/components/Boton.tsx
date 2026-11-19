import type { ButtonHTMLAttributes } from "react";

type VarianteBoton = "primario" | "secundario" | "fantasma-peligro";
type TamanoBoton = "normal" | "grande";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primario: acción principal; secundario: acciones de apoyo;
   *  fantasma-peligro: acciones destructivas sin fondo. */
  variante?: VarianteBoton;
  tamaño?: TamanoBoton;
}

const CLASES_VARIANTE: Record<VarianteBoton, string> = {
  primario:
    "bg-primario text-sobre-primario shadow-sm hover:bg-primario-hover disabled:border disabled:border-borde disabled:bg-superficie-suave disabled:text-texto-suave disabled:shadow-none",
  secundario:
    "border border-borde-fuerte bg-superficie text-primario hover:bg-superficie-suave disabled:border-borde disabled:bg-superficie-suave disabled:text-texto-suave",
  "fantasma-peligro":
    "text-peligro hover:bg-peligro-fondo disabled:text-texto-suave disabled:hover:bg-transparent",
};

const CLASES_TAMANO: Record<TamanoBoton, string> = {
  normal: "px-4 py-2 text-sm",
  grande: "px-6 py-3 text-base",
};

/**
 * Botón con variantes tokenizadas: colores semánticos, estados de hover,
 * deshabilitado y foco visibles en ambos temas.
 */
export default function Boton({
  variante = "primario",
  tamaño = "normal",
  className = "",
  type = "button",
  ...resto
}: Props) {
  return (
    <button
      type={type}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-control font-semibold transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-foco focus-visible:ring-offset-2 focus-visible:ring-offset-fondo disabled:cursor-not-allowed ${CLASES_VARIANTE[variante]} ${CLASES_TAMANO[tamaño]} ${className}`}
      {...resto}
    />
  );
}
