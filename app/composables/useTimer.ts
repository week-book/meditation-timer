import { ref, computed } from 'vue'

export function useTimer(initialMinutes = 5) {
  const totalSeconds = ref(initialMinutes * 60)
  const remaining = ref(totalSeconds.value)
  const running = ref(false)

  let intervalId: ReturnType<typeof setInterval> | null = null

  const display = computed(() => {
    const m = Math.floor(remaining.value / 60)
      .toString()
      .padStart(2, '0')
    const s = (remaining.value % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  })

  let chimeCtx: AudioContext | null = null

  function playChime() {
    // переиспользуем один AudioContext на весь жизненный цикл композабла —
    // раньше здесь создавался новый контекст при каждом завершении сессии
    // и никогда не закрывался; это ограниченный браузером ресурс
    // (например, Safari жёстко лимитирует число одновременно живых
    // AudioContext), поэтому после нескольких медитаций подряд звук
    // мог перестать проигрываться вовсе
    if (!chimeCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      chimeCtx = new AudioCtx()
    }
    const ctx = chimeCtx
    if (ctx.state === 'suspended') ctx.resume()

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 528
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3)
    osc.start()
    osc.stop(ctx.currentTime + 3)
  }

  function start(onFinish?: () => void) {
    if (running.value) return
    // если предыдущая сессия уже завершилась (remaining дошёл до 0),
    // перед повторным запуском откатываем время к полной длительности —
    // иначе таймер тут же уйдёт в минус и мгновенно завершится снова
    if (remaining.value <= 0) {
      remaining.value = totalSeconds.value
    }
    running.value = true
    intervalId = setInterval(() => {
      remaining.value--
      if (remaining.value <= 0) {
        stop()
        playChime()
        onFinish?.()
      }
    }, 1000)
  }

  function pause() {
    running.value = false
    if (intervalId) clearInterval(intervalId)
    intervalId = null
  }

  function stop() {
    running.value = false
    if (intervalId) clearInterval(intervalId)
    intervalId = null
  }

  function reset() {
    stop()
    remaining.value = totalSeconds.value
  }

  function setDuration(minutes: number) {
    stop()
    totalSeconds.value = minutes * 60
    remaining.value = totalSeconds.value
  }

  return { totalSeconds, remaining, running, display, start, pause, stop, reset, setDuration }
}
