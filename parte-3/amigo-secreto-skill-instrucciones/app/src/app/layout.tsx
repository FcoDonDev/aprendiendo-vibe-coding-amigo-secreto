import type { Metadata } from "next";
import Script from "next/script";
import { Fredoka, Nunito_Sans } from "next/font/google";
import "./globals.css";

// Fuentes auto-alojadas por next/font (sin solicitudes a terceros en runtime).
const fuenteDisplay = Fredoka({
  subsets: ["latin"],
  variable: "--fuente-display",
});

const fuenteCuerpo = Nunito_Sans({
  subsets: ["latin"],
  variable: "--fuente-cuerpo",
});

/** Aplica el tema guardado (o el del sistema) antes del primer pintado. */
const TEMA_INICIAL = `(function(){try{var t=localStorage.getItem("tema");var o=t?t==="oscuro":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",o);}catch(e){}})();`;

export const metadata: Metadata = {
  title: "Amigo Secreto",
  description:
    "Organiza un sorteo de amigo secreto: registra participantes, haz el sorteo y envía las asignaciones por correo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      // El script puede añadir la clase `dark` al <html> antes de hidratar.
      suppressHydrationWarning
      className={`${fuenteDisplay.variable} ${fuenteCuerpo.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-fondo font-sans text-texto">
        <Script
          id="tema-inicial"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: TEMA_INICIAL }}
        />
        {children}
      </body>
    </html>
  );
}
