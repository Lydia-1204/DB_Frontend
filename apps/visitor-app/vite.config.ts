// 此文件为 Vite 的项目配置文件，主要用于配置插件（如 React），可根据需要扩展更多构建和开发相关设置。
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { port: 5176 }
})
