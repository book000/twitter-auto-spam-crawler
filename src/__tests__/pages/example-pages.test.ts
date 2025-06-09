import { ExamplePages } from '../../pages/example-pages'
import { URLS, DELAYS } from '../../core/constants'
import { Storage } from '../../core/storage'
import { TweetService } from '../../services/tweet-service'
import { QueueService } from '../../services/queue-service'
import { NotificationService } from '../../services/notification-service'
import { AsyncUtils } from '../../utils/async'
import { TweetPage } from '../../pages/tweet-page'
import {
  setupUserscriptMocks,
  setupConsoleMocks,
  restoreConsoleMocks,
} from '../utils/page-test-utils'

// Mock dependencies
jest.mock('../../core/storage')
jest.mock('../../services/tweet-service')
jest.mock('../../services/queue-service')
jest.mock('../../services/notification-service')
jest.mock('../../utils/async')
jest.mock('../../pages/tweet-page')

// Mock timers
jest.useFakeTimers()

/**
 * ExamplePagesクラスのテストスイート
 * 各種通知機能とツイートダウンロード、キューリセット機能を検証する
 * - JSON ダウンロード機能
 * - 各種 Discord 通知機能
 * - 待機キューリセット機能
 * - バージョン更新通知機能
 */
describe('ExamplePages', () => {
  let consoleMocks: ReturnType<typeof setupConsoleMocks>

  beforeEach(() => {
    // Setup mocks
    setupUserscriptMocks()
    consoleMocks = setupConsoleMocks()

    // Clear all mocks
    jest.clearAllMocks()
    jest.clearAllTimers()

    // Setup default mock implementations
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

    // Mock window methods
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
    /**
     * ダウンロードが不要な場合の処理をテスト
     * - TweetService.isNeedDownload()がfalseを返す場合
     * - ダウンロード処理がスキップされることを確認
     * - TweetPage.run(true)の実行確認
     */
    it('should skip download when not needed', async () => {
      ;(TweetService.isNeedDownload as jest.Mock).mockReturnValue(false)

      await ExamplePages.runDownloadJson()

      expect(TweetService.downloadTweets).not.toHaveBeenCalled()
      expect(AsyncUtils.delay).not.toHaveBeenCalledWith(DELAYS.DOWNLOAD_WAIT)
      expect(TweetPage.run).toHaveBeenCalledWith(true)
    })

    /**
     * ダウンロードが必要な場合の処理をテスト
     * - TweetService.isNeedDownload()がtrueを返す場合
     * - ダウンロード実行とログ出力
     * - 待機時間後のTweetPage.run(true)実行
     */
    it('should download when needed', async () => {
      ;(TweetService.isNeedDownload as jest.Mock).mockReturnValue(true)

      await ExamplePages.runDownloadJson()

      expect(consoleMocks.log).toHaveBeenCalledWith(
        'runDownloadJson: download needed. Wait 5 seconds.'
      )
      expect(TweetService.downloadTweets).toHaveBeenCalled()
      expect(AsyncUtils.delay).toHaveBeenCalledWith(DELAYS.DOWNLOAD_WAIT)
      expect(TweetPage.run).toHaveBeenCalledWith(true)
    })

    /**
     * TweetPage.runエラーのハンドリングをテスト
     * - TweetPage.run()で例外が発生した場合
     * - エラーが適切にキャッチされることを確認
     */
    it('should handle TweetPage.run error gracefully', async () => {
      const mockError = new Error('TweetPage error')
      ;(TweetPage.run as jest.Mock).mockRejectedValue(mockError)

      await ExamplePages.runDownloadJson()

      expect(consoleMocks.error).toHaveBeenCalledWith(
        'Error in TweetPage.run:',
        mockError
      )
    })
  })

  describe('runLoginNotify', () => {
    /**
     * ログイン通知の正常処理をテスト
     * - Discord通知の送信
     * - 成功時のコールバック実行
     * - Storage.setLoginNotified(true)の呼び出し
     */
    it('should send login notification successfully', async () => {
      let notificationCallback: (() => void) | undefined
      ;(NotificationService.notifyDiscord as jest.Mock).mockImplementation(
        (_message, callback, _skipAlert) => {
          notificationCallback = callback
          return Promise.resolve()
        }
      )

      ExamplePages.runLoginNotify()

      expect(NotificationService.notifyDiscord).toHaveBeenCalledWith(
        ':key: Need to login.',
        expect.any(Function),
        false
      )

      // Execute the callback
      if (notificationCallback) {
        notificationCallback()
      }

      expect(window.close).toHaveBeenCalled()
      expect(Storage.setLoginNotified).toHaveBeenCalledWith(true)

      // Wait for promise resolution
      await Promise.resolve()
      expect(consoleMocks.info).toHaveBeenCalledWith(
        'Notification sent successfully'
      )
    })

    /**
     * ログイン通知失敗時のエラーハンドリングをテスト
     * - NotificationService.notifyDiscord()で例外が発生した場合
     * - エラーログの出力確認
     */
    it('should handle notification error', async () => {
      const mockError = new Error('Notification failed')
      ;(NotificationService.notifyDiscord as jest.Mock).mockRejectedValue(
        mockError
      )

      ExamplePages.runLoginNotify()

      // Wait for promise rejection
      await Promise.resolve()
      expect(consoleMocks.error).toHaveBeenCalledWith(
        'Failed to notify login:',
        mockError
      )
    })
  })

  describe('runLoginSuccessNotify', () => {
    /**
     * ログイン成功通知の正常処理をテスト
     * - Discord通知の送信
     * - 成功時のコールバック実行
     */
    it('should send login success notification', async () => {
      let notificationCallback: (() => void) | undefined
      ;(NotificationService.notifyDiscord as jest.Mock).mockImplementation(
        (_message, callback, _skipAlert) => {
          notificationCallback = callback
          return Promise.resolve()
        }
      )

      ExamplePages.runLoginSuccessNotify()

      expect(NotificationService.notifyDiscord).toHaveBeenCalledWith(
        ':white_check_mark: Login is successful!',
        expect.any(Function),
        false
      )

      // Execute the callback
      if (notificationCallback) {
        notificationCallback()
      }

      expect(window.close).toHaveBeenCalled()

      // Wait for promise resolution
      await Promise.resolve()
      expect(consoleMocks.info).toHaveBeenCalledWith(
        'Notification sent successfully'
      )
    })

    /**
     * ログイン成功通知失敗時のエラーハンドリングをテスト
     */
    it('should handle login success notification error', async () => {
      const mockError = new Error('Notification failed')
      ;(NotificationService.notifyDiscord as jest.Mock).mockRejectedValue(
        mockError
      )

      ExamplePages.runLoginSuccessNotify()

      // Wait for promise rejection
      await Promise.resolve()
      expect(consoleMocks.error).toHaveBeenCalledWith(
        'Failed to notify login success:',
        mockError
      )
    })
  })

  describe('runLockedNotify', () => {
    /**
     * アカウントロック通知の正常処理をテスト
     * - Discord通知の送信（skipAlert=true）
     * - Storage.setLockedNotified(true)の呼び出し
     */
    it('should send account locked notification', async () => {
      let notificationCallback: (() => void) | undefined
      ;(NotificationService.notifyDiscord as jest.Mock).mockImplementation(
        (_message, callback, _skipAlert) => {
          notificationCallback = callback
          return Promise.resolve()
        }
      )

      ExamplePages.runLockedNotify()

      expect(NotificationService.notifyDiscord).toHaveBeenCalledWith(
        ':lock: Account is locked!',
        expect.any(Function),
        true
      )

      // Execute the callback
      if (notificationCallback) {
        notificationCallback()
      }

      expect(window.close).toHaveBeenCalled()
      expect(Storage.setLockedNotified).toHaveBeenCalledWith(true)

      // Wait for promise resolution
      await Promise.resolve()
      expect(consoleMocks.info).toHaveBeenCalledWith(
        'Notification sent successfully'
      )
    })

    /**
     * アカウントロック通知失敗時のエラーハンドリングをテスト
     */
    it('should handle account locked notification error', async () => {
      const mockError = new Error('Notification failed')
      ;(NotificationService.notifyDiscord as jest.Mock).mockRejectedValue(
        mockError
      )

      ExamplePages.runLockedNotify()

      // Wait for promise rejection
      await Promise.resolve()
      expect(consoleMocks.error).toHaveBeenCalledWith(
        'Failed to notify account locked:',
        mockError
      )
    })
  })

  describe('runUnlockedNotify', () => {
    /**
     * アカウントアンロック通知の正常処理をテスト
     * - Discord通知の送信
     * - 成功時のコールバック実行
     */
    it('should send account unlocked notification', async () => {
      let notificationCallback: (() => void) | undefined
      ;(NotificationService.notifyDiscord as jest.Mock).mockImplementation(
        (_message, callback, _skipAlert) => {
          notificationCallback = callback
          return Promise.resolve()
        }
      )

      ExamplePages.runUnlockedNotify()

      expect(NotificationService.notifyDiscord).toHaveBeenCalledWith(
        ':unlock: Account is unlocked.',
        expect.any(Function),
        false
      )

      // Execute the callback
      if (notificationCallback) {
        notificationCallback()
      }

      expect(window.close).toHaveBeenCalled()

      // Wait for promise resolution
      await Promise.resolve()
      expect(consoleMocks.info).toHaveBeenCalledWith(
        'Notification sent successfully'
      )
    })

    /**
     * アカウントアンロック通知失敗時のエラーハンドリングをテスト
     */
    it('should handle account unlocked notification error', async () => {
      const mockError = new Error('Notification failed')
      ;(NotificationService.notifyDiscord as jest.Mock).mockRejectedValue(
        mockError
      )

      ExamplePages.runUnlockedNotify()

      // Wait for promise rejection
      await Promise.resolve()
      expect(consoleMocks.error).toHaveBeenCalledWith(
        'Failed to notify account unlocked:',
        mockError
      )
    })
  })

  describe('runResetWaiting', () => {
    /**
     * 待機キューリセット機能をテスト
     * - QueueService.resetWaitingQueue()の呼び出し
     * - アラート表示
     * - タイムアウト後のホームページ遷移
     */
    it('should reset waiting queue and redirect to home', () => {
      ExamplePages.runResetWaiting()

      expect(QueueService.resetWaitingQueue).toHaveBeenCalled()
      expect(globalThis.alert).toHaveBeenCalledWith(
        'Successfully reset waitingTweets. Navigate to the home page in 3 seconds.'
      )
      expect(globalThis.setTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        DELAYS.RESET_REDIRECT_WAIT
      )

      // Execute the setTimeout callback
      const setTimeoutCallback = (globalThis.setTimeout as any).mock.calls[0][0]
      setTimeoutCallback()

      expect(globalThis.location.href).toBe(URLS.HOME)
    })
  })

  describe('runUpdateNotify', () => {
    /**
     * バージョン更新通知の正常処理をテスト
     * - URLパラメーターからバージョン情報取得
     * - Discord通知の送信
     */
    it('should send update notification with version info', async () => {
      // Mock URLSearchParams
      Object.defineProperty(globalThis, 'location', {
        value: {
          search: '?old=1.0.0&new=1.1.0',
        },
        writable: true,
        configurable: true,
        configurable: true,
      })

      let notificationCallback: (() => void) | undefined
      ;(NotificationService.notifyDiscord as jest.Mock).mockImplementation(
        (_message, callback, _skipAlert) => {
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

      // Execute the callback
      if (notificationCallback) {
        notificationCallback()
      }

      expect(window.close).toHaveBeenCalled()

      // Wait for promise resolution
      await Promise.resolve()
      expect(consoleMocks.info).toHaveBeenCalledWith(
        'Update notification sent successfully'
      )
    })

    /**
     * バージョンパラメーター不足時のエラーハンドリングをテスト
     * - oldまたはnewパラメーターが不足している場合
     * - エラーログ出力とウィンドウクローズ
     */
    it('should handle missing version parameters', () => {
      // Mock URLSearchParams with missing parameters
      Object.defineProperty(globalThis, 'location', {
        value: {
          search: '?old=1.0.0',
        },
        writable: true,
        configurable: true,
      })

      ExamplePages.runUpdateNotify()

      expect(consoleMocks.error).toHaveBeenCalledWith(
        'runUpdateNotify: Missing version parameters'
      )
      expect(window.close).toHaveBeenCalled()
      expect(NotificationService.notifyDiscord).not.toHaveBeenCalled()
    })

    /**
     * 更新通知失敗時のエラーハンドリングをテスト
     */
    it('should handle update notification error', async () => {
      Object.defineProperty(globalThis, 'location', {
        value: {
          search: '?old=1.0.0&new=1.1.0',
        },
        writable: true,
        configurable: true,
        configurable: true,
      })

      const mockError = new Error('Notification failed')
      ;(NotificationService.notifyDiscord as jest.Mock).mockRejectedValue(
        mockError
      )

      ExamplePages.runUpdateNotify()

      // Wait for promise rejection
      await Promise.resolve()
      expect(consoleMocks.error).toHaveBeenCalledWith(
        'Failed to notify update:',
        mockError
      )
    })

    /**
     * 空のバージョンパラメーターの処理をテスト
     */
    it('should handle empty version parameters', () => {
      Object.defineProperty(globalThis, 'location', {
        value: {
          search: '?old=&new=1.1.0',
        },
        writable: true,
        configurable: true,
      })

      ExamplePages.runUpdateNotify()

      expect(consoleMocks.error).toHaveBeenCalledWith(
        'runUpdateNotify: Missing version parameters'
      )
      expect(window.close).toHaveBeenCalled()
    })
  })
})
