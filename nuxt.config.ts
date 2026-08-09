export default defineNuxtConfig({
  compatibilityDate: '2026-08-08',

  modules: ['@nuxt/eslint', '@pinia/nuxt', '@vite-pwa/nuxt'],

  // SSR включён на уровне всего приложения — HTML страницы (текст, мета-теги,
  // структура) рендерится на сервере и сразу виден роботам.
  // Сам таймер внутри страницы дальше рендерится только на клиенте,
  // см. <ClientOnly> в app/pages/index.vue — это осознанный выбор:
  // таймер использует Web Audio API, requestFullscreen и т.п.,
  // которых на сервере просто нет, и рендерить их там не нужно и не за чем.
  ssr: true,

  devtools: { enabled: true },

  css: ['~/assets/css/style.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'ru' },
      // Дефолты на случай, если конкретная страница не переопределит их через useSeoMeta.
      title: 'Таймер для медитации онлайн',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#ebe3f1' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/favicon-48x48.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },

  pwa: {
    // 'generateSW' сам собирает service worker по описанным ниже правилам —
    // руками воркер не пишем, в отличие от старого public/sw.js.
    strategies: 'generateSW',
    registerType: 'autoUpdate',

    manifest: {
      name: 'Таймер для медитации',
      short_name: 'Медитация',
      description: 'Онлайн-таймер для медитации с дыхательными техниками и lo-fi музыкой',
      lang: 'ru',
      start_url: '/',
      display: 'standalone',
      background_color: '#ebe3f1',
      theme_color: '#ebe3f1',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        {
          src: '/icons/icon-maskable-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable',
        },
        {
          src: '/icons/icon-maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },

    workbox: {
      // Автономная работа: HTML/JS/CSS/иконки — по стратегии "сначала кэш"
      // с фоновым обновлением, чтобы таймер открывался и без сети.
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      runtimeCaching: [
        {
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: { cacheName: 'pages-cache' },
        },
      ],
    },

    client: {
      installPrompt: true,
    },

    devOptions: {
      // Позволяет проверять PWA прямо в 'nuxt dev', не только после build.
      enabled: true,
      type: 'module',
    },
  },
})
