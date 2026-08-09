import { defineStore } from 'pinia'
import type { WeatherTheme } from '~/types'

export interface BreathSettings {
  preset: string // '4-4' | '6-6' | '4-7-8' | '' (своё значение)
  inhale: number
  hold: number
  exhale: number
}

interface SettingsState {
  durationMinutes: number
  breath: BreathSettings
  weatherTheme: WeatherTheme
  musicVolume: number
}

const STORAGE_KEY = 'meditation-timer:settings'

const defaults: SettingsState = {
  durationMinutes: 5,
  breath: { preset: '4-4', inhale: 4, hold: 0, exhale: 4 },
  weatherTheme: 'petals',
  musicVolume: 0.5,
}

// Настройки хранятся в localStorage браузера — никакого бэкенда для этого
// не нужно, а значения переживают перезагрузку страницы и повторные визиты.
export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    durationMinutes: defaults.durationMinutes,
    breath: { ...defaults.breath },
    weatherTheme: defaults.weatherTheme,
    musicVolume: defaults.musicVolume,
  }),

  actions: {
    // Подтягиваем сохранённые настройки. Вызывается один раз при монтировании
    // клиентского виджета — стор создаётся с дефолтами и на сервере (SSR),
    // и на клиенте, но localStorage существует только в браузере.
    load() {
      if (typeof window === 'undefined') return
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw) as Partial<SettingsState>
        // мержим с дефолтами по полям, а не доверяем сохранённой структуре
        // целиком — если формат настроек поменяется в будущей версии сайта,
        // старые/битые данные в localStorage не должны ломать страницу
        if (typeof parsed.durationMinutes === 'number') {
          this.durationMinutes = parsed.durationMinutes
        }
        if (parsed.breath && typeof parsed.breath === 'object') {
          this.breath = { ...defaults.breath, ...parsed.breath }
        }
        if (parsed.weatherTheme) {
          this.weatherTheme = parsed.weatherTheme
        }
        if (typeof parsed.musicVolume === 'number') {
          this.musicVolume = parsed.musicVolume
        }
      } catch {
        // повреждённые данные в localStorage (или приватный режим без
        // доступа к нему) — просто остаёмся на дефолтах
      }
    },

    persist() {
      if (typeof window === 'undefined') return
      try {
        const payload: SettingsState = {
          durationMinutes: this.durationMinutes,
          breath: this.breath,
          weatherTheme: this.weatherTheme,
          musicVolume: this.musicVolume,
        }
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      } catch {
        // localStorage может быть недоступен (приватный режим, квота и т.п.) —
        // в таком случае просто не сохраняем, сессия продолжает работать
      }
    },

    setDuration(minutes: number) {
      this.durationMinutes = minutes
      this.persist()
    },

    setBreath(breath: BreathSettings) {
      this.breath = breath
      this.persist()
    },

    setWeatherTheme(theme: WeatherTheme) {
      this.weatherTheme = theme
      this.persist()
    },

    setMusicVolume(volume: number) {
      this.musicVolume = volume
      this.persist()
    },
  },
})
