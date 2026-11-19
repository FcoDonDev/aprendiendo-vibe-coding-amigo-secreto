import { Gift } from "@phosphor-icons/react/dist/ssr";
import SorteoApp from "@/components/SorteoApp";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-10 pb-10 sm:pt-14">
      <header className="mb-10 text-center">
        <span
          aria-hidden="true"
          className="mx-auto mb-4 flex size-16 items-center justify-center rounded-3xl bg-regalo text-white shadow-lg shadow-regalo/30 rotate-[-6deg]"
        >
          <Gift weight="fill" className="size-9" />
        </span>
        <h1 className="font-titulos text-4xl font-semibold tracking-tight text-tinta sm:text-5xl">
          Amigo Secreto
        </h1>
        <p className="mx-auto mt-3 max-w-md text-tinta-suave">
          Registra a los participantes, haz el sorteo y recibe cada asignación
          por correo.
        </p>
      </header>
      <SorteoApp />
    </main>
  );
}
