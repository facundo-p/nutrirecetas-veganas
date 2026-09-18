import { useSyncExternalStore } from 'react';
import { acotarFactor } from '../domain/scaling';

/**
 * Router hash propio (sin dependencia): la app es una SPA estática offline y el
 * hash sobrevive a cualquier hosting sin configurar rewrites.
 */

export type Route =
  | { screen: 'recipes' }
  | { screen: 'recipe'; id: string }
  | { screen: 'cook'; id: string; factor?: number }
  | { screen: 'ingredients' }
  | { screen: 'ingredient'; id: string }
  | { screen: 'nutrients' }
  | { screen: 'nutrient'; id: string }
  | { screen: 'glossary' }
  | { screen: 'diary' }
  | { screen: 'profile' }
  | { screen: 'settings' };

/**
 * El factor de escala viaja en la ruta (`#/cocinar/r02/x2`), no en la query:
 * el router es de hash y `location.search` nunca ve lo que va después del `#`.
 * Sin el segmento se cocina ×1, así siguen resolviendo los enlaces viejos.
 */
const FACTOR_EN_RUTA = /^x(\d+(?:\.\d+)?)$/;

function leerFactor(segmento: string | undefined): number | undefined {
  const escrito = segmento === undefined ? null : FACTOR_EN_RUTA.exec(segmento);
  if (escrito === null) return undefined;
  const factor = acotarFactor(Number(escrito[1]));
  return factor === 1 ? undefined : factor;
}

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  switch (parts[0]) {
    case 'receta':
      return parts[1] ? { screen: 'recipe', id: decodeURIComponent(parts[1]) } : { screen: 'recipes' };
    case 'cocinar': {
      if (!parts[1]) return { screen: 'recipes' };
      const id = decodeURIComponent(parts[1]);
      const factor = leerFactor(parts[2]);
      return factor === undefined ? { screen: 'cook', id } : { screen: 'cook', id, factor };
    }
    case 'ingredientes':
      return { screen: 'ingredients' };
    case 'ingrediente':
      return parts[1] ? { screen: 'ingredient', id: decodeURIComponent(parts[1]) } : { screen: 'ingredients' };
    case 'nutrientes':
      return { screen: 'nutrients' };
    case 'nutriente':
      return parts[1] ? { screen: 'nutrient', id: decodeURIComponent(parts[1]) } : { screen: 'nutrients' };
    case 'glosario':
      return { screen: 'glossary' };
    case 'diario':
      return { screen: 'diary' };
    case 'perfil':
      return { screen: 'profile' };
    case 'ajustes':
      return { screen: 'settings' };
    // `#/hoy` era la pantalla de inicio hasta la Fase 3. Sigue resolviendo
    // porque hay una PWA instalada con ese `start_url` y bookmarks vivos.
    case 'hoy':
    case 'recetario':
      return { screen: 'recipes' };
    default:
      return { screen: 'recipes' };
  }
}

export function routeHash(route: Route): string {
  switch (route.screen) {
    case 'recipes':
      return '#/recetario';
    case 'recipe':
      return `#/receta/${encodeURIComponent(route.id)}`;
    case 'cook': {
      const base = `#/cocinar/${encodeURIComponent(route.id)}`;
      return route.factor === undefined || route.factor === 1 ? base : `${base}/x${route.factor}`;
    }
    case 'ingredients':
      return '#/ingredientes';
    case 'ingredient':
      return `#/ingrediente/${encodeURIComponent(route.id)}`;
    case 'nutrients':
      return '#/nutrientes';
    case 'nutrient':
      return `#/nutriente/${encodeURIComponent(route.id)}`;
    case 'glossary':
      return '#/glosario';
    case 'diary':
      return '#/diario';
    case 'profile':
      return '#/perfil';
    case 'settings':
      return '#/ajustes';
  }
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  return parseHash(hash);
}

export function navigate(route: Route): void {
  window.location.hash = routeHash(route);
}
