import { ref, onUnmounted } from 'vue'

/**
 * Удерживает экран включённым (Screen Wake Lock API), пока активна сессия.
 * Поддерживается не везде (например, в старом Safari/Firefox), поэтому
 * isSupported позволяет скрыть UI или просто тихо ничего не делать.
 *
 * Браузер сам снимает лок, когда вкладка уходит в фон (например, юзер
 * свернул приложение или заблокировал телефон другой кнопкой), поэтому
 * при возврате на вкладку (visibilitychange) лок нужно запросить заново,
 * если сессия всё ещё должна идти.
 */
export function useWakeLock() {
  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator
  const isActive = ref(false)

  let sentinel: WakeLockSentinel | null = null
  let wanted = false

  async function requestLock() {
    if (!isSupported || sentinel) return
    try {
      sentinel = await navigator.wakeLock.request('screen')
      isActive.value = true
      sentinel.addEventListener('release', () => {
        isActive.value = false
        sentinel = null
      })
    } catch (e) {
      // может отказать, если вкладка не видна, батарея разряжена и т.п.
      console.error('Не удалось получить wake lock:', e)
    }
  }

  async function releaseLock() {
    if (sentinel) {
      await sentinel.release()
      sentinel = null
    }
    isActive.value = false
  }

  async function enable() {
    wanted = true
    await requestLock()
  }

  async function disable() {
    wanted = false
    await releaseLock()
  }

  function handleVisibilityChange() {
    if (wanted && document.visibilityState === 'visible') {
      requestLock()
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    releaseLock()
  })

  return { isSupported, isActive, enable, disable }
}
