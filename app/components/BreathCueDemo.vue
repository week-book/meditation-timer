<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import type { BreathCueStyle } from '~/types'
import { useSettingsStore } from '~/stores/settings'

// Отдельный блок страницы (как FactCards/SocialCards рядом), а не часть
// свёрнутых настроек таймера — чтобы стиль сигнала можно было выбрать и
// прослушать заранее, до старта сессии. Выбор пишется в тот же
// settings-стор, что читает MeditationTimer при реальной медитации.
const settings = useSettingsStore()
settings.load()

const breathCue = useBreathCue()
breathCue.setStyle(settings.breathCueStyle)

interface CueOption {
  style: BreathCueStyle
  title: string
  text: string
}

const options: CueOption[] = [
  {
    style: 'tone',
    title: 'Тон',
    text: 'Один мягкий сигнал на каждую смену фазы — разной высоты на вдох, задержку и выдох.',
  },
  {
    style: 'interval',
    title: 'Интервал',
    text: 'Два тона подряд: восходящий на вдох, нисходящий на выдох — направление слышно сразу.',
  },
  {
    style: 'pulses',
    title: 'Пульсы',
    text: 'Короткие щелчки без высоты тона: один на вдох, два на задержку, три на выдох.',
  },
  {
    style: 'off',
    title: 'Без звука',
    text: 'Сигнала нет, только подпись фазы на экране — как было раньше.',
  },
]

const expanded = ref<Record<BreathCueStyle, boolean>>({
  tone: false,
  interval: false,
  pulses: false,
  off: false,
})

function toggleExpanded(style: BreathCueStyle) {
  expanded.value[style] = !expanded.value[style]
}

function selectStyle(style: BreathCueStyle) {
  breathCue.setStyle(style)
  settings.setBreathCueStyle(style)
}

function previewPhase(style: BreathCueStyle, phase: 'inhale' | 'hold' | 'exhale') {
  breathCue.preview(phase, style)
}

/* ---------- Прогнать цикл на настоящем ритме дыхания ---------- */
// Проверка сигнала в естественном темпе, на том же ритме (вдох/задержка/
// выдох), что настроен для сессии — а не абстрактный "4-0-4".
const cycleActive = ref(false)
const cyclePhaseLabel = ref('')
const cycleProgress = ref(0)
let cycleTimeoutId: ReturnType<typeof setTimeout> | null = null
let cycleRafId: number | null = null
let cyclePhaseStart = 0
let cyclePhaseDur = 0

const cycleButtonLabel = computed(() => (cycleActive.value ? 'Стоп' : 'Прогнать цикл'))

function cyclePhases() {
  const list: { key: 'inhale' | 'hold' | 'exhale'; label: string; dur: number }[] = [
    { key: 'inhale', label: 'Вдох', dur: settings.breath.inhale },
  ]
  if (settings.breath.hold > 0) {
    list.push({ key: 'hold', label: 'Задержка', dur: settings.breath.hold })
  }
  list.push({ key: 'exhale', label: 'Выдох', dur: settings.breath.exhale })
  return list
}

function animateCycle() {
  if (!cycleActive.value) return
  const elapsed = (Date.now() - cyclePhaseStart) / 1000
  cycleProgress.value = Math.min(100, (elapsed / cyclePhaseDur) * 100)
  cycleRafId = requestAnimationFrame(animateCycle)
}

function stepCycle(phases: ReturnType<typeof cyclePhases>, i: number) {
  if (!cycleActive.value) return
  const p = phases[i % phases.length]
  cyclePhaseLabel.value = p.label
  cyclePhaseDur = p.dur
  cyclePhaseStart = Date.now()
  cycleProgress.value = 0
  breathCue.preview(p.key, settings.breathCueStyle)
  if (cycleRafId) cancelAnimationFrame(cycleRafId)
  animateCycle()
  cycleTimeoutId = setTimeout(() => stepCycle(phases, i + 1), p.dur * 1000)
}

function stopCycle() {
  cycleActive.value = false
  if (cycleTimeoutId) clearTimeout(cycleTimeoutId)
  if (cycleRafId) cancelAnimationFrame(cycleRafId)
  cycleTimeoutId = null
  cycleRafId = null
  cyclePhaseLabel.value = ''
  cycleProgress.value = 0
}

function toggleCycle() {
  if (cycleActive.value) stopCycle()
  else {
    cycleActive.value = true
    stepCycle(cyclePhases(), 0)
  }
}

onUnmounted(stopCycle)
</script>

<template>
  <section class="cues" id="cues">
    <h2>Сигналы дыхания</h2>
    <p class="cues__intro">
      Если медитируете с закрытыми глазами, звук подскажет, когда менять фазу дыхания.
      Прослушайте варианты и выберите свой — во время сессии будет проигрываться именно он.
    </p>

    <div class="cues__grid">
      <article
        v-for="opt in options"
        :key="opt.style"
        class="cues__card"
        :class="{ active: settings.breathCueStyle === opt.style }"
        role="button"
        tabindex="0"
        @click="selectStyle(opt.style)"
        @keydown.enter="selectStyle(opt.style)"
        @keydown.space.prevent="selectStyle(opt.style)"
      >
        <div class="cues__card-head">
          <button class="cues__info" @click.stop="toggleExpanded(opt.style)" aria-label="Показать описание">
            {{ opt.title }} <span class="cues__info-icon">{{ expanded[opt.style] ? '−' : '?' }}</span>
          </button>
          <Transition name="cues-badge">
            <span class="cues__badge" v-if="settings.breathCueStyle === opt.style">Выбрано</span>
          </Transition>
        </div>

        <p v-if="expanded[opt.style]" class="cues__card-text">{{ opt.text }}</p>

        <div v-if="opt.style !== 'off'" class="cues__preview-row">
          <button class="secondary" @click.stop="previewPhase(opt.style, 'inhale')">Вдох</button>
          <button class="secondary" @click.stop="previewPhase(opt.style, 'hold')">Задержка</button>
          <button class="secondary" @click.stop="previewPhase(opt.style, 'exhale')">Выдох</button>
        </div>
      </article>
    </div>

    <div class="cues__cycle">
      <div class="cues__cycle-row">
        <span class="cues__cycle-label">
          {{ cyclePhaseLabel || 'Прогнать цикл на вашем ритме' }}
        </span>
        <button class="secondary" @click="toggleCycle">{{ cycleButtonLabel }}</button>
      </div>
      <div class="cues__cycle-progress">
        <div class="cues__cycle-progress-fill" :style="{ width: cycleProgress + '%' }"></div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cues {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 16px 48px;
  scroll-margin-top: 24px;
}

.cues h2 {
  text-align: center;
  margin-bottom: 12px;
}

.cues__intro {
  max-width: 520px;
  margin: 0 auto 20px;
  text-align: center;
  font-size: 0.85rem;
  line-height: 1.6;
  color: #5a5a5a;
}

.cues__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-bottom: 18px;
}

.cues__card {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid #e2dbe7;
  border-radius: 14px;
  padding: 12px 14px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    border-color 0.25s ease-out,
    background-color 0.25s ease-out,
    transform 0.15s ease-out;
}

.cues__card:hover {
  border-color: #c3b8cf;
}

.cues__card:active {
  transform: scale(0.985);
}

.cues__card:focus {
  outline: none;
}

.cues__card:focus-visible {
  outline: 2px solid #9a8fae;
  outline-offset: 2px;
}

.cues__card.active {
  border-color: #9a8fae;
  background: #f5f2f8;
}

.cues__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.cues__card h3 {
  font-size: 0.9rem;
  color: #3a3a3a;
  font-weight: 500;
}

.cues__info {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: #3a3a3a;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: opacity 0.15s ease;
}

.cues__info:hover {
  opacity: 0.7;
}

.cues__info-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #9a8fae;
  color: #9a8fae;
  font-size: 0.7rem;
  line-height: 1;
  flex-shrink: 0;
}

.cues__card-text {
  font-size: 0.8rem;
  line-height: 1.5;
  color: #5a5a5a;
  margin-top: 8px;
}

.cues__preview-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.cues__preview-row button {
  font-size: 0.75rem;
  padding: 5px 12px;
}

.cues__badge {
  font-size: 0.7rem;
  color: #9a8fae;
  font-weight: 500;
  flex-shrink: 0;
}

.cues-badge-enter-active,
.cues-badge-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.cues-badge-enter-from,
.cues-badge-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}

.cues__cycle {
  max-width: 480px;
  margin: 0 auto;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid #e2dbe7;
  border-radius: 14px;
}

.cues__cycle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.cues__cycle-label {
  font-size: 0.8rem;
  color: #5a5a5a;
}

.cues__cycle-row button {
  font-size: 0.75rem;
  padding: 5px 12px;
  min-width: 100px;
  flex-shrink: 0;
}

.cues__cycle-progress {
  height: 4px;
  border-radius: 2px;
  background: #ece7f0;
  overflow: hidden;
}

.cues__cycle-progress-fill {
  height: 100%;
  width: 0%;
  background: #9a8fae;
  transition: width 0.1s linear;
}

@media (min-width: 480px) {
  .cues__grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
