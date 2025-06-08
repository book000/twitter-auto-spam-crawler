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
    ;(DomUtils.clickMoreReplies as jest.Mock).mockClear()
    ;(DomUtils.clickMoreRepliesAggressive as jest.Mock).mockClear()

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
    it.skip('should return immediately if scrolling is already in progress', async () => {
      // Start the first scroll
      const promise1 = ScrollUtils.scrollPage()

      // Second call should resolve immediately
      const promise2 = ScrollUtils.scrollPage()

      // Wait for second promise (should resolve immediately)
      await promise2

      // Clean up first scroll by triggering completion
      for (let i = 0; i < THRESHOLDS.MAX_FAIL_SCROLL_COUNT; i++) {
        jest.advanceTimersByTime(TIMEOUTS.SCROLL_INTERVAL)
      }

      await promise1
    })

    /** resetScrollStateメソッドの動作を検証 */
    it.skip('should properly reset scroll state with active interval', () => {
      // Start a scroll to create an interval
      ScrollUtils.scrollPage()

      // Reset state
      ScrollUtils.resetScrollState()

      // Should be able to start a new scroll immediately
      const promise = ScrollUtils.scrollPage()

      // Clean up
      for (let i = 0; i < THRESHOLDS.MAX_FAIL_SCROLL_COUNT; i++) {
        jest.advanceTimersByTime(TIMEOUTS.SCROLL_INTERVAL)
      }

      return promise
    })

    /** 複数のscrollPage呼び出しが適切に処理されることを検証 */
    it.skip('should handle multiple scrollPage calls correctly', async () => {
      // First scroll starts normally
      const promise1 = ScrollUtils.scrollPage()

      // Second scroll should return immediately (line 29 coverage)
      const promise2 = ScrollUtils.scrollPage()

      // Check second promise resolves immediately
      let promise2Resolved = false
      promise2.then(() => {
        promise2Resolved = true
      })

      // Allow microtasks to process
      await Promise.resolve()
      expect(promise2Resolved).toBe(true)

      // Complete first scroll
      for (let i = 0; i < THRESHOLDS.MAX_FAIL_SCROLL_COUNT; i++) {
        jest.advanceTimersByTime(TIMEOUTS.SCROLL_INTERVAL)
      }

      await promise1
    })

    /** スクロール成功時に失敗カウントがリセットされることを検証 */
    it('should reset fail count when scroll succeeds', async () => {
      const consoleLogSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {})
      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

      // Set initial height
      Object.defineProperty(document.body, 'scrollHeight', {
        value: 1000,
        writable: true,
        configurable: true,
      })

      const promise = ScrollUtils.scrollPage()

      // Trigger one failure first
      jest.advanceTimersByTime(TIMEOUTS.SCROLL_INTERVAL)

      // Change height to simulate success (reset fail count)
      Object.defineProperty(document.body, 'scrollHeight', {
        value: 1500,
        writable: true,
        configurable: true,
      })

      jest.advanceTimersByTime(TIMEOUTS.SCROLL_INTERVAL)

      // Keep height same to reach max failures
      for (let i = 0; i < THRESHOLDS.MAX_FAIL_SCROLL_COUNT; i++) {
        jest.advanceTimersByTime(TIMEOUTS.SCROLL_INTERVAL)
      }

      await expect(promise).resolves.toBeUndefined()

      expect(consoleLogSpy).toHaveBeenCalledWith('scrollPage: success')
      expect(consoleWarnSpy).toHaveBeenCalledWith('scrollPage: failed scroll')

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
    it.skip('should wait between scrolls', async () => {
      const count = 2
      const promise = ScrollUtils.scrollWithCount(count)

      // First scroll happens immediately
      expect(mockScrollBy).toHaveBeenCalledTimes(1)

      // Advance timers for all setTimeout calls
      for (let i = 0; i < count; i++) {
        jest.advanceTimersByTime(TIMEOUTS.CRAWL_INTERVAL)
      }

      await promise
      expect(mockScrollBy).toHaveBeenCalledTimes(count)
    })

    /** 正しいパラメーターでスクロールが実行されることを検証 */
    it('should scroll with correct parameters', async () => {
      const promise = ScrollUtils.scrollWithCount(1)

      // Advance timer to complete the setTimeout in scrollWithCount
      jest.advanceTimersByTime(TIMEOUTS.CRAWL_INTERVAL)

      // Wait for promise to resolve
      await promise

      expect(mockScrollBy).toHaveBeenCalledWith({
        top: window.innerHeight,
        behavior: 'smooth',
      })
    })
  })
})
