import type { InputHTMLAttributes, Ref } from "react";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  /** Etiqueta visible del campo. */
  etiqueta: string;
  /** Mensaje de error del campo; se anuncia con el input vía aria-describedby. */
  error?: string | null;
  className?: string;
}

/**
 * Campo de texto con etiqueta visible y error conectado por `aria-describedby`.
 * En React 19 el `ref` llega como prop normal y se aplica al input.
 */
export default function Campo({
  id,
  etiqueta,
  error = null,
  className = "",
  ref,
  ...resto
}: Props & { ref?: Ref<HTMLInputElement> }) {
  const idError = `${id}-error`;
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-texto"
      >
        {etiqueta}
      </label>
      <input
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : undefined}
        className={`w-full rounded-control border bg-superficie px-3 py-2 text-sm text-texto outline-none transition-shadow duration-150 placeholder:text-texto-suave/70 focus:ring-2 focus:ring-foco/40 ${
          error
            ? "border-peligro"
            : "border-borde-fuerte focus:border-acentuado"
        }`}
        {...resto}
      />
      {error && (
        <p id={idError} className="mt-1 text-sm text-peligro">
          {error}
        </p>
      )}
    </div>
  );
}
