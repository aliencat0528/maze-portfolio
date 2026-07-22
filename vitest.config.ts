import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// 單元測試只跑邏輯層（composables / utils），不進瀏覽器。
// 端到端流程走 Playwright，設定見 playwright.config.ts。
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  test: {
    // jsdom 而非 happy-dom：happy-dom 修掉 VM context escape（GHSA-37j7-fg3j-429f）
    // 的版本要求 Node >= 20，本機是 18。見 MR-013
    environment: 'jsdom',
    globals: true,
    setupFiles: ['test/setup.ts'],
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/composables/**', 'src/utils/**'],
      reporter: ['text', 'html']
    }
  }
})
