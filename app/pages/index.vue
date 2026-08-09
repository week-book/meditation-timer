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
</script>

<template>
  <main>
    <!-- ==================== ВИДЖЕТ ТАЙМЕРА (client-only) ====================
         .timer-stage центрирует именно эту зону на весь экран, а не body
         целиком — иначе SEO-статья ниже утягивает виджет вместе с собой
         при центрировании (см. style.css). -->
    <div class="timer-stage">
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

    <!-- ==================== НАВИГАЦИЯ ПО РАЗДЕЛАМ СТРАНИЦЫ ====================
         Ссылки только на реально существующие блоки страницы (никаких
         придуманных разделов) — ведут на соответствующие id ниже. -->
    <nav class="page-nav" aria-label="Разделы страницы">
      <a href="#facts">Факты о медитации</a>
      <a href="#social">Мои соцсети</a>
    </nav>

    <FactCards />

    <SocialCards />
  </main>
</template>

<style scoped>
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

.page-nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  max-width: 680px;
  margin: 0 auto 16px;
  padding: 0 16px;
}

.page-nav a {
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid #d8d1e0;
  color: #5a5a5a;
  font-size: 0.85rem;
  text-decoration: none;
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
</style>
