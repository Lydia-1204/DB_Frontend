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
      // ↓↓↓↓ 新增这条规则，处理所有 SOS 请求 ↓↓↓↓
      '/api/EmergencySOS': {
        target: 'http://47.96.238.102:5000',
        changeOrigin: true,
      },

      // ↓↓↓↓ 规则二：我们新加的，所有老人/登记/饮食相关的请求，都发往 7000 端口 ↓↓↓↓
      '/api/CheckIn': {
        target: 'http://47.96.238.102:7000',
        changeOrigin: true,
      },
      '/api/DietRecommendation': {
        target: 'http://47.96.238.102:7000',
        changeOrigin: true,
      },
      '/api/ElderlyRecord': {
        target: 'http://47.96.238.102:7000',
        changeOrigin: true,
      },
      '/api/family': {
        target: 'http://47.96.238.102:7000',
        changeOrigin: true,
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