import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amigo Secreto",
  description:
    "Organiza un sorteo de amigo secreto: registra participantes, haz el sorteo y envía las asignaciones por correo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-zinc-100 font-sans">
        {children}
      </body>
    </html>
  );
}
