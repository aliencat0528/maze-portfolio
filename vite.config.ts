import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  // 部署在 GitHub Pages 的專案頁下（aliencat0528.github.io/art-wall/），
  // 資產路徑必須帶這層前綴。改 repo 名稱時這裡要跟著改。
  // 網址狀態（?c=&w=）用 location.pathname 組出來，不受 base 影響，故無需另外處理。
  base: '/art-wall/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})
