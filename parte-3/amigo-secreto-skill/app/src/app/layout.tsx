import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";

/* Tipografías festivas: Fredoka para títulos, Nunito para el cuerpo. */
const titulo = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-titulo",
  display: "swap",
});

const cuerpo = Nunito({
  subsets: ["latin"],
  variable: "--font-cuerpo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Amigo Secreto",
  description:
    "Organiza un sorteo de amigo secreto: registra participantes, haz el sorteo y envía las asignaciones por correo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`h-full antialiased ${titulo.variable} ${cuerpo.variable}`}
    >
      <body className="flex min-h-full flex-col bg-crema font-sans text-tinta">
        {children}
      </body>
    </html>
  );
}
