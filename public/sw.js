// В проекте нет и не было PWA/service worker'а — этот файл существует
// только для того, чтобы отдать браузеру валидный ответ на /sw.js,
// если он по какой-то причине (обычно — воркер, оставшийся от другой
// версии сайта или локальной разработки) продолжает его запрашивать.
// Без этого файла запрос улетал в 404 → Nuxt рендерил страницу ошибки →
// это, в свою очередь, упиралось в известный баг Pinia/Nuxt при SSR-
// сериализации payload (obj.hasOwnProperty is not a function,
// см. https://github.com/vuejs/pinia/issues/2872).
//
// Воркер ничего не кэширует и не перехватывает — он сразу же снимает
// свою регистрацию и перезагружает открытые вкладки, чтобы браузер
// больше никогда не пытался его обновлять.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', async () => {
  await self.registration.unregister()
  const clientsList = await self.clients.matchAll({ type: 'window' })
  for (const client of clientsList) {
    client.navigate(client.url)
  }
})
