"use client";

import { useRef, useState, useSyncExternalStore, useTransition } from "react";
import { realizarSorteo, type SorteoResponse } from "@/app/actions";
import type { Asignacion, Participante } from "@/lib/sorteo";

const STORAGE_KEY = "amigo-secreto-participantes";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LISTA_VACIA: Participante[] = [];

// —— Almacén local en el navegador (sin base de datos) ——
let cache: Participante[] | null = null;
const oyentes = new Set<() => void>();

function leerStorage(): Participante[] {
  try {
    const guardado = window.localStorage.getItem(STORAGE_KEY);
    return guardado ? (JSON.parse(guardado) as Participante[]) : LISTA_VACIA;
  } catch {
    return LISTA_VACIA; // dato corrupto: se empieza de cero
  }
}

const almacen = {
  getSnapshot(): Participante[] {
    if (cache === null) cache = leerStorage();
    return cache;
  },
  getServerSnapshot(): Participante[] {
    return LISTA_VACIA;
  },
  guardar(nueva: Participante[]) {
    cache = nueva;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nueva));
    for (const oyente of oyentes) oyente();
  },
  subscribe(oyente: () => void): () => void {
    oyentes.add(oyente);
    return () => oyentes.delete(oyente);
  },
};

function setLista(
  actualizar: (prev: Participante[]) => Participante[],
) {
  almacen.guardar(actualizar(almacen.getSnapshot()));
}

export default function Organizador() {
  const participantes = useSyncExternalStore(
    almacen.subscribe,
    almacen.getSnapshot,
    almacen.getServerSnapshot,
  );
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [avisoForm, setAvisoForm] = useState<string | null>(null);
  const [avisoLista, setAvisoLista] = useState<string[]>([]);
  const [resultado, setResultado] = useState<SorteoResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const correoRef = useRef<HTMLInputElement>(null);

  function agregarParticipante(e: React.FormEvent) {
    e.preventDefault();
    const nombreLimpio = nombre.trim();
    const correoLimpio = correo.trim();

    if (!nombreLimpio) {
      setAvisoForm("Escribe el nombre del participante.");
      return;
    }
    if (!EMAIL_RE.test(correoLimpio)) {
      setAvisoForm("Escribe un correo electrónico válido.");
      return;
    }
    if (
      participantes.some(
        (p) => p.correo.toLowerCase() === correoLimpio.toLowerCase(),
      )
    ) {
      setAvisoForm("Ese correo ya está en la lista.");
      return;
    }

    setLista((prev) => [...prev, { nombre: nombreLimpio, correo: correoLimpio }]);
    setAvisoForm(null);
    setResultado(null);
    setNombre("");
    setCorreo("");
    correoRef.current?.focus();
  }

  function quitarParticipante(index: number) {
    setLista((prev) => prev.filter((_, i) => i !== index));
    setResultado(null);
  }

  function sortear() {
    setAvisoLista([]);
    startTransition(async () => {
      const respuesta = await realizarSorteo(participantes);
      if (!respuesta.ok) {
        setAvisoLista(respuesta.errores);
        setResultado(null);
        return;
      }
      setResultado(respuesta);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Formulario de alta */}
      <form
        onSubmit={agregarParticipante}
        className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]"
      >
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre"
          aria-label="Nombre del participante"
          className="h-11 rounded-lg border border-black/[.08] bg-white px-3 text-base outline-none transition-colors placeholder:text-zinc-400 focus:border-black/[.25] dark:border-white/[.145] dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:focus:border-white/[.35]"
        />
        <input
          ref={correoRef}
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          placeholder="Correo electrónico"
          aria-label="Correo electrónico del participante"
          className="h-11 rounded-lg border border-black/[.08] bg-white px-3 text-base outline-none transition-colors placeholder:text-zinc-400 focus:border-black/[.25] dark:border-white/[.145] dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:focus:border-white/[.35]"
        />
        <button
          type="submit"
          className="h-11 rounded-lg bg-foreground px-5 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Añadir
        </button>
      </form>

      {avisoForm && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {avisoForm}
        </p>
      )}

      {/* Lista de participantes */}
      <section aria-label="Lista de participantes">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">
            Participantes{" "}
            <span className="text-sm font-normal text-zinc-500">
              ({participantes.length})
            </span>
          </h2>
          <span
            className={`text-sm font-medium ${
              participantes.length >= 2
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {participantes.length >= 2
              ? "Listo para sortear"
              : "Se requieren al menos 2 participantes"}
          </span>
        </div>

        {participantes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Aún no hay participantes. Añade al menos dos para poder sortear.
          </p>
        ) : (
          <ul className="divide-y divide-black/[.08] rounded-lg border border-black/[.08] dark:divide-white/[.08] dark:border-white/[.145]">
            {participantes.map((p, i) => (
              <li
                key={`${p.correo}-${i}`}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.nombre}</p>
                  <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                    {p.correo}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => quitarParticipante(i)}
                  aria-label={`Quitar a ${p.nombre}`}
                  className="shrink-0 rounded-md px-2 py-1 text-sm text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Acción de sorteo */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={sortear}
          disabled={isPending || participantes.length < 2}
          className="h-12 w-full rounded-full bg-foreground text-base font-semibold text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-[#ccc] sm:w-[260px]"
        >
          {isPending ? "Sorteando y enviando…" : "🎉 Realizar sorteo"}
        </button>

        {avisoLista.length > 0 && (
          <ul
            role="alert"
            className="list-inside list-disc rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {avisoLista.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Resultado del sorteo */}
      {resultado?.ok && (
        <section
          aria-label="Resultado del sorteo"
          className="flex flex-col gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30"
        >
          <h2 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">
            ¡Sorteo realizado!
          </h2>
          <p className="text-sm text-emerald-800/90 dark:text-emerald-300/90">
            Se enviaron {resultado.entregados} correos, cada uno con la
            asignación exclusiva de su destinatario.
          </p>

          <details className="text-sm">
            <summary className="cursor-pointer select-none font-medium text-emerald-900 dark:text-emerald-200">
              Ver quién le regala a quién (solo para el organizador)
            </summary>
            <ul className="mt-2 divide-y divide-emerald-200/70 dark:divide-emerald-900">
              {resultado.asignaciones.map((a: Asignacion) => (
                <li
                  key={`${a.de.correo}->${a.para.correo}`}
                  className="py-2 text-emerald-900 dark:text-emerald-200"
                >
                  {a.de.nombre} → {a.para.nombre}
                </li>
              ))}
            </ul>
          </details>

          {resultado.fallidos.length > 0 && (
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                No se pudo entregar el correo a:
              </p>
              <ul className="mt-1 list-inside list-disc text-sm text-amber-700 dark:text-amber-300">
                {resultado.fallidos.map((f) => (
                  <li key={f.correo}>
                    {f.correo}: {f.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
