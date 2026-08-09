<script setup lang="ts">
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import type { WeatherTheme } from '~/types'

/* ---------- Таймер ---------- */
const timer = useTimer(5)
const durationPresets = [1, 5, 10, 20]
const activeDuration = ref(5)

/* ---------- Дыхание ---------- */
const breathing = useBreathing()
const breathPresets = [
  { label: '4-4', inhale: 4, hold: 0, exhale: 4 },
  { label: '6-6', inhale: 6, hold: 0, exhale: 6 },
  { label: '4-7-8', inhale: 4, hold: 7, exhale: 8 },
]
const activeBreathPreset = ref('4-4')
const customBreathOpen = ref(false)
const inhaleInput = ref(4)
const holdInput = ref(0)
const exhaleInput = ref(4)

// ключ для пересоздания круга — форсирует перезапуск CSS-анимации при смене ритма
const breathKey = ref(0)

function selectBreathPreset(preset: (typeof breathPresets)[number]) {
  activeBreathPreset.value = preset.label
  breathing.config.inhale = preset.inhale
  breathing.config.hold = preset.hold
  breathing.config.exhale = preset.exhale
  inhaleInput.value = preset.inhale
  holdInput.value = preset.hold
  exhaleInput.value = preset.exhale
  breathKey.value++
}

function applyCustomBreath() {
  const inhale = Math.max(1, inhaleInput.value || 4)
  const hold = Math.max(0, holdInput.value || 0)
  const exhale = Math.max(1, exhaleInput.value || 4)
  breathing.config.inhale = inhale
  breathing.config.hold = hold
  breathing.config.exhale = exhale
  activeBreathPreset.value = ''
  breathKey.value++
}

// динамические keyframes дыхания, зависящие от текущего ритма
const breathingCss = computed(() => {
  const inhaleEnd = breathing.inhaleEndPct.value
  const holdEnd = breathing.holdEndPct.value
  return `
    @keyframes breathe {
      0% { transform: scale(1); border-color: #c9c2b2; box-shadow: 0 0 0 rgba(220, 200, 230, 0); }
      ${inhaleEnd}% { transform: scale(1.08); border-color: #b9a9cc; box-shadow: 0 0 40px rgba(200, 180, 220, 0.5); }
      ${holdEnd}% { transform: scale(1.08); border-color: #b9a9cc; box-shadow: 0 0 40px rgba(200, 180, 220, 0.5); }
      100% { transform: scale(1); border-color: #c9c2b2; box-shadow: 0 0 0 rgba(220, 200, 230, 0); }
    }
    @keyframes shimmer {
      0% { background-position: 0% 50%; }
      ${inhaleEnd}% { background-position: 100% 50%; }
      ${holdEnd}% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `
})

watchEffect(() => {
  document.documentElement.style.setProperty(
    '--breathe-duration',
    breathing.totalDuration.value + 's',
  )
})

/* ---------- Частицы фона ---------- */
const { particles, startWeather } = useParticles()
const weatherOptions: { theme: WeatherTheme; label: string }[] = [
  { theme: 'none', label: 'Нет' },
  { theme: 'leaves', label: 'Листва' },
  { theme: 'stars', label: 'Звёзды' },
  { theme: 'snow', label: 'Снег' },
  { theme: 'petals', label: 'Сакура' },
]
const activeWeather = ref<WeatherTheme>('none')

function selectWeather(theme: WeatherTheme) {
  activeWeather.value = theme
  startWeather(theme)
}

/* ---------- Lo-fi музыка ---------- */
const lofi = useLofi()

/* ---------- Полноэкранный режим ---------- */
const fullscreen = useFullscreen()

/* ---------- Настройки (сворачиваемая панель) ---------- */
const settingsOpen = ref(false)

/* ---------- Управление таймером и состоянием сессии ---------- */
function handleStartPause() {
  if (timer.running.value) {
    timer.pause()
    breathing.stopBreathing()
  } else {
    timer.start(() => {
      breathing.stopBreathing()
      lofi.stop()
    })
    breathing.start()
  }
}

function handleReset() {
  timer.reset()
  breathing.stopBreathing()
}

function selectDuration(min: number) {
  activeDuration.value = min
  timer.setDuration(min)
  breathing.stopBreathing()
}

const startBtnLabel = computed(() => {
  if (timer.running.value) return 'Пауза'
  if (timer.remaining.value !== timer.totalSeconds.value && timer.remaining.value > 0)
    return 'Продолжить'
  return 'Начать'
})

// класс "дыхания" на body — фоновый shimmer-эффект охватывает весь экран,
// поэтому переключается напрямую на document.body, а не только внутри #app
watch(
  () => breathing.active.value,
  (active) => {
    document.body.classList.toggle('breathing', active)
  },
)
watch(
  () => fullscreen.isFullscreen.value,
  (fs) => {
    document.body.classList.toggle('is-fullscreen', fs)
  },
)

onMounted(() => {
  document.body.classList.toggle('is-fullscreen', fullscreen.isFullscreen.value)
})
</script>

<template>
  <component :is="'style'">{{ breathingCss }}</component>

  <div id="particlesLayer" class="particles-layer">
    <span
      v-for="p in particles"
      :key="p.id"
      class="particle"
      :style="{
        left: p.left + 'vw',
        '--fall-duration': p.duration + 's',
        '--sway-duration': p.swayDuration + 's',
        fontSize: p.size + 'px',
        opacity: p.opacity,
      }"
      >{{ p.emoji }}</span
    >
  </div>

  <button
    v-if="fullscreen.isSupported"
    class="fullscreen-toggle"
    title="Полноэкранный режим"
    aria-label="Полноэкранный режим"
    @click="fullscreen.toggle"
  >
    <svg
      class="icon-expand"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3"></path>
      <path d="M21 8V5a2 2 0 0 0-2-2h-3"></path>
      <path d="M3 16v3a2 2 0 0 0 2 2h3"></path>
      <path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
    </svg>
    <svg
      class="icon-compress"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M8 3v3a2 2 0 0 1-2 2H3"></path>
      <path d="M21 8h-3a2 2 0 0 1-2-2V3"></path>
      <path d="M3 16h3a2 2 0 0 1 2 2v3"></path>
      <path d="M16 21v-3a2 2 0 0 1 2-2h3"></path>
    </svg>
  </button>

  <div class="container">
    <div :key="breathKey" class="circle" :class="{ breathing: breathing.active.value }">
      <div>
        <div class="time">{{ timer.display.value }}</div>
        <div class="phase" :class="{ visible: breathing.phaseVisible.value }">
          {{ breathing.phase.value }}
        </div>
      </div>
    </div>

    <div class="controls">
      <button @click="handleStartPause">{{ startBtnLabel }}</button>
      <button class="secondary" @click="handleReset">Сбросить</button>
    </div>

    <button class="settings-toggle" @click="settingsOpen = !settingsOpen">
      {{ settingsOpen ? 'Скрыть настройки' : 'Настройки' }}
    </button>

    <div class="settings-panel" :class="{ open: settingsOpen }">
      <section class="settings-section">
        <div class="section-title">Длительность</div>
        <div class="presets">
          <button
            v-for="min in durationPresets"
            :key="min"
            class="preset"
            :class="{ active: activeDuration === min }"
            @click="selectDuration(min)"
          >
            {{ min }} мин
          </button>
        </div>
      </section>

      <section class="settings-section">
        <div class="section-title">Ритм дыхания</div>
        <div class="breath-presets">
          <button
            v-for="preset in breathPresets"
            :key="preset.label"
            class="breath-preset"
            :class="{ active: activeBreathPreset === preset.label }"
            @click="selectBreathPreset(preset)"
          >
            {{ preset.label }}
          </button>
        </div>
        <button class="link-toggle" @click="customBreathOpen = !customBreathOpen">
          {{ customBreathOpen ? 'Скрыть свои значения' : 'Свои значения' }}
        </button>
        <div class="breath-custom" :class="{ open: customBreathOpen }">
          <label>Вдох <input v-model.number="inhaleInput" type="number" min="1" max="20" /></label>
          <label
            >Задержка <input v-model.number="holdInput" type="number" min="0" max="20"
          /></label>
          <label>Выдох <input v-model.number="exhaleInput" type="number" min="1" max="20" /></label>
          <button class="secondary" @click="applyCustomBreath">Применить</button>
        </div>
      </section>

      <section class="settings-section">
        <div class="section-title">Фон</div>
        <div class="weather-presets">
          <button
            v-for="opt in weatherOptions"
            :key="opt.theme"
            class="weather-preset"
            :class="{ active: activeWeather === opt.theme }"
            @click="selectWeather(opt.theme)"
          >
            {{ opt.label }}
          </button>
        </div>
      </section>

      <section class="settings-section">
        <div class="section-title">Музыка</div>
        <div class="music-controls">
          <button class="secondary" @click="lofi.toggle">
            {{ lofi.playing.value ? 'Остановить музыку' : 'Играть lo-fi' }}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="lofi.volume.value"
            @input="lofi.setVolume(($event.target as HTMLInputElement).valueAsNumber)"
          />
        </div>
      </section>
    </div>
  </div>
</template>
