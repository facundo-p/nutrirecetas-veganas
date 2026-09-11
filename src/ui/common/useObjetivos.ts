import { useMemo } from 'react';
import { usePerfil } from '../../db/hooks';
import { objetivosDeReferencia, type ObjetivosDeReferencia } from '../../domain/objetivos';
import { getSeedIndex } from '../../seed';

/**
 * Contra qué se mide un porcentaje. `usePerfil` da undefined mientras carga:
 * hasta que se sepa, la referencia genérica es la respuesta correcta y no un
 * hueco, porque el perfil nunca es un portón (invariante 4).
 */
export function useObjetivos(): ObjetivosDeReferencia {
  const perfil = usePerfil();
  const nutrientes = getSeedIndex().seed.nutrientes;
  return useMemo(() => objetivosDeReferencia(perfil ?? null, nutrientes, new Date()), [perfil, nutrientes]);
}
