import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Substituições para módulos do Node.js
      'crypto': 'crypto-browserify',
      'stream': 'stream-browserify',
      'util': 'util',
      'assert': 'assert',
      'events': 'events',
      'process': 'process/browser',
      'buffer': 'buffer',
    },
  },
  define: {
    'process.env': {},
    global: {},
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
}); 