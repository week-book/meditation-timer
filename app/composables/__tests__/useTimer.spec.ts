import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useTimer } from '../useTimer'

// playChime() использует window.AudioContext — в jsdom его нет,
// поэтому подменяем на заглушку, чтобы тесты не падали по чужой причине.
beforeEach(() => {
  vi.useFakeTimers()
  class FakeAudioContext {
    currentTime = 0
    destination = {}
    state = 'running'
    createOscillator() {
      return {
        connect: vi.fn(),
        frequency: { value: 0 },
        type: '',
        start: vi.fn(),
        stop: vi.fn(),
      }
    }
    createGain() {
      return {
        connect: vi.fn(),
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
      }
    }
    resume() {}
  }
  window.AudioContext = FakeAudioContext as unknown as typeof AudioContext
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useTimer', () => {
  it('отсчитывает секунды и корректно завершается по нулю', () => {
    const timer = useTimer(1) // 1 минута = 60 секунд
    const onFinish = vi.fn()

    timer.start(onFinish)
    vi.advanceTimersByTime(60_000)

    expect(timer.remaining.value).toBe(0)
    expect(timer.running.value).toBe(false)
    expect(onFinish).toHaveBeenCalledOnce()
  })

  it('после завершения таймер можно запустить повторно без ухода в минус', () => {
    const timer = useTimer(1) // 1 минута

    // первый прогон до конца
    timer.start()
    vi.advanceTimersByTime(60_000)
    expect(timer.remaining.value).toBe(0)
    expect(timer.running.value).toBe(false)

    // повторный запуск — воспроизводим баг из отчёта пользователя
    timer.start()

    // сразу после старта таймер должен работать, а не выключаться мгновенно
    expect(timer.running.value).toBe(true)

    vi.advanceTimersByTime(1_000)

    // remaining не должен уходить в минус
    expect(timer.remaining.value).toBeGreaterThanOrEqual(0)
    // и таймер всё ещё должен идти — прошла всего 1 секунда из 60
    expect(timer.running.value).toBe(true)
    expect(timer.remaining.value).toBe(59)
  })
})

describe('useTimer — звук завершения (playChime)', () => {
  it('переиспользует один AudioContext между несколькими завершениями таймера, а не создаёт новый каждый раз', () => {
    let createdContexts = 0

    class FakeAudioContext {
      currentTime = 0
      destination = {}
      state = 'running'
      constructor() {
        createdContexts++
      }
      createOscillator() {
        return {
          connect: vi.fn(),
          frequency: { value: 0 },
          type: '',
          start: vi.fn(),
          stop: vi.fn(),
        }
      }
      createGain() {
        return {
          connect: vi.fn(),
          gain: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
        }
      }
      resume() {}
    }
    window.AudioContext = FakeAudioContext as unknown as typeof AudioContext

    const timer = useTimer(1) // 1 минута

    // первая медитация -> первый чайм
    timer.start()
    vi.advanceTimersByTime(60_000)

    // вторая медитация -> второй чайм
    timer.start()
    vi.advanceTimersByTime(60_000)

    // третья медитация -> третий чайм
    timer.start()
    vi.advanceTimersByTime(60_000)

    // AudioContext — тяжёлый и ограниченный браузером ресурс
    // (Safari жёстко ограничивает число одновременно существующих
    // несостроенных AudioContext). Должен быть создан один раз и переиспользован.
    expect(createdContexts).toBe(1)
  })
})
