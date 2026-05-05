import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,            // listen on all interfaces (needed for tunnels)
    port: 5173,
    strictPort: true,
    // Allow any host (dev-only) so ngrok / cloudflared / etc. all work
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:8000',
      '/uploads': 'http://localhost:8000',
      '/declarations': 'http://localhost:8000',
    },
  },
});
