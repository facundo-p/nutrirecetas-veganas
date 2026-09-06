import { useEffect, useMemo, useState } from 'react';
import { getSeedIndex } from '../../seed';
import { recipeInSeason } from '../../domain/season';
import { estadoDeReceta } from '../../domain/estado';
import { useOverlays } from '../../db/hooks';
import { groupRecipes, hayFiltros, type EstadosElegidos, type RecipeFiltersState } from './filtering';
import { memoriaDeFiltros } from './memoria-de-filtros';
import { RecipeCard } from './RecipeCard';
import { RecipeFilters } from './RecipeFilters';
import { EncabezadoPantalla } from '../common/EncabezadoPantalla';
import { currentMonth } from '../common/format';

export function RecipeList() {
  const idx = getSeedIndex();
  const mes = currentMonth();
  const overlays = useOverlays();
  const [filters, setFilters] = useState<RecipeFiltersState>(memoriaDeFiltros.filtros);
  const [open, setOpen] = useState<Set<string>>(memoriaDeFiltros.variantesAbiertas);

  // Lo que se filtró y lo que se desplegó sobreviven a abrir una receta y volver.
  useEffect(() => {
    memoriaDeFiltros.filtros = filters;
  }, [filters]);
  useEffect(() => {
    memoriaDeFiltros.variantesAbiertas = open;
  }, [open]);

  // Un solo mapa para las 84 tarjetas: un `useOverlay` por tarjeta serían 84
  // suscripciones a la base para leer un campo.
  const estados: EstadosElegidos = useMemo(() => {
    const m = new Map<string, NonNullable<(typeof overlays)>[number]['estado']>();
    for (const o of overlays ?? []) if (o.estado !== undefined) m.set(o.receta_id, o.estado);
    return m as EstadosElegidos;
  }, [overlays]);

  const groups = useMemo(() => groupRecipes(filters, estados, idx), [filters, estados, idx]);
  const anyFilter = hayFiltros(filters);
  const total = groups.reduce((acc, g) => acc + (g.motherMatches ? 1 : 0) + g.matchingVariants.length, 0);

  const toggle = (id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <EncabezadoPantalla etiqueta="Recetario" titulo="Recetario" />
      {/* El recetario abre en el buscador: se entra a buscar algo, no a que la
          app proponga. */}
      <RecipeFilters filters={filters} onChange={setFilters} />
      <p className="conteo-resultados" aria-live="polite">
        {total} {total === 1 ? 'receta' : 'recetas'}
        {anyFilter ? ' con estos filtros' : ''}
      </p>
      <div className="lista-recetas">
        {groups.map((g) => {
          const variantsOpen = open.has(g.mother.id) || (!g.motherMatches && g.matchingVariants.length > 0);
          const shownVariants = variantsOpen ? (g.motherMatches ? g.variants : g.matchingVariants) : [];
          return (
            <div key={g.mother.id}>
              <RecipeCard
                recipe={g.mother}
                estado={estadoDeReceta(g.mother, { estado: estados.get(g.mother.id) })}
                inSeason={recipeInSeason(idx, g.mother, mes)}
                variantCount={g.variants.length}
                onToggleVariants={g.variants.length > 0 ? () => toggle(g.mother.id) : undefined}
                variantsOpen={variantsOpen}
              />
              {shownVariants.length > 0 && (
                <div className="lista-variantes">
                  {shownVariants.map((v) => (
                    <RecipeCard
                      key={v.id}
                      recipe={v}
                      estado={estadoDeReceta(v, { estado: estados.get(v.id) })}
                      inSeason={recipeInSeason(idx, v, mes)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {total === 0 && <p className="sin-resultados">Ninguna receta coincide. Probá aflojar algún filtro.</p>}
    </>
  );
}
