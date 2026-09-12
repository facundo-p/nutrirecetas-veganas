// Genera el papel de cada tema: un tile WebP con alfa en src/assets/texturas/.
// El tema pone el color del papel y el tile solo agrega lo que lo hace papel
// hecho a mano: manchas de pulpa, grano, fibras cortas en cualquier dirección e
// inclusiones (pedacitos de semilla y hoja). Se corre a mano y el resultado se
// commitea: en runtime no se dibuja nada.
// Uso: node scripts/textura.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'assets', 'texturas');
mkdirSync(OUT, { recursive: true });

/** Lado del tile en píxeles CSS. Tiene que coincidir con `--tile-textura`.
    Va a 1×: al doble y con alfa, el grano fino no comprime y el tile pesaba
    470 KB; una trama de papel no necesita la nitidez de un texto. */
const LADO = 360;
const ESCALA = 1;
const CALIDAD = 0.8;

const TEXTURAS = {
  papel: {
    fibras: 300, fibrasClaras: 0.45, inclusiones: 90,
    fibra: [120, 98, 66], fibraClara: [250, 246, 234], mancha: [120, 96, 60],
    grano: [92, 74, 46], granoClaro: [255, 255, 255],
    paletaInclusion: [[92, 74, 46], [96, 110, 60], [150, 110, 70], [60, 50, 36]],
    opacidad: { mancha: 0.16, grano: 0.16, granoClaro: 0.3, fibras: 0.42, inclusiones: 0.7 },
  },
  musgo: {
    fibras: 230, fibrasClaras: 0.3, inclusiones: 70,
    fibra: [8, 18, 11], fibraClara: [214, 222, 200], mancha: [0, 0, 0],
    grano: [0, 0, 0], granoClaro: [237, 233, 216],
    paletaInclusion: [[8, 18, 11], [120, 140, 90], [190, 175, 130]],
    opacidad: { mancha: 0.3, grano: 0.22, granoClaro: 0.05, fibras: 0.36, inclusiones: 0.6 },
  },
};

/** Semilla fija: regenerar da el mismo papel, y el diff del WebP dice si cambió algo. */
function azar(semilla) {
  return () => {
    semilla |= 0;
    semilla = (semilla + 0x6d2b79f5) | 0;
    let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rgb = ([r, g, b]) => `rgb(${r},${g},${b})`;

/** Ruido de turbulencia pasado a alfa: k y c recortan qué parte del ruido se ve. */
function ruido(id, frecuencia, octavas, semilla, [r, g, b], k, c) {
  return (
    `<filter id='${id}' x='0' y='0' width='100%' height='100%'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='${frecuencia}' numOctaves='${octavas}' seed='${semilla}' stitchTiles='stitch'/>` +
    `<feColorMatrix values='0 0 0 0 ${r / 255} 0 0 0 0 ${g / 255} 0 0 0 0 ${b / 255} ${k} 0 0 0 ${c}'/></filter>`
  );
}

/** Lo que cruza un borde se dibuja también del otro lado: el tile no tiene costura. */
function envolver(x, y, dibujar) {
  let trazos = '';
  for (const dx of [-LADO, 0, LADO]) {
    for (const dy of [-LADO, 0, LADO]) {
      if (dx && (x + dx < -40 || x + dx > LADO + 40)) continue;
      if (dy && (y + dy < -40 || y + dy > LADO + 40)) continue;
      trazos += dibujar(x + dx, y + dy);
    }
  }
  return trazos;
}

function svgDePapel(t, semilla = 7) {
  const r = azar(semilla);
  const n = (v) => v.toFixed(1);
  let fibras = '';
  for (let i = 0; i < t.fibras; i++) {
    const x = r() * LADO, y = r() * LADO, angulo = r() * Math.PI * 2;
    const largo = 5 + r() ** 2 * 26, curva = (r() - 0.5) * largo * 0.9;
    const x2 = x + Math.cos(angulo) * largo, y2 = y + Math.sin(angulo) * largo;
    const cx = (x + x2) / 2 - Math.sin(angulo) * curva, cy = (y + y2) / 2 + Math.cos(angulo) * curva;
    const color = rgb(r() < t.fibrasClaras ? t.fibraClara : t.fibra);
    const ancho = (0.3 + r() * 0.6).toFixed(2), opacidad = (0.25 + r() * 0.55).toFixed(2);
    fibras += envolver(x, y, (X, Y) =>
      `<path d='M${n(X)} ${n(Y)}Q${n(cx - x + X)} ${n(cy - y + Y)} ${n(x2 - x + X)} ${n(y2 - y + Y)}' ` +
      `stroke='${color}' stroke-width='${ancho}' stroke-opacity='${opacidad}' fill='none' stroke-linecap='round'/>`);
  }
  let inclusiones = '';
  for (let i = 0; i < t.inclusiones; i++) {
    const x = r() * LADO, y = r() * LADO, rx = 0.5 + r() * 1.4, ry = rx * (0.4 + r() * 0.6), giro = Math.round(r() * 180);
    const color = rgb(t.paletaInclusion[Math.floor(r() * t.paletaInclusion.length)]), opacidad = (0.35 + r() * 0.45).toFixed(2);
    inclusiones += envolver(x, y, (X, Y) =>
      `<ellipse cx='${n(X)}' cy='${n(Y)}' rx='${rx.toFixed(2)}' ry='${ry.toFixed(2)}' ` +
      `transform='rotate(${giro} ${n(X)} ${n(Y)})' fill='${color}' fill-opacity='${opacidad}'/>`);
  }
  const o = t.opacidad;
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' width='${LADO}' height='${LADO}' viewBox='0 0 ${LADO} ${LADO}'>` +
    ruido('m', '.006', 3, 4, t.mancha, 1.6, -0.62) +
    ruido('m2', '.02', 2, 5, t.mancha, 1.3, -0.5) +
    ruido('g', '.95', 2, 2, t.grano, 3.4, -2.15) +
    ruido('c', '.7', 2, 9, t.granoClaro, -3.4, 1.2) +
    `<rect width='${LADO}' height='${LADO}' filter='url(#m)' opacity='${o.mancha}'/>` +
    `<rect width='${LADO}' height='${LADO}' filter='url(#m2)' opacity='${o.mancha * 0.6}'/>` +
    `<rect width='${LADO}' height='${LADO}' filter='url(#g)' opacity='${o.grano}'/>` +
    `<rect width='${LADO}' height='${LADO}' filter='url(#c)' opacity='${o.granoClaro}'/>` +
    `<g opacity='${o.fibras}'>${fibras}</g><g opacity='${o.inclusiones}'>${inclusiones}</g></svg>`
  );
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const [tema, parametros] of Object.entries(TEXTURAS)) {
    const svg = svgDePapel(parametros);
    // El SVG se dibuja como imagen en un canvas del doble de tamaño y el canvas
    // exporta WebP con alfa: Chromium sabe codificarlo, así no hace falta sharp.
    const dataUrl = await page.evaluate(
      async ({ svg, lado, calidad }) => {
        const img = new Image();
        img.src = 'data:image/svg+xml,' + encodeURIComponent(svg);
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = lado;
        canvas.getContext('2d').drawImage(img, 0, 0, lado, lado);
        return canvas.toDataURL('image/webp', calidad);
      },
      { svg, lado: LADO * ESCALA, calidad: CALIDAD },
    );
    const bytes = Buffer.from(dataUrl.split(',')[1], 'base64');
    writeFileSync(join(OUT, `${tema}.webp`), bytes);
    console.log(`${tema}.webp`, `${Math.round(bytes.length / 1024)} KB`);
  }
} finally {
  await browser.close();
}
