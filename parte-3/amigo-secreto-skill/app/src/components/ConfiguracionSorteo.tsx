"use client";

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

/** Tarjeta de opción de radio: resaltada cuando está marcada. */
function OpcionRadio({
  nombre,
  valor,
  marcada,
  alElegir,
  texto,
}: {
  nombre: string;
  valor: string;
  marcada: boolean;
  alElegir: () => void;
  texto: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-caramelo px-3.5 py-3 text-sm transition hover:border-regalo/50 has-checked:border-regalo has-checked:bg-regalo-suave/50 has-checked:shadow-sm">
      <input
        type="radio"
        name={nombre}
        value={valor}
        checked={marcada}
        onChange={alElegir}
        className="mt-0.5 size-4 shrink-0 accent-[var(--color-regalo)]"
      />
      <span>{texto}</span>
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
        <legend className="mb-2 text-sm font-semibold text-tinta">
          Tipo de sorteo
        </legend>
        <div className="flex flex-col gap-2">
          <OpcionRadio
            nombre="tipo-sorteo"
            valor="individual"
            marcada={config.tipo === "individual"}
            alElegir={() => alActualizar({ tipo: "individual" })}
            texto="Individual (clásico): una persona, un regalo"
          />
          <OpcionRadio
            nombre="tipo-sorteo"
            valor="multiple"
            marcada={config.tipo === "multiple"}
            alElegir={() => alActualizar({ tipo: "multiple" })}
            texto="Multiple: cada quien regala a varias personas"
          />
        </div>
      </fieldset>

      {esMultiple && (
        <div>
          <label
            htmlFor="cantidad-amigos"
            className="mb-1 block text-sm font-semibold text-tinta"
          >
            Cantidad de amigos secretos por participante
          </label>
          <input
            id="cantidad-amigos"
            type="number"
            min={2}
            max={maximaCantidad > 1 ? maximaCantidad : 2}
            value={config.cantidadAmigos}
            onChange={(e) =>
              alActualizar({ cantidadAmigos: Number(e.target.value) })
            }
            className="campo w-40"
          />
          {cantidadInvalida && (
            <p aria-live="polite" className="mt-1 text-sm text-regalo">
              La cantidad debe estar entre 2 y la cantidad de participantes
              menos uno (hoy: {Math.max(maximaCantidad, 2)}).
            </p>
          )}
        </div>
      )}

      <fieldset>
        <legend className="text-sm font-semibold text-tinta">
          Monto sugerido del regalo (opcional)
        </legend>
        <p className="mt-1 text-xs text-tinta-suave">
          Puedes definir solo un mínimo, o un mínimo y un máximo como rango.
        </p>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-tinta-suave">
            Mínimo
            <input
              type="number"
              min={0}
              step="0.01"
              aria-label="Monto mínimo sugerido"
              value={config.montoMinimo}
              onChange={(e) => alActualizar({ montoMinimo: e.target.value })}
              className="campo w-32"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-tinta-suave">
            Máximo
            <input
              type="number"
              min={0}
              step="0.01"
              aria-label="Monto máximo sugerido"
              value={config.montoMaximo}
              onChange={(e) => alActualizar({ montoMaximo: e.target.value })}
              className="campo w-32"
            />
          </label>
        </div>
        {(!montoValido(config.montoMinimo) || !montoValido(config.montoMaximo)) && (
          <p aria-live="polite" className="mt-1 text-sm text-regalo">
            Los montos deben ser números mayores que cero.
          </p>
        )}
        {!cantidadInvalida &&
          montoValido(config.montoMinimo) &&
          montoValido(config.montoMaximo) &&
          aNumero(config.montoMinimo) > aNumero(config.montoMaximo) &&
          config.montoMinimo.trim() !== "" &&
          config.montoMaximo.trim() !== "" && (
            <p aria-live="polite" className="mt-1 text-sm text-regalo">
              El monto máximo no puede ser menor que el mínimo.
            </p>
          )}
      </fieldset>
    </div>
  );
}
