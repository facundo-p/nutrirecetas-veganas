import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CLAVES_CRITICAS,
  USDA_MATCHES,
  type ClaveCritica,
  type EntradaFdc,
} from '../build-seed/curated-tables';
import type { ValorUsda } from '../build-seed/curated-usda';
import { loadRawData } from '../build-seed/load';

/**
 * `npm run usda` — trae de FoodData Central los críticos de cada match de T17
 * y escribe `curated-usda.ts`. `npm run usda -- --buscar "lentils cooked"`
 * lista candidatos para elegir a mano: la elección nunca es automática.
 *
 * Usa `FDC_API_KEY` si está; si no, DEMO_KEY, que admite 10 pedidos por hora.
 * Por eso pide de a 20 alimentos.
 */

const API = 'https://api.nal.usda.gov/fdc/v1';
const API_KEY = process.env.FDC_API_KEY ?? 'DEMO_KEY';
const DESTINO = join(dirname(fileURLToPath(import.meta.url)), '..', 'build-seed', 'curated-usda.ts');
const POR_PEDIDO = 20;

const NUMERO_FDC = { calcio_mg: '301', zinc_mg: '309', selenio_ug: '317', yodo_ug: '314' } as const;
const ALA_DIFERENCIADO = '851';
const ALA_SIN_DIFERENCIAR = '619';
const NOTA_ALA_619 = '18:3 sin diferenciar; en vegetales es casi todo ALA';
const NOTA_SELENIO = 'varía mucho con el suelo; dato de EE.UU.';
const CATEGORIAS_CON_SELENIO_DEL_SUELO = new Set(['cereal', 'pseudocereal', 'legumbre', 'derivado_soja']);

interface NutrienteFdc {
  nutrient: { number: string };
  amount?: number;
  foodNutrientDerivation?: { code: string };
}
interface AlimentoFdc {
  fdcId: number;
  description: string;
  dataType: string;
  foodNutrients: NutrienteFdc[];
}

async function pedir<T>(ruta: string, cuerpo: unknown): Promise<T> {
  const respuesta = await fetch(`${API}${ruta}?api_key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
  if (!respuesta.ok) throw new Error(`FDC ${ruta}: ${respuesta.status} ${await respuesta.text()}`);
  return (await respuesta.json()) as T;
}

async function buscar(texto: string): Promise<void> {
  const { foods } = await pedir<{ foods: AlimentoFdc[] }>('/foods/search', {
    query: texto,
    dataType: ['SR Legacy', 'Foundation'],
    pageSize: 25,
  });
  for (const f of foods) console.log(`${f.fdcId}\t${f.dataType}\t${f.description}`);
}

async function traerAlimentos(ids: number[]): Promise<Map<number, AlimentoFdc>> {
  const alimentos = new Map<number, AlimentoFdc>();
  const numeros = [...Object.values(NUMERO_FDC), ALA_DIFERENCIADO, ALA_SIN_DIFERENCIAR].map(Number);
  for (let i = 0; i < ids.length; i += POR_PEDIDO) {
    const lote = await pedir<AlimentoFdc[]>('/foods', { fdcIds: ids.slice(i, i + POR_PEDIDO), nutrients: numeros });
    for (const alimento of lote) alimentos.set(alimento.fdcId, alimento);
  }
  return alimentos;
}

/** Nutriente ausente = no se escribe: nulo no es cero. */
function leer(alimento: AlimentoFdc, numero: string): Omit<ValorUsda, 'nota'> | undefined {
  const n = alimento.foodNutrients.find((x) => x.nutrient.number === numero && x.amount !== undefined);
  if (n === undefined || n.amount === undefined) return undefined;
  const derivacion = n.foodNutrientDerivation?.code;
  return {
    valor: n.amount,
    fdc_id: alimento.fdcId,
    nutriente_fdc: numero as ValorUsda['nutriente_fdc'],
    ...(derivacion !== undefined ? { derivacion } : {}),
  };
}

function valorDe(clave: ClaveCritica, alimento: AlimentoFdc, entrada: EntradaFdc, categoria: string): ValorUsda | undefined {
  if (clave === 'ala_g') {
    const diferenciado = leer(alimento, ALA_DIFERENCIADO);
    if (diferenciado !== undefined) return diferenciado;
    const sinDiferenciar = leer(alimento, ALA_SIN_DIFERENCIAR);
    return sinDiferenciar && { ...sinDiferenciar, nota: NOTA_ALA_619 };
  }
  const valor = leer(alimento, NUMERO_FDC[clave]);
  if (valor === undefined) return undefined;
  // El yodo de SR Legacy y el no analítico arrastran los aditivos de EE.UU.
  if (clave === 'yodo_ug' && (entrada.data_type !== 'Foundation' || valor.derivacion !== 'A')) return undefined;
  if (clave === 'selenio_ug' && CATEGORIAS_CON_SELENIO_DEL_SUELO.has(categoria)) return { ...valor, nota: NOTA_SELENIO };
  return valor;
}

function verificarDescripcion(entrada: EntradaFdc, alimento: AlimentoFdc | undefined, id: string): AlimentoFdc {
  if (alimento === undefined) throw new Error(`${id}: FDC no devolvió ${entrada.fdc_id}`);
  if (alimento.description !== entrada.descripcion_fdc || alimento.dataType !== entrada.data_type) {
    throw new Error(`${id}: ${entrada.fdc_id} es "${alimento.description}" (${alimento.dataType}), no "${entrada.descripcion_fdc}"`);
  }
  return alimento;
}

function serializar(valores: Record<string, Partial<Record<ClaveCritica, ValorUsda>>>): string {
  const fecha = new Date().toISOString().slice(0, 10);
  const cuerpo = Object.entries(valores)
    .map(([id, porClave]) => {
      const lineas = CLAVES_CRITICAS.filter((c) => porClave[c] !== undefined).map(
        (c) => `    ${c}: ${JSON.stringify(porClave[c]).replace(/"([a-z_]+)":/g, '$1: ')},`,
      );
      return `  ${id}: {\n${lineas.join('\n')}\n  },`;
    })
    .join('\n');
  return `/**
 * Generado por \`npm run usda\` el ${fecha} desde los matches de T17; no editar a
 * mano. Valores por 100 g de FoodData Central, con su procedencia.
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

export const VALORES_USDA: Record<string, Partial<Record<ClaveCritica, ValorUsda>>> = {
${cuerpo}
};
`;
}

async function main(): Promise<void> {
  const i = process.argv.indexOf('--buscar');
  if (i !== -1) return buscar(process.argv.slice(i + 1).join(' '));

  const crudos = new Map(loadRawData().ingredientes.map((r) => [r.id, r]));
  const matches = Object.entries(USDA_MATCHES).sort(([a], [b]) => a.localeCompare(b));
  const ids = [...new Set(matches.flatMap(([, m]) => [m.fdc_id, ...(m.extra ? [m.extra.fdc_id] : [])]))];
  const alimentos = await traerAlimentos(ids);

  const valores: Record<string, Partial<Record<ClaveCritica, ValorUsda>>> = {};
  for (const [id, match] of matches) {
    const crudo = crudos.get(id);
    if (crudo === undefined) throw new Error(`T17: ${id} no es un ingrediente`);
    const principal = verificarDescripcion(match, alimentos.get(match.fdc_id), id);
    const extra = match.extra && verificarDescripcion(match.extra, alimentos.get(match.extra.fdc_id), id);
    const porClave: Partial<Record<ClaveCritica, ValorUsda>> = {};
    for (const clave of CLAVES_CRITICAS) {
      if (crudo.nutrientes?.[clave] != null || match.omitir?.[clave] !== undefined) continue;
      const usaExtra = match.extra !== undefined && extra !== undefined && match.extra.claves.includes(clave);
      const valor = usaExtra ? valorDe(clave, extra, match.extra!, crudo.categoria) : valorDe(clave, principal, match, crudo.categoria);
      if (valor !== undefined) porClave[clave] = valor;
    }
    if (Object.keys(porClave).length > 0) valores[id] = porClave;
  }
  writeFileSync(DESTINO, serializar(valores));
  console.log(`✔ ${Object.keys(valores).length} ingredientes con valores USDA → ${DESTINO}`);
}

await main();
