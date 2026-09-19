import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Keeps the Gemini key server-side: the browser only ever talks to /api.
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
});
