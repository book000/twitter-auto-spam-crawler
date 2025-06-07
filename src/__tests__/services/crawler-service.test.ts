import { CrawlerService } from '../../services/crawler-service'
import { TweetService } from '../../services/tweet-service'
import { QueueService } from '../../services/queue-service'
import { Storage } from '../../core/storage'
import type { Tweet } from '../../types'

// Mock the dependencies
jest.mock('../../services/tweet-service')
jest.mock('../../services/queue-service')
jest.mock('../../core/storage')

// Mock timers
jest.useFakeTimers()

/**
 * CrawlerServiceクラスのテストスイート
 * ツイートの自動クロール、フィルタリング、タイマー管理機能を検証する
 * - 定期的なツイート取得とエンゲージメント閾値によるフィルタリング
 * - QueueServiceとの連携による待機キューへの追加処理
 * - クロール状態の管理とエラーハンドリング
 */
describe('CrawlerService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    CrawlerService.stopCrawling()
    CrawlerService.resetCrawledTweetCount()
    // Reset all mock implementations
    ;(TweetService.getTweets as jest.Mock).mockReset()
    ;(TweetService.saveTweets as jest.Mock).mockReset()
    ;(TweetService.getTargetTweets as jest.Mock).mockReset()
    ;(QueueService.isCheckedTweet as jest.Mock).mockReset()
    ;(QueueService.isWaitingTweet as jest.Mock).mockReset()
    ;(QueueService.addWaitingTweets as jest.Mock).mockReset()
    ;(Storage.getWaitingTweets as jest.Mock).mockReset()
  })

  afterEach(() => {
    CrawlerService.stopCrawling()
    jest.runOnlyPendingTimers()
  })

  /**
   * crawlTweetsメソッドのテスト
   * ツイートの取得、保存、エンゲージメントフィルタリング、待機キューへの追加処理を検証
   * - TweetServiceからのツイート取得と保存
   * - 既にチェック済み・待機中のツイートの重複除外
   * - 新規ツイートのキューイングとカウント管理
   */
  describe('crawlTweets', () => {
    /**
     * 正常なツイート処理フローをテスト
     * - TweetServiceからのツイート取得と保存
     * - エンゲージメント閾値によるターゲットツイートのフィルタリング
     * - 未チェック・未待機のツイートのみを待機キューに追加
     * - クロール済みツイート数の正確なカウント更新
     */
    it('should process tweets and add unchecked ones to waiting queue', async () => {
      const mockTweets: Tweet[] = [
        {
          url: 'https://x.com/user1/status/1',
          tweetText: 'Test tweet 1',
          tweetHtml: '<span>Test tweet 1</span>',
          elementHtml: '<article>Test 1</article>',
          screenName: 'user1',
          tweetId: '1',
          replyCount: '15',
          retweetCount: '150',
          likeCount: '500',
        },
        {
          url: 'https://x.com/user2/status/2',
          tweetText: 'Test tweet 2',
          tweetHtml: '<span>Test tweet 2</span>',
          elementHtml: '<article>Test 2</article>',
          screenName: 'user2',
          tweetId: '2',
          replyCount: '20',
          retweetCount: '200',
          likeCount: '600',
        },
      ]

      const mockTargetTweets = mockTweets
      const mockWaitingTweets = ['3', '4']

      ;(TweetService.getTweets as jest.Mock).mockReturnValue(mockTweets)
      ;(TweetService.getTargetTweets as jest.Mock).mockReturnValue(
        mockTargetTweets
      )
      ;(QueueService.isCheckedTweet as jest.Mock).mockReturnValue(false)
      ;(QueueService.isWaitingTweet as jest.Mock).mockReturnValue(false)
      ;(Storage.getWaitingTweets as jest.Mock).mockReturnValue(
        mockWaitingTweets
      )

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      await CrawlerService.crawlTweets()

      expect(TweetService.getTweets).toHaveBeenCalled()
      expect(TweetService.saveTweets).toHaveBeenCalledWith(mockTweets)
      expect(TweetService.getTargetTweets).toHaveBeenCalledWith(mockTweets)
      expect(QueueService.addWaitingTweets).toHaveBeenCalledWith(['1', '2'])
      expect(consoleSpy).toHaveBeenCalledWith(
        'crawlTweets: 2 tweets added to waitingTweets. totalWaitingTweets=2'
      )
      expect(CrawlerService.getCrawledTweetCount()).toBe(2)

      consoleSpy.mockRestore()
    })

    /**
     * 重複ツイートのフィルタリング機能をテスト
     * - 既にチェック済みのツイートを除外
     * - 既に待機中のツイートを除外
     * - 結果として空のキューが追加されることを確認
     */
    it('should filter out already checked and waiting tweets', async () => {
      const mockTweets: Tweet[] = [
        {
          url: 'https://x.com/user1/status/1',
          tweetText: 'Test tweet 1',
          tweetHtml: '<span>Test tweet 1</span>',
          elementHtml: '<article>Test 1</article>',
          screenName: 'user1',
          tweetId: '1',
          replyCount: '15',
          retweetCount: '150',
          likeCount: '500',
        },
        {
          url: 'https://x.com/user2/status/2',
          tweetText: 'Test tweet 2',
          tweetHtml: '<span>Test tweet 2</span>',
          elementHtml: '<article>Test 2</article>',
          screenName: 'user2',
          tweetId: '2',
          replyCount: '20',
          retweetCount: '200',
          likeCount: '600',
        },
      ]

      ;(TweetService.getTweets as jest.Mock).mockReturnValue(mockTweets)
      ;(TweetService.getTargetTweets as jest.Mock).mockReturnValue(mockTweets)
      ;(QueueService.isCheckedTweet as jest.Mock).mockImplementation(
        (tweetId) => {
          return tweetId === '1' // Tweet 1 is already checked
        }
      )
      ;(QueueService.isWaitingTweet as jest.Mock).mockImplementation(
        (tweetId) => {
          return tweetId === '2' // Tweet 2 is already waiting
        }
      )

      await CrawlerService.crawlTweets()

      expect(QueueService.addWaitingTweets).toHaveBeenCalledWith([])
    })

    /**
     * ツイートが見つからない場合の早期リターンをテスト
     * - TweetServiceがnullを返す場合の処理
     * - 後続の保存・フィルタリング処理が呼ばれないことを確認
     * - クロール数が増加しないことを確認
     */
    it('should return early when no tweets are found', async () => {
      ;(TweetService.getTweets as jest.Mock).mockReturnValue(null)

      await CrawlerService.crawlTweets()

      expect(TweetService.saveTweets).not.toHaveBeenCalled()
      expect(TweetService.getTargetTweets).not.toHaveBeenCalled()
      expect(QueueService.addWaitingTweets).not.toHaveBeenCalled()
      expect(CrawlerService.getCrawledTweetCount()).toBe(0)
    })

    /**
     * 空のツイート配列の処理をテスト
     * - ツイートの配列が空の場合の警告メッセージ出力
     * - 保存処理がスキップされることを確認
     * - クロール数が0のままであることを確認
     */
    it('should handle empty tweets array', async () => {
      ;(TweetService.getTweets as jest.Mock).mockReturnValue([])

      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

      await CrawlerService.crawlTweets()

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'crawlTweets: tweets not found'
      )
      expect(TweetService.saveTweets).not.toHaveBeenCalled()
      expect(CrawlerService.getCrawledTweetCount()).toBe(0)

      consoleWarnSpy.mockRestore()
    })

    /**
     * 新規追加対象がない場合の処理をテスト
     * - 全てのツイートが既にチェック済みの場合
     * - 空の配列でキューが更新されることを確認
     * - ログメッセージが出力されないことを確認
     */
    it('should return early when no new tweets to add', async () => {
      const mockTweets: Tweet[] = [
        {
          url: 'https://x.com/user1/status/1',
          tweetText: 'Test tweet 1',
          tweetHtml: '<span>Test tweet 1</span>',
          elementHtml: '<article>Test 1</article>',
          screenName: 'user1',
          tweetId: '1',
          replyCount: '15',
          retweetCount: '150',
          likeCount: '500',
        },
      ]

      ;(TweetService.getTweets as jest.Mock).mockReturnValue(mockTweets)
      ;(TweetService.getTargetTweets as jest.Mock).mockReturnValue(mockTweets)
      ;(QueueService.isCheckedTweet as jest.Mock).mockReturnValue(true)
      ;(QueueService.isWaitingTweet as jest.Mock).mockReturnValue(false)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      await CrawlerService.crawlTweets()

      expect(QueueService.addWaitingTweets).toHaveBeenCalledWith([])
      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  /**
   * クロール開始・停止機能のテスト
   * - インターバルタイマーの開始と停止制御
   * - 重複インターバル設定の防止
   * - エラーハンドリングの動作確認
   */
  describe('startCrawling and stopCrawling', () => {
    /**
     * クロールインターバルの開始機能をテスト
     * - startCrawling呼び出し後のタイマー設定確認
     * - 指定時間経過後のcrawlTweets実行確認
     */
    it('should start crawling interval', () => {
      CrawlerService.startCrawling()

      // Advance timer to trigger interval
      jest.advanceTimersByTime(1000)

      expect(TweetService.getTweets).toHaveBeenCalled()
    })

    /**
     * 重複インターバル防止機能をテスト
     * - 複数回のstartCrawling呼び出し
     * - インターバルが一つだけ作成されることを確認
     */
    it('should not start multiple intervals', () => {
      CrawlerService.startCrawling()
      CrawlerService.startCrawling()

      // Should only create one interval
      jest.advanceTimersByTime(1000)

      expect(TweetService.getTweets).toHaveBeenCalledTimes(1)
    })

    /**
     * クロールインターバルの停止機能をテスト
     * - stopCrawling呼び出し後のタイマー停止確認
     * - 時間経過後もcrawlTweetsが実行されないことを確認
     */
    it('should stop crawling interval', () => {
      CrawlerService.startCrawling()
      CrawlerService.stopCrawling()

      jest.advanceTimersByTime(1000)

      expect(TweetService.getTweets).not.toHaveBeenCalled()
    })

    /**
     * crawlTweets実行時のエラーハンドリングをテスト
     * - TweetService処理中のエラー発生
     * - エラーが適切にthrowされることを確認
     */
    it('should handle crawlTweets errors', async () => {
      ;(TweetService.getTweets as jest.Mock).mockImplementation(() => {
        throw new Error('Test error')
      })

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      // Test the error handling directly
      await expect(CrawlerService.crawlTweets()).rejects.toThrow('Test error')

      consoleErrorSpy.mockRestore()
    })

    /**
     * 非同期処理でのエラーハンドリングをテスト
     * - QueueService処理中の非同期エラー発生
     * - Promise rejectionが適切に処理されることを確認
     */
    it('should handle async crawlTweets rejections', async () => {
      const mockTweets = [
        { tweetId: '1', replyCount: '15', retweetCount: '150' } as Tweet,
      ]

      ;(TweetService.getTweets as jest.Mock).mockReturnValue(mockTweets)
      ;(TweetService.getTargetTweets as jest.Mock).mockReturnValue(mockTweets)
      ;(QueueService.isCheckedTweet as jest.Mock).mockReturnValue(false)
      ;(QueueService.isWaitingTweet as jest.Mock).mockReturnValue(false)
      ;(QueueService.addWaitingTweets as jest.Mock).mockRejectedValue(
        new Error('Async error')
      )

      // Test the error handling directly
      await expect(CrawlerService.crawlTweets()).rejects.toThrow('Async error')
    })
  })

  /**
   * クロール済みツイート数の管理機能テスト
   * - クロール数の累積カウント機能
   * - カウントのリセット機能
   * - 初期値の確認
   */
  describe('getCrawledTweetCount and resetCrawledTweetCount', () => {
    /**
     * クロール済みツイート数の追跡機能をテスト
     * - 複数回のcrawlTweets実行による累積カウント
     * - 処理されたツイート数の正確な記録
     */
    it('should track crawled tweet count', async () => {
      const mockTweets: Tweet[] = [
        { tweetId: '1' } as Tweet,
        { tweetId: '2' } as Tweet,
        { tweetId: '3' } as Tweet,
      ]

      ;(TweetService.getTweets as jest.Mock).mockReturnValue(mockTweets)
      ;(TweetService.getTargetTweets as jest.Mock).mockReturnValue([])
      ;(QueueService.addWaitingTweets as jest.Mock).mockResolvedValue(undefined)

      await CrawlerService.crawlTweets()

      expect(CrawlerService.getCrawledTweetCount()).toBe(3)

      await CrawlerService.crawlTweets()

      expect(CrawlerService.getCrawledTweetCount()).toBe(6)
    })

    /**
     * クロール数リセット機能をテスト
     * - resetCrawledTweetCount呼び出し後のカウント初期化
     * - カウントが確実に0に戻ることを確認
     */
    it('should reset crawled tweet count', async () => {
      const mockTweets: Tweet[] = [{ tweetId: '1' } as Tweet]

      ;(TweetService.getTweets as jest.Mock).mockReturnValue(mockTweets)
      ;(TweetService.getTargetTweets as jest.Mock).mockReturnValue([])
      ;(QueueService.addWaitingTweets as jest.Mock).mockResolvedValue(undefined)

      await CrawlerService.crawlTweets()

      expect(CrawlerService.getCrawledTweetCount()).toBe(1)

      CrawlerService.resetCrawledTweetCount()

      expect(CrawlerService.getCrawledTweetCount()).toBe(0)
    })

    /**
     * 初期状態のカウント値をテスト
     * - サービス初期化時のカウントが0であることを確認
     */
    it('should start with zero count', () => {
      expect(CrawlerService.getCrawledTweetCount()).toBe(0)
    })
  })
})
