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

      // まだ解決されていないことを確認
      jest.advanceTimersByTime(999)
      expect(jest.getTimerCount()).toBe(1)

      // 時間を進めて解決を確認
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
      expect(jest.getTimerCount()).toBe(0) // タイマーがクリアされている
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

  describe('exponentialBackoff', () => {
    it('should calculate delay with exponential backoff', async () => {
      const baseMs = 1000

      // attempt 0: 1000ms
      const promise0 = AsyncUtils.exponentialBackoff(baseMs, 0)
      jest.advanceTimersByTime(1000)
      await expect(promise0).resolves.toBeUndefined()

      // attempt 1: 2000ms
      const promise1 = AsyncUtils.exponentialBackoff(baseMs, 1)
      jest.advanceTimersByTime(2000)
      await expect(promise1).resolves.toBeUndefined()

      // attempt 2: 4000ms
      const promise2 = AsyncUtils.exponentialBackoff(baseMs, 2)
      jest.advanceTimersByTime(4000)
      await expect(promise2).resolves.toBeUndefined()
    })

    it('should respect maximum delay', async () => {
      const baseMs = 1000
      const maxMs = 3000

      // attempt 10 would be 1024000ms, but should be capped at 3000ms
      const promise = AsyncUtils.exponentialBackoff(baseMs, 10, maxMs)
      jest.advanceTimersByTime(3000)
      await expect(promise).resolves.toBeUndefined()
    })

    it('should support cancellation', async () => {
      const controller = new AbortController()
      const promise = AsyncUtils.exponentialBackoff(
        1000,
        2,
        10_000,
        controller.signal
      )

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

  describe('retry', () => {
    it('should retry failed operations', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('1st fail'))
        .mockRejectedValueOnce(new Error('2nd fail'))
        .mockResolvedValueOnce('success')

      const promise = AsyncUtils.retry(operation, { maxAttempts: 3 })

      // 1回目の失敗
      await jest.advanceTimersByTimeAsync(0)
      expect(operation).toHaveBeenCalledTimes(1)

      // 1回目のリトライ遅延 (exponential backoff: 1000ms)
      await jest.advanceTimersByTimeAsync(1000)
      expect(operation).toHaveBeenCalledTimes(2)

      // 2回目のリトライ遅延 (exponential backoff: 2000ms)
      await jest.advanceTimersByTimeAsync(2000)
      expect(operation).toHaveBeenCalledTimes(3)

      await expect(promise).resolves.toBe('success')
    })

    it('should throw last error after max attempts', async () => {
      jest.useRealTimers() // Use real timers for this test to avoid timing issues

      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('1st fail'))
        .mockRejectedValueOnce(new Error('2nd fail'))
        .mockRejectedValueOnce(new Error('3rd fail'))

      const promise = AsyncUtils.retry(operation, {
        maxAttempts: 3,
        baseDelay: 1, // Very short delay for testing
        useExponentialBackoff: false,
      })

      await expect(promise).rejects.toThrow('3rd fail')
      expect(operation).toHaveBeenCalledTimes(3)

      jest.useFakeTimers() // Restore fake timers
    })

    it('should use fixed delay when exponential backoff is disabled', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('1st fail'))
        .mockRejectedValueOnce(new Error('2nd fail'))
        .mockResolvedValueOnce('success')

      const promise = AsyncUtils.retry(operation, {
        maxAttempts: 3,
        baseDelay: 500,
        useExponentialBackoff: false,
      })

      // 1回目の失敗
      await jest.advanceTimersByTimeAsync(0)
      expect(operation).toHaveBeenCalledTimes(1)

      // 固定遅延 500ms
      await jest.advanceTimersByTimeAsync(500)
      expect(operation).toHaveBeenCalledTimes(2)

      // 固定遅延 500ms
      await jest.advanceTimersByTimeAsync(500)
      expect(operation).toHaveBeenCalledTimes(3)

      await expect(promise).resolves.toBe('success')
    })

    it('should support cancellation', async () => {
      const controller = new AbortController()
      const operation = jest.fn().mockRejectedValue(new Error('Always fails'))

      const promise = AsyncUtils.retry(operation, {
        maxAttempts: 3,
        signal: controller.signal,
      })

      // 1回目の失敗後、キャンセル
      await jest.advanceTimersByTimeAsync(0)
      controller.abort()

      await expect(promise).rejects.toThrow('Delay was aborted')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should succeed on first attempt without delay', async () => {
      const operation = jest.fn().mockResolvedValueOnce('immediate success')

      const result = await AsyncUtils.retry(operation)

      expect(result).toBe('immediate success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should use default options', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success')

      const promise = AsyncUtils.retry(operation)

      // デフォルトの指数バックオフ遅延
      await jest.advanceTimersByTimeAsync(0)
      await jest.advanceTimersByTimeAsync(1000)

      await expect(promise).resolves.toBe('success')
    })
  })
})
