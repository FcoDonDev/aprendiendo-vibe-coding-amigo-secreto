import SorteoApp from "@/components/SorteoApp";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">🎅 Amigo Secreto</h1>
        <p className="mt-2 text-zinc-600">
          Registra a los participantes, haz el sorteo y recibe cada asignación
          por correo.
        </p>
      </header>
      <SorteoApp />
    </main>
  );
}
