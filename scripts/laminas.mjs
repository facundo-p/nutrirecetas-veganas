// Pasa cada grabado de docs/assets/laminas/ a una máscara de tinta en
// src/assets/laminas/<id>.webp: el alfa sale de qué tan oscuro es el trazo, así
// que el papel del original desaparece y el color lo pone el tema con
// --ilustracion. Se corre a mano y el resultado se commitea.
// Uso: node scripts/laminas.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGINALES = join(ROOT, 'docs', 'assets', 'laminas');
const OUT = join(ROOT, 'src', 'assets', 'laminas');
mkdirSync(OUT, { recursive: true });

/** Lado mayor de la máscara. La más grande se ve a ~230 px CSS: a 480 y calidad
    0,8 las 32 pesaban 1,9 MB de precache para una nitidez que no se nota. */
const LADO_MAYOR = 400;
const CALIDAD = 0.72;
/** Más claro que esto es papel; más oscuro que TINTA_PLENA, trazo pleno. */
const PAPEL = 232;
const TINTA_PLENA = 70;

/**
 * Recortes a la figura principal, en fracciones del original [x, y, ancho, alto].
 * El limón y el garbanzo vienen de láminas botánicas con subfiguras numeradas.
 */
const RECORTES = {
  limon: [0, 0.36, 0.38, 0.62],
  garbanzo: [0.25, 0.1, 0.52, 0.9],
};

const fuentes = JSON.parse(readFileSync(join(ORIGINALES, 'fuentes.json'), 'utf8'));

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const [id, { archivo }] of Object.entries(fuentes)) {
    const ext = archivo.split('.').pop();
    const tipo = ext === 'jpg' ? 'image/jpeg' : 'image/png';
    const original = `data:${tipo};base64,${readFileSync(join(ORIGINALES, archivo)).toString('base64')}`;
    const resultado = await page.evaluate(
      async ({ original, recorte, papel, tintaPlena, ladoMayor, calidad }) => {
        const img = new Image();
        img.src = original;
        await img.decode();
        const [fx, fy, fw, fh] = recorte ?? [0, 0, 1, 1];
        const sx = Math.round(fx * img.width), sy = Math.round(fy * img.height);
        const sw = Math.round(fw * img.width), sh = Math.round(fh * img.height);

        const lienzo = document.createElement('canvas');
        lienzo.width = sw;
        lienzo.height = sh;
        const ctx = lienzo.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = '#fff'; // un PNG con alfa propio se lee sobre papel blanco
        ctx.fillRect(0, 0, sw, sh);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        const datos = ctx.getImageData(0, 0, sw, sh);
        const p = datos.data;

        let x0 = sw, y0 = sh, x1 = -1, y1 = -1;
        for (let i = 0; i < p.length; i += 4) {
          const luz = 0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2];
          const alfa = Math.max(0, Math.min(1, (papel - luz) / (papel - tintaPlena))) ** 0.85;
          p[i] = p[i + 1] = p[i + 2] = 0;
          p[i + 3] = Math.round(alfa * 255);
          if (p[i + 3] > 24) {
            const x = (i / 4) % sw, y = Math.floor(i / 4 / sw);
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
        }
        ctx.putImageData(datos, 0, 0);

        // Recorta al trazo y lleva el lado mayor a LADO_MAYOR.
        const ancho = x1 - x0 + 1, alto = y1 - y0 + 1;
        const escala = Math.min(1, ladoMayor / Math.max(ancho, alto));
        const salida = document.createElement('canvas');
        salida.width = Math.round(ancho * escala);
        salida.height = Math.round(alto * escala);
        salida.getContext('2d').drawImage(lienzo, x0, y0, ancho, alto, 0, 0, salida.width, salida.height);
        return { webp: salida.toDataURL('image/webp', calidad), ancho: salida.width, alto: salida.height };
      },
      { original, recorte: RECORTES[id], papel: PAPEL, tintaPlena: TINTA_PLENA, ladoMayor: LADO_MAYOR, calidad: CALIDAD },
    );
    const bytes = Buffer.from(resultado.webp.split(',')[1], 'base64');
    writeFileSync(join(OUT, `${id}.webp`), bytes);
    console.log(id.padEnd(10), `${resultado.ancho}×${resultado.alto}`, `${Math.round(bytes.length / 1024)} KB`);
  }
} finally {
  await browser.close();
}
