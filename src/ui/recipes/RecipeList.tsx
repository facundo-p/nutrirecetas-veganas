import { useEffect, useMemo, useState } from 'react';
import { getSeedIndex } from '../../seed';
import { recipeInSeason } from '../../domain/season';
import { estadoDeReceta } from '../../domain/estado';
import { objetivosDeReferencia } from '../../domain/objetivos';
import { ORDEN_BARRA } from '../../domain/aporte';
import { useOverlays, usePerfil } from '../../db/hooks';
import { EMPTY_FILTERS, groupRecipes, hayFiltros, type EstadosElegidos, type RecipeFiltersState } from './filtering';
import { memoriaDeFiltros } from './memoria-de-filtros';
import { RecipeCard } from './RecipeCard';
import { RecipeFilters } from './RecipeFilters';
import { LeyendaDeColores } from './LeyendaDeColores';
import { EncabezadoPantalla } from '../common/EncabezadoPantalla';
import { aporteDeReceta } from '../common/nutritionCache';
import { currentMonth } from '../common/format';

export function RecipeList() {
  const idx = getSeedIndex();
  const mes = currentMonth();
  const overlays = useOverlays();
  const perfil = usePerfil();
  const [filters, setFilters] = useState<RecipeFiltersState>(memoriaDeFiltros.filtros);
  const [open, setOpen] = useState<Set<string>>(memoriaDeFiltros.variantesAbiertas);
  const [leyendaAbierta, setLeyendaAbierta] = useState(false);

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

  // Mientras el perfil carga se mide contra la referencia genérica: el perfil
  // nunca es un portón, tampoco para dibujar una barra.
  const objetivos = useMemo(() => objetivosDeReferencia(perfil ?? null, idx.seed.nutrientes, new Date()), [perfil, idx]);
  const aportes = useMemo(
    () => new Map(idx.seed.recetas.map((r) => [r.id, aporteDeReceta(idx, r.id, objetivos)])),
    [idx, objetivos],
  );

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
      <EncabezadoPantalla titulo="Nutrirecetas">
        <p className="encabezado-bajada">Cada receta se dibuja con lo que le da al cuerpo. Un color por nutriente.</p>
      </EncabezadoPantalla>
      {/* El recetario abre en el buscador: se entra a buscar algo, no a que la
          app proponga. */}
      <RecipeFilters filters={filters} onChange={setFilters} />
      <div className="conteo-fila">
        <p className="conteo-resultados" aria-live="polite">
          {total} {total === 1 ? 'receta' : 'recetas'}
          {anyFilter ? ' con estos filtros' : ''}
        </p>
        <button
          type="button"
          className="leyenda-toggle"
          aria-expanded={leyendaAbierta}
          aria-controls="leyenda-colores"
          onClick={() => setLeyendaAbierta((abierta) => !abierta)}
        >
          <span className="leyenda-rayitas" aria-hidden="true">
            {ORDEN_BARRA.map((id) => (
              <span key={id} className="rayita-nutriente" data-nut={id} />
            ))}
          </span>
          {leyendaAbierta ? 'ocultar' : 'qué es cada color'}
        </button>
      </div>
      {leyendaAbierta && <LeyendaDeColores id="leyenda-colores" fuente={objetivos.fuente} />}
      <div className="lista-recetas">
        {groups.map((g) => {
          const variantsOpen = open.has(g.mother.id) || (!g.motherMatches && g.matchingVariants.length > 0);
          const shownVariants = variantsOpen ? (g.motherMatches ? g.variants : g.matchingVariants) : [];
          return (
            <div key={g.mother.id}>
              <RecipeCard
                recipe={g.mother}
                estado={estadoDeReceta(g.mother, { estado: estados.get(g.mother.id) })}
                aporte={aportes.get(g.mother.id)!}
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
                      aporte={aportes.get(v.id)!}
                      inSeason={recipeInSeason(idx, v, mes)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {total === 0 && (
        <div className="sin-resultados">
          <p className="sin-resultados-titulo">No hay ninguna con todo eso junto.</p>
          <p>Probá soltar un filtro, o buscar por un ingrediente solo.</p>
          <button type="button" className="boton-secundario" onClick={() => setFilters(EMPTY_FILTERS)}>
            Empezar de nuevo
          </button>
        </div>
      )}
    </>
  );
}
