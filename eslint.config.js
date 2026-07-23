import js from '@eslint/js'
import ts from 'typescript-eslint'
import vue from 'eslint-plugin-vue'
import globals from 'globals'

export default ts.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'playwright-report/**', 'test-results/**'] },

  js.configs.recommended,
  ...ts.configs.recommended,
  ...vue.configs['flat/recommended'],

  {
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        parser: ts.parser,
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    rules: {
      // 專案以 <script setup> 為主，單字組件名為既有慣例（App.vue 等）
      'vue/multi-word-component-names': 'off'
    }
  },

  {
    // 測試工具設定與 E2E：跑在 Node，callback 內又會操作 browser 物件
    // （addInitScript / page.evaluate），兩套 globals 都要
    files: ['playwright.config.js', 'e2e/**/*.js', 'vitest.config.ts', 'test/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser }
    }
  }
)
