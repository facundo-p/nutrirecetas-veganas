// One-off: rasteriza public/icono.svg a los PNG del manifest con Playwright.
// La versión maskable agrega zona segura (el sistema recorta hasta el 20 %).
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(join(ROOT, 'public', 'icono.svg'), 'utf8');

const page = (size, scale, bg) => `<!doctype html><style>
  * { margin: 0 }
  body { width: ${size}px; height: ${size}px; background: ${bg}; display: grid; place-items: center }
  svg { width: ${Math.round(size * scale)}px; height: ${Math.round(size * scale)}px }
</style>${svg}`;

const browser = await chromium.launch();
const tab = await browser.newPage({ deviceScaleFactor: 1 });

const targets = [
  { file: 'icono-192.png', size: 192, scale: 1, bg: 'transparent' },
  { file: 'icono-512.png', size: 512, scale: 1, bg: 'transparent' },
  // maskable: el arte ocupa el 72 % centrado sobre papel pleno
  { file: 'icono-maskable-512.png', size: 512, scale: 0.72, bg: '#F5EFDC' },
];

for (const { file, size, scale, bg } of targets) {
  await tab.setViewportSize({ width: size, height: size });
  await tab.setContent(page(size, scale, bg));
  const buffer = await tab.screenshot({ omitBackground: bg === 'transparent' });
  writeFileSync(join(ROOT, 'public', file), buffer);
  console.log('✔', file);
}

await browser.close();
