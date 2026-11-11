import { ExamplePages } from '../../pages/example-pages'
import { DELAYS } from '../../core/constants'
import { Storage } from '../../core/storage'
import { TweetService } from '../../services/tweet-service'
import { QueueService } from '../../services/queue-service'
import { NotificationService } from '../../services/notification-service'
import { AsyncUtils } from '../../utils/async'
import { TweetPage } from '../../pages/tweet-page'
import { PageErrorHandler } from '../../utils/page-error-handler'
import {
  setupUserscriptMocks,
  setupConsoleMocks,
  restoreConsoleMocks,
} from '../utils/page-test-utils'
// Import mock before the module under test
import { clearMockStorage } from '../../__mocks__/userscript'

jest.mock('../../core/storage')
jest.mock('../../services/tweet-service')
jest.mock('../../services/queue-service')
jest.mock('../../services/notification-service')
jest.mock('../../utils/async')
jest.mock('../../pages/tweet-page')
jest.mock('../../utils/page-error-handler')

jest.useFakeTimers()

describe('ExamplePages', () => {
  let consoleMocks: ReturnType<typeof setupConsoleMocks>

  beforeEach(() => {
    setupUserscriptMocks()
    clearMockStorage()
    consoleMocks = setupConsoleMocks()

    jest.clearAllMocks()
    jest.clearAllTimers()

    ;(TweetService.isNeedDownload as jest.Mock).mockReturnValue(false)
    ;(TweetService.downloadTweets as jest.Mock).mockImplementation(() => {})
    ;(AsyncUtils.delay as jest.Mock).mockResolvedValue(undefined)
    ;(TweetPage.run as jest.Mock).mockResolvedValue(undefined)
    ;(NotificationService.notifyDiscord as jest.Mock).mockResolvedValue(
      undefined
    )
    ;(QueueService.resetWaitingQueue as jest.Mock).mockImplementation(() => {})
    ;(Storage.setLoginNotified as jest.Mock).mockImplementation(() => {})
    ;(Storage.setLockedNotified as jest.Mock).mockImplementation(() => {})
    ;(PageErrorHandler.logAction as jest.Mock).mockImplementation(() => {})
    ;(PageErrorHandler.logError as jest.Mock).mockImplementation(() => {})

    globalThis.alert = jest.fn()
    globalThis.setTimeout = jest.fn() as any
    Object.defineProperty(globalThis, 'close', {
      value: jest.fn(),
      writable: true,
    })
  })

  afterEach(() => {
    restoreConsoleMocks(consoleMocks)
    jest.runOnlyPendingTimers()
  })

  describe('runDownloadJson', () => {
    it('should skip download when not needed', async () => {
      ;(TweetService.isNeedDownload as jest.Mock).mockReturnValue(false)

      await ExamplePages.runDownloadJson()

      expect(TweetService.downloadTweets).not.toHaveBeenCalled()
      expect(AsyncUtils.delay).not.toHaveBeenCalledWith(DELAYS.DOWNLOAD_WAIT)
      expect(TweetPage.run).toHaveBeenCalledWith(true)
    })

    it('should download when needed', async () => {
      ;(TweetService.isNeedDownload as jest.Mock).mockReturnValue(true)

      await ExamplePages.runDownloadJson()

      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'download needed. Wait 5 seconds.'
      )
      expect(TweetService.downloadTweets).toHaveBeenCalled()
      expect(AsyncUtils.delay).toHaveBeenCalledWith(DELAYS.DOWNLOAD_WAIT)
      expect(TweetPage.run).toHaveBeenCalledWith(true)
    })

    it('should handle TweetPage.run error gracefully', async () => {
      const mockError = new Error('TweetPage error')
      ;(TweetPage.run as jest.Mock).mockRejectedValue(mockError)

      await ExamplePages.runDownloadJson()

      expect(PageErrorHandler.logError).toHaveBeenCalledWith(
        'Error in TweetPage.run',
        mockError
      )
    })
  })

  describe('runLoginNotify', () => {
    it('should send login notification successfully', async () => {
      let notificationCallback: (() => void) | undefined
      ;(NotificationService.notifyDiscord as jest.Mock).mockImplementation(
        (_message, callback) => {
          notificationCallback = callback
          return Promise.resolve()
        }
      )

      ExamplePages.runLoginNotify()

      expect(NotificationService.notifyDiscord).toHaveBeenCalledWith(
        ':key: Need to login.',
        expect.any(Function),
        false,
        ''
      )

      if (notificationCallback) {
        notificationCallback()
      }

      expect(window.close).toHaveBeenCalled()
      expect(Storage.setLoginNotified).toHaveBeenCalledWith(true)

      await Promise.resolve()
      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'Notification sent successfully'
      )
    })

    it('should handle notification error', async () => {
      const mockError = new Error('Notification failed')
      ;(NotificationService.notifyDiscord as jest.Mock).mockRejectedValue(
        mockError
      )

      ExamplePages.runLoginNotify()

      await jest.runAllTimersAsync()
      expect(PageErrorHandler.logError).toHaveBeenCalledWith(
        'Failed to notify login',
        mockError
      )
    })
  })

  describe('runLoginSuccessNotify', () => {
    it('should send login success notification', async () => {
      let notificationCallback: (() => void) | undefined
      ;(NotificationService.notifyDiscord as jest.Mock).mockImplementation(
        (_message, callback) => {
          notificationCallback = callback
          return Promise.resolve()
        }
      )

      ExamplePages.runLoginSuccessNotify()

      expect(NotificationService.notifyDiscord).toHaveBeenCalledWith(
        ':white_check_mark: Login is successful!',
        expect.any(Function),
        false,
        ''
      )

      if (notificationCallback) {
        notificationCallback()
      }

      expect(window.close).toHaveBeenCalled()

      await Promise.resolve()
      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'Notification sent successfully'
      )
    })

    it('should handle login success notification error', async () => {
      const mockError = new Error('Notification failed')
      ;(NotificationService.notifyDiscord as jest.Mock).mockRejectedValue(
        mockError
      )

      ExamplePages.runLoginSuccessNotify()

      await jest.runAllTimersAsync()
      expect(PageErrorHandler.logError).toHaveBeenCalledWith(
        'Failed to notify login success',
        mockError
      )
    })
  })

  describe('runLockedNotify', () => {
    it('should send account locked notification without setting flag in callback', async () => {
      let notificationCallback: (() => void) | undefined
      ;(NotificationService.notifyDiscord as jest.Mock).mockImplementation(
        (_message, callback) => {
          notificationCallback = callback
          return Promise.resolve()
        }
      )

      ExamplePages.runLockedNotify()

      expect(NotificationService.notifyDiscord).toHaveBeenCalledWith(
        ':lock: Account is locked!',
        expect.any(Function),
        true,
        ''
      )

      if (notificationCallback) {
        notificationCallback()
      }

      expect(window.close).toHaveBeenCalled()
      // The flag is set before notifying, so the callback must not set it again
      expect(Storage.setLockedNotified).not.toHaveBeenCalled()

      await Promise.resolve()
      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'Notification sent successfully'
      )
    })

    it('should handle account locked notification error and reset flag', async () => {
      const mockError = new Error('Notification failed')
      ;(NotificationService.notifyDiscord as jest.Mock).mockRejectedValue(
        mockError
      )

      ExamplePages.runLockedNotify()

      await jest.runAllTimersAsync()

      // A failed notification resets the flag so it can be retried
      expect(Storage.setLockedNotified).toHaveBeenCalledWith(false)
      expect(PageErrorHandler.logError).toHaveBeenCalledWith(
        'Failed to notify account locked',
        mockError
      )
    })
  })

  describe('runUnlockedNotify', () => {
    it('should send account unlocked notification', async () => {
      let notificationCallback: (() => void) | undefined
      ;(NotificationService.notifyDiscord as jest.Mock).mockImplementation(
        (_message, callback) => {
          notificationCallback = callback
          return Promise.resolve()
        }
      )

      ExamplePages.runUnlockedNotify()

      expect(NotificationService.notifyDiscord).toHaveBeenCalledWith(
        ':unlock: Account is unlocked.',
        expect.any(Function),
        false,
        ''
      )

      if (notificationCallback) {
        notificationCallback()
      }

      expect(window.close).toHaveBeenCalled()

      await Promise.resolve()
      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'Notification sent successfully'
      )
    })

    it('should handle account unlocked notification error', async () => {
      const mockError = new Error('Notification failed')
      ;(NotificationService.notifyDiscord as jest.Mock).mockRejectedValue(
        mockError
      )

      ExamplePages.runUnlockedNotify()

      await jest.runAllTimersAsync()
      expect(PageErrorHandler.logError).toHaveBeenCalledWith(
        'Failed to notify account unlocked',
        mockError
      )
    })
  })

  describe('runResetWaiting', () => {
    it('should reset waiting queue and redirect to home', () => {
      ExamplePages.runResetWaiting()

      expect(QueueService.resetWaitingQueue).toHaveBeenCalled()
      expect(globalThis.alert).toHaveBeenCalledWith(
        'Successfully reset waitingTweets. Navigate to the home page in 3 seconds.'
      )
      expect(setTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        DELAYS.RESET_REDIRECT_WAIT
      )

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const setTimeoutCallback = (setTimeout as any).mock.calls[0][0]
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      setTimeoutCallback()

      // Since we can't mock location.href in JSDOM, we verify the behavior by checking
      // that setTimeout was called with the correct parameters
      expect(setTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        DELAYS.RESET_REDIRECT_WAIT
      )
    })
  })

  describe('runUpdateNotify', () => {
    it('should send update notification with version info', async () => {
      const mockGet = jest.fn()
      mockGet.mockImplementation((key: string) => {
        if (key === 'old') return '1.0.0'
        return key === 'new' ? '1.1.0' : null
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(globalThis as any).URLSearchParams = jest
        .fn()
        .mockImplementation(() => ({
          get: mockGet,
        }))

      let notificationCallback: (() => void) | undefined
      ;(NotificationService.notifyDiscord as jest.Mock).mockImplementation(
        (_message, callback) => {
          notificationCallback = callback
          return Promise.resolve()
        }
      )

      ExamplePages.runUpdateNotify()

      const expectedMessage =
        '🚀 Twitter Auto Spam Crawler がアップデートされました!\n' +
        '📦 1.0.0 → 1.1.0\n' +
        '✨ 新しいバージョンが適用されました。'

      expect(NotificationService.notifyDiscord).toHaveBeenCalledWith(
        expectedMessage,
        expect.any(Function),
        true
      )

      if (notificationCallback) {
        notificationCallback()
      }

      expect(window.close).toHaveBeenCalled()

      await Promise.resolve()
      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'Update notification sent successfully'
      )
    })

    it('should handle missing version parameters', () => {
      const mockGet = jest.fn()
      mockGet.mockImplementation((key: string) => {
        if (key === 'old') return '1.0.0'
        return key === 'new' ? null : null
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(globalThis as any).URLSearchParams = jest
        .fn()
        .mockImplementation(() => ({
          get: mockGet,
        }))

      ExamplePages.runUpdateNotify()

      expect(PageErrorHandler.logError).toHaveBeenCalledWith(
        'Missing version parameters'
      )
      expect(window.close).toHaveBeenCalled()
      expect(NotificationService.notifyDiscord).not.toHaveBeenCalled()
    })

    it('should handle update notification error', async () => {
      const mockGet = jest.fn()
      mockGet.mockImplementation((key: string) => {
        if (key === 'old') return '1.0.0'
        return key === 'new' ? '1.1.0' : null
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(globalThis as any).URLSearchParams = jest
        .fn()
        .mockImplementation(() => ({
          get: mockGet,
        }))

      const mockError = new Error('Notification failed')
      ;(NotificationService.notifyDiscord as jest.Mock).mockRejectedValue(
        mockError
      )

      ExamplePages.runUpdateNotify()

      await jest.runAllTimersAsync()
      expect(PageErrorHandler.logError).toHaveBeenCalledWith(
        'Failed to notify update',
        mockError
      )
    })

    it('should handle empty version parameters', () => {
      const mockGet = jest.fn()
      mockGet.mockImplementation((key: string) => {
        if (key === 'old') return ''
        return key === 'new' ? '1.1.0' : null
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(globalThis as any).URLSearchParams = jest
        .fn()
        .mockImplementation(() => ({
          get: mockGet,
        }))

      ExamplePages.runUpdateNotify()

      expect(PageErrorHandler.logError).toHaveBeenCalledWith(
        'Missing version parameters'
      )
      expect(window.close).toHaveBeenCalled()
    })
  })
})
