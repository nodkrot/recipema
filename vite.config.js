import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync } from 'fs';

// Plugin to copy service worker to dist
function copyServiceWorker() {
  return {
    name: 'copy-service-worker',
    writeBundle() {
      try {
        copyFileSync(
          resolve(__dirname, 'app/service-worker.js'),
          resolve(__dirname, 'dist/service-worker.js')
        );
        console.log('✓ Service worker copied to dist');
      } catch (err) {
        console.error('Failed to copy service worker:', err);
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), copyServiceWorker()],
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
});

