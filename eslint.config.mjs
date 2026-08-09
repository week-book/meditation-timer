// @ts-check
// withNuxt читается из .nuxt/eslint.config.mjs, который Nuxt генерирует сам
// (модуль '@nuxt/eslint' в nuxt.config.ts) — он уже знает про авто-импорты
// Nuxt (useTimer, useBreathing и т.д.) и не будет ругаться на них как на
// неопределённые переменные, в отличие от голого typescript-eslint конфига.
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Точечные исключения оставлены как warn, а не off,
      // чтобы про них не забыли, но чтобы они не ломали CI сразу.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    ignores: ['**/dist/**', '**/.output/**', '**/coverage/**', '**/node_modules/**'],
  },
)
