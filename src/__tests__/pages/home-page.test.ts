import { HomePage } from '../../pages/home-page'
import { URLS, DELAYS } from '../../core/constants'
import { ConfigManager } from '../../core/config'
import { StateService } from '../../services/state-service'
import { CrawlerService } from '../../services/crawler-service'
import { DomUtils } from '../../utils/dom'
import { AsyncUtils } from '../../utils/async'
import {
  setupTwitterDOM,
  setupUserscriptMocks,
  setupConsoleMocks,
  restoreConsoleMocks,
} from '../utils/page-test-utils'

// Mock dependencies
jest.mock('../../core/config')
jest.mock('../../services/state-service')
jest.mock('../../services/crawler-service')
jest.mock('../../utils/dom')
jest.mock('../../utils/async')

// Mock timers
jest.useFakeTimers()

/**
 * HomePageクラスのテストスイート
 * ホームページでのツイートクロール処理とページナビゲーション機能を検証する
 * - DOM要素の待機とエラーハンドリング
 * - タブ切り替えとスクロール処理
 * - 設定に基づくページ遷移
 */
describe('HomePage', () => {
  let consoleMocks: ReturnType<typeof setupConsoleMocks>

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = ''

    // Setup mocks
    setupUserscriptMocks()
    consoleMocks = setupConsoleMocks()

    // Clear all mocks
    jest.clearAllMocks()
    jest.clearAllTimers()

    // Reset mock implementations
    ;(DomUtils.checkAndNavigateToLogin as jest.Mock).mockReturnValue(false)
    ;(DomUtils.waitElement as jest.Mock).mockResolvedValue(undefined)
    ;(DomUtils.isFailedPage as jest.Mock).mockReturnValue(false)
    ;(AsyncUtils.delay as jest.Mock).mockResolvedValue(undefined)
    ;(ConfigManager.getIsOnlyHome as jest.Mock).mockReturnValue(false)
    ;(StateService.resetState as jest.Mock).mockImplementation(() => {})
    ;(CrawlerService.startCrawling as jest.Mock).mockImplementation(() => {})
  })

  afterEach(() => {
    restoreConsoleMocks(consoleMocks)
    jest.runOnlyPendingTimers()
  })

  describe('run', () => {
    /**
     * 正常なホームページ処理フローをテスト
     * - 状態リセットとクロール開始
     * - タブナビゲーション要素の待機
     * - 各タブでのクリックとスクロール処理
     * - 探索ページへの遷移
     */
    it('should process home page successfully and navigate to explore', async () => {
      setupTwitterDOM()

      await HomePage.run()

      expect(StateService.resetState).toHaveBeenCalled()
      expect(CrawlerService.startCrawling).toHaveBeenCalled()
      expect(DomUtils.waitElement).toHaveBeenCalledWith(
        'div[data-testid="primaryColumn"] nav[aria-live="polite"][role="navigation"] div[role="tablist"] > div[role="presentation"] a[role="tab"]'
      )
      expect(AsyncUtils.delay).toHaveBeenCalledWith(DELAYS.LONG * 3)
      expect(globalThis.location.href).toBe(URLS.EXPLORE)
    })

    /**
     * ログインページへのリダイレクト処理をテスト
     * - ログインが必要な場合の早期リターン
     * - 他の処理が実行されないことを確認
     */
    it('should return early when login is required', async () => {
      ;(DomUtils.checkAndNavigateToLogin as jest.Mock).mockReturnValue(true)

      await HomePage.run()

      expect(StateService.resetState).not.toHaveBeenCalled()
      expect(CrawlerService.startCrawling).not.toHaveBeenCalled()
    })

    /**
     * タブナビゲーション要素の待機失敗時のエラーハンドリングをテスト
     * - DOM要素が見つからない場合の処理
     * - エラー待機時間後のページリロード
     */
    it('should handle waitElement error and reload page', async () => {
      ;(DomUtils.waitElement as jest.Mock).mockRejectedValue(
        new Error('Element not found')
      )

      await HomePage.run()

      expect(consoleMocks.log).toHaveBeenCalledWith('Wait 1 minute and reload.')
      expect(AsyncUtils.delay).toHaveBeenCalledWith(DELAYS.ERROR_RELOAD_WAIT)
      expect(globalThis.location.reload).toHaveBeenCalled()
    })

    /**
     * 失敗ページ検出時のエラーログ出力をテスト
     * - DomUtils.isFailedPage()がtrueを返す場合
     * - 専用エラーメッセージの出力確認
     */
    it('should log error when failed page is detected', async () => {
      ;(DomUtils.waitElement as jest.Mock).mockRejectedValue(
        new Error('Element not found')
      )
      ;(DomUtils.isFailedPage as jest.Mock).mockReturnValue(true)

      await HomePage.run()

      expect(consoleMocks.error).toHaveBeenCalledWith('runHome: failed page.')
    })

    /**
     * タブクリック処理とツイート待機のテスト
     * - 各タブの順次クリック処理
     * - ツイート要素の待機処理
     * - スクロール処理の実行
     */
    it('should click tabs and wait for tweets', async () => {
      setupTwitterDOM()

      // Mock tab clicking
      const tabs = document.querySelectorAll('a[role="tab"]')
      const clickSpies = [...tabs].map((tab) => {
        const spy = jest.fn()
        ;(tab as HTMLAnchorElement).click = spy
        return spy
      })

      await HomePage.run()

      // Verify all tabs were clicked
      for (const spy of clickSpies) {
        expect(spy).toHaveBeenCalled()
      }

      // Verify tweet waiting was called for each tab
      expect(DomUtils.waitElement).toHaveBeenCalledWith(
        'article[data-testid="tweet"]'
      )

      // Verify scrolling was performed (implementation uses 10 scrolls per tab)
      const SCROLLS_PER_TAB = 10
      expect(window.scrollBy).toHaveBeenCalledTimes(SCROLLS_PER_TAB * tabs.length)
    })

    /**
     * ツイート待機失敗時の次タブへのスキップ処理をテスト
     * - 特定タブでツイートが見つからない場合
     * - 失敗ページでない場合の継続処理
     */
    it('should skip to next tab when tweet waiting fails', async () => {
      setupTwitterDOM()

      // Mock waitElement to fail only for tweet elements
      ;(DomUtils.waitElement as jest.Mock).mockImplementation(
        (selector: string) => {
          if (selector.includes('article[data-testid="tweet"]')) {
            return Promise.reject(new Error('Tweet not found'))
          }
          return Promise.resolve()
        }
      )

      await HomePage.run()

      expect(consoleMocks.log).toHaveBeenCalledWith('Next tab')
    })

    /**
     * ツイート待機失敗時の失敗ページ処理をテスト
     * - ツイート要素が見つからずかつ失敗ページの場合
     * - エラー待機後のページリロード
     */
    it('should reload when tweet waiting fails on failed page', async () => {
      setupTwitterDOM()
      ;(DomUtils.waitElement as jest.Mock).mockImplementation(
        (selector: string) => {
          if (selector.includes('article[data-testid="tweet"]')) {
            return Promise.reject(new Error('Tweet not found'))
          }
          return Promise.resolve()
        }
      )
      ;(DomUtils.isFailedPage as jest.Mock).mockReturnValue(true)

      await HomePage.run()

      expect(consoleMocks.error).toHaveBeenCalledWith(
        'runHome: failed page. Wait 1 minute and reload.'
      )
      expect(AsyncUtils.delay).toHaveBeenCalledWith(DELAYS.ERROR_RELOAD_WAIT)
      expect(globalThis.location.reload).toHaveBeenCalled()
    })

    /**
     * isOnlyHome設定がtrueの場合のホームページ遷移をテスト
     * - ConfigManager.getIsOnlyHome()がtrueを返す場合
     * - 探索ページではなくホームページへの遷移
     */
    it('should navigate to home when isOnlyHome is true', async () => {
      setupTwitterDOM()
      ;(ConfigManager.getIsOnlyHome as jest.Mock).mockReturnValue(true)

      await HomePage.run()

      expect(consoleMocks.log).toHaveBeenCalledWith(
        'runHome: isOnlyHome is true. Go to home page.'
      )
      expect(globalThis.location.href).toBe(URLS.HOME)
    })

    /**
     * スクロール処理の詳細な動作確認
     * - 各タブで10回のスクロール実行
     * - スクロール間隔の適切な待機時間
     */
    it('should perform scroll actions with correct intervals', async () => {
      setupTwitterDOM()

      await HomePage.run()

      // Verify scroll behavior
      expect(window.scrollBy).toHaveBeenCalledWith({
        top: window.innerHeight,
        behavior: 'smooth',
      })

      // Verify scroll delay
      expect(AsyncUtils.delay).toHaveBeenCalledWith(DELAYS.CRAWL_INTERVAL)
    })

    /**
     * ログ出力の詳細確認
     * - タブ数の正確な出力
     * - 各タブ処理開始時のログ
     * - 最終的な探索ページ遷移ログ
     */
    it('should log correct tab information', async () => {
      setupTwitterDOM()
      const tabs = document.querySelectorAll('a[role="tab"]')

      await HomePage.run()

      expect(consoleMocks.log).toHaveBeenCalledWith(
        `runHome: tabs=${tabs.length}`
      )

      // Check individual tab logs
      for (let i = 0; i < tabs.length; i++) {
        expect(consoleMocks.log).toHaveBeenCalledWith(`runHome: open tab=${i}`)
      }

      expect(consoleMocks.log).toHaveBeenCalledWith(
        'runHome: all tabs are opened. Go to explore page.'
      )
    })
  })
})
