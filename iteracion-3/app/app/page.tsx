import Organizador from "@/app/components/organizador";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            🎁 Amigo Secreto
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Añade a los participantes, realiza el sorteo y cada persona
            recibirá por correo su asignación — de forma exclusiva y secreta.
          </p>
        </header>

        <Organizador />
      </main>
    </div>
  );
}
