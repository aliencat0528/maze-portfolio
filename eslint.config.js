import js from '@eslint/js'
import ts from 'typescript-eslint'
import vue from 'eslint-plugin-vue'
import globals from 'globals'

export default ts.config(
  { ignores: ['dist/**', 'node_modules/**'] },

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
  }
)
