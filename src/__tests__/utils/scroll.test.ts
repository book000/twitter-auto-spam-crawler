import { ScrollUtils } from '../../utils/scroll'
import { DomUtils } from '../../utils/dom'
import { TIMEOUTS, THRESHOLDS } from '../../core/constants'

// Mock DomUtils
jest.mock('../../utils/dom', () => ({
  DomUtils: {
    clickMoreReplies: jest.fn(),
    clickMoreRepliesAggressive: jest.fn(),
  },
}))

// Mock timers
jest.useFakeTimers()

// Mock window.scrollBy and window.innerHeight
const mockScrollBy = jest.fn()
Object.defineProperty(globalThis, 'scrollBy', {
  value: mockScrollBy,
  writable: true,
})

Object.defineProperty(globalThis, 'innerHeight', {
  value: 800,
  writable: true,
})

// Mock document.body.scrollHeight
Object.defineProperty(document.body, 'scrollHeight', {
  value: 1000,
  writable: true,
  configurable: true,
})

/**
 * ScrollUtilsクラスのテストスイート
 * ページスクロール機能とスクロール制御ロジックを検証する
 * - 自動スクロールとページ高さ変化の検出
 * - スクロール失敗回数の管理と制限
 * - 返信展開ボタンとの連携機能
 * - 指定回数のスクロール実行機能
 */
describe('ScrollUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    mockScrollBy.mockClear()
    ;(DomUtils.clickMoreReplies as jest.Mock).mockClear?.()
    ;(DomUtils.clickMoreRepliesAggressive as jest.Mock).mockClear?.()

    // Reset scroll state for clean tests
    ScrollUtils.resetScrollState()

    // Reset scroll height
    Object.defineProperty(document.body, 'scrollHeight', {
      value: 1000,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    // Clean up any running intervals
    ScrollUtils.resetScrollState()
    jest.runOnlyPendingTimers()
  })

  /**
   * scrollPageメソッドのテスト
   * ページの自動スクロールとコンテンツ読み込み検出機能を検証
   */
  describe('scrollPage', () => {
    /** 最大失敗回数に達した時にスクロールが終了することを検証 */
    it('should start scrolling and resolve when max fail count is reached', async () => {
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

      const promise = ScrollUtils.scrollPage()

      // Simulate reaching max fail scroll count
      for (let i = 0; i < THRESHOLDS.MAX_FAIL_SCROLL_COUNT + 1; i++) {
        jest.advanceTimersByTime(TIMEOUTS.SCROLL_INTERVAL)
      }

      await expect(promise).resolves.toBeUndefined()

      expect(mockScrollBy).toHaveBeenCalledWith({
        top: 800,
        behavior: 'smooth',
      })
      expect(DomUtils.clickMoreReplies).toHaveBeenCalled()
      expect(DomUtils.clickMoreRepliesAggressive).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith('scrollPage: failed scroll')

      consoleSpy.mockRestore()
    })

    /** ページ高の変化でスクロール成功を検出することを検証 */
    it('should detect successful scrolling when page height changes', async () => {
      const consoleLogSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {})
      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

      const promise = ScrollUtils.scrollPage()

      // First scroll - height changes (success)
      jest.advanceTimersByTime(TIMEOUTS.SCROLL_INTERVAL / 2)
      Object.defineProperty(document.body, 'scrollHeight', {
        value: 1500,
        writable: true,
        configurable: true,
      })
      jest.advanceTimersByTime(TIMEOUTS.SCROLL_INTERVAL / 2)

      // Second scroll - height doesn't change (fail)
      jest.advanceTimersByTime(TIMEOUTS.SCROLL_INTERVAL)

      // Continue failing until max count
      for (let i = 1; i < THRESHOLDS.MAX_FAIL_SCROLL_COUNT; i++) {
        jest.advanceTimersByTime(TIMEOUTS.SCROLL_INTERVAL)
      }

      await expect(promise).resolves.toBeUndefined()

      expect(consoleLogSpy).toHaveBeenCalledWith('scrollPage: success')
      expect(consoleWarnSpy).toHaveBeenCalledWith('scrollPage: failed scroll')

      consoleLogSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    })

    /** スクロールが既に実行中の場合に即座に返すことを検証 */
    it('should return immediately if scrolling is already in progress', async () => {
      const promise1 = ScrollUtils.scrollPage()
      const promise2 = ScrollUtils.scrollPage()

      // Second call should resolve immediately
      await expect(promise2).resolves.toBeUndefined()

      // Complete the first scroll by triggering enough failures
      for (let i = 0; i < THRESHOLDS.MAX_FAIL_SCROLL_COUNT; i++) {
        jest.advanceTimersByTime(TIMEOUTS.SCROLL_INTERVAL)
      }

      await expect(promise1).resolves.toBeUndefined()
    })

    /** スクロール成功時に失敗カウントがリセットされることを検証 */
    it('should reset fail count when scroll succeeds', async () => {
      const consoleLogSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {})
      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

      // Start with initial height of 1000
      Object.defineProperty(document.body, 'scrollHeight', {
        value: 1000,
        writable: true,
        configurable: true,
      })

      const promise = ScrollUtils.scrollPage()

      // First interval - height stays same (fail)
      jest.advanceTimersByTime(TIMEOUTS.SCROLL_INTERVAL)

      // Change height to simulate successful scroll
      Object.defineProperty(document.body, 'scrollHeight', {
        value: 1500,
        writable: true,
        configurable: true,
      })

      // Second interval - height changed (success)
      jest.advanceTimersByTime(TIMEOUTS.SCROLL_INTERVAL)

      // Restore height to cause failures until max count
      Object.defineProperty(document.body, 'scrollHeight', {
        value: 1500, // Keep same height to cause failures
        writable: true,
        configurable: true,
      })

      // Fail again until max count
      for (let i = 0; i < THRESHOLDS.MAX_FAIL_SCROLL_COUNT; i++) {
        jest.advanceTimersByTime(TIMEOUTS.SCROLL_INTERVAL)
      }

      await expect(promise).resolves.toBeUndefined()

      expect(consoleLogSpy).toHaveBeenCalledWith('scrollPage: success')
      expect(consoleWarnSpy).toHaveBeenCalledWith('scrollPage: failed scroll')

      // Should have been called MAX_FAIL_SCROLL_COUNT times (1 before success resets counter, then MAX_FAIL_SCROLL_COUNT after)
      expect(consoleWarnSpy).toHaveBeenCalledTimes(
        THRESHOLDS.MAX_FAIL_SCROLL_COUNT
      )

      consoleLogSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    })
  })

  /**
   * scrollWithCountメソッドのテスト
   * 指定された回数だけスクロールを実行する機能を検証
   */
  describe('scrollWithCount', () => {
    /** スクロールが即座に実行されることを検証 */
    it('should call scrollBy immediately', () => {
      const count = 3
      ScrollUtils.scrollWithCount(count)

      // First scroll happens immediately
      expect(mockScrollBy).toHaveBeenCalledTimes(1)
      expect(mockScrollBy).toHaveBeenCalledWith({
        top: 800,
        behavior: 'smooth',
      })
    })

    /** ゼロ回数のスクロール指定が適切に処理されることを検証 */
    it('should handle zero count', async () => {
      const promise = ScrollUtils.scrollWithCount(0)

      await expect(promise).resolves.toBeUndefined()

      expect(mockScrollBy).not.toHaveBeenCalled()
    })

    /** スクロール間の適切な待機時間が設定されることを検証 */
    it('should wait between scrolls', async () => {
      const count = 2
      const promise = ScrollUtils.scrollWithCount(count)

      // First scroll should happen immediately
      expect(mockScrollBy).toHaveBeenCalledTimes(1)
      expect(mockScrollBy).toHaveBeenCalled()

      // Advance timer to trigger second scroll
      jest.advanceTimersByTime(TIMEOUTS.CRAWL_INTERVAL)

      // Wait for async operations to complete
      await promise

      // Second scroll should be called after timeout
      expect(mockScrollBy).toHaveBeenCalledTimes(2)
    })

    /** 正しいパラメーターでスクロールが実行されることを検証 */
    it('should scroll with correct parameters', async () => {
      const promise = ScrollUtils.scrollWithCount(1)

      jest.advanceTimersByTime(TIMEOUTS.CRAWL_INTERVAL)

      await expect(promise).resolves.toBeUndefined()

      expect(mockScrollBy).toHaveBeenCalledWith({
        top: window.innerHeight,
        behavior: 'smooth',
      })
    })
  })
})
