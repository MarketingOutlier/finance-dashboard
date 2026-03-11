import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api/webhook': {
        target: 'https://n8n.srv1415510.hstgr.cloud',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/webhook/, '/webhook/extrato-bancario')
      }
    }
  }
});
