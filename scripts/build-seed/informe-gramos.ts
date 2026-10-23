import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { cabezaDeUnidad } from '../../src/domain/rounding';
import type { Seed } from '../../src/seed/schema';
import { auditarGramos, resumenDeGramos, type LineaAuditada, type Veredicto } from './gramos';

/**
 * `npm run gramos` — qué gramos se pueden ajustar y cuáles no.
 *
 * Materia prima, no decisión: las respuestas van a `docs/decisiones-de-datos.md`
 * y a las tablas curadas. Por eso sale por consola y no genera un `.md` que
 * nadie mantendría.
 */

const SEED_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'seed', 'seed.json');

function num(valor: number, decimales = 1): string {
  return Number(valor.toFixed(decimales)).toString().replace('.', ',');
}

function desvio(observado: number, esperado: number): string {
  if (esperado === 0) return '';
  const pct = ((observado - esperado) / esperado) * 100;
  return `${pct > 0 ? '+' : '−'}${Math.round(Math.abs(pct))} %`;
}

function linea(l: LineaAuditada): string {
  return `${l.receta_id.padEnd(4)} ${l.ingrediente_id.padEnd(26)} ${`"${l.unidad}"`.padEnd(34)} ${num(l.cantidad, 2).padStart(5)} → ${num(l.g_aprox).padStart(6)} g`;
}

function conEstado<E extends Veredicto['estado']>(
  auditadas: readonly LineaAuditada[],
  estado: E,
): (LineaAuditada & { veredicto: Extract<Veredicto, { estado: E }> })[] {
  return auditadas.filter(
    (l): l is LineaAuditada & { veredicto: Extract<Veredicto, { estado: E }> } => l.veredicto.estado === estado,
  );
}

export function informeDeGramos(seed: Omit<Seed, 'content_hash'>): string {
  const auditadas = auditarGramos(seed);
  const r = resumenDeGramos(auditadas);
  const out: string[] = [];
  const di = (s = '') => out.push(s);

  const sinRefTodas = conEstado(auditadas, 'sin_referencia');
  const aOjo = sinRefTodas.filter((l) => l.familia === 'a_ojo');
  const sinRef = sinRefTodas.filter((l) => l.familia !== 'a_ojo');
  const comparables = r.total - r.porEstado.no_aplica;
  di(`Gramos — ${r.total} líneas, ${comparables} comparables`);
  di();
  di(`  ✔ ${String(r.porEstado.coherente + r.porEstado.peso_directo).padStart(4)}  con referencia y coherentes`);
  di(`  ✖ ${String(r.porEstado.divergente).padStart(4)}  divergen de la tabla            SE AJUSTAN: hay contra qué`);
  di(`  ✖ ${String(r.porEstado.ambigua).padStart(4)}  ambiguas, dos filas empatan     SE AJUSTAN: falta elegir fila`);
  di(`  ✖ ${String(r.porEstado.incoherente_en_grupo).padStart(4)}  incoherentes entre sí           SE AJUSTAN: hay con qué compararlas`);
  di(`  · ${String(sinRef.length).padStart(4)}  sin referencia                  NO hasta que haya fuente → T18`);
  di(`  · ${String(aOjo.length).padStart(4)}  a ojo (pizca, chorrito, puñado) NO tienen fuente: son convención`);
  di(`  · ${String(r.total - comparables).padStart(4)}  no se comparan                  compuestas y preparados`);

  const divergentes = conEstado(auditadas, 'divergente');
  di();
  di(`DIVERGEN DE LA TABLA (${divergentes.length})`);
  di(`  una referencia «inferida» quiere decir que la unidad no nombró la fila: puede fallar la línea o la inferencia`);
  for (const l of [...divergentes].sort((a, b) => a.receta_id.localeCompare(b.receta_id))) {
    const ref = l.veredicto.referencia;
    const fuente = ref === null
      ? 'su propia cantidad'
      : `${ref.clave}${ref.ingrediente_ref === l.ingrediente_id ? '' : ` de ${ref.ingrediente_ref}`}` +
        `${ref.via === 'pieza' ? ', inferida' : ref.via === 'derivada_ml' ? ', derivada' : ''}`;
    di(`  ${linea(l)}   esperado ${num(l.veredicto.esperado_g).padStart(6)} (${fuente})  ${desvio(l.g_aprox, l.veredicto.esperado_g)}`);
  }

  const ambiguas = conEstado(auditadas, 'ambigua');
  if (ambiguas.length > 0) {
    di();
    di(`AMBIGUAS — dos filas de la tabla empatan y el guardia no elige (${ambiguas.length})`);
    for (const l of ambiguas) di(`  ${linea(l)}   candidatas: ${l.veredicto.candidatas.join(' / ')}`);
  }

  const incoherentes = conEstado(auditadas, 'incoherente_en_grupo');
  di();
  di(`INCOHERENTES ENTRE SÍ, sin tabla (${incoherentes.length})`);
  const porGrupo = new Map<string, typeof incoherentes>();
  for (const l of incoherentes) {
    const clave = `${l.ingrediente_id} | ${cabezaDeUnidad(l.unidad)}`;
    porGrupo.set(clave, [...(porGrupo.get(clave) ?? []), l]);
  }
  for (const [clave, grupo] of [...porGrupo].sort()) {
    const pares = grupo[0]?.veredicto.pares ?? 0;
    const tarifa = grupo[0]?.veredicto.tarifa_del_grupo ?? 0;
    di(`  ${clave}  —  ${pares} líneas en el grupo, mediana ${num(tarifa, 2)} g/medida${pares === 2 ? '  (n=2: ninguna manda)' : ''}`);
    for (const l of grupo) di(`    ${linea(l)}   la mediana daría ${num(l.veredicto.esperado_g)}`);
  }

  const grupos = new Map<string, number>();
  for (const l of sinRef) {
    const clave = `${l.ingrediente_id}|${cabezaDeUnidad(l.unidad)}`;
    grupos.set(clave, (grupos.get(clave) ?? 0) + 1);
  }
  const ranking = [...grupos].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const mitad = Math.ceil(sinRef.length / 2);
  let acumulado = 0;
  let gruposHastaLaMitad = 0;
  for (const [, n] of ranking) {
    if (acumulado >= mitad) break;
    acumulado += n;
    gruposHastaLaMitad += 1;
  }
  di();
  di(`SIN REFERENCIA — qué cubrir primero (${sinRef.length} líneas en ${ranking.length} grupos)`);
  di(`  ${gruposHastaLaMitad} grupos cubren la mitad de las líneas`);
  for (const fila of [...Array(Math.ceil(Math.min(ranking.length, 30) / 5)).keys()]) {
    di('  ' + ranking.slice(fila * 5, fila * 5 + 5).map(([k, n]) => `${String(n).padStart(3)} ${k}`.padEnd(34)).join(''));
  }

  const compuestas = auditadas.filter((l) => l.familia === 'compuesta' && l.veredicto.estado === 'no_aplica');
  const gruposAOjo = new Map<string, number[]>();
  for (const l of aOjo) {
    const clave = cabezaDeUnidad(l.unidad);
    gruposAOjo.set(clave, [...(gruposAOjo.get(clave) ?? []), l.g_aprox / l.cantidad]);
  }
  di();
  di(`A OJO — no existe fuente para estas medidas; van a una convención declarada (${aOjo.length} líneas)`);
  for (const [medida, tarifas] of [...gruposAOjo].sort()) {
    const unicas = [...new Set(tarifas.map((t) => num(t, 2)))].sort();
    di(`  ${medida.padEnd(12)} ${String(tarifas.length).padStart(2)} líneas   g por medida: ${unicas.join(' · ')}`);
  }

  di();
  di(`NO SE COMPARAN — compuestas (${compuestas.length}): la cantidad describe el primer sumando y los gramos el total`);
  for (const l of compuestas) di(`  ${linea(l)}`);

  return out.join('\n');
}

/** Una línea para los `notes` del build. */
export function resumenCortoDeGramos(seed: Omit<Seed, 'content_hash'>): string {
  const r = resumenDeGramos(auditarGramos(seed));
  return (
    `gramos: ${r.conReferencia}/${r.total} líneas con referencia, ` +
    `${r.ajustables} ajustables y ${r.porEstado.sin_referencia} sin fuente todavía — \`npm run gramos\``
  );
}

function main(): void {
  const seed = JSON.parse(readFileSync(SEED_PATH, 'utf8')) as Seed;
  console.log(informeDeGramos(seed));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
