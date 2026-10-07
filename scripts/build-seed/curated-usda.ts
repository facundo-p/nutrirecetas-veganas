/**
 * Generado por `npm run usda` desde los matches de T17; no editar a mano.
 * Valores por 100 g de FoodData Central, con su procedencia.
 */
import type { ClaveCritica } from './curated-tables';

export interface ValorUsda {
  valor: number;
  fdc_id: number;
  nutriente_fdc: '301' | '309' | '317' | '314' | '851' | '619';
  /** código de derivación de FDC: A analítico, Z cero asumido, BFSN imputado… */
  derivacion?: string;
  nota?: string;
}

export const VALORES_USDA: Record<string, Partial<Record<ClaveCritica, ValorUsda>>> = {};
