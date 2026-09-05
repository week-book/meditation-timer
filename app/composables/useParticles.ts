import { ref } from 'vue'
import type { Particle, WeatherTheme, WeatherThemeConfig } from '~/types'

const weatherThemes: Record<Exclude<WeatherTheme, 'none'>, WeatherThemeConfig> = {
  leaves: { emojis: ['🍃', '🍂'], rate: 900, sizeMin: 18, sizeMax: 32 },
  stars: { emojis: ['✨'], rate: 900, sizeMin: 14, sizeMax: 22 },
  snow: { emojis: ['❄️'], rate: 800, sizeMin: 14, sizeMax: 24 },
  petals: { emojis: ['🌸'], rate: 900, sizeMin: 16, sizeMax: 24 },
}

let particleIdSeq = 0

export function useParticles() {
  const particles = ref<Particle[]>([])
  let intervalId: ReturnType<typeof setInterval> | null = null

  function spawnParticle(theme: Exclude<WeatherTheme, 'none'>, startPartway = false) {
    const config = weatherThemes[theme]
    const emoji = config.emojis[Math.floor(Math.random() * config.emojis.length)]
    const duration = 15 + Math.random() * 12
    const id = ++particleIdSeq

    // для частиц первой партии сдвигаем анимацию отрицательной задержкой,
    // чтобы они появились сразу в случайной точке своего падения, а не
    // ехали от верхнего края экрана
    const fallDelay = startPartway ? -(0.1 + Math.random() * 0.85) * duration : 0
    const remaining = duration + fallDelay

    const particle: Particle = {
      id,
      emoji,
      left: Math.random() * 100,
      duration,
      swayDuration: Number((duration / 3).toFixed(1)),
      size: config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin),
      opacity: 0.25 + Math.random() * 0.35,
      fallDelay,
    }
    particles.value.push(particle)
    setTimeout(() => {
      particles.value = particles.value.filter((p) => p.id !== id)
    }, remaining * 1000)
  }

  function startWeather(theme: WeatherTheme) {
    if (intervalId) clearInterval(intervalId)
    particles.value = []
    if (theme === 'none') return
    const rate = weatherThemes[theme].rate
    // сразу заполняем экран частицами в случайных точках падения,
    // чтобы при загрузке они были видны в случайных местах, а не
    // появлялись постепенно сверху
    const initialBatch = 12
    for (let i = 0; i < initialBatch; i++) {
      spawnParticle(theme, true)
    }
    intervalId = setInterval(() => spawnParticle(theme), rate)
  }

  return { particles, startWeather }
}
