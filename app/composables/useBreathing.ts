import { ref, reactive, computed, watch } from 'vue'
import type { BreathConfig } from '~/types'

export function useBreathing() {
  const config = reactive<BreathConfig>({ inhale: 4, hold: 0, exhale: 4 })
  const phase = ref('')
  const phaseVisible = ref(false)
  const active = ref(false)

  let phaseTimeoutId: ReturnType<typeof setTimeout> | null = null

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

  function stopBreathing() {
    active.value = false
    stopPhaseCycle()
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
    restartIfActive,
  }
}
