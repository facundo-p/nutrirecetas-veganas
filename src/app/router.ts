import { useSyncExternalStore } from 'react';

/**
 * Router hash propio (~40 líneas, sin dependencia): la app es una SPA estática
 * offline y el hash sobrevive a cualquier hosting sin configurar rewrites.
 */

export type Route =
  | { screen: 'recipes' }
  | { screen: 'recipe'; id: string }
  | { screen: 'ingredients' }
  | { screen: 'ingredient'; id: string }
  | { screen: 'glossary' };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  switch (parts[0]) {
    case 'receta':
      return parts[1] ? { screen: 'recipe', id: decodeURIComponent(parts[1]) } : { screen: 'recipes' };
    case 'ingredientes':
      return { screen: 'ingredients' };
    case 'ingrediente':
      return parts[1] ? { screen: 'ingredient', id: decodeURIComponent(parts[1]) } : { screen: 'ingredients' };
    case 'glosario':
      return { screen: 'glossary' };
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
    case 'ingredients':
      return '#/ingredientes';
    case 'ingredient':
      return `#/ingrediente/${encodeURIComponent(route.id)}`;
    case 'glossary':
      return '#/glosario';
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
