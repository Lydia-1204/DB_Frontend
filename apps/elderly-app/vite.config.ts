// 此文件为 Vite 的项目配置文件，主要用于配置插件（如 React），可根据需要扩展更多构建和开发相关设置。
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Diet recommendations -> port 7000
      '/api/DietRecommendation': {
        target: 'http://47.96.238.102:7000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      // Elderly info (profile) -> port 7000
      '/api/ElderlyInfo': {
        target: 'http://47.96.238.102:7000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/api/ElderlyRecord': {
        target: 'http://47.96.238.102:7000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      // Voice reminders and some other services on port 8000
      '/api/VoiceReminder': {
        target: 'http://47.96.238.102:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/api/Activity': {
        target: 'http://47.96.238.102:6006',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/api/ActivityParticipation': {
        target: 'http://47.96.238.102:6006',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      // Health monitoring
      '/api/HealthMonitoring': {
        target: 'http://47.96.238.102:3003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      // Medical orders
      '/api/medical': {
        target: 'http://47.96.238.102:6006',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      // Emergency and NursingPlan, etc.
      '/api/EmergencySOS': {
        target: 'http://47.96.238.102:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      // Account management (login, change password)
      // Proxy all Account endpoints (login, change-password, etc.) to backend
      '/api/Account': {
        target: 'http://47.96.238.102:7000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/api/staff-info/nursing-plans': {
        target: 'http://47.96.238.102:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})
