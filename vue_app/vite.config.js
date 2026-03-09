import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api/user_service': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      '/api/auth_service': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      '/api/publications_service': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      '/api/backups_service': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      '/api/orders_service': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      '/publications_service': {
        target: 'http://localhost:8888',
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
})
