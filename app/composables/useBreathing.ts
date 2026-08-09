import { ref, reactive, computed, watch } from 'vue'
import type { BreathConfig } from '~/types'

export function useBreathing() {
  const config = reactive<BreathConfig>({ inhale: 4, hold: 0, exhale: 4 })
  const phase = ref('')
  const phaseVisible = ref(false)
  const active = ref(false)

  let phaseTimeoutId: ReturnType<typeof setTimeout> | null = null

  // мягкая остановка: вместо того чтобы оборвать текущую фазу (вдох/задержку/выдох)
  // на середине, отмечаем, что после того как она сама доиграет до конца —
  // нужно остановиться, а не запускать следующую фазу по кругу
  let stopRequested = false
  let stopRequestedCallback: (() => void) | undefined

  const totalDuration = computed(() => config.inhale + config.hold + config.exhale)
  const inhaleEndPct = computed(() => ((config.inhale / totalDuration.value) * 100).toFixed(2))
  const holdEndPct = computed(() =>
    (((config.inhale + config.hold) / totalDuration.value) * 100).toFixed(2),
  )

  function runPhaseCycle() {
    const phases: { label: string; dur: number }[] = [{ label: 'Вдох', dur: config.inhale }]
    if (config.hold > 0) phases.push({ label: 'Задержка', dur: config.hold })
    phases.push({ label: 'Выдох', dur: config.exhale })

    let i = 0
    const step = () => {
      if (!active.value) return
      phase.value = phases[i].label
      phaseVisible.value = true
      phaseTimeoutId = setTimeout(() => {
        // текущая фаза (например, вдох или задержка) доиграла до конца —
        // если за это время попросили остановиться, останавливаемся именно
        // сейчас, на границе фаз, а не хватаем цикл посреди дыхания
        if (stopRequested) {
          stopRequested = false
          active.value = false
          phaseVisible.value = false
          const cb = stopRequestedCallback
          stopRequestedCallback = undefined
          cb?.()
          return
        }
        i = (i + 1) % phases.length
        step()
      }, phases[i].dur * 1000)
    }
    step()
  }

  function stopPhaseCycle() {
    if (phaseTimeoutId) clearTimeout(phaseTimeoutId)
    phaseVisible.value = false
  }

  function start() {
    active.value = true
    runPhaseCycle()
  }

  // немедленная остановка — обрывает текущую фазу на середине.
  // Используется для паузы/сброса, где резкость ожидаема и осмысленна.
  function stopBreathing() {
    active.value = false
    stopPhaseCycle()
    stopRequested = false
    const cb = stopRequestedCallback
    stopRequestedCallback = undefined
    cb?.()
  }

  // мягкая остановка — дожидается конца текущей фазы (довдохнуть/довыдохнуть)
  // и только потом останавливает цикл, вызывая callback. Нужна для конца
  // сессии, чтобы она не обрывалась случайно на вдохе или на задержке дыхания.
  function requestGracefulStop(onDone?: () => void) {
    if (!active.value) {
      onDone?.()
      return
    }
    stopRequested = true
    stopRequestedCallback = onDone
  }

  // при смене ритма во время активной сессии — перезапуск цикла с новым таймингом
  function restartIfActive() {
    if (!active.value) return
    stopPhaseCycle()
    runPhaseCycle()
  }

  watch(
    () => ({ ...config }),
    () => restartIfActive(),
  )

  return {
    config,
    phase,
    phaseVisible,
    active,
    inhaleEndPct,
    holdEndPct,
    totalDuration,
    start,
    stopBreathing,
    requestGracefulStop,
    restartIfActive,
  }
}
