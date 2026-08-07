import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ command }) => ({
  base: '/',
  plugins: [
    vue(),
    command === 'serve' && vueDevTools(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
    proxy: {
      '/api/user_service': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
      '/api/auth_service': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
      '/api/publications_service': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
      '/api/backups_service': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
      '/api/backup_service': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
      '/api/orders_service': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
      '/publications_service': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
      '/user_service': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
      '/bcv-api': {
        target: 'https://www.bcv.org.ve/',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/bcv-api/, '')
      },
      '/kitco-api': {
        target: 'https://api.metals.live/',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/kitco-api/, '')
      }
    },
  },
}))
