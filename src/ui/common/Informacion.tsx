import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconCerrar, IconInfo } from '../icons/icons';

/**
 * Lo que explica la app, detrás de una «i» por pantalla: a la vista queda la
 * receta y lo que ayuda a cocinarla, y quien quiera el porqué lo tiene a un
 * toque. Abre una hoja desde abajo, como la de filtros.
 *
 * La hoja se monta en `body` y no donde está el botón: encabezados y fichas
 * arman su propio contexto de apilado, y adentro quedaría debajo de la nav.
 */
export function Informacion({ children }: { children: ReactNode }) {
  const [abierta, setAbierta] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);

  const cerrar = () => {
    setAbierta(false);
    boton.current?.focus();
  };

  return (
    <>
      <button
        ref={boton}
        type="button"
        className="boton-informacion"
        aria-haspopup="dialog"
        aria-expanded={abierta}
        aria-label="Para saber: lo que explica esta pantalla"
        onClick={() => setAbierta(true)}
      >
        <IconInfo />
      </button>
      {abierta && createPortal(<HojaDeInformacion onCerrar={cerrar}>{children}</HojaDeInformacion>, document.body)}
    </>
  );
}

function HojaDeInformacion({ onCerrar, children }: { onCerrar: () => void; children: ReactNode }) {
  const hoja = useRef<HTMLDivElement>(null);
  const cerrar = useRef(onCerrar);
  useEffect(() => {
    cerrar.current = onCerrar;
  });

  // El foco entra a la hoja al abrir, y Escape la cierra desde cualquier lado.
  useEffect(() => {
    hoja.current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar.current();
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, []);

  return (
    <div className="hoja-informacion">
      <button type="button" className="hoja-informacion-velo" aria-label="Cerrar" onClick={onCerrar} />
      <div
        className="hoja-informacion-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-informacion"
        tabIndex={-1}
        ref={hoja}
      >
        <div className="hoja-informacion-cabecera">
          <h2 id="titulo-informacion">Para saber</h2>
          <button type="button" className="hoja-informacion-cerrar" aria-label="Cerrar" onClick={onCerrar}>
            <IconCerrar />
          </button>
        </div>
        <div className="hoja-informacion-cuerpo">{children}</div>
      </div>
    </div>
  );
}
