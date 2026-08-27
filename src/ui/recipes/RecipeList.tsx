import { useMemo, useState } from 'react';
import { getSeedIndex } from '../../seed';
import { recipeInSeason } from '../../domain/season';
import { useCocciones, useOverlays, usePerfil } from '../../db/hooks';
import { EMPTY_FILTERS, groupRecipes, type RecipeFiltersState } from './filtering';
import { RecipeCard } from './RecipeCard';
import { RecipeFilters } from './RecipeFilters';
import { Recomendaciones } from './Recomendaciones';
import { EncabezadoPantalla } from '../common/EncabezadoPantalla';
import { currentMonth } from '../common/format';

export function RecipeList() {
  const idx = getSeedIndex();
  const mes = currentMonth();
  const cocciones = useCocciones();
  const overlays = useOverlays();
  const perfil = usePerfil();
  const [filters, setFilters] = useState<RecipeFiltersState>(EMPTY_FILTERS);
  const [open, setOpen] = useState<Set<string>>(new Set());

  const groups = useMemo(() => groupRecipes(filters, idx), [filters, idx]);
  const anyFilter = filters !== EMPTY_FILTERS && JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);
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
      {/* Arriba del buscador y corta: la app abre acá, y lo primero tiene que
          ser una respuesta a "¿qué cocino?", no un formulario vacío. */}
      {cocciones && overlays && (
        <Recomendaciones perfil={perfil ?? null} cocciones={cocciones} overlays={overlays} />
      )}
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
                inSeason={recipeInSeason(idx, g.mother, mes)}
                variantCount={g.variants.length}
                onToggleVariants={g.variants.length > 0 ? () => toggle(g.mother.id) : undefined}
                variantsOpen={variantsOpen}
              />
              {shownVariants.length > 0 && (
                <div className="lista-variantes">
                  {shownVariants.map((v) => (
                    <RecipeCard key={v.id} recipe={v} inSeason={recipeInSeason(idx, v, mes)} />
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
