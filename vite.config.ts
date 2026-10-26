import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    server: {
      port: 3001,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        // Prompt explícito para o usuário atualizar (nunca troca a versão no meio de um lançamento)
        registerType: 'prompt',
        injectRegister: null,
        includeAssets: [
          'favicon.ico',
          'favicon-16x16.png',
          'favicon-32x32.png',
          'favicon-192x192.png',
          'favicon-512x512.png',
          'apple-touch-icon.png',
          'maskable-512.png',
          'logo.png',
        ],
        manifest: {
          id: './',
          name: 'Monely Finance',
          short_name: 'Monely',
          description: 'Seu dinheiro, claro e organizado.',
          lang: 'pt-BR',
          dir: 'ltr',
          start_url: './',
          scope: './',
          display: 'standalone',
          display_override: ['standalone'],
          orientation: 'portrait',
          background_color: '#0f1216',
          theme_color: '#0f1216',
          categories: ['finance', 'productivity'],
          icons: [
            {
              src: 'favicon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'favicon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2,webmanifest}'],
          // Não pré-carrega artefatos grandes e não usados pelo shell
          globIgnores: ['**/downloads/**', '**/favicon.png'],
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: false,
          runtimeCaching: [
            {
              // Dados financeiros NUNCA entram no cache do service worker
              urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\//i,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'monely-google-fonts-stylesheets' },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'monely-google-fonts-webfonts',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|webp|ico)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'monely-images',
                expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-motion': ['framer-motion'],
          },
        },
      },
    },
    esbuild: {
      drop: ['debugger'],
      pure: ['console.log', 'console.debug', 'console.info'],
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
