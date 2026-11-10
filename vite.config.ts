import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png', 'favicon.svg'],
      manifest: {
        name: 'Dieta',
        short_name: 'Dieta',
        description: 'Planejamento de dieta com metas de calorias e macros',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f6f3ec',
        theme_color: '#14532d',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // O app é só online: o service worker guarda apenas a "casca" (JS/CSS/ícones).
        // Chamadas ao Supabase nunca passam pelo cache.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/rest\//, /^\/auth\//],
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      },
    }),
  ],
});
