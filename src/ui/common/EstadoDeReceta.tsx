import { useEffect, useRef, useState, type ComponentType, type KeyboardEvent } from 'react';
import { ESTADOS_DE_RECETA, ETIQUETA_DE_ESTADO, type EstadoDeReceta } from '../../domain/estado';
import { IconEstrellaBrotada, IconMarcar, IconSenalador, IconTildeBrote, type IconProps } from '../icons/icons';

const ICONO: Record<EstadoDeReceta, ComponentType<IconProps>> = {
  'sin-probar': IconMarcar,
  probada: IconTildeBrote,
  pendiente: IconSenalador,
  favorita: IconEstrellaBrotada,
};

/**
 * Tu estado con una receta, en la tarjeta del recetario. `sin-probar` no se
 * dibuja: marcar 39 recetas con "todavía no" es ruido, no información.
 */
export function ChipDeEstado({ estado }: { estado: EstadoDeReceta }) {
  if (estado === 'sin-probar') return null;
  const Icono = ICONO[estado];
  return (
    <span className={`chip chip-mini chip-estado estado-${estado}`}>
      <Icono /> {ETIQUETA_DE_ESTADO[estado]}
    </span>
  );
}

/**
 * En la ficha, un botón chico con el ícono del estado actual que abre las cuatro
 * opciones. Eran cuatro chips con su rótulo en dos renglones, y empujaban los
 * ingredientes fuera de la pantalla. El ícono solo no alcanza para leerlo: por
 * eso el botón lleva el estado en su `aria-label` y el menú, las palabras.
 */
export function MenuDeEstado({
  estado,
  onChange,
}: {
  estado: EstadoDeReceta;
  onChange: (siguiente: EstadoDeReceta) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const opciones = useRef<HTMLUListElement>(null);

  // Abierto, el foco va a la opción elegida; tocar afuera o Escape lo cierran.
  useEffect(() => {
    if (!abierto) return;
    opciones.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
    const alTocar = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false);
    };
    const alTeclear = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setAbierto(false);
      boton.current?.focus();
    };
    document.addEventListener('pointerdown', alTocar);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('pointerdown', alTocar);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [abierto]);

  /** Un menú se recorre con las flechas, y da la vuelta en los extremos. */
  const recorrer = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const botones = [...(opciones.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
    const actual = botones.indexOf(document.activeElement as HTMLButtonElement);
    const paso = e.key === 'ArrowDown' ? 1 : -1;
    botones[(actual + paso + botones.length) % botones.length]?.focus();
  };

  const elegir = (opcion: EstadoDeReceta) => {
    onChange(opcion);
    setAbierto(false);
    boton.current?.focus();
  };

  const Icono = ICONO[estado];
  return (
    <div className="menu-estado" ref={raiz}>
      <button
        ref={boton}
        type="button"
        className="menu-estado-boton"
        data-estado={estado}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={`Tu estado con esta receta: ${ETIQUETA_DE_ESTADO[estado]}`}
        onClick={() => setAbierto((v) => !v)}
      >
        <Icono />
      </button>
      {abierto && (
        <ul className="menu-estado-opciones" role="menu" aria-label="Tu estado con esta receta" ref={opciones} onKeyDown={recorrer}>
          {ESTADOS_DE_RECETA.map((opcion) => {
            const IconoDeOpcion = ICONO[opcion];
            return (
              <li key={opcion} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={estado === opcion}
                  className="menu-estado-opcion"
                  data-estado={opcion}
                  onClick={() => elegir(opcion)}
                >
                  <IconoDeOpcion /> {ETIQUETA_DE_ESTADO[opcion]}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
