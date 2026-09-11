import { useRef, useState } from 'react';
import { getSeedIndex } from '../../seed';
import { routeHash } from '../../app/router';
import { cuantosFiltros, type RecipeFiltersState } from './filtering';
import { ModalDeFiltros } from './ModalDeFiltros';
import { IconFiltros, IconLupa } from '../icons/icons';

interface Props {
  filters: RecipeFiltersState;
  onChange: (next: RecipeFiltersState) => void;
  /** Cuántas recetas quedan: el botón de cierre del modal lo dice. */
  resultados: number;
}

/** El buscador y el botón que abre los filtros. Los filtros en sí viven en el modal. */
export function RecipeFilters({ filters, onChange, resultados }: Props) {
  const idx = getSeedIndex();
  const [abierto, setAbierto] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const puestos = cuantosFiltros(filters);

  const cerrar = () => {
    setAbierto(false);
    boton.current?.focus();
  };

  return (
    <div className="filtros">
      <div className="filtros-fila-busqueda">
        <label className="filtros-buscador">
          <IconLupa />
          <input
            type="search"
            className="filtros-busqueda"
            placeholder="ingrediente o nombre"
            aria-label="Buscar recetas por nombre o ingrediente"
            value={filters.q}
            onChange={(e) => onChange({ ...filters, q: e.target.value })}
          />
        </label>
        <button
          ref={boton}
          type="button"
          className={puestos > 0 ? 'filtros-boton activo' : 'filtros-boton'}
          aria-label={puestos > 0 ? `Filtros, ${puestos} ${puestos === 1 ? 'puesto' : 'puestos'}` : 'Filtros'}
          aria-haspopup="dialog"
          aria-expanded={abierto}
          onClick={() => setAbierto(true)}
        >
          <IconFiltros />
          {puestos > 0 && (
            <span className="filtros-contador" aria-hidden="true">
              {puestos}
            </span>
          )}
        </button>
      </div>
      {/* El filtro recorta el recetario; la ficha del nutriente lo rankea y
          explica de qué se trata. Son dos preguntas distintas sobre lo mismo. */}
      {filters.ricaEn !== '' && (
        <p className="filtros-enlace">
          <a href={routeHash({ screen: 'nutrient', id: filters.ricaEn })}>
            Ver las que más aportan, y qué es {idx.nutrientById.get(filters.ricaEn)?.nombre.toLowerCase()} ›
          </a>
        </p>
      )}
      {abierto && <ModalDeFiltros filters={filters} onChange={onChange} resultados={resultados} onCerrar={cerrar} />}
    </div>
  );
}
