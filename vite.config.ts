/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Actualización por consentimiento: toast + "Actualizar", jamás auto-reload.
      registerType: 'prompt',
      includeAssets: ['fondo.webp', 'icono.svg'],
      manifest: {
        name: 'Nutrirecetas',
        short_name: 'Nutrirecetas',
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
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
  },
});
