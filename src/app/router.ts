import { useSyncExternalStore } from 'react';

/**
 * Router hash propio (sin dependencia): la app es una SPA estática offline y el
 * hash sobrevive a cualquier hosting sin configurar rewrites.
 */

export type Route =
  | { screen: 'recipes' }
  | { screen: 'recipe'; id: string }
  | { screen: 'cook'; id: string }
  | { screen: 'ingredients' }
  | { screen: 'ingredient'; id: string }
  | { screen: 'glossary' }
  | { screen: 'diary' }
  | { screen: 'profile' }
  | { screen: 'settings' };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  switch (parts[0]) {
    case 'receta':
      return parts[1] ? { screen: 'recipe', id: decodeURIComponent(parts[1]) } : { screen: 'recipes' };
    case 'cocinar':
      return parts[1] ? { screen: 'cook', id: decodeURIComponent(parts[1]) } : { screen: 'recipes' };
    case 'ingredientes':
      return { screen: 'ingredients' };
    case 'ingrediente':
      return parts[1] ? { screen: 'ingredient', id: decodeURIComponent(parts[1]) } : { screen: 'ingredients' };
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
    case 'cook':
      return `#/cocinar/${encodeURIComponent(route.id)}`;
    case 'ingredients':
      return '#/ingredientes';
    case 'ingredient':
      return `#/ingrediente/${encodeURIComponent(route.id)}`;
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
