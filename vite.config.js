import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['images/*.png'],
      manifest: {
        name: 'RecipeMa',
        short_name: 'RecipeMa',
        description: 'Family recipe hub',
        theme_color: '#1890ff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/images/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/images/icon-256x256.png',
            sizes: '256x256',
            type: 'image/png'
          },
          {
            src: '/images/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: '/images/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // In dev mode, skip precaching (Vite serves files directly)
        // In production, precache all static assets
        globPatterns: mode === 'production'
          ? ['**/*.{js,css,html,ico,png,svg,webmanifest}']
          : [],
        runtimeCaching: [
          {
            // Cache Firebase Storage images with a cache-first strategy
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'recipema-images-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
        ]
      },
      // Only enable service worker in development mode
      devOptions: mode === 'development' ? {
        enabled: true,
        type: 'module'
      } : {
        enabled: false
      }
    })
  ],
  root: 'app',
  envDir: '..',
  publicDir: '../public',
  esbuild: {
    loader: 'jsx',
    include: /app\/.*\.js$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'app/index.html')
      }
    }
  },
  server: {
    port: 1234,
    open: true
  }
}));

