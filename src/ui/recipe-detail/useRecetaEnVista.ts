import { useMemo, useState } from 'react';
import type { SeedIndex } from '../../seed';
import type { Line, Recipe } from '../../seed/schema';
import { nutricionConLineas, type RecipeNutrition } from '../../domain/nutrition';
import { avisosDeEscalado, escalarLineas, type AvisoEscalado } from '../../domain/scaling';
import { nutritionOf } from '../common/nutritionCache';
import { useFactorAnimado } from './useFactorAnimado';

export interface RecetaEnVista {
  factor: number;
  setFactor: (factor: number) => void;
  /** El factor que se dibuja mientras las cifras viajan hacia `factor`. */
  mostrado: number;
  animando: boolean;
  /** Con los sustitutos puestos y sin escalar: de acá sale el factor de un ajuste. */
  lineasElegidas: Line[];
  /** Escaladas con el factor que viaja: lo que se dibuja. */
  lineasMostradas: Line[];
  avisos: AvisoEscalado[];
  nutrition: RecipeNutrition;
  sustituir: (indice: number, ingrediente_id: string | null) => void;
}

/**
 * La receta como se la está mirando: con las porciones elegidas y los
 * sustitutos puestos. Efímera como el selector de porciones: al salir, la
 * receta vuelve a ser la que es.
 */
export function useRecetaEnVista(idx: SeedIndex, recipe: Recipe): RecetaEnVista {
  const [factor, setFactor] = useState(1);
  const { mostrado, animando } = useFactorAnimado(factor);
  /** Qué línea se cambió por qué ingrediente. */
  const [sustituciones, setSustituciones] = useState<ReadonlyMap<number, string>>(new Map());

  // Las sustituciones se aplican antes de escalar, así entran igual al escalado
  // y al recálculo. Cambian la referencia y nada más: la cantidad y los gramos
  // son los que la receta pide, como en la sesión de cocina.
  const lineasElegidas = useMemo(() => {
    if (sustituciones.size === 0) return recipe.lineas;
    return recipe.lineas.map((linea, i) => {
      const nuevo = sustituciones.get(i);
      return nuevo === undefined ? linea : { ...linea, ref: { tipo: 'ingrediente' as const, id: nuevo } };
    });
  }, [recipe, sustituciones]);

  // Las cantidades se dibujan con el factor que viaja; los avisos, con el de
  // destino: no tienen por qué recalcularse cuadro a cuadro.
  const lineasMostradas = useMemo(
    () => (mostrado === 1 ? lineasElegidas : escalarLineas(lineasElegidas, mostrado)),
    [lineasElegidas, mostrado],
  );
  const avisos = useMemo(() => avisosDeEscalado(recipe, factor), [recipe, factor]);

  // Sin el factor a propósito: una porción es una porción. Escalar pasa por el
  // redondeo de cocina, y eso cambia las cantidades, no lo que aporta la receta.
  const nutrition = useMemo(
    () =>
      sustituciones.size === 0
        ? nutritionOf(idx, recipe.id)
        : nutricionConLineas(recipe, lineasElegidas, recipe.porciones_num, idx),
    [idx, recipe, lineasElegidas, sustituciones],
  );

  const sustituir = (indice: number, ingrediente_id: string | null) => {
    setSustituciones((previas) => {
      const siguiente = new Map(previas);
      if (ingrediente_id === null) siguiente.delete(indice);
      else siguiente.set(indice, ingrediente_id);
      return siguiente;
    });
  };

  return { factor, setFactor, mostrado, animando, lineasElegidas, lineasMostradas, avisos, nutrition, sustituir };
}
