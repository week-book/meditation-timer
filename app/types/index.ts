export interface BreathConfig {
  inhale: number
  hold: number
  exhale: number
}

export type WeatherTheme = 'none' | 'leaves' | 'stars' | 'snow' | 'petals'

// звуковой сигнал смены фазы дыхания (вдох/задержка/выдох) — нужен тем,
// кто медитирует с закрытыми глазами и не смотрит на экран
export type BreathCueStyle = 'off' | 'tone' | 'interval' | 'pulses'

export interface WeatherThemeConfig {
  emojis: string[]
  rate: number
  sizeMin: number
  sizeMax: number
}

export interface Particle {
  id: number
  emoji: string
  left: number
  duration: number
  swayDuration: number
  size: number
  opacity: number
  fallDelay: number
}
