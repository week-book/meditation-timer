import { ref } from 'vue'
import type { Particle, WeatherTheme, WeatherThemeConfig } from '~/types'

const weatherThemes: Record<Exclude<WeatherTheme, 'none'>, WeatherThemeConfig> = {
  leaves: { emojis: ['🍃', '🍂'], rate: 900, sizeMin: 14, sizeMax: 26 },
  stars: { emojis: ['✨'], rate: 900, sizeMin: 10, sizeMax: 18 },
  snow: { emojis: ['❄️'], rate: 800, sizeMin: 10, sizeMax: 20 },
  petals: { emojis: ['🌸'], rate: 900, sizeMin: 12, sizeMax: 20 },
}

let particleIdSeq = 0

export function useParticles() {
  const particles = ref<Particle[]>([])
  let intervalId: ReturnType<typeof setInterval> | null = null

  function spawnParticle(theme: Exclude<WeatherTheme, 'none'>) {
    const config = weatherThemes[theme]
    const emoji = config.emojis[Math.floor(Math.random() * config.emojis.length)]
    const duration = 12 + Math.random() * 8
    const id = ++particleIdSeq

    const particle: Particle = {
      id,
      emoji,
      left: Math.random() * 100,
      duration,
      swayDuration: Number((duration / 3).toFixed(1)),
      size: config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin),
      opacity: 0.25 + Math.random() * 0.35,
    }
    particles.value.push(particle)
    setTimeout(() => {
      particles.value = particles.value.filter((p) => p.id !== id)
    }, duration * 1000)
  }

  function startWeather(theme: WeatherTheme) {
    if (intervalId) clearInterval(intervalId)
    particles.value = []
    if (theme === 'none') return
    const rate = weatherThemes[theme].rate
    intervalId = setInterval(() => spawnParticle(theme), rate)
  }

  return { particles, startWeather }
}
