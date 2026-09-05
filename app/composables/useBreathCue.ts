import { ref } from 'vue'
import type { BreathCueStyle } from '~/types'

type CuePhase = 'inhale' | 'hold' | 'exhale'

// частоты по фазам — одинаковые для всех стилей, чтобы "тон" и "интервал"
// звучали узнаваемо похоже, а не как два разных инструмента
const PHASE_FREQUENCIES: Record<CuePhase, number> = {
  inhale: 520,
  hold: 340,
  exhale: 260,
}

const CUE_VOLUME = 0.55

export function useBreathCue() {
  const style = ref<BreathCueStyle>('tone')

  // переиспользуем один AudioContext, как в useTimer.ts/useLofi.ts — иначе
  // после нескольких сессий подряд браузер (особенно Safari) перестаёт
  // создавать новые контексты
  let ctx: AudioContext | null = null

  function ensureContext(): AudioContext | null {
    if (ctx) return ctx
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    ctx = new AudioCtx()
    return ctx
  }

  function playTone(freq: number, duration = 1.1) {
    const c = ensureContext()
    if (!c) return
    if (c.state === 'suspended') c.resume()

    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(CUE_VOLUME, c.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + duration + 0.05)
  }

  function playPulses(freq: number, count: number) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => playTone(freq, 0.12), i * 160)
    }
  }

  // восходящий интервал на вдох, нисходящий на выдох — направление слышно
  // без необходимости запоминать, какая высота звука что означает
  function playInterval(rising: boolean) {
    const low = PHASE_FREQUENCIES.exhale
    const high = PHASE_FREQUENCIES.inhale
    playTone(rising ? low : high, 0.28)
    setTimeout(() => playTone(rising ? high : low, 0.3), 260)
  }

  function emit(phase: CuePhase, s: BreathCueStyle) {
    if (s === 'off') return
    const freq = PHASE_FREQUENCIES[phase]
    if (s === 'tone') {
      playTone(freq)
    } else if (s === 'pulses') {
      const count = phase === 'inhale' ? 1 : phase === 'hold' ? 2 : 3
      playPulses(freq, count)
    } else if (s === 'interval') {
      playInterval(phase === 'inhale')
    }
  }

  // вызывается во время реальной сессии — использует выбранный стиль
  function playCue(phase: CuePhase) {
    emit(phase, style.value)
  }

  // вызывается из блока "опробовать сигналы" — играет конкретный стиль,
  // не трогая текущий выбранный style, чтобы прослушивание вариантов
  // не сбивало уже сделанный выбор
  function preview(phase: CuePhase, previewStyle: BreathCueStyle) {
    emit(phase, previewStyle)
  }

  function setStyle(s: BreathCueStyle) {
    style.value = s
  }

  return { style, setStyle, playCue, preview }
}
