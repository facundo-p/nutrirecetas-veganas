// Renders reproducibles de cierre de fase: screenshots reales de la app
// (build de producción servido con vite preview) a 390 px y 1280 px.
// Uso: npm run build && npm run renders [-- fase-2] [--tema=d]
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const fase = args.find((a) => !a.startsWith('--')) ?? 'fase-2';
// Cada tema visual tiene su carpeta: el default es el tema activo de la app.
const tema = args.find((a) => a.startsWith('--tema='))?.slice(7) ?? 'd';
const carpeta = `${fase}-tema-${tema}`;
const OUT = join(ROOT, 'docs', 'renders', carpeta);
mkdirSync(OUT, { recursive: true });

const PORT = 4173;
const BASE = `http://localhost:${PORT}`;

const RUTAS = [
  ['recetario', '#/recetario'],
  ['receta-r01', '#/receta/r01'],
  ['receta-p19', '#/receta/p19'],
  ['cocinar-personalizar', '#/cocinar/r01'],
  ['cocinar-pasos', '#/cocinar/r01'],
  ['diario', '#/diario'],
  ['perfil', '#/perfil'],
  ['ajustes', '#/ajustes'],
  ['ingredientes', '#/ingredientes'],
  ['ingrediente-garbanzos', '#/ingrediente/garbanzos'],
  ['nutrientes', '#/nutrientes'],
  ['nutriente-b12', '#/nutriente/b12'],
  ['glosario', '#/glosario'],
];

const VIEWPORTS = [
  ['mobile-390', { width: 390, height: 844 }],
  ['desktop-1280', { width: 1280, height: 800 }],
];

/**
 * El diario y Hoy no tienen nada que mostrar sin datos de usuario, así que el
 * script siembra un estado de demo determinista, con fechas relativas a hoy.
 * Vive solo acá: la app jamás escribe datos de ejemplo.
 */
const SEMBRADO = `
(async () => {
const req = indexedDB.open('nutrirecetas_user');
await new Promise((resolve, reject) => {
  req.onerror = () => reject(req.error);
  req.onsuccess = () => {
    const db = req.result;
    const tx = db.transaction(['perfil', 'cocciones', 'overlays', 'meta'], 'readwrite');
    const hoy = new Date();
    const iso = (horasAtras) => new Date(hoy.getTime() - horasAtras * 3600 * 1000).toISOString();

    tx.objectStore('perfil').put({
      id: 1,
      nombre: 'Facu',
      sexo_para_requerimientos: 'masculino',
      fecha_nacimiento: '1990-03-14',
      peso_kg: 75,
      nivel_entrenamiento: 'intenso',
      nutrientes_destacados: ['hierro', 'b12', 'proteina', 'calcio', 'zinc', 'yodo', 'omega3'],
      creado_en: iso(72),
      actualizado_en: iso(72),
    });

    const nutriente = (v, cobertura, ic) => ({ intervalo: { min: v * 0.94, max: v * 1.06 }, cobertura_pct: cobertura, ic });
    tx.objectStore('cocciones').put({
      id: 1,
      receta_id: 'p19',
      receta_nombre: 'Pastel de papas',
      seed_version: '1.0.0',
      fecha: iso(20),
      porciones_rendidas: 6,
      factor_escala: 1,
      lineas: [],
      variaciones: [
        { tipo: 'desmarcado', nombre: 'Vino tinto' },
        { tipo: 'agregado', nombre: 'Espinaca', detalle: '80 g' },
      ],
      nota: 'la próxima, más pimentón ahumado',
      nutricion_porcion: {
        masa_total_g: 343,
        kcal: nutriente(464, 99.9, 8),
        por_nutriente: {
          hierro_mg: nutriente(3.7, 22.7, 7),
          prot_g: nutriente(29.6, 91.5, 7),
          calcio_mg: nutriente(120, 62, 6),
          zinc_mg: nutriente(2.9, 60, 7),
          yodo_ug: nutriente(12, 40, 6),
          ala_g: nutriente(0.3, 55, 6),
        },
        alerta_b12: true,
      },
    });
    tx.objectStore('cocciones').put({
      id: 2,
      receta_id: 'r01',
      receta_nombre: 'Sopa de lentejas rojas al estilo turco',
      seed_version: '1.0.0',
      fecha: iso(52),
      porciones_rendidas: 4,
      factor_escala: 1,
      lineas: [],
      variaciones: [],
      nutricion_porcion: {
        masa_total_g: 508,
        kcal: nutriente(244, 99.7, 8),
        por_nutriente: {
          hierro_mg: nutriente(2.6, 16.7, 7),
          prot_g: nutriente(8, 34.7, 7),
          yodo_ug: nutriente(30, 45, 6),
        },
        alerta_b12: false,
      },
    });

    tx.objectStore('overlays').put({ receta_id: 'r01', favorita: true, ic_usuario: 8, actualizado_en: iso(50) });
    // al día a propósito: con la marca vieja, el aviso de la migración saldría
    // en las 24 capturas y no es lo que se viene a revisar
    tx.objectStore('meta').put({
      id: 1,
      user_schema_version: 4,
      seed_version: '1.0.0',
      ultimo_backup: iso(24 * 40),
      cambios_desde_backup: 6,
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  };
});
})();
`;

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: ROOT,
  stdio: 'pipe',
});
await new Promise((resolve, reject) => {
  server.stdout.on('data', (d) => d.toString().includes('http') && resolve());
  server.stderr.on('data', (d) => process.stderr.write(d));
  server.on('exit', (code) => reject(new Error(`vite preview terminó (${code}) — ¿corriste npm run build?`)));
  setTimeout(() => reject(new Error('vite preview no arrancó en 15 s')), 15000);
});

const browser = await chromium.launch();
try {
  for (const [vpName, viewport] of VIEWPORTS) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });

    // La base se siembra una vez por contexto. Ojo: escribir por IndexedDB crudo
    // no dispara los observables de Dexie, y navegar entre hashes no recarga la
    // página — sin este reload la app sigue mostrando el estado vacío.
    await page.goto(`${BASE}/?tema=${tema}#/recetario`, { waitUntil: 'networkidle' });
    await page.evaluate(SEMBRADO);
    await page.reload({ waitUntil: 'networkidle' });

    // Si el sembrado no llegó, mejor fallar que publicar renders vacíos. Se
    // comprueba contra el diario, que es la pantalla que no tiene nada que
    // mostrar sin datos de usuario.
    await page.goto(`${BASE}/?tema=${tema}#/diario`, { waitUntil: 'networkidle' });
    await page
      .getByText('Pastel de papas')
      .first()
      .waitFor({ timeout: 5000 })
      .catch(() => {
        throw new Error('El sembrado de datos de demo no llegó a la app: el diario sigue vacío.');
      });

    for (const [name, hash] of RUTAS) {
      await page.goto(`${BASE}/?tema=${tema}${hash}`, { waitUntil: 'networkidle' });

      // la sesión de cocina necesita un par de clics para llegar a los pasos
      if (name === 'cocinar-pasos') {
        await page.getByRole('button', { name: 'Empezar a cocinar' }).click();
        await page.waitForTimeout(150);
      }

      // la nav fija flotaría a mitad del screenshot fullPage: se ancla al fondo real
      await page.addStyleTag({
        content:
          'body{position:relative}.nav{position:absolute;top:auto;bottom:0}.panel-nutricion-vivo{position:static}',
      });
      await page.waitForTimeout(350); // fuentes variables
      await page.screenshot({ path: join(OUT, `${name}--${vpName}.png`), fullPage: true });
      console.log('✔', `${name}--${vpName}.png`);
    }
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log(`\nRenders en docs/renders/${carpeta}/`);
