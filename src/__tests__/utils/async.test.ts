import { AsyncUtils } from '@/utils/async'

describe('AsyncUtils', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('delay', () => {
    it('should delay for specified time', async () => {
      const promise = AsyncUtils.delay(1000)

      jest.advanceTimersByTime(999)
      expect(jest.getTimerCount()).toBe(1)

      jest.advanceTimersByTime(1)
      await expect(promise).resolves.toBeUndefined()
    })

    it('should be cancellable with AbortSignal', async () => {
      const controller = new AbortController()
      const promise = AsyncUtils.delay(1000, controller.signal)

      controller.abort()
      await expect(promise).rejects.toThrow('Delay was aborted')
    })

    it('should reject immediately if signal is already aborted', async () => {
      const controller = new AbortController()
      controller.abort()

      const promise = AsyncUtils.delay(1000, controller.signal)
      await expect(promise).rejects.toThrow('Delay was aborted')
    })

    it('should cancel timeout when aborted during delay', async () => {
      const controller = new AbortController()
      const promise = AsyncUtils.delay(1000, controller.signal)

      jest.advanceTimersByTime(500)
      controller.abort()

      await expect(promise).rejects.toThrow('Delay was aborted')
      expect(jest.getTimerCount()).toBe(0)
    })
  })

  describe('randomDelay', () => {
    it('should delay for a random time between min and max', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5)

      const promise = AsyncUtils.randomDelay(1000, 2000)

      // 1500ms (min + 0.5 * (max - min))
      jest.advanceTimersByTime(1499)
      expect(jest.getTimerCount()).toBe(1)

      jest.advanceTimersByTime(1)
      await expect(promise).resolves.toBeUndefined()
    })

    it('should support cancellation', async () => {
      const controller = new AbortController()
      const promise = AsyncUtils.randomDelay(1000, 2000, controller.signal)

      controller.abort()
      await expect(promise).rejects.toThrow('Delay was aborted')
    })
  })

  describe('withTimeout', () => {
    it('should resolve if operation completes before timeout', async () => {
      const operation = new Promise((resolve) => {
        setTimeout(() => {
          resolve('success')
        }, 1000)
      })

      const promise = AsyncUtils.withTimeout(operation, 2000)
      jest.advanceTimersByTime(1000)

      await expect(promise).resolves.toBe('success')
    })

    it('should reject if operation times out', async () => {
      const operation = new Promise((resolve) => {
        setTimeout(() => {
          resolve('success')
        }, 2000)
      })

      const promise = AsyncUtils.withTimeout(operation, 1000, 'Custom timeout')
      jest.advanceTimersByTime(1000)

      await expect(promise).rejects.toThrow('Custom timeout')
    })

    it('should use default timeout message', async () => {
      const operation = new Promise(() => {
        // Never resolves
      })

      const promise = AsyncUtils.withTimeout(operation, 1000)
      jest.advanceTimersByTime(1000)

      await expect(promise).rejects.toThrow('Operation timed out')
    })
  })
})
