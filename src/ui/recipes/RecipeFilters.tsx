import { getSeedIndex } from '../../seed';
import { DIFFICULTY_LEVELS } from '../../seed/schema';
import { allFamilies, type RecipeFiltersState } from './filtering';

interface Props {
  filters: RecipeFiltersState;
  onChange: (next: RecipeFiltersState) => void;
}

export function RecipeFilters({ filters, onChange }: Props) {
  const idx = getSeedIndex();
  const set = (patch: Partial<RecipeFiltersState>) => onChange({ ...filters, ...patch });

  return (
    <div className="filtros">
      <input
        type="search"
        className="filtros-busqueda"
        placeholder="Buscar por nombre o ingrediente…"
        aria-label="Buscar recetas por nombre o ingrediente"
        value={filters.q}
        onChange={(e) => set({ q: e.target.value })}
      />
      {/* Los chips van primero y en su propia fila: son tres, entran sin scroll,
          y detrás de cinco selects quedaban fuera de la pantalla en el celular. */}
      <div className="filtros-chips">
        <button
          type="button"
          className="chip chip-boton"
          aria-pressed={filters.deEstacion}
          onClick={() => set({ deEstacion: !filters.deEstacion })}
        >
          de estación
        </button>
        <button
          type="button"
          className="chip chip-boton"
          aria-pressed={filters.estado === 'probada'}
          onClick={() => set({ estado: filters.estado === 'probada' ? '' : 'probada' })}
        >
          probadas
        </button>
        <button
          type="button"
          className="chip chip-boton"
          aria-pressed={filters.estado === 'por-probar'}
          onClick={() => set({ estado: filters.estado === 'por-probar' ? '' : 'por-probar' })}
        >
          por probar
        </button>
      </div>
      <div className="filtros-fila">
        <select aria-label="Tipo" value={filters.tipo} onChange={(e) => set({ tipo: e.target.value as RecipeFiltersState['tipo'] })}>
          <option value="todas">Todo tipo</option>
          <option value="salada">Saladas</option>
          <option value="dulce">Dulces</option>
          <option value="pan">Panes y masas</option>
          <option value="combo">Combos</option>
          <option value="preparados">Preparados</option>
        </select>
        <select
          aria-label="Dificultad"
          value={filters.dificultad}
          onChange={(e) => set({ dificultad: e.target.value as RecipeFiltersState['dificultad'] })}
        >
          <option value="">Toda dificultad</option>
          {DIFFICULTY_LEVELS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          aria-label="Tiempo total"
          value={filters.tiempoMax ?? ''}
          onChange={(e) => set({ tiempoMax: e.target.value === '' ? null : Number(e.target.value) })}
        >
          <option value="">Sin tope de tiempo</option>
          <option value="30">Hasta 30 min</option>
          <option value="60">Hasta 1 h</option>
          <option value="90">Hasta 1 h 30</option>
        </select>
        <select aria-label="Familia" value={filters.familia} onChange={(e) => set({ familia: e.target.value })}>
          <option value="">Toda familia</option>
          {allFamilies().map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          aria-label="Rica en nutriente"
          value={filters.ricaEn}
          onChange={(e) => set({ ricaEn: e.target.value })}
          title="≥20 % de la referencia diaria (adulto genérico) por porción"
        >
          <option value="">Rica en…</option>
          {idx.seed.nutrientes.map((n) => (
            <option key={n.id} value={n.id}>
              rica en {n.nombre.toLowerCase()}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
