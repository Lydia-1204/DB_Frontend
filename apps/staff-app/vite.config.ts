import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 规则一：处理所有发往“员工服务”的请求
      '/api-staff': {
        target: 'http://47.96.238.102:5000', // 目标服务器：端口 5000
        changeOrigin: true,
        // 正确的重写规则！把 '/api-staff' 替换成 '/api'
        rewrite: (path) => path.replace(/^\/api-staff/, '/api'), 
      },

      // 规则二、三、四... 也需要根据各自后端的实际路径进行调整
      // 假设其他服务的后端路径也都是 /api/... 开头
      '/api-room': {
        target: 'http://47.96.238.102:7000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-room/, '/api'),
      },
      
      '/api-medical': {
        target: 'http://47.96.238.102:9006',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-medical/, '/api'),
      },
      
      '/api-activity': {
        target: 'http://47.96.238.102:9000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-activity/, '/api'),
      }
    }
  }
})