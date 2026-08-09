<script setup lang="ts">
// Статический массив — рендерится на сервере вместе со страницей, как и
// FactCards рядом. QR-коды раньше генерировались сторонним сервисом
// api.qrserver.com через <img src="https://...">, что делало карточки
// зависимыми от чужого сайта (нет сети/сервис лёг/заблокирован — нет
// QR-кода). Теперь SVG сгенерированы один раз офлайн (см. скрипт ниже)
// и лежат прямо в public/qr — раздаются нашим же сервером, без единого
// внешнего запроса.
//
// Скрипт генерации (python, пакет qrcode):
//   qrcode.QRCode(error_correction=ERROR_CORRECT_M, box_size=10, border=2,
//                 image_factory=qrcode.image.svg.SvgPathFillImage)
//   .make_image(fill_color="#3a3a3a", back_color="white")
// Если ссылки поменяются — файлы в public/qr нужно перегенерировать вручную.
interface SocialLink {
  label: string
  displayUrl: string
  href: string
  qrFile: string
}

const links: SocialLink[] = [
  {
    label: 'Сайт',
    displayUrl: 'week-book.ru',
    href: 'https://week-book.ru/',
    qrFile: 'site',
  },
  {
    label: 'Телеграм-канал',
    displayUrl: 't.me/weeekbook',
    href: 'https://t.me/weeekbook',
    qrFile: 'telegram',
  },
  {
    label: 'Вопросы и жалобы',
    displayUrl: 'Написать в директ',
    href: 'https://t.me/weeekbook?direct',
    qrFile: 'telegram-direct',
  },
  {
    label: 'GitHub',
    displayUrl: 'github.com/week-book',
    href: 'https://github.com/week-book',
    qrFile: 'github',
  },
]

const QR_SIZE = 180
</script>

<template>
  <section class="social" id="social">
    <h2>Мои соцсети</h2>
    <div class="social__grid">
      <article v-for="link in links" :key="link.href" class="social__card">
        <a :href="link.href" target="_blank" rel="noopener noreferrer" class="social__qr-link">
          <img
            :src="`/qr/${link.qrFile}.svg`"
            :width="QR_SIZE"
            :height="QR_SIZE"
            :alt="`QR-код: ${link.label}`"
            loading="lazy"
            decoding="async"
            class="social__qr"
          />
        </a>
        <h3>{{ link.label }}</h3>
        <a :href="link.href" target="_blank" rel="noopener noreferrer" class="social__link">
          {{ link.displayUrl }}
        </a>
      </article>
    </div>
  </section>
</template>

<style scoped>
.social {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 16px 64px;
  /* отступ сверху при переходе по якорной ссылке из навигации —
     без него заголовок прилипал вплотную к верхнему краю экрана */
  scroll-margin-top: 24px;
}

.social h2 {
  text-align: center;
  margin-bottom: 24px;
}

.social__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.social__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid #e2dbe7;
  border-radius: 16px;
  padding: 20px;
}

.social__qr-link {
  display: block;
  line-height: 0;
}

.social__qr {
  width: 140px;
  height: 140px;
  border-radius: 8px;
  background: #fff;
  padding: 8px;
  border: 1px solid #e2dbe7;
}

.social__card h3 {
  font-size: 1rem;
  margin: 14px 0 4px;
  color: #3a3a3a;
}

.social__link {
  font-size: 0.85rem;
  color: #9a8fae;
  text-decoration: underline;
  text-underline-offset: 3px;
  word-break: break-word;
}

.social__link:hover {
  opacity: 0.7;
}

@media (max-width: 400px) {
  .social__grid {
    grid-template-columns: 1fr;
  }
}
</style>
