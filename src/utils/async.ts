/**
 * 非同期処理用のユーティリティ関数群
 */
export const AsyncUtils = {
  /**
   * 指定した時間だけ処理を遅延する
   *
   * @param ms - 遅延時間（ミリ秒）
   * @param signal - AbortSignal（キャンセル用）
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * // 1秒待機
   * await AsyncUtils.delay(1000)
   *
   * // キャンセル可能な待機
   * const controller = new AbortController()
   * await AsyncUtils.delay(5000, controller.signal)
   * ```
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
   * ランダムな時間だけ処理を遅延する
   *
   * @param minMs - 最小遅延時間
   * @param maxMs - 最大遅延時間
   * @param signal - AbortSignal
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * // 500ms〜1500msの間でランダム遅延
   * await AsyncUtils.randomDelay(500, 1500)
   * ```
   */
  randomDelay(
    minMs: number,
    maxMs: number,
    signal?: AbortSignal
  ): Promise<void> {
    const durationMs = Math.random() * (maxMs - minMs) + minMs
    return this.delay(durationMs, signal)
  },

  /**
   * 指数バックオフによる遅延
   *
   * @param baseMs - 基本遅延時間
   * @param attempt - 試行回数（0から開始）
   * @param maxMs - 最大遅延時間
   * @param signal - AbortSignal
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * // リトライ処理での使用
   * for (let attempt = 0; attempt < maxRetries; attempt++) {
   *   try {
   *     await operation()
   *     break
   *   } catch (error) {
   *     if (attempt === maxRetries - 1) throw error
   *     await AsyncUtils.exponentialBackoff(1000, attempt, 10000)
   *   }
   * }
   * ```
   */
  exponentialBackoff(
    baseMs: number,
    attempt: number,
    maxMs = 30_000,
    signal?: AbortSignal
  ): Promise<void> {
    const backoffMs = Math.min(baseMs * Math.pow(2, attempt), maxMs)
    return this.delay(backoffMs, signal)
  },

  /**
   * タイムアウト付きPromise
   *
   * @param promise - 元のPromise
   * @param timeoutMs - タイムアウト時間
   * @param timeoutMessage - タイムアウト時のエラーメッセージ
   * @returns Promise<T>
   *
   * @example
   * ```typescript
   * const result = await AsyncUtils.withTimeout(
   *   fetchData(),
   *   5000,
   *   'Data fetch timed out'
   * )
   * ```
   */
  withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage = 'Operation timed out'
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      setTimeout(() => {
        reject(new Error(timeoutMessage))
      }, timeoutMs)
    })

    return Promise.race([promise, timeoutPromise])
  },

  /**
   * リトライ処理のヘルパー
   *
   * @param operation - 実行する非同期操作
   * @param options - リトライオプション
   * @returns Promise<T>
   *
   * @example
   * ```typescript
   * const result = await AsyncUtils.retry(
   *   () => unstableApiCall(),
   *   { maxAttempts: 3, baseDelay: 1000 }
   * )
   * ```
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
          ? this.exponentialBackoff(baseDelay, attempt, 30_000, signal)
          : this.delay(baseDelay, signal))
      }
    }

    // This should never happen because we throw in the loop
    throw lastError ?? new Error('Retry failed')
  },
}

export interface RetryOptions {
  maxAttempts?: number
  baseDelay?: number
  useExponentialBackoff?: boolean
  signal?: AbortSignal
}
