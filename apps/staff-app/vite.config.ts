import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
  port: 5175,
    proxy: {
      // 规则一：处理所有发往“员工服务”的请求
      '/api-staff': {
        target: 'http://47.96.238.102:5000', // 目标服务器：端口 5000
        changeOrigin: true,
        // 正确的重写规则！把 '/api-staff' 替换成 '/api'
        rewrite: (path) => path.replace(/^\/api-staff/, '/api'), 
      },
      // ↓↓↓↓ 新增这条设备管理的代理规则 ↓↓↓↓
      '/api-device': {
        target: 'http://47.96.238.102:3003', // 目标服务器：端口 3003
        changeOrigin: true,
        // 重写规则：将前端的 /api-device 替换为后端需要的 /api/DeviceManagement
        // 例如: /api-device/devices -> /api/DeviceManagement/devices
        rewrite: (path) => path.replace(/^\/api-device/, '/api/DeviceManagement'),
      },

      // ↓↓↓↓ 新增这条规则，处理所有房间管理请求 ↓↓↓↓
      '/api-room': {
        target: 'http://47.96.238.102:3003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-room/, '/api/RoomManagement'),
      },

      // ↓↓↓↓ 新增这条规则，处理所有 SOS 请求 ↓↓↓↓
      '/api/EmergencySOS': {
        target: 'http://47.96.238.102:5000',
        changeOrigin: true,
      },
       // ↓↓↓↓ 为 7000 端口的服务添加/确认规则 ↓↓↓↓
      '/api/ElderlyInfo': { // <--- 新增的规则！
        target: 'http://47.96.238.102:7000',
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
      // ↓↓↓↓ 新增的活动 API 代理规则 ↓↓↓↓
      '/api/Activity': {
        target: 'http://47.96.238.102:8000',
        changeOrigin: true,
      },
      // ↓↓↓↓ 新增的活动参与 API 代理规则 ↓↓↓↓
      '/api/ActivityParticipation': {
        target: 'http://47.96.238.102:8000',
        changeOrigin: true,
      },
      // ↓↓↓↓ 新增的规则 ↓↓↓↓
      '/api/VisitorRegistration': {
        target: 'http://47.96.238.102:9000', // 假设端口是 9000，请根据实际情况修改
        changeOrigin: true,
      },
       // ↓↓↓↓ 为 9000 端口的公告服务添加新规则 ↓↓↓↓
      '/api/SystemAnnouncement': {
        target: 'http://47.96.238.102:9000',
        changeOrigin: true,
      },
      
    }
  }
})