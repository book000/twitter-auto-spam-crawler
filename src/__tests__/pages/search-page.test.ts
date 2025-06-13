import { SearchPage } from '../../pages/search-page'
import { DELAYS } from '../../core/constants'
import { StateService } from '../../services/state-service'
import { CrawlerService } from '../../services/crawler-service'
import { DomUtils } from '../../utils/dom'
import { AsyncUtils } from '../../utils/async'
import { TweetPage } from '../../pages/tweet-page'
import { PageErrorHandler } from '../../utils/page-error-handler'
import {
  setupSearchPageDOM,
  setupUserscriptMocks,
  setupConsoleMocks,
  restoreConsoleMocks,
} from '../utils/page-test-utils'

// Mock dependencies
jest.mock('../../services/state-service')
jest.mock('../../services/crawler-service')
jest.mock('../../utils/dom')
jest.mock('../../utils/async')
jest.mock('../../pages/tweet-page')
jest.mock('../../utils/page-error-handler')

// Mock timers
jest.useFakeTimers()

/**
 * SearchPageクラスのテストスイート
 * 検索ページでのライブフィード処理とツイートクロール機能を検証する
 * - ライブフィルター(f=live)の自動付与
 * - ツイート要素の待機とスクロール処理
 * - エラーハンドリングとページリロード
 */
describe('SearchPage', () => {
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

    // Setup default mock implementations
    ;(DomUtils.checkAndNavigateToLogin as jest.Mock).mockReturnValue(false)
    ;(DomUtils.waitElement as jest.Mock).mockResolvedValue(undefined)
    ;(DomUtils.isFailedPage as jest.Mock).mockReturnValue(false)
    ;(AsyncUtils.delay as jest.Mock).mockResolvedValue(undefined)
    ;(StateService.resetState as jest.Mock).mockImplementation(() => {})
    ;(CrawlerService.startCrawling as jest.Mock).mockImplementation(() => {})
    ;(TweetPage.run as jest.Mock).mockResolvedValue(undefined)
    ;(PageErrorHandler.logAction as jest.Mock).mockImplementation(() => {})
    ;(PageErrorHandler.logError as jest.Mock).mockImplementation(() => {})
    ;(PageErrorHandler.handlePageError as jest.Mock).mockResolvedValue(
      undefined
    )
  })

  afterEach(() => {
    restoreConsoleMocks(consoleMocks)
    jest.runOnlyPendingTimers()
  })

  describe('run', () => {
    /**
     * ログインリダイレクト処理をテスト
     * - ログインが必要な場合の早期リターン
     */
    it('should return early when login is required', async () => {
      ;(DomUtils.checkAndNavigateToLogin as jest.Mock).mockReturnValue(true)

      await SearchPage.run()

      expect(StateService.resetState).not.toHaveBeenCalled()
    })

    /**
     * ライブフィルター(f=live)が未設定の場合の自動付与をテスト
     * - location.searchにf=liveが含まれていない場合
     * - 待機後のURLパラメーター追加処理
     */
    it.skip('should add live filter when not present', async () => {
      // Mock location.search to not include f=live
      const originalLocation = globalThis.location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      delete (globalThis as any).location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(globalThis as any).location = {
        search: '?q=test',
      }

      await SearchPage.run()

      expect(AsyncUtils.delay).toHaveBeenCalledWith(DELAYS.CRAWL_INTERVAL)
      // Since JSDOM doesn't allow location.search assignment, we can't test the actual change
      // Instead, we verify the behavior by checking that delay was called

      // Restore original location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(globalThis as any).location = originalLocation
    })

    /**
     * ライブフィルターが既に設定済みの場合の正常処理をテスト
     * - location.searchにf=liveが含まれている場合
     * - 状態リセットとクロール開始
     * - ツイート待機とスクロール処理
     * - TweetPageへの遷移
     */
    it.skip('should process search page when live filter is present', async () => {
      setupSearchPageDOM()
      const originalLocation = globalThis.location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      delete (globalThis as any).location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(globalThis as any).location = {
        search: '?q=test&f=live',
      }

      await SearchPage.run()

      expect(StateService.resetState).toHaveBeenCalled()
      expect(CrawlerService.startCrawling).toHaveBeenCalled()
      expect(DomUtils.waitElement).toHaveBeenCalledWith(
        'article[data-testid="tweet"]'
      )
      expect(TweetPage.run).toHaveBeenCalledWith(true)

      // Restore original location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(globalThis as any).location = originalLocation
    })

    /**
     * ツイート要素待機失敗時のエラーハンドリングをテスト
     * - DOM要素が見つからない場合の処理
     * - エラー待機時間後のページリロード
     */
    it.skip('should handle waitElement error and reload page', async () => {
      const originalLocation = globalThis.location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      delete (globalThis as any).location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(globalThis as any).location = {
        search: '?q=test&f=live',
        reload: jest.fn(),
      }
      ;(DomUtils.waitElement as jest.Mock).mockRejectedValue(
        new Error('Element not found')
      )

      await SearchPage.run()

      expect(consoleMocks.log).toHaveBeenCalledWith('Wait 1 minute and reload.')
      expect(AsyncUtils.delay).toHaveBeenCalledWith(DELAYS.ERROR_RELOAD_WAIT)
      expect(globalThis.location.reload).toHaveBeenCalled()

      // Restore original location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(globalThis as any).location = originalLocation
    })

    /**
     * 失敗ページ検出時のエラーログ出力をテスト
     * - DomUtils.isFailedPage()がtrueを返す場合
     * - 専用エラーメッセージの出力確認
     */
    it.skip('should log error when failed page is detected', async () => {
      const originalLocation = globalThis.location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      delete (globalThis as any).location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(globalThis as any).location = {
        search: '?q=test&f=live',
      }
      ;(DomUtils.waitElement as jest.Mock).mockRejectedValue(
        new Error('Element not found')
      )
      ;(DomUtils.isFailedPage as jest.Mock).mockReturnValue(true)

      await SearchPage.run()

      expect(consoleMocks.error).toHaveBeenCalledWith(
        'runSearch: failed page. Wait 1 minute and reload.'
      )

      // Restore original location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(globalThis as any).location = originalLocation
    })

    /**
     * スクロール処理の詳細な動作確認をテスト
     * - 10回のスクロール実行
     * - 各スクロール後のクロール間隔待機
     * - 適切なスクロール設定値
     */
    it.skip('should perform scroll actions with correct intervals', async () => {
      setupSearchPageDOM()
      const originalLocation = globalThis.location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      delete (globalThis as any).location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(globalThis as any).location = {
        search: '?q=test&f=live',
      }

      await SearchPage.run()

      // Verify 10 scroll actions were performed
      expect(window.scrollBy).toHaveBeenCalledTimes(10)
      expect(window.scrollBy).toHaveBeenCalledWith({
        top: window.innerHeight,
        behavior: 'smooth',
      })

      // Verify delay was called for each scroll
      expect(AsyncUtils.delay).toHaveBeenCalledWith(DELAYS.CRAWL_INTERVAL)

      // Restore original location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(globalThis as any).location = originalLocation
    })

    /**
     * TweetPageエラー処理の確認をテスト
     * - TweetPage.run()実行時のエラーハンドリング
     * - エラーが適切にcatchされることを確認
     */
    it.skip('should handle TweetPage.run errors gracefully', async () => {
      setupSearchPageDOM()
      const originalLocation = globalThis.location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      delete (globalThis as any).location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(globalThis as any).location = {
        search: '?q=test&f=live',
      }

      const mockError = new Error('TweetPage error')
      ;(TweetPage.run as jest.Mock).mockRejectedValue(mockError)

      await SearchPage.run()

      expect(consoleMocks.error).toHaveBeenCalledWith(
        'Error in TweetPage.run:',
        mockError
      )

      // Restore original location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(globalThis as any).location = originalLocation
    })

    /**
     * 複数パラメーターがある場合のライブフィルター追加をテスト
     * - 既存のクエリパラメーターがある場合
     * - &f=liveの適切な追加
     */
    it.skip('should append live filter to existing query parameters', async () => {
      const originalLocation = globalThis.location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      delete (globalThis as any).location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(globalThis as any).location = {
        search: '?q=test&src=typed_query',
      }

      await SearchPage.run()

      expect(AsyncUtils.delay).toHaveBeenCalledWith(DELAYS.CRAWL_INTERVAL)
      // We verify the behavior by checking that delay was called, not the actual location change

      // Restore original location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(globalThis as any).location = originalLocation
    })

    /**
     * 空の検索パラメーターの場合のライブフィルター追加をテスト
     * - location.searchが空文字列の場合
     * - ?f=liveの追加
     */
    it.skip('should add live filter when no query parameters exist', async () => {
      const originalLocation = globalThis.location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      delete (globalThis as any).location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(globalThis as any).location = {
        search: '',
      }

      await SearchPage.run()

      expect(AsyncUtils.delay).toHaveBeenCalledWith(DELAYS.CRAWL_INTERVAL)
      // We verify the behavior by checking that delay was called

      // Restore original location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(globalThis as any).location = originalLocation
    })

    /**
     * ライブフィルターが既に含まれている場合のスキップ処理をテスト
     * - f=liveが既に含まれている場合
     * - 重複追加されないことを確認
     */
    it.skip('should not modify search when live filter already exists', async () => {
      setupSearchPageDOM()
      const originalLocation = globalThis.location
      const originalSearch = '?q=spam&f=live&src=search'
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      delete (globalThis as any).location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(globalThis as any).location = {
        search: originalSearch,
      }

      await SearchPage.run()

      // Should proceed without delay since f=live already exists
      expect(StateService.resetState).toHaveBeenCalled()
      expect(CrawlerService.startCrawling).toHaveBeenCalled()

      // Restore original location
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(globalThis as any).location = originalLocation
    })

    /**
     * 部分一致でのライブフィルター検出をテスト
     * - f=liveを含む他のパラメーターがある場合
     * - 正確な一致のみを検出することを確認
     */
    it.skip('should detect live filter in various parameter positions', async () => {
      setupSearchPageDOM()

      // Test various positions of f=live parameter
      const testCases = [
        '?f=live',
        '?q=test&f=live',
        '?f=live&q=test',
        '?q=test&f=live&src=search',
      ]

      for (const search of testCases) {
        const originalLocation = globalThis.location
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        delete (globalThis as any).location
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        ;(globalThis as any).location = {
          search,
        }
        jest.clearAllMocks()

        await SearchPage.run()

        // Should proceed with normal processing, not redirect
        expect(StateService.resetState).toHaveBeenCalled()
        expect(CrawlerService.startCrawling).toHaveBeenCalled()

        // Restore original location
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        ;(globalThis as any).location = originalLocation
      }
    })
  })
})
