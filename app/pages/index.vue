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

    <!-- ==================== ТЕКСТОВЫЙ КОНТЕНТ ДЛЯ ПОИСКОВИКОВ ====================
         Этот блок рендерится на сервере и виден роботам сразу, без выполнения JS.
         Ниже — структура-заготовка под тексты, которые вы допишете сами
         (см. обсуждение по семантическому ядру и кластеру запросов). -->
    <article class="seo-content">
      <h1>Таймер для медитации онлайн</h1>
      <p>
        <!-- TODO: 2-4 предложения — что это, для кого, чем отличается от других таймеров
             (бесплатно, без регистрации, дыхательные техники, звуки, работает офлайн). -->
      </p>

      <section>
        <h2>Дыхательные техники: 4-4, 6-6 и 4-7-8</h2>
        <p>
          <!-- TODO: объяснить каждую технику, для чего она (успокоение, засыпание,
               концентрация), почему именно такие пропорции вдоха/задержки/выдоха. -->
        </p>
      </section>

      <section>
        <h2>Звуки природы и lo-fi для концентрации</h2>
        <p>
          <!-- TODO: про фоновые темы (листва, звёзды, снег, сакура) и lo-fi-музыку —
               отдельный кластер запросов, не пересекающийся с "таймер для медитации". -->
        </p>
      </section>

      <section>
        <h2>Частые вопросы</h2>
        <!-- TODO: 3-5 вопросов-ответов, из них тоже можно сделать FAQPage JSON-LD позже -->
        <dl>
          <dt><!-- Нужна ли регистрация? --></dt>
          <dd><!-- Нет, всё работает прямо в браузере. --></dd>
        </dl>
      </section>
    </article>

    <FactCards />
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
</style>
