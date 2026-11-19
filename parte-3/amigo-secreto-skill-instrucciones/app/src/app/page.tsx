import SorteoApp from "@/components/SorteoApp";
import AlternarTema from "@/components/AlternarTema";
import {
  IconoFlechaAbajo,
  IconoRegalo,
  IconoChispa,
} from "@/components/iconos";

/** Página única: encabezado con identidad, flujo del sorteo y nota de privacidad. */
export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16">
        <header className="relative pb-10 pt-6 text-center">
          {/* Alternador de tema en la esquina de la página. */}
          <div className="absolute right-0 top-6">
            <AlternarTema />
          </div>

          {/* Formas decorativas festivas (sin significado, ocultas al lector). */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute -top-4 left-1/4 h-28 w-28 rounded-full bg-acentuado/20 blur-2xl" />
            <div className="absolute right-10 top-16 h-16 w-16 rounded-full bg-oro/25 blur-xl" />
            <div className="absolute left-2 top-28 h-12 w-12 rounded-full bg-primario/15 blur-xl" />
          </div>

          <div className="mx-auto mb-4 mt-10 flex h-16 w-16 rotate-3 items-center justify-center rounded-tarjeta bg-primario text-sobre-primario shadow-tarjeta">
            <IconoRegalo className="h-9 w-9" />
          </div>

          <h1 className="font-display text-4xl font-semibold tracking-tight text-texto sm:text-5xl">
            Amigo Secreto
          </h1>
          <p className="mx-auto mt-3 max-w-md text-texto-suave">
            Registra a los participantes, haz el sorteo y recibe cada
            asignación por correo.
          </p>

          <a
            href="#paso-participantes"
            className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-pildora border border-borde-fuerte bg-superficie px-5 py-2.5 text-sm font-semibold text-primario shadow-sm transition-colors duration-200 hover:bg-superficie-suave outline-none focus-visible:ring-2 focus-visible:ring-foco focus-visible:ring-offset-2 focus-visible:ring-offset-fondo"
          >
            <IconoChispa className="h-4 w-4" aria-hidden="true" />
            Empezar
            <IconoFlechaAbajo className="h-4 w-4" aria-hidden="true" />
          </a>
        </header>

        <SorteoApp />
      </main>

      <footer className="border-t border-borde py-6 text-center text-sm text-texto-suave">
        Los correos se usan únicamente para enviar la asignación; no se guarda
        ninguna información en el servidor.
      </footer>
    </div>
  );
}
