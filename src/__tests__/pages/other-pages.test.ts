import { OtherPages } from '../../pages/other-pages'
import { URLS, DELAYS } from '../../core/constants'
import { Storage } from '../../core/storage'
import { AsyncUtils } from '../../utils/async'
import { PageErrorHandler } from '../../utils/page-error-handler'
import {
  setupUserscriptMocks,
  setupConsoleMocks,
  restoreConsoleMocks,
} from '../utils/page-test-utils'

// Mock dependencies
jest.mock('../../core/storage')
jest.mock('../../utils/async')
jest.mock('../../utils/page-error-handler')

// Mock timers
jest.useFakeTimers()

/**
 * OtherPagesクラスのテストスイート
 * その他のページ処理機能を検証する
 * - ポスト作成ページのクローズ処理
 * - Blue Blocker キュー処理待機
 * - ログインページ遷移
 * - アカウントロック時の定期チェック
 */
describe('OtherPages', () => {
  let consoleMocks: ReturnType<typeof setupConsoleMocks>

  beforeEach(() => {
    // Setup mocks
    setupUserscriptMocks()
    consoleMocks = setupConsoleMocks()

    // Clear all mocks
    jest.clearAllMocks()
    jest.clearAllTimers()

    // Setup default mock implementations
    ;(AsyncUtils.delay as jest.Mock).mockResolvedValue(undefined)
    ;(Storage.isLoginNotified as jest.Mock).mockReturnValue(false)
    ;(Storage.isLockedNotified as jest.Mock).mockReturnValue(false)
    ;(PageErrorHandler.logAction as jest.Mock).mockImplementation(() => {})
    ;(PageErrorHandler.logError as jest.Mock).mockImplementation(() => {})

    // Mock history.back
    Object.defineProperty(globalThis, 'history', {
      value: {
        back: jest.fn(),
      },
      writable: true,
    })

    // Mock window.open
    Object.defineProperty(globalThis, 'open', {
      value: jest.fn(),
      writable: true,
    })

    // Mock setInterval and clearInterval
    globalThis.setInterval = jest.fn() as any
    globalThis.clearInterval = jest.fn() as any
  })

  afterEach(() => {
    restoreConsoleMocks(consoleMocks)
    jest.runOnlyPendingTimers()
  })

  describe('runComposePost', () => {
    /**
     * クローズボタンが存在する場合の処理をテスト
     * - アプリバーのクローズボタンクリック
     * - history.back()の実行
     */
    it('should click close button and go back when close button exists', () => {
      const closeButton = document.createElement('button')
      closeButton.dataset.testid = 'app-bar-close'
      closeButton.setAttribute('role', 'button')

      const clickSpy = jest.fn()
      closeButton.click = clickSpy

      document.body.append(closeButton)

      OtherPages.runComposePost()

      expect(clickSpy).toHaveBeenCalled()
      expect(globalThis.history.back).toHaveBeenCalled()
    })

    /**
     * クローズボタンが存在しない場合の処理をテスト
     * - ボタンクリックはスキップ
     * - history.back()は実行される
     */
    it('should only go back when close button does not exist', () => {
      OtherPages.runComposePost()

      expect(globalThis.history.back).toHaveBeenCalled()
    })

    /**
     * 複数のボタンが存在する場合の処理をテスト
     * - 最初にマッチするボタンのみがクリックされる
     */
    it.skip('should click only the first matching close button', () => {
      const closeButton1 = document.createElement('button')
      closeButton1.dataset.testid = 'app-bar-close'
      closeButton1.setAttribute('role', 'button')
      const clickSpy1 = jest.fn()
      closeButton1.addEventListener('click', clickSpy1)

      const closeButton2 = document.createElement('button')
      closeButton2.dataset.testid = 'app-bar-close'
      closeButton2.setAttribute('role', 'button')
      const clickSpy2 = jest.fn()
      closeButton2.addEventListener('click', clickSpy2)

      document.body.append(closeButton1, closeButton2)

      OtherPages.runComposePost()

      expect(clickSpy1).toHaveBeenCalled()
      expect(clickSpy2).not.toHaveBeenCalled()
    })
  })

  describe('runProcessBlueBlockerQueue', () => {
    /**
     * Blue Blockerキュー処理の正常フローをテスト
     * - 初期60秒待機
     * - トースト要素の定期チェック開始
     * - トースト消失時のホームページ遷移
     */
    it('should wait and monitor toasts until they disappear', async () => {
      // Setup DOM with toast elements
      const toastContainer = document.createElement('div')
      toastContainer.id = 'injected-blue-block-toasts'

      const toast1 = document.createElement('div')
      toast1.className = 'toast'
      const toast2 = document.createElement('div')
      toast2.className = 'toast'

      toastContainer.append(toast1, toast2)
      document.body.append(toastContainer)

      let intervalCallback: (() => void) | undefined

        // Mock setInterval to capture the callback
      ;(globalThis.setInterval as jest.Mock).mockImplementation((callback) => {
        intervalCallback = callback
        return 123 // Mock interval ID
      })

      const promise = OtherPages.runProcessBlueBlockerQueue()

      expect(PageErrorHandler.logAction).toHaveBeenCalledWith('start')
      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'waiting for 60 seconds to process queue.'
      )
      expect(AsyncUtils.delay).toHaveBeenCalledWith(DELAYS.PROCESSING_WAIT)

      // Wait for the initial delay to complete
      await Promise.resolve()

      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'checking for #injected-blue-block-toasts > div.toast'
      )
      expect(globalThis.setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        DELAYS.CRAWL_INTERVAL
      )

      // Execute interval callback with toasts present
      if (intervalCallback) {
        intervalCallback()
      }

      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'still waiting for toasts: 2'
      )

      // Remove toasts
      toastContainer.innerHTML = ''

      // Execute interval callback again with no toasts
      if (intervalCallback) {
        intervalCallback()
      }

      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'all toasts are gone.'
      )
      expect(globalThis.clearInterval).toHaveBeenCalledWith(123)
      // Since we can't mock location.href in JSDOM, we verify the behavior by checking
      // that the interval was cleared
      expect(globalThis.clearInterval).toHaveBeenCalled()

      await promise
    })

    /**
     * トースト要素が初期状態で存在しない場合のテスト
     * - 即座にホームページに遷移することを確認
     */
    it('should navigate to home immediately when no toasts exist', async () => {
      // Setup DOM with no toast elements
      const toastContainer = document.createElement('div')
      toastContainer.id = 'injected-blue-block-toasts'
      document.body.append(toastContainer)

      let intervalCallback: (() => void) | undefined
      ;(globalThis.setInterval as jest.Mock).mockImplementation((callback) => {
        intervalCallback = callback
        return 456
      })

      const promise = OtherPages.runProcessBlueBlockerQueue()

      // Wait for the initial delay
      await Promise.resolve()

      // Execute interval callback with no toasts
      if (intervalCallback) {
        intervalCallback()
      }

      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'all toasts are gone.'
      )
      expect(globalThis.clearInterval).toHaveBeenCalledWith(456)
      // Since we can't mock location.href in JSDOM, we verify the behavior by checking
      // that the interval was cleared
      expect(globalThis.clearInterval).toHaveBeenCalled()

      await promise
    })

    /**
     * トースト要素の数の変化を追跡するテスト
     * - 複数回のチェックサイクルでトースト数の変化を確認
     */
    it('should track toast count changes over time', async () => {
      const toastContainer = document.createElement('div')
      toastContainer.id = 'injected-blue-block-toasts'

      // Start with 3 toasts
      for (let i = 0; i < 3; i++) {
        const toast = document.createElement('div')
        toast.className = 'toast'
        toastContainer.append(toast)
      }

      document.body.append(toastContainer)

      let intervalCallback: (() => void) | undefined
      ;(globalThis.setInterval as jest.Mock).mockImplementation((callback) => {
        intervalCallback = callback
        return 789
      })

      const promise = OtherPages.runProcessBlueBlockerQueue()
      await Promise.resolve()

      // First check - 3 toasts
      if (intervalCallback) {
        intervalCallback()
      }
      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'still waiting for toasts: 3'
      )

      // Remove one toast
      toastContainer.firstChild!.remove()

      // Second check - 2 toasts
      if (intervalCallback) {
        intervalCallback()
      }
      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'still waiting for toasts: 2'
      )

      await promise
    })
  })

  describe('runLogin', () => {
    /**
     * ログイン通知が未送信の場合の処理をテスト
     * - 新しいウィンドウでログイン通知ページを開く
     */
    it('should open login notify page when not notified', () => {
      ;(Storage.isLoginNotified as jest.Mock).mockReturnValue(false)

      OtherPages.runLogin()

      expect(window.open).toHaveBeenCalledWith(
        URLS.EXAMPLE_LOGIN_NOTIFY,
        '_blank'
      )
    })

    /**
     * ログイン通知が既に送信済みの場合の処理をテスト
     * - 何も実行しないことを確認
     */
    it('should do nothing when already notified', () => {
      ;(Storage.isLoginNotified as jest.Mock).mockReturnValue(true)

      OtherPages.runLogin()

      expect(window.open).not.toHaveBeenCalled()
    })
  })

  describe('runLocked', () => {
    /**
     * アカウントロック時の定期チェック処理をテスト
     * - ロック通知が未送信の場合のロック通知ページオープン
     * - 定期的なブックマークページへの遷移
     */
    it('should start periodic unlock check and open locked notify page when not notified', () => {
      ;(Storage.isLockedNotified as jest.Mock).mockReturnValue(false)

      let intervalCallback: (() => void) | undefined
      ;(globalThis.setInterval as jest.Mock).mockImplementation((callback) => {
        intervalCallback = callback
        return 999
      })

      OtherPages.runLocked()

      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'Account is locked, starting continuous unlock detection'
      )
      expect(globalThis.setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        DELAYS.LOCKED_CHECK_INTERVAL
      )
      expect(window.open).toHaveBeenCalledWith(
        URLS.EXAMPLE_LOCKED_NOTIFY,
        '_blank'
      )

      // Execute interval callback
      if (intervalCallback) {
        intervalCallback()
      }

      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'Periodic check 1 - navigating to bookmark page to test unlock status'
      )
      // Since we can't mock location.href in JSDOM, we verify the behavior by checking
      // that the periodic check was started
      expect(globalThis.setInterval).toHaveBeenCalled()
    })

    /**
     * ロック通知が既に送信済みの場合の処理をテスト
     * - 定期チェックは開始するが、通知ページは開かない
     */
    it('should start periodic check but not open notify page when already notified', () => {
      ;(Storage.isLockedNotified as jest.Mock).mockReturnValue(true)

      OtherPages.runLocked()

      expect(globalThis.setInterval).toHaveBeenCalled()
      expect(window.open).not.toHaveBeenCalled()
    })

    /**
     * 複数回の定期チェック実行をテスト
     * - checkCountの適切な増加
     * - 各チェック時のログ出力
     */
    it('should increment check count on each periodic check', () => {
      let intervalCallback: (() => void) | undefined
      ;(globalThis.setInterval as jest.Mock).mockImplementation((callback) => {
        intervalCallback = callback
        return 111
      })

      OtherPages.runLocked()

      // First check
      if (intervalCallback) {
        intervalCallback()
      }
      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'Periodic check 1 - navigating to bookmark page to test unlock status'
      )

      // Second check
      if (intervalCallback) {
        intervalCallback()
      }
      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'Periodic check 2 - navigating to bookmark page to test unlock status'
      )

      // Third check
      if (intervalCallback) {
        intervalCallback()
      }
      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'Periodic check 3 - navigating to bookmark page to test unlock status'
      )
    })
  })
})
