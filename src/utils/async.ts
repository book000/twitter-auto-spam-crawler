/** Promise-based timing helpers: delays and timeouts. */
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
}
