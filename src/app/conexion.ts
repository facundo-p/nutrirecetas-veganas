import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void): () => void {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

/**
 * `onLine === false` es confiable; `true` no garantiza internet (hay red, no
 * salida). Para un aviso que solo informa, alcanza.
 */
export function useEnLinea(): boolean {
  return useSyncExternalStore(subscribe, () => navigator.onLine);
}
