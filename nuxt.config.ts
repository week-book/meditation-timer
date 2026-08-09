export default defineNuxtConfig({
  compatibilityDate: '2026-08-08',

  modules: ['@nuxt/eslint'],

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
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
})
