import { useEffect, useRef, useState } from 'react';

export const DURACION_ESCALADO_MS = 420;

/** Ease-out cúbico: arranca rápido y frena al llegar. */
export function suavizar(k: number): number {
  return 1 - (1 - k) ** 3;
}

/** El factor en el instante `transcurrido` del viaje de `desde` a `hasta`. */
export function factorEnElCamino(desde: number, hasta: number, transcurrido: number): number {
  const k = Math.min(1, Math.max(0, transcurrido / DURACION_ESCALADO_MS));
  return desde + (hasta - desde) * suavizar(k);
}

// Sin matchMedia (jsdom, navegadores viejos) se salta el viaje: lo que importa es el valor final.
function sinMovimiento(): boolean {
  return typeof window.matchMedia !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * El factor que se muestra mientras las cantidades viajan hacia el nuevo. Se
 * anima la cuenta, cuadro a cuadro, como estado de React: no es una transición
 * de CSS, y nada escribe estilo. `animando` es lo que tiñe las cifras.
 */
export function useFactorAnimado(factor: number): { mostrado: number; animando: boolean } {
  const [mostrado, setMostrado] = useState(factor);
  const [animando, setAnimando] = useState(false);
  const actual = useRef(factor);

  useEffect(() => {
    const desde = actual.current;
    if (desde === factor) return;
    const llegar = () => {
      actual.current = factor;
      setMostrado(factor);
      setAnimando(false);
    };
    if (sinMovimiento()) {
      llegar();
      return;
    }
    // Un cambio en pleno viaje arranca desde donde iba, no desde el principio.
    let cuadro = 0;
    const inicio = performance.now();
    setAnimando(true);
    const avanzar = (ahora: number) => {
      const transcurrido = ahora - inicio;
      if (transcurrido >= DURACION_ESCALADO_MS) return llegar();
      actual.current = factorEnElCamino(desde, factor, transcurrido);
      setMostrado(actual.current);
      cuadro = requestAnimationFrame(avanzar);
    };
    cuadro = requestAnimationFrame(avanzar);
    return () => cancelAnimationFrame(cuadro);
  }, [factor]);

  return { mostrado, animando };
}
