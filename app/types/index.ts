export interface BreathConfig {
  inhale: number
  hold: number
  exhale: number
}

export type WeatherTheme = 'none' | 'leaves' | 'stars' | 'snow' | 'petals'

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
}
