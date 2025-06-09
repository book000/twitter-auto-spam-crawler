import { TweetPage } from '../../pages/tweet-page'
import { URLS, DELAYS, TWEET_URL_REGEX, THRESHOLDS } from '../../core/constants'
import { Storage } from '../../core/storage'
import { StateService } from '../../services/state-service'
import { CrawlerService } from '../../services/crawler-service'
import { QueueService } from '../../services/queue-service'
import { TweetService } from '../../services/tweet-service'
import { DomUtils } from '../../utils/dom'
import { ScrollUtils } from '../../utils/scroll'
import { ErrorHandler } from '../../utils/error'
import { AsyncUtils } from '../../utils/async'
import {
  setupTweetPageDOM,
  setupUserscriptMocks,
  setupConsoleMocks,
  restoreConsoleMocks,
} from '../utils/page-test-utils'

// Mock dependencies
jest.mock('../../core/storage')
jest.mock('../../services/state-service')
jest.mock('../../services/crawler-service')
jest.mock('../../services/queue-service')
jest.mock('../../services/tweet-service')
jest.mock('../../utils/dom')
jest.mock('../../utils/scroll')
jest.mock('../../utils/error')
jest.mock('../../utils/async')

// Mock timers
jest.useFakeTimers()

/**
 * TweetPageクラスのテストスイート
 * 個別ツイートページでの処理とエラーハンドリング機能を検証する
 * - onlyOpenモードでの次ツイート取得とナビゲーション
 * - エラーダイアログの検出と削除ツイート処理
 * - リトライ機能とツイート処理完了後の遷移
 */
describe('TweetPage', () => {
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
    ;(CrawlerService.getCrawledTweetCount as jest.Mock).mockReturnValue(1)
    ;(CrawlerService.resetCrawledTweetCount as jest.Mock).mockImplementation(
      () => {}
    )
    ;(TweetService.isNeedDownload as jest.Mock).mockReturnValue(false)
    ;(QueueService.getNextWaitingTweet as jest.Mock).mockReturnValue(
      '123456789'
    )
    ;(QueueService.checkedTweet as jest.Mock).mockResolvedValue(undefined)
    ;(Storage.getRetryCount as jest.Mock).mockReturnValue(0)
    ;(Storage.setRetryCount as jest.Mock).mockImplementation(() => {})
    ;(ScrollUtils.scrollPage as jest.Mock).mockResolvedValue(undefined)
    ;(ErrorHandler.handleErrorDialog as jest.Mock).mockResolvedValue(undefined)
    ;(ErrorHandler.detectUnprocessablePost as jest.Mock).mockResolvedValue(
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

      await TweetPage.run()

      expect(StateService.resetState).not.toHaveBeenCalled()
    })

    /**
     * onlyOpen=trueでダウンロードが必要な場合のテスト
     * - TweetService.isNeedDownload()がtrueを返す場合
     * - ダウンロードページへの遷移
     */
    it('should navigate to download page when download is needed (onlyOpen=true)', async () => {
      ;(TweetService.isNeedDownload as jest.Mock).mockReturnValue(true)

      await TweetPage.run(true)

      expect(globalThis.location.href).toBe(URLS.EXAMPLE_DOWNLOAD_JSON)
    })

    /**
     * onlyOpen=trueで次の待機ツイートがない場合のテスト
     * - QueueService.getNextWaitingTweet()がnullを返す場合
     * - ブックマークページへの遷移
     */
    it('should navigate to bookmark when no waiting tweets (onlyOpen=true)', async () => {
      ;(QueueService.getNextWaitingTweet as jest.Mock).mockReturnValue(null)

      await TweetPage.run(true)

      expect(globalThis.location.href).toBe(URLS.BOOKMARK)
    })

    /**
     * onlyOpen=trueで次ツイートへの遷移テスト
     * - 正常な次ツイートIDの取得
     * - 該当ツイートURLへの遷移
     */
    it('should navigate to next tweet (onlyOpen=true)', async () => {
      const nextTweetId = '123456789'
      ;(QueueService.getNextWaitingTweet as jest.Mock).mockReturnValue(
        nextTweetId
      )

      await TweetPage.run(true)

      expect(globalThis.location.href).toBe(
        `https://x.com/user/status/${nextTweetId}`
      )
    })

    /**
     * 正常なツイートページ処理フローをテスト
     * - 状態リセットとクロール開始
     * - エラーハンドラーの設定
     * - ツイート要素の待機とスクロール処理
     * - ツイート処理完了後の次ツイートへの遷移
     */
    it('should process tweet page successfully', async () => {
      setupTweetPageDOM()
      globalThis.location.href = 'https://x.com/user/status/123456789'

      // Mock regex match
      jest
        .spyOn(TWEET_URL_REGEX, 'exec')
        .mockReturnValue(['', 'user', '123456789'] as RegExpExecArray)

      await TweetPage.run()

      expect(StateService.resetState).toHaveBeenCalled()
      expect(CrawlerService.startCrawling).toHaveBeenCalled()
      expect(ErrorHandler.handleErrorDialog).toHaveBeenCalled()
      expect(ErrorHandler.detectUnprocessablePost).toHaveBeenCalled()
      expect(DomUtils.waitElement).toHaveBeenCalledWith(
        'article[data-testid="tweet"]'
      )
      expect(ScrollUtils.scrollPage).toHaveBeenCalled()
      expect(QueueService.checkedTweet).toHaveBeenCalledWith('123456789')
    })

    /**
     * ツイート要素待機失敗時のリトライ処理をテスト
     * - リトライ回数が制限内の場合
     * - Storage.setRetryCount()での回数増加
     * - 待機後のページリロード
     */
    it('should retry when tweet element is not found', async () => {
      ;(DomUtils.waitElement as jest.Mock).mockRejectedValue(
        new Error('Element not found')
      )
      ;(Storage.getRetryCount as jest.Mock).mockReturnValue(1)

      await TweetPage.run()

      expect(consoleMocks.log).toHaveBeenCalledWith(
        'Wait 1 minute and reload. (Retry count: 2)'
      )
      expect(Storage.setRetryCount).toHaveBeenCalledWith(2)
      expect(AsyncUtils.delay).toHaveBeenCalledWith(DELAYS.ERROR_RELOAD_WAIT)
      expect(globalThis.location.reload).toHaveBeenCalled()
    })

    /**
     * 最大リトライ回数到達時の処理をテスト
     * - リトライ回数がTHRESHOLDS.MAX_RETRY_COUNTに達した場合
     * - リトライ回数のリセット
     * - ツイートのチェック完了マーキング
     * - 次ツイートへの遷移
     */
    it('should skip tweet after max retries', async () => {
      ;(DomUtils.waitElement as jest.Mock).mockRejectedValue(
        new Error('Element not found')
      )
      ;(Storage.getRetryCount as jest.Mock).mockReturnValue(
        THRESHOLDS.MAX_RETRY_COUNT
      )
      globalThis.location.href = 'https://x.com/user/status/987654321'

      // Mock regex match
      jest
        .spyOn(TWEET_URL_REGEX, 'exec')
        .mockReturnValue(['', 'user', '987654321'] as RegExpExecArray)

      await TweetPage.run()

      expect(consoleMocks.error).toHaveBeenCalledWith(
        'runTweet: failed to load tweet after 3 retries. Resetting retry count and moving to next tweet.'
      )
      expect(Storage.setRetryCount).toHaveBeenCalledWith(0)
      expect(QueueService.checkedTweet).toHaveBeenCalledWith('987654321')
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

      await TweetPage.run()

      expect(consoleMocks.error).toHaveBeenCalledWith('runTweet: failed page.')
    })

    /**
     * クロール済みツイート数が0の場合のブックマーク遷移をテスト
     * - CrawlerService.getCrawledTweetCount()が0を返す場合
     * - ブックマークページへの遷移
     */
    it('should navigate to bookmark when no tweets were crawled', async () => {
      setupTweetPageDOM()
      ;(CrawlerService.getCrawledTweetCount as jest.Mock).mockReturnValue(0)

      await TweetPage.run()

      expect(globalThis.location.href).toBe(URLS.BOOKMARK)
    })

    /**
     * エラーダイアログハンドラーのコールバック処理をテスト
     * - 削除ツイートダイアログの検出
     * - ツイートIDの抽出とチェック完了マーキング
     * - クロール数のリセット
     */
    it('should handle error dialog callback for deleted tweet', async () => {
      globalThis.location.href = 'https://x.com/user/status/111222333'

      // Mock regex match
      jest
        .spyOn(TWEET_URL_REGEX, 'exec')
        .mockReturnValue(['', 'user', '111222333'] as RegExpExecArray)

      // Mock the error handler to call the callback
      ;(ErrorHandler.handleErrorDialog as jest.Mock).mockImplementation(
        async (callback) => {
          const mockDialog = { textContent: 'このツイートは削除されました' }
          await callback(mockDialog)
        }
      )

      await TweetPage.run()

      expect(consoleMocks.error).toHaveBeenCalledWith(
        'runTweet: found error dialog',
        'このツイートは削除されました'
      )
      expect(consoleMocks.error).toHaveBeenCalledWith(
        'runTweet: tweet deleted. Skip this tweet.'
      )
      expect(QueueService.checkedTweet).toHaveBeenCalledWith('111222333')
      expect(CrawlerService.resetCrawledTweetCount).toHaveBeenCalled()
    })

    /**
     * 処理不可能ポスト検出ハンドラーのコールバック処理をテスト
     * - ErrorHandler.detectUnprocessablePost()のコールバック実行
     * - ツイートIDの抽出とチェック完了マーキング
     * - クロール数のリセット
     */
    it('should handle unprocessable post detection callback', async () => {
      globalThis.location.href = 'https://x.com/user/status/444555666'

      // Mock regex match
      jest
        .spyOn(TWEET_URL_REGEX, 'exec')
        .mockReturnValue(['', 'user', '444555666'] as RegExpExecArray)

      // Mock the unprocessable post handler to call the callback
      ;(ErrorHandler.detectUnprocessablePost as jest.Mock).mockImplementation(
        async (callback) => {
          const mockArticle = document.createElement('article')
          await callback(mockArticle)
        }
      )

      await TweetPage.run()

      expect(consoleMocks.error).toHaveBeenCalledWith(
        "runTweet: found can't processing post",
        expect.any(HTMLElement)
      )
      expect(QueueService.checkedTweet).toHaveBeenCalledWith('444555666')
      expect(CrawlerService.resetCrawledTweetCount).toHaveBeenCalled()
    })

    /**
     * 正常処理完了後のリトライ回数リセットをテスト
     * - ツイート要素の正常待機完了
     * - Storage.setRetryCount(0)での回数リセット
     */
    it('should reset retry count on successful processing', async () => {
      setupTweetPageDOM()
      globalThis.location.href = 'https://x.com/user/status/777888999'

      // Mock regex match
      jest
        .spyOn(TWEET_URL_REGEX, 'exec')
        .mockReturnValue(['', 'user', '777888999'] as RegExpExecArray)

      await TweetPage.run()

      expect(Storage.setRetryCount).toHaveBeenCalledWith(0)
    })

    /**
     * 英語の削除ツイートメッセージ処理をテスト
     * - 'deleted'を含む英語のエラーダイアログ
     * - 適切な削除処理の実行
     */
    it('should handle English deleted tweet message', async () => {
      globalThis.location.href = 'https://x.com/user/status/555666777'

      // Mock regex match
      jest
        .spyOn(TWEET_URL_REGEX, 'exec')
        .mockReturnValue(['', 'user', '555666777'] as RegExpExecArray)

      // Mock the error handler with English message
      ;(ErrorHandler.handleErrorDialog as jest.Mock).mockImplementation(
        async (callback) => {
          const mockDialog = { textContent: 'This tweet has been deleted' }
          await callback(mockDialog)
        }
      )

      await TweetPage.run()

      expect(consoleMocks.error).toHaveBeenCalledWith(
        'runTweet: tweet deleted. Skip this tweet.'
      )
      expect(QueueService.checkedTweet).toHaveBeenCalledWith('555666777')
    })
  })
})
