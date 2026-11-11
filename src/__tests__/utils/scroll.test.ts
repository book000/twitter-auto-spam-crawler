import { ScrollUtils } from '../../utils/scroll'
import { DomUtils } from '../../utils/dom'
import { TIMEOUTS, THRESHOLDS } from '../../core/constants'

jest.mock('../../utils/dom', () => ({
  DomUtils: {
    clickMoreReplies: jest.fn(),
    clickMoreRepliesAggressive: jest.fn(),
  },
}))

jest.useFakeTimers()

const mockScrollBy = jest.fn()
Object.defineProperties(globalThis, {
  scrollBy: {
    value: mockScrollBy,
    writable: true,
  },
  innerHeight: {
    value: 800,
    writable: true,
  },
})

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

    ScrollUtils.resetScrollState()

    Object.defineProperty(document.body, 'scrollHeight', {
      value: 1000,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    ScrollUtils.resetScrollState()
    jest.runOnlyPendingTimers()
  })

  describe('scrollPage', () => {
    it('should start scrolling and resolve when max fail count is reached', async () => {
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

      const promise = ScrollUtils.scrollPage()

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

    // TODO: Re-enable after improving fakeTimers setup
    it.skip('should return immediately if scrolling is already in progress', async () => {
      const promise1 = ScrollUtils.scrollPage()

      const promise2 = ScrollUtils.scrollPage()

      await promise2

      for (let i = 0; i < THRESHOLDS.MAX_FAIL_SCROLL_COUNT; i++) {
        jest.advanceTimersByTime(TIMEOUTS.SCROLL_INTERVAL)
      }

      await promise1
    })

    // TODO: Re-enable after improving timer mocks for state cleanup
    it.skip('should properly reset scroll state with active interval', () => {
      ScrollUtils.scrollPage()

      ScrollUtils.resetScrollState()

      const promise = ScrollUtils.scrollPage()

      for (let i = 0; i < THRESHOLDS.MAX_FAIL_SCROLL_COUNT; i++) {
        jest.advanceTimersByTime(TIMEOUTS.SCROLL_INTERVAL)
      }

      return promise
    })

    // TODO: Re-enable by refining fakeTimers for multiple Promise handling
    it.skip('should handle multiple scrollPage calls correctly', async () => {
      const promise1 = ScrollUtils.scrollPage()

      const promise2 = ScrollUtils.scrollPage()

      let promise2Resolved = false
      promise2.then(() => {
        promise2Resolved = true
      })

      // Allow microtasks to process
      await Promise.resolve()
      expect(promise2Resolved).toBe(true)

      for (let i = 0; i < THRESHOLDS.MAX_FAIL_SCROLL_COUNT; i++) {
        jest.advanceTimersByTime(TIMEOUTS.SCROLL_INTERVAL)
      }

      await promise1
    })

    it('should reset fail count when scroll succeeds', async () => {
      const consoleLogSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {})
      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

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
})
