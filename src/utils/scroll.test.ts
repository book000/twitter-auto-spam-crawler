import { ScrollUtils } from './scroll'
import { DomUtils } from './dom'
import { TIMEOUTS, THRESHOLDS } from '../core/constants'

// Mock DomUtils
jest.mock('./dom', () => ({
  DomUtils: {
    clickMoreReplies: jest.fn(),
    clickMoreRepliesAggressive: jest.fn(),
  },
}))

// Mock timers
jest.useFakeTimers()

// Mock window.scrollBy and window.innerHeight
const mockScrollBy = jest.fn()
Object.defineProperty(window, 'scrollBy', {
  value: mockScrollBy,
  writable: true,
})

Object.defineProperty(window, 'innerHeight', {
  value: 800,
  writable: true,
})

// Mock document.body.scrollHeight
Object.defineProperty(document.body, 'scrollHeight', {
  value: 1000,
  writable: true,
  configurable: true,
})

describe('ScrollUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    mockScrollBy.mockClear()
    ;(DomUtils.clickMoreReplies as jest.Mock).mockClear()
    ;(DomUtils.clickMoreRepliesAggressive as jest.Mock).mockClear()

    // Reset scroll height
    Object.defineProperty(document.body, 'scrollHeight', {
      value: 1000,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
  })

  describe('scrollPage', () => {
    it('should start scrolling and resolve when max fail count is reached', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

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

    it('should detect successful scrolling when page height changes', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

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

    it('should return immediately if scrolling is already in progress', async () => {
      const promise1 = ScrollUtils.scrollPage()
      const promise2 = ScrollUtils.scrollPage()

      // Second call should resolve immediately
      await expect(promise2).resolves.toBeUndefined()

      // Complete the first scroll
      for (let i = 0; i < THRESHOLDS.MAX_FAIL_SCROLL_COUNT + 1; i++) {
        jest.advanceTimersByTime(TIMEOUTS.SCROLL_INTERVAL)
      }

      await expect(promise1).resolves.toBeUndefined()
    })

    it('should reset fail count when scroll succeeds', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      const promise = ScrollUtils.scrollPage()

      // Fail once
      jest.advanceTimersByTime(TIMEOUTS.SCROLL_INTERVAL)

      // Success (height changes)
      Object.defineProperty(document.body, 'scrollHeight', {
        value: 1500,
        writable: true,
        configurable: true,
      })
      jest.advanceTimersByTime(TIMEOUTS.SCROLL_INTERVAL)

      // Fail again until max count
      for (let i = 0; i < THRESHOLDS.MAX_FAIL_SCROLL_COUNT; i++) {
        jest.advanceTimersByTime(TIMEOUTS.SCROLL_INTERVAL)
      }

      await expect(promise).resolves.toBeUndefined()

      expect(consoleLogSpy).toHaveBeenCalledWith('scrollPage: success')
      expect(consoleWarnSpy).toHaveBeenCalledWith('scrollPage: failed scroll')

      // Should have been called MAX_FAIL_SCROLL_COUNT times (reset after success)
      expect(consoleWarnSpy).toHaveBeenCalledTimes(
        THRESHOLDS.MAX_FAIL_SCROLL_COUNT
      )

      consoleLogSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    })
  })

  describe('scrollWithCount', () => {
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

    it('should handle zero count', async () => {
      const promise = ScrollUtils.scrollWithCount(0)

      await expect(promise).resolves.toBeUndefined()

      expect(mockScrollBy).not.toHaveBeenCalled()
    })

    it('should wait between scrolls', () => {
      const count = 2
      ScrollUtils.scrollWithCount(count)

      // First scroll should happen immediately
      expect(mockScrollBy).toHaveBeenCalledTimes(1)
      expect(mockScrollBy).toHaveBeenCalled()
    })

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
