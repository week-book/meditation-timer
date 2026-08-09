import { ref, onMounted, onUnmounted } from 'vue'

export function useFullscreen() {
  const isFullscreen = ref(false)
  const isSupported = !!(
    document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen
  )

  function checkState() {
    isFullscreen.value = !!(document.fullscreenElement || document.webkitFullscreenElement)
  }

  async function toggle() {
    try {
      if (!isFullscreen.value) {
        const el = document.documentElement
        if (el.requestFullscreen) await el.requestFullscreen()
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen()
      } else {
        if (document.exitFullscreen) await document.exitFullscreen()
        else if (document.webkitExitFullscreen) await document.webkitExitFullscreen()
      }
    } catch (e) {
      console.error('Не удалось переключить полноэкранный режим:', e)
    }
  }

  onMounted(() => {
    document.addEventListener('fullscreenchange', checkState)
    document.addEventListener('webkitfullscreenchange', checkState)
  })

  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', checkState)
    document.removeEventListener('webkitfullscreenchange', checkState)
  })

  return { isFullscreen, toggle, isSupported }
}
