/** Promise-based timing helpers: delays, timeouts and retries. */
export const AsyncUtils = {
  /**
   * Waits for the given time.
   *
   * @param ms - Delay in milliseconds
   * @param signal - Aborting it cancels the wait
   * @returns A promise that resolves after `ms`, or rejects with an Error
   *   if the signal is already aborted or is aborted during the wait
   */
  delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new Error('Delay was aborted'))
        return
      }

      const timeoutId = setTimeout(() => {
        resolve()
      }, ms)

      signal?.addEventListener('abort', () => {
        clearTimeout(timeoutId)
        reject(new Error('Delay was aborted'))
      })
    })
  },

  /**
   * Waits for a random time between `minMs` and `maxMs`.
   *
   * @param minMs - Minimum delay in milliseconds
   * @param maxMs - Maximum delay in milliseconds
   * @param signal - Aborting it cancels the wait, as in {@link AsyncUtils.delay}
   * @returns A promise with the same settle behavior as `delay`
   */
  randomDelay(
    minMs: number,
    maxMs: number,
    signal?: AbortSignal
  ): Promise<void> {
    const durationMs = Math.random() * (maxMs - minMs) + minMs
    return AsyncUtils.delay(durationMs, signal)
  },

  /**
   * Waits for `baseMs * 2^attempt`, capped at `maxMs`.
   *
   * @param baseMs - Delay for the first attempt, in milliseconds
   * @param attempt - Zero-based attempt number
   * @param maxMs - Upper bound of the delay in milliseconds
   * @param signal - Aborting it cancels the wait, as in {@link AsyncUtils.delay}
   * @returns A promise with the same settle behavior as `delay`
   */
  exponentialBackoff(
    baseMs: number,
    attempt: number,
    maxMs = 30_000,
    signal?: AbortSignal
  ): Promise<void> {
    const backoffMs = Math.min(baseMs * Math.pow(2, attempt), maxMs)
    return AsyncUtils.delay(backoffMs, signal)
  },

  /**
   * Races a promise against a timeout.
   * The original promise is not cancelled when the timeout wins.
   *
   * @param promise - The promise to wait for
   * @param timeoutMs - Timeout in milliseconds
   * @param timeoutMessage - Message of the Error thrown on timeout
   * @returns The settled value of `promise`
   * @throws The rejection of `promise`, or an Error if the timeout elapses first
   */
  withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage = 'Operation timed out'
  ): Promise<T> {
    let timeoutId: NodeJS.Timeout
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(timeoutMessage))
      }, timeoutMs)
    })

    return Promise.race([promise, timeoutPromise]).finally(() => {
      clearTimeout(timeoutId)
    })
  },

  /**
   * Runs an operation, retrying on failure with a delay between attempts.
   *
   * @param operation - The async operation to run
   * @param options - Retry settings
   * @returns The result of the first successful attempt
   * @throws The error of the last attempt once `maxAttempts` is exhausted, or
   *   the abort Error if the signal aborts while waiting between attempts
   */
  async retry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      useExponentialBackoff = true,
      signal,
    } = options

    let lastError: Error | undefined

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error

        if (attempt === maxAttempts - 1) {
          throw lastError
        }

        await (useExponentialBackoff
          ? AsyncUtils.exponentialBackoff(baseDelay, attempt, 30_000, signal)
          : AsyncUtils.delay(baseDelay, signal))
      }
    }

    // This should never happen because we throw in the loop
    throw lastError ?? new Error('Retry failed')
  },
}

/** Options for {@link AsyncUtils.retry}. */
export interface RetryOptions {
  /** Maximum number of attempts, including the first (default: 3) */
  maxAttempts?: number
  /** Base delay between attempts in milliseconds (default: 1000) */
  baseDelay?: number
  /** Double the delay on each attempt, capped at 30 s (default: true) */
  useExponentialBackoff?: boolean
  /** Aborting it cancels the wait between attempts */
  signal?: AbortSignal
}
