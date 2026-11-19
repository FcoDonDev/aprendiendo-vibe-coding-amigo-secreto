"use client";

import { IconoLuna, IconoSol } from "@/components/iconos";

/**
 * Alternador de tema claro/oscuro. Opera sobre la clase `dark` en <html> y
 * persiste la elección en localStorage; el valor inicial lo aplica un script
 * temprano en el layout (también respeta `prefers-color-scheme` la primera vez).
 * Los dos iconos se muestran/ocultan por CSS según el tema activo, así el
 * componente no depende de estado de React ni sufre desajuste de hidratación.
 */
export default function AlternarTema() {
  function alternar() {
    const oscuro = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("tema", oscuro ? "oscuro" : "claro");
    } catch {
      // Sin almacenamiento disponible: el tema solo cambia en esta visita.
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label="Cambiar entre modo claro y oscuro"
      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-control border border-borde bg-superficie text-texto-suave transition-colors duration-200 hover:bg-superficie-suave hover:text-texto outline-none focus-visible:ring-2 focus-visible:ring-foco focus-visible:ring-offset-2 focus-visible:ring-offset-fondo"
    >
      {/* Luna visible en claro (cambia a oscuro), sol visible en oscuro. */}
      <IconoLuna className="h-5 w-5 dark:hidden" />
      <IconoSol className="hidden h-5 w-5 dark:block" />
    </button>
  );
}
