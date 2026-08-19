import { useEffect } from 'react';

/**
 * Mantiene la pantalla encendida mientras se cocina. Si el navegador no lo
 * soporta o lo rechaza (Safari lo niega sin gesto del usuario), no pasa nada:
 * es una comodidad, no un requisito, y jamás debe romper la pantalla de pasos.
 */
export function useWakeLock(activo: boolean): void {
  useEffect(() => {
    if (!activo || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    let lock: WakeLockSentinel | null = null;
    let cancelado = false;

    const pedir = async () => {
      try {
        const sentinel = await navigator.wakeLock.request('screen');
        if (cancelado) {
          void sentinel.release();
          return;
        }
        lock = sentinel;
      } catch {
        // permiso denegado o pestaña en segundo plano: se sigue sin wake lock
      }
    };

    void pedir();

    // Al volver de segundo plano el lock se pierde: se vuelve a pedir.
    const alVolver = () => {
      if (document.visibilityState === 'visible' && lock === null) void pedir();
    };
    document.addEventListener('visibilitychange', alVolver);

    return () => {
      cancelado = true;
      document.removeEventListener('visibilitychange', alVolver);
      void lock?.release();
      lock = null;
    };
  }, [activo]);
}
