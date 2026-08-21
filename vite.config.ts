/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * En GitHub Pages las dos versiones cuelgan de rutas distintas del mismo sitio,
 * así que el bundle necesita saber desde dónde se sirve. Sin `VITE_BASE` (dev y
 * tests) la raíz es `/`.
 */
const BASE = process.env.VITE_BASE ?? '/';

/** Dos PWA instalables en el mismo celular necesitan nombres distintos. */
const ES_STAGING = process.env.VITE_ENTORNO === 'staging';
const NOMBRE = ES_STAGING ? 'Nutrirecetas staging' : 'Nutrirecetas';

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      // Actualización por consentimiento: toast + "Actualizar", jamás auto-reload.
      registerType: 'prompt',
      includeAssets: ['fondo.webp', 'icono.svg'],
      manifest: {
        name: NOMBRE,
        short_name: NOMBRE,
        description: 'Recetario vegano personal con base nutricional. Offline, sin cuentas.',
        lang: 'es-AR',
        display: 'standalone',
        background_color: '#F5EFDC',
        theme_color: '#F5EFDC',
        icons: [
          { src: 'icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icono-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache total: tras instalar, ningún camino crítico toca la red.
        globPatterns: ['**/*.{js,css,html,woff2,webp,png,svg}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
  test: {
    environment: 'node',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts', '.claude/**/*.test.ts'],
  },
});
