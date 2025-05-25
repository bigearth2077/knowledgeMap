import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    include: ['@element-plus/icons-vue'],
  },
  server: {
    fs: {
      // 允许访问src目录
      allow: ['../'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 代理的目标地址
        changeOrigin: true, // 是否改变源地址
        rewrite: (path) => path.replace(/^\/api/, ''), // 可选：重写路径，去掉 /api 前缀
      },
    },
  },
})
