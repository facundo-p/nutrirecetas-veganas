// Renders reproducibles de cierre de fase: screenshots reales de la app
// (build de producción servido con vite preview) a 390 px y 1280 px.
// Uso: npm run build && npm run renders [-- fase-1] [--tema=d]
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const fase = args.find((a) => !a.startsWith('--')) ?? 'fase-1';
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
  ['ingredientes', '#/ingredientes'],
  ['ingrediente-garbanzos', '#/ingrediente/garbanzos'],
  ['glosario', '#/glosario'],
];

const VIEWPORTS = [
  ['mobile-390', { width: 390, height: 844 }],
  ['desktop-1280', { width: 1280, height: 800 }],
];

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
    for (const [name, hash] of RUTAS) {
      await page.goto(`${BASE}/?tema=${tema}${hash}`, { waitUntil: 'networkidle' });
      // la nav fija flotaría a mitad del screenshot fullPage: se ancla al fondo real
      await page.addStyleTag({ content: 'body{position:relative}.nav{position:absolute;top:auto;bottom:0}' });
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
