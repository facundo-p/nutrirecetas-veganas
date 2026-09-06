import type { ComponentType } from 'react';
import { ESTADOS_DE_RECETA, ETIQUETA_DE_ESTADO, type EstadoDeReceta } from '../../domain/estado';
import { IconEstrellaBrotada, IconSenalador, IconTildeBrote, type IconProps } from '../icons/icons';

/**
 * Tu estado con una receta, en la tarjeta y en la ficha. `sin-probar` no tiene
 * ícono a propósito: es el default, y en la tarjeta ni siquiera se dibuja —
 * marcar 39 recetas con "todavía no" es ruido, no información.
 */
const ICONO: Record<EstadoDeReceta, ComponentType<IconProps> | null> = {
  'sin-probar': null,
  probada: IconTildeBrote,
  pendiente: IconSenalador,
  favorita: IconEstrellaBrotada,
};

export function ChipDeEstado({ estado }: { estado: EstadoDeReceta }) {
  const Icono = ICONO[estado];
  if (!Icono) return null;
  return (
    <span className={`chip chip-mini chip-estado estado-${estado}`}>
      <Icono /> {ETIQUETA_DE_ESTADO[estado]}
    </span>
  );
}

export function ControlDeEstado({
  estado,
  onChange,
}: {
  estado: EstadoDeReceta;
  onChange: (siguiente: EstadoDeReceta) => void;
}) {
  return (
    <div className="control-estado" role="group" aria-label="Tu estado con esta receta">
      {/* El grupo necesita decir qué es: cuatro chips sueltos abajo de los
          metadatos se leen como filtros. */}
      <span className="control-estado-rotulo">Para vos</span>
      {ESTADOS_DE_RECETA.map((opcion) => {
        const Icono = ICONO[opcion];
        return (
          <button
            key={opcion}
            type="button"
            className={`chip chip-boton chip-estado estado-${opcion}`}
            aria-pressed={estado === opcion}
            onClick={() => onChange(opcion)}
          >
            {Icono && <Icono />} {ETIQUETA_DE_ESTADO[opcion]}
          </button>
        );
      })}
    </div>
  );
}
