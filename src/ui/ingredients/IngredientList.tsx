import { useMemo, useState } from 'react';
import { getSeedIndex } from '../../seed';
import { INGREDIENT_CATEGORIES, type Ingredient } from '../../seed/schema';
import { midpoint } from '../../domain/interval';
import { routeHash } from '../../app/router';
import { amountUnit, currentMonth, formatNumber, icSprouts, normalize } from '../common/format';
import { ingredientInSeason } from '../../domain/season';
import { IconBrotesIc, IconTemporada } from '../icons/icons';
import { EncabezadoPantalla } from '../common/EncabezadoPantalla';

function nutrientValue100g(ing: Ingredient, clave: string): number | null {
  const value = ing.nutrientes[clave as keyof Ingredient['nutrientes']];
  return value ? midpoint(value.intervalo) : null;
}

export function IngredientList() {
  const idx = getSeedIndex();
  const [q, setQ] = useState('');
  const [categoria, setCategoria] = useState('');
  const [fuenteDe, setFuenteDe] = useState('');

  const nutrient = fuenteDe !== '' ? idx.nutrientById.get(fuenteDe) : undefined;

  const list = useMemo(() => {
    const nq = normalize(q.trim());
    let items = idx.seed.ingredientes.filter((ing) => {
      if (categoria !== '' && ing.categoria !== categoria) return false;
      if (nq !== '' && !normalize(ing.nombre).includes(nq) && !ing.sinonimos.some((s) => normalize(s).includes(nq))) {
        return false;
      }
      return true;
    });
    if (nutrient) {
      items = items
        .map((ing) => ({ ing, valor: nutrientValue100g(ing, nutrient.clave_ingrediente) }))
        .filter((x): x is { ing: Ingredient; valor: number } => x.valor !== null && x.valor > 0)
        .sort((a, b) => b.valor - a.valor)
        .map((x) => x.ing);
    }
    return items;
  }, [idx, q, categoria, nutrient]);

  return (
    <>
      <EncabezadoPantalla etiqueta="Ingredientes" titulo="Ingredientes" />
      <div className="filtros">
        <input
          type="search"
          className="filtros-busqueda"
          placeholder="Buscar por nombre o sinónimo…"
          aria-label="Buscar ingredientes"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="filtros-fila">
          <select aria-label="Categoría" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Toda categoría</option>
            {INGREDIENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
          <select
            aria-label="Fuentes de nutriente"
            value={fuenteDe}
            onChange={(e) => setFuenteDe(e.target.value)}
            title="Ordena por aporte cada 100 g"
          >
            <option value="">Fuentes de…</option>
            {idx.seed.nutrientes.map((n) => (
              <option key={n.id} value={n.id}>
                fuentes de {n.nombre.toLowerCase()}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="conteo-resultados" aria-live="polite">
        {list.length} {list.length === 1 ? 'ingrediente' : 'ingredientes'}
        {nutrient ? `, ordenados por ${nutrient.nombre.toLowerCase()} cada 100 g` : ''}
      </p>
      <ul className="lista-ingredientes">
        {list.map((ing) => {
          const valor = nutrient ? nutrientValue100g(ing, nutrient.clave_ingrediente) : null;
          return (
            <li key={ing.id}>
              <a className="tarjeta fila-ingrediente" href={routeHash({ screen: 'ingredient', id: ing.id })}>
                <span className="fila-ingrediente-nombre">
                  {ing.nombre}
                  {ingredientInSeason(idx, ing.id, currentMonth()) && (
                    <IconTemporada className="inline-icono icono-temporada" aria-label="en temporada" />
                  )}
                </span>
                <span className="fila-ingrediente-meta">
                  {valor !== null && nutrient && (
                    <span className="cifra">
                      {formatNumber(valor, valor < 10 ? 1 : 0)} {amountUnit(nutrient.clave_ingrediente)}
                    </span>
                  )}
                  <span className="chip chip-mini">{ing.categoria.replaceAll('_', ' ')}</span>
                  <span className="meta-item" title={`índice de confianza ${ing.ic}/10`}>
                    <IconBrotesIc nivel={icSprouts(ing.ic)} />
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}
