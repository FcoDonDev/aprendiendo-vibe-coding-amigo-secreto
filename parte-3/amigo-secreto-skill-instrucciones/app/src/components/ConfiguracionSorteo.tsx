"use client";

import {
  IconoRegalo,
  IconoUsuarios,
  IconoMarcar,
} from "@/components/iconos";

/** Tipo de sorteo: "individual" (clásico) o "multiple" (varios amigos secretos). */
export type TipoSorteo = "individual" | "multiple";

/** Estado de la configuración editable por el organizador. */
export interface EstadoConfig {
  tipo: TipoSorteo;
  /** Cantidad de amigos secretos por participante (solo si tipo es múltiple). */
  cantidadAmigos: number;
  /** Textos crudos de los campos de monto; "" significa sin definir. */
  montoMinimo: string;
  montoMaximo: string;
}

export const CONFIG_INICIAL: EstadoConfig = {
  tipo: "individual",
  cantidadAmigos: 2,
  montoMinimo: "",
  montoMaximo: "",
};

interface Props {
  config: EstadoConfig;
  numParticipantes: number;
  alActualizar: (actualizacion: Partial<EstadoConfig>) => void;
}

const CLASES_CONTROL = `rounded-control border bg-superficie px-3 py-2 text-sm text-texto outline-none transition-shadow duration-150 focus:ring-2 focus:ring-foco/40`;

/** Numero positivo o NaN/negativo si el texto no es un monto válido. */
function aNumero(crudo: string): number {
  if (crudo.trim() === "") return NaN;
  const valor = Number(crudo);
  return Number.isFinite(valor) ? valor : NaN;
}

/** Indica si el texto es vacío o un monto positivo válido. */
function montoValido(crudo: string): boolean {
  return crudo.trim() === "" || aNumero(crudo) > 0;
}

/**
 * La configuración permite sortear: participantes suficientes, cantidad de
 * amigos secretos en rango y montos numéricamente coherentes.
 */
export function esConfiguracionValida(
  config: EstadoConfig,
  numParticipantes: number,
): boolean {
  if (numParticipantes < 2) return false;
  if (config.tipo === "multiple") {
    const maxima = numParticipantes - 1;
    if (
      !Number.isInteger(config.cantidadAmigos) ||
      config.cantidadAmigos < 2 ||
      config.cantidadAmigos > maxima
    ) {
      return false;
    }
  }
  if (!montoValido(config.montoMinimo) || !montoValido(config.montoMaximo)) {
    return false;
  }
  const minimo = aNumero(config.montoMinimo);
  const maximo = aNumero(config.montoMaximo);
  if (Number.isFinite(minimo) && Number.isFinite(maximo) && minimo > maximo) {
    return false;
  }
  return true;
}

/** Tarjeta seleccionable para un tipo de sorteo (radio nativo + aspecto de tarjeta). */
function TarjetaTipoSorteo({
  valor,
  titulo,
  descripcion,
  seleccionado,
  alSeleccionar,
  icono,
}: {
  valor: TipoSorteo;
  titulo: string;
  descripcion: string;
  seleccionado: boolean;
  alSeleccionar: () => void;
  icono: React.ReactNode;
}) {
  return (
    <label className="group relative block cursor-pointer">
      <input
        type="radio"
        name="tipo-sorteo"
        value={valor}
        checked={seleccionado}
        onChange={alSeleccionar}
        className="sr-only"
      />
      <div className="flex items-start gap-3 rounded-tarjeta border border-borde-fuerte bg-superficie p-4 transition-colors duration-200 group-has-[:checked]:border-primario group-has-[:checked]:bg-superficie-suave group-has-[:focus-visible]:ring-2 group-has-[:focus-visible]:ring-foco">
        {icono}
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-texto">{titulo}</span>
          <span className="block text-sm text-texto-suave">{descripcion}</span>
        </span>
        <IconoMarcar
          className="mt-0.5 h-5 w-5 shrink-0 text-primario opacity-0 transition-opacity duration-200 group-has-[:checked]:opacity-100"
        />
      </div>
    </label>
  );
}

/** Sección de configuración: tipo de sorteo, cantidad y monto sugerido. */
export default function ConfiguracionSorteo({
  config,
  numParticipantes,
  alActualizar,
}: Props) {
  const esMultiple = config.tipo === "multiple";
  const maximaCantidad = numParticipantes - 1;
  const cantidadInvalida =
    esMultiple &&
    (config.cantidadAmigos < 2 || config.cantidadAmigos > maximaCantidad);

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="text-sm font-semibold text-texto">
          Tipo de sorteo
        </legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <TarjetaTipoSorteo
            valor="individual"
            titulo="Individual (clásico)"
            descripcion="Una persona, un regalo"
            seleccionado={config.tipo === "individual"}
            alSeleccionar={() => alActualizar({ tipo: "individual" })}
            icono={<IconoRegalo className="mt-0.5 h-5 w-5 shrink-0 text-primario" aria-hidden="true" />}
          />
          <TarjetaTipoSorteo
            valor="multiple"
            titulo="Multiple"
            descripcion="Cada quien regala a varias personas"
            seleccionado={esMultiple}
            alSeleccionar={() => alActualizar({ tipo: "multiple" })}
            icono={<IconoUsuarios className="mt-0.5 h-5 w-5 shrink-0 text-secundario" aria-hidden="true" />}
          />
        </div>
      </fieldset>

      {esMultiple && (
        <div>
          <label
            htmlFor="cantidad-amigos"
            className="block text-sm font-medium text-texto"
          >
            Cantidad de amigos secretos por participante
          </label>
          <input
            id="cantidad-amigos"
            type="number"
            min={2}
            max={maximaCantidad > 1 ? maximaCantidad : 2}
            value={config.cantidadAmigos}
            aria-invalid={cantidadInvalida || undefined}
            aria-describedby={
              cantidadInvalida ? "cantidad-amigos-error" : undefined
            }
            onChange={(e) =>
              alActualizar({ cantidadAmigos: Number(e.target.value) })
            }
            className={`${CLASES_CONTROL} mt-1 w-40 border-borde-fuerte focus:border-acentuado`}
          />
          {cantidadInvalida && (
            <p
              id="cantidad-amigos-error"
              aria-live="polite"
              className="mt-1 text-sm text-peligro"
            >
              La cantidad debe estar entre 2 y la cantidad de participantes
              menos uno (hoy: {Math.max(maximaCantidad, 2)}).
            </p>
          )}
        </div>
      )}

      <fieldset>
        <legend className="text-sm font-semibold text-texto">
          Monto sugerido del regalo (opcional)
        </legend>
        <p className="mt-1 text-xs text-texto-suave">
          Puedes definir solo un mínimo, o un mínimo y un máximo como rango.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <label className="text-sm text-texto-suave">
            Mínimo
            <input
              type="number"
              min={0}
              step="0.01"
              aria-label="Monto mínimo sugerido"
              value={config.montoMinimo}
              onChange={(e) => alActualizar({ montoMinimo: e.target.value })}
              className={`${CLASES_CONTROL} ml-2 w-32 border-borde-fuerte focus:border-acentuado`}
            />
          </label>
          <label className="text-sm text-texto-suave">
            Máximo
            <input
              type="number"
              min={0}
              step="0.01"
              aria-label="Monto máximo sugerido"
              value={config.montoMaximo}
              onChange={(e) => alActualizar({ montoMaximo: e.target.value })}
              className={`${CLASES_CONTROL} ml-2 w-32 border-borde-fuerte focus:border-acentuado`}
            />
          </label>
        </div>
        {(!montoValido(config.montoMinimo) || !montoValido(config.montoMaximo)) && (
          <p aria-live="polite" className="mt-1 text-sm text-peligro">
            Los montos deben ser números mayores que cero.
          </p>
        )}
        {!cantidadInvalida &&
          montoValido(config.montoMinimo) &&
          montoValido(config.montoMaximo) &&
          aNumero(config.montoMinimo) > aNumero(config.montoMaximo) &&
          config.montoMinimo.trim() !== "" &&
          config.montoMaximo.trim() !== "" && (
            <p aria-live="polite" className="mt-1 text-sm text-peligro">
              El monto máximo no puede ser menor que el mínimo.
            </p>
          )}
      </fieldset>
    </div>
  );
}
