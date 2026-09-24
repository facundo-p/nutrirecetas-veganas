import { partirPaso, type LineaDePaso } from '../../domain/pasos';
import { cantidadConUnidad, cantidadEnPalabras } from './format';

/**
 * El texto de un paso con sus cantidades puestas. Lo que dice la prosa y lo que
 * dice la lista son el mismo número, también después de ajustar las porciones.
 */
export function TextoDePaso({ texto, lineas }: { texto: string; lineas: readonly LineaDePaso[] }) {
  return (
    <>
      {partirPaso(texto, lineas).map((trozo, i) =>
        trozo.tipo === 'texto' ? (
          trozo.texto
        ) : (
          <span key={i} className="paso-cantidad">
            {/* El build no deja tokenizar una unidad que no se sabe decir; si
                una pasara, se lee como en la lista antes que romperse. */}
            {cantidadEnPalabras(trozo.linea, trozo.articulo) ?? cantidadConUnidad(trozo.linea)}
          </span>
        ),
      )}
    </>
  );
}
