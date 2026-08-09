import { ref } from 'vue'

// Мягкая джазовая прогрессия (ii - V - I - vi), midi-ноты
const LOFI_CHORDS: number[][] = [
  [50, 57, 60, 65], // Dm9
  [55, 59, 65, 69], // G13
  [48, 55, 59, 64], // Cmaj9
  [45, 52, 55, 60], // Am9
]

const LOFI_BPM = 74
const LOFI_STEPS_PER_BAR = 8 // восьмые ноты
const LOFI_BARS = 4
const LOFI_TOTAL_STEPS = LOFI_STEPS_PER_BAR * LOFI_BARS
const LOFI_EIGHTH = 60 / LOFI_BPM / 2
const LOFI_SWING = LOFI_EIGHTH * 0.35
const LOFI_BAR_DUR = LOFI_STEPS_PER_BAR * LOFI_EIGHTH

function midiToFreq(m: number): number {
  return 440 * Math.pow(2, (m - 69) / 12)
}

export function useLofi() {
  const playing = ref(false)
  const volume = ref(0.5)

  let ctx: AudioContext | null = null
  let volumeGain: GainNode | null = null
  let fadeGain: GainNode | null = null
  let filter: BiquadFilterNode | null = null
  let schedulerId: ReturnType<typeof setInterval> | null = null
  let nextNoteTime = 0
  let step = 0
  let crackleSource: AudioBufferSourceNode | null = null

  function ensureContext() {
    if (ctx) return
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    ctx = new AudioCtx()

    filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 2600
    filter.Q.value = 0.6

    fadeGain = ctx.createGain()
    fadeGain.gain.value = 0

    volumeGain = ctx.createGain()
    volumeGain.gain.value = volume.value

    filter.connect(fadeGain)
    fadeGain.connect(volumeGain)
    volumeGain.connect(ctx.destination)
  }

  function playPadChord(chord: number[], time: number, duration: number) {
    if (!ctx || !filter) return
    chord.forEach((midi, idx) => {
      ;[-4, 4].forEach((detuneCents) => {
        const osc = ctx!.createOscillator()
        osc.type = 'triangle'
        osc.frequency.value = midiToFreq(midi)
        osc.detune.value = detuneCents

        const pan = ctx!.createStereoPanner()
        pan.pan.value = detuneCents < 0 ? -0.3 : 0.3

        const gain = ctx!.createGain()
        const peak = 0.05 - idx * 0.006
        gain.gain.setValueAtTime(0, time)
        gain.gain.linearRampToValueAtTime(peak, time + 1.0)
        gain.gain.setValueAtTime(peak, time + duration - 1.2)
        gain.gain.linearRampToValueAtTime(0, time + duration)

        osc.connect(gain)
        gain.connect(pan)
        pan.connect(filter!)

        osc.start(time)
        osc.stop(time + duration + 0.1)
      })
    })
  }

  function playBassNote(midi: number, time: number, velocity: number) {
    if (!ctx || !filter) return
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = midiToFreq(midi - 12)

    const gain = ctx.createGain()
    const peak = 0.22 * velocity
    gain.gain.setValueAtTime(0, time)
    gain.gain.linearRampToValueAtTime(peak, time + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.7)

    osc.connect(gain)
    gain.connect(filter)
    osc.start(time)
    osc.stop(time + 0.75)
  }

  function playKick(time: number) {
    if (!ctx || !filter) return
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(120, time)
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.12)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.5, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28)

    osc.connect(gain)
    gain.connect(filter)
    osc.start(time)
    osc.stop(time + 0.3)
  }

  function noiseBuffer(duration: number): AudioBuffer {
    const bufferSize = Math.max(1, Math.floor(ctx!.sampleRate * duration))
    const buffer = ctx!.createBuffer(1, bufferSize, ctx!.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    return buffer
  }

  function playSnare(time: number) {
    if (!ctx || !filter) return
    const src = ctx.createBufferSource()
    src.buffer = noiseBuffer(0.18)

    const bandpass = ctx.createBiquadFilter()
    bandpass.type = 'bandpass'
    bandpass.frequency.value = 1800
    bandpass.Q.value = 0.8

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.18, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15)

    src.connect(bandpass)
    bandpass.connect(gain)
    gain.connect(filter)
    src.start(time)
    src.stop(time + 0.18)
  }

  function playHat(time: number, velocity: number) {
    if (!ctx || !filter) return
    const src = ctx.createBufferSource()
    src.buffer = noiseBuffer(0.06)

    const highpass = ctx.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = 7000

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.08 * velocity, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)

    src.connect(highpass)
    highpass.connect(gain)
    gain.connect(filter)
    src.start(time)
    src.stop(time + 0.06)
  }

  function startVinylCrackle() {
    if (!ctx || !filter) return
    const src = ctx.createBufferSource()
    src.buffer = noiseBuffer(2)
    src.loop = true

    const bandpass = ctx.createBiquadFilter()
    bandpass.type = 'bandpass'
    bandpass.frequency.value = 2200
    bandpass.Q.value = 0.5

    const gain = ctx.createGain()
    gain.gain.value = 0.02

    src.connect(bandpass)
    bandpass.connect(gain)
    gain.connect(filter)
    src.start()
    crackleSource = src
  }

  function scheduleStep(stepIndex: number, time: number) {
    const barIndex = Math.floor(stepIndex / LOFI_STEPS_PER_BAR) % LOFI_BARS
    const posInBar = stepIndex % LOFI_STEPS_PER_BAR
    const chord = LOFI_CHORDS[barIndex]

    if (posInBar === 0) {
      playPadChord(chord, time, LOFI_BAR_DUR)
      playBassNote(chord[0], time, 1)
    }
    if (posInBar === 4) {
      playBassNote(chord[0], time, 0.6)
    }
    if (posInBar === 0 || posInBar === 4) playKick(time)
    if (posInBar === 2 || posInBar === 6) playSnare(time)

    const isOffbeat = posInBar % 2 === 1
    const hatTime = isOffbeat ? time + LOFI_SWING : time
    playHat(hatTime, isOffbeat ? 0.3 : 0.5)
  }

  function scheduler() {
    if (!ctx) return
    while (nextNoteTime < ctx.currentTime + 0.15) {
      scheduleStep(step, nextNoteTime)
      nextNoteTime += LOFI_EIGHTH
      step = (step + 1) % LOFI_TOTAL_STEPS
    }
  }

  function start() {
    ensureContext()
    if (!ctx || !fadeGain) return
    if (ctx.state === 'suspended') ctx.resume()
    if (playing.value) return

    playing.value = true
    step = 0
    nextNoteTime = ctx.currentTime + 0.1
    startVinylCrackle()
    schedulerId = setInterval(scheduler, 25)

    fadeGain.gain.cancelScheduledValues(ctx.currentTime)
    fadeGain.gain.setValueAtTime(fadeGain.gain.value, ctx.currentTime)
    fadeGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.2)
  }

  function stop() {
    if (!playing.value || !ctx || !fadeGain) return
    playing.value = false
    if (schedulerId) clearInterval(schedulerId)

    const now = ctx.currentTime
    fadeGain.gain.cancelScheduledValues(now)
    fadeGain.gain.setValueAtTime(fadeGain.gain.value, now)
    fadeGain.gain.linearRampToValueAtTime(0, now + 0.8)

    if (crackleSource) {
      const src = crackleSource
      setTimeout(() => {
        try {
          src.stop()
        } catch {
          // источник уже остановлен
        }
      }, 900)
      crackleSource = null
    }
  }

  function toggle() {
    if (playing.value) stop()
    else start()
  }

  function setVolume(v: number) {
    volume.value = v
    if (volumeGain) volumeGain.gain.value = v
  }

  return { playing, volume, start, stop, toggle, setVolume }
}
