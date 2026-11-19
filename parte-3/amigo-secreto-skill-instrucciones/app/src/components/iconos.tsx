import type { SVGProps } from "react";

/**
 * Familia de iconos vectorial de la aplicación: todos comparten caja de 24px,
 * trazo de 2px, terminaciones y uniones redondeadas, y se colorean con
 * `currentColor`. Los iconos decorativos deben recibir `aria-hidden="true"`
 * desde quien los usa; los que acompañan texto visible siempre lo son.
 */
function IconoBase(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

/** Regalo con lazo: logotipo y paso de sorteo. */
export function IconoRegalo(props: SVGProps<SVGSVGElement>) {
  return (
    <IconoBase {...props}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </IconoBase>
  );
}

/** Grupo de personas: paso de participantes y modo múltiple. */
export function IconoUsuarios(props: SVGProps<SVGSVGElement>) {
  return (
    <IconoBase {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </IconoBase>
  );
}

/** Controles deslizantes: paso de opciones. */
export function IconoAjustes(props: SVGProps<SVGSVGElement>) {
  return (
    <IconoBase {...props}>
      <path d="M21 4h-7" />
      <path d="M10 4H3" />
      <path d="M21 12h-9" />
      <path d="M8 12H3" />
      <path d="M21 20h-5" />
      <path d="M12 20H3" />
      <path d="M14 2v4" />
      <path d="M8 10v4" />
      <path d="M16 18v4" />
    </IconoBase>
  );
}

/** Sobre: el correo donde llega la asignación. */
export function IconoSobre(props: SVGProps<SVGSVGElement>) {
  return (
    <IconoBase {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </IconoBase>
  );
}

/** Papelera: acciones de eliminación. */
export function IconoBasura(props: SVGProps<SVGSVGElement>) {
  return (
    <IconoBase {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </IconoBase>
  );
}

/** Flecha descendente: ancla del hero hacia el flujo. */
export function IconoFlechaAbajo(props: SVGProps<SVGSVGElement>) {
  return (
    <IconoBase {...props}>
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </IconoBase>
  );
}

/** Sol: acción del alternador para volver al modo claro. */
export function IconoSol(props: SVGProps<SVGSVGElement>) {
  return (
    <IconoBase {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </IconoBase>
  );
}

/** Luna: acción del alternador para activar el modo oscuro. */
export function IconoLuna(props: SVGProps<SVGSVGElement>) {
  return (
    <IconoBase {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </IconoBase>
  );
}

/** Vínculo mutuo: sustituye al símbolo "↔" entre parejas excluidas. */
export function IconoVinculo(props: SVGProps<SVGSVGElement>) {
  return (
    <IconoBase {...props}>
      <path d="M8 3 4 7l4 4" />
      <path d="M4 7h16" />
      <path d="m16 21 4-4-4-4" />
      <path d="M20 17H4" />
    </IconoBase>
  );
}

/** Chispas: celebración y detalles decorativos. */
export function IconoChispa(props: SVGProps<SVGSVGElement>) {
  return (
    <IconoBase {...props}>
      <path d="M9.94 15.5a2 2 0 0 0-1.44-1.44L2.36 12.5a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.56-6.14a.5.5 0 0 1 .96 0L14.02 8.5a2 2 0 0 0 1.44 1.44l6.14 1.56a.5.5 0 0 1 0 .96l-6.14 1.57a2 2 0 0 0-1.44 1.43l-1.56 6.14a.5.5 0 0 1-.96 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
    </IconoBase>
  );
}

/** Triángulo de advertencia: mensajes de error. */
export function IconoAdvertencia(props: SVGProps<SVGSVGElement>) {
  return (
    <IconoBase {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </IconoBase>
  );
}

/** Palomita de verificación: estados seleccionados. */
export function IconoMarcar(props: SVGProps<SVGSVGElement>) {
  return (
    <IconoBase {...props}>
      <path d="M20 6 9 17l-5-5" />
    </IconoBase>
  );
}

/** Cargador circular: estado de ocupado (gira con animate-spin). */
export function IconoCargando(props: SVGProps<SVGSVGElement>) {
  return (
    <IconoBase {...props}>
      <path d="M21 12a9 9 0 1 1-6.22-8.56" />
    </IconoBase>
  );
}
