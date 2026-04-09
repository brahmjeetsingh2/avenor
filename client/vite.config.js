import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
  build: {
    target: 'esnext',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React bundle
          'vendor-react':   ['react', 'react-dom', 'react-router-dom'],
          // State + data
          'vendor-state':   ['zustand', 'axios'],
          // Charts (heavy — load separately)
          'vendor-charts':  ['recharts'],
          // Icons
          'vendor-icons':   ['lucide-react'],
          // Realtime
          'vendor-socket':  ['socket.io-client'],
          // Date utils
          'vendor-dates':   ['date-fns'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
