<script setup lang="ts">
// Всё в этом файле рендерится на сервере (SSR) и приходит в браузер
// уже готовым HTML с текстом — это как раз то, чего не хватало в CSR-версии.
// Сам виджет таймера ниже подключён через <ClientOnly> и рендерится
// только в браузере, серверу до него дела нет.

useSeoMeta({
  title: 'Таймер для медитации онлайн — дыхательные техники, звуки природы',
  description:
    'Бесплатный таймер для медитации с дыхательными техниками (4-4, 6-6, 4-7-8), ' +
    'анимированным кругом дыхания, звуками природы и lo-fi музыкой. Работает в браузере, без регистрации.',
  ogTitle: 'Таймер для медитации онлайн',
  ogDescription:
    'Дыхательные техники, анимированный круг дыхания и звуки природы — прямо в браузере.',
  ogType: 'website',
  // ogImage: 'https://ваш-домен.ru/og-cover.png', // TODO: добавить картинку-превью для соцсетей
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://ваш-домен.ru/' }], // TODO: подставить реальный домен
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Таймер для медитации',
        applicationCategory: 'HealthApplication',
        operatingSystem: 'Any (веб-браузер)',
        url: 'https://ваш-домен.ru/', // TODO
        description:
          'Онлайн-таймер для медитации с дыхательными техниками, звуками природы и lo-fi музыкой.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'RUB',
        },
      }),
    },
  ],
})

/* ---------- Подсветка активного раздела в нижней навигации ---------- */
// По умолчанию (пока JS не догрузился/во время SSR) активен «Таймер» — это
// же первый экран, который видит пользователь. Дальше IntersectionObserver
// следит, какой из трёх блоков сейчас во вьюпорте, и переключает подсветку
// без единого слушателя scroll (дешевле и не дёргается).
const activeSection = ref<'home' | 'facts' | 'social'>('home')
let observer: IntersectionObserver | null = null

onMounted(() => {
  const sections: Array<'home' | 'facts' | 'social'> = ['home', 'facts', 'social']
  const visibleRatios = new Map<string, number>()

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        visibleRatios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0)
      }
      // раздел с наибольшей видимой площадью и считаем текущим —
      // так подсветка не "прыгает" на стыке двух блоков
      let best: string = activeSection.value
      let bestRatio = 0
      for (const [id, ratio] of visibleRatios) {
        if (ratio > bestRatio) {
          bestRatio = ratio
          best = id
        }
      }
      if (bestRatio > 0) {
        activeSection.value = best as typeof activeSection.value
      }
    },
    // средняя полоса вьюпорта — с поправкой снизу на высоту фикс. навигации
    { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '-10% 0px -25% 0px' },
  )

  for (const id of sections) {
    const el = document.getElementById(id)
    if (el) observer.observe(el)
  }
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <main>
    <!-- ==================== ВИДЖЕТ ТАЙМЕРА (client-only) ====================
         .timer-stage центрирует именно эту зону на весь экран, а не body
         целиком — иначе SEO-статья ниже утягивает виджет вместе с собой
         при центрировании (см. style.css). -->
    <div id="home" class="timer-stage">
      <ClientOnly>
        <MeditationTimer />
        <template #fallback>
          <!-- Простой скелетон на время до гидратации, чтобы не скакал layout (CLS) -->
          <div class="timer-fallback" aria-hidden="true">
            <div class="timer-fallback__circle" />
          </div>
        </template>
      </ClientOnly>
    </div>

    <FactCards />

    <SocialCards />

    <!-- ==================== НАВИГАЦИЯ ПО РАЗДЕЛАМ СТРАНИЦЫ ====================
         Закреплена снизу экрана, поэтому видна постоянно — и над таймером,
         и при просмотре фактов/соцсетей. Ссылки ведут на реально
         существующие блоки страницы (id ниже) плюс кнопка возврата к
         таймеру. -->
    <nav class="page-nav" aria-label="Разделы страницы">
      <a href="#home" :class="{ active: activeSection === 'home' }">Таймер</a>
      <a href="#facts" :class="{ active: activeSection === 'facts' }">Факты</a>
      <a href="#social" :class="{ active: activeSection === 'social' }">Соцсети</a>
    </nav>
  </main>
</template>

<style scoped>
main {
  /* запас снизу под фиксированную нижнюю навигацию, чтобы последний
     блок страницы не оказывался у неё под капотом */
  padding-bottom: 72px;
}

.timer-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
}
.timer-fallback__circle {
  width: 220px;
  height: 220px;
  border-radius: 50%;
  border: 2px solid #c9c2b2;
  opacity: 0.5;
}

.seo-content {
  max-width: 680px;
  margin: 0 auto;
  padding: 24px 16px 64px;
  color: #3a3a3a;
  line-height: 1.6;
}
.seo-content h2 {
  margin-top: 32px;
  margin-bottom: 8px;
}

/* Закреплена снизу вьюпорта — остаётся на экране при любой прокрутке,
   поверх таймера и остальных блоков. */
.page-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom, 0px));
  background: rgba(244, 241, 234, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-top: 1px solid #e2dbe7;
}

.page-nav a {
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid #d8d1e0;
  background: #fff;
  color: #5a5a5a;
  font-size: 0.85rem;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background 0.2s,
    color 0.2s,
    border-color 0.2s;
}

.page-nav a:hover {
  background: #9a8fae;
  border-color: #9a8fae;
  color: #fff;
}

.page-nav a.active {
  background: #9a8fae;
  border-color: #9a8fae;
  color: #fff;
}
</style>
