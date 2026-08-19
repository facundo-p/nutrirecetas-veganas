/**
 * Arranque PWA: persistencia de storage (mitigación del riesgo #1: eviction
 * en iOS) y registro del service worker con actualización por consentimiento
 * (jamás auto-reload: podés estar cocinando).
 */

export function requestPersistentStorage(): void {
  if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
    void navigator.storage.persist();
  }
}

export type UpdateHandler = (apply: () => void) => void;

export async function registerServiceWorker(onNeedRefresh: UpdateHandler): Promise<void> {
  if (!import.meta.env.PROD) return;
  const { registerSW } = await import('virtual:pwa-register');
  const update = registerSW({
    onNeedRefresh() {
      onNeedRefresh(() => {
        void update(true);
      });
    },
  });
}
