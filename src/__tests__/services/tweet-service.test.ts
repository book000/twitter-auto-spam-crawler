import { TweetService } from '../../services/tweet-service'
import { Storage } from '../../core/storage'
import { THRESHOLDS } from '../../core/constants'
import type { Tweet } from '../../types'
import '../../__mocks__/userscript'

// Mock Storage
jest.mock('../../core/storage')

// Mock document methods for download tests only
const mockCreateElement = jest.fn()
const mockAppend = jest.fn()
const mockClick = jest.fn()
// eslint-disable-next-line @typescript-eslint/no-deprecated
const originalCreateElement = document.createElement.bind(document)
const originalAppend = document.body.append.bind(document.body)

// Mock URL.createObjectURL and URL.revokeObjectURL
globalThis.URL.createObjectURL = jest.fn(() => 'mock-blob-url')
globalThis.URL.revokeObjectURL = jest.fn()

// Mock Blob
globalThis.Blob = jest.fn().mockImplementation((data, options) => ({
  data,
  options,
}))

/**
 * TweetServiceクラスのテストスイート
 * ツイートの取得、保存、フィルタリング、ダウンロード機能を検証する
 * - DOMからのツイート要素抽出とデータパース
 * - エンゲージメント指標（リプライ、リツイート、いいね）の解析
 * - ストレージを使用したツイートの保存と更新
 * - 閾値による対象ツイートのフィルタリング
 * - JSONファイルとしてのツイートダウンロード機能
 */
describe('TweetService', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    jest.clearAllMocks()
    mockCreateElement.mockClear()
    mockAppend.mockClear()
    mockClick.mockClear()
    // Reset to original methods for most tests
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.createElement = originalCreateElement
    document.body.append = originalAppend
    Storage.clearCache()
  })

  /**
   * getTweetsメソッドのテスト
   * DOMからツイート記事要素を抽出し、構造化されたTweetオブジェクトに変換する機能を検証
   * - ツイートURL、テキスト内容、HTML、ユーザー名、IDの抽出
   * - エンゲージメント数（リプライ、リツイート、いいね）の解析
   * - 無効なURL、欠損要素、不正データの適切な処理
   */
  describe('getTweets', () => {
    /**
     * 正常なツイート記事からのデータ抽出をテスト
     * - 完全なツイート要素（リンク、テキスト、インタラクションボタン）からの情報抽出
     * - URL、ユーザー名、ツイートIDの正確な解析
     * - エンゲージメント数の正確な読み取り
     * - HTMLとテキストコンテンツの適切な分離
     */
    it('should return tweets from tweet articles', () => {
      // Create mock tweet articles
      const article1 = document.createElement('article')
      article1.dataset.testid = 'tweet'

      // Create tweet link with time
      const link1 = document.createElement('a')
      link1.setAttribute('role', 'link')
      link1.href = 'https://x.com/testuser1/status/123456789'
      const time1 = document.createElement('time')
      time1.setAttribute('datetime', '2024-01-01T12:00:00Z')
      link1.append(time1)
      article1.append(link1)

      // Create tweet text
      const textDiv1 = document.createElement('div')
      textDiv1.setAttribute('lang', 'ja')
      textDiv1.setAttribute('dir', 'ltr')
      textDiv1.dataset.testid = 'tweetText'
      textDiv1.textContent = 'Test tweet content'
      textDiv1.innerHTML = '<span>Test tweet content</span>'
      article1.append(textDiv1)

      // Create interaction buttons
      const replyButton1 = document.createElement('button')
      replyButton1.setAttribute('role', 'button')
      replyButton1.dataset.testid = 'reply'
      replyButton1.setAttribute('aria-label', '5 replies')
      article1.append(replyButton1)

      const retweetButton1 = document.createElement('button')
      retweetButton1.setAttribute('role', 'button')
      retweetButton1.dataset.testid = 'retweet'
      retweetButton1.setAttribute('aria-label', '10 retweets')
      article1.append(retweetButton1)

      const likeButton1 = document.createElement('button')
      likeButton1.setAttribute('role', 'button')
      likeButton1.dataset.testid = 'like'
      likeButton1.setAttribute('aria-label', '20 likes')
      article1.append(likeButton1)

      // Mock querySelectorAll to return our test article
      const mockQuerySelectorAll = jest.fn().mockReturnValue([article1])
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.querySelectorAll = mockQuerySelectorAll

      const result = TweetService.getTweets()

      expect(result).toHaveLength(1)
      expect(result![0]).toEqual({
        url: 'https://x.com/testuser1/status/123456789',
        tweetText: 'Test tweet content',
        tweetHtml: '<span>Test tweet content</span>',
        elementHtml: article1.innerHTML,
        screenName: 'testuser1',
        tweetId: '123456789',
        replyCount: '5',
        retweetCount: '10',
        likeCount: '20',
      })
    })

    /**
     * ツイート要素が見つからない場合のnull返却をテスト
     * - 無効なarticle要素（timeを含むlink要素なし）の処理
     * - 適切な警告メッセージの出力確認
     * - エラー状態での安全な処理終了
     */
    it('should return null when tweet element is not found', () => {
      const article = document.createElement('article')
      article.dataset.testid = 'tweet'
      // No link with time element

      const mockQuerySelectorAll = jest.fn().mockReturnValue([article])
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const originalQuerySelector = article.querySelector.bind(article)
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      article.querySelector = jest.fn().mockReturnValue(null)
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.querySelectorAll = mockQuerySelectorAll

      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

      const result = TweetService.getTweets()

      expect(result).toBeNull()
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'getTweets: tweetElement not found'
      )

      consoleWarnSpy.mockRestore()
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      article.querySelector = originalQuerySelector
    })

    /**
     * 無効なURLを持つツイートのスキップ処理をテスト
     * - X.com以外のドメインURLの除外
     * - 無効なツイートURLパターンの適切なフィルタリング
     * - 結果として空配列が返されることを確認
     */
    it('should skip tweets with invalid URLs', () => {
      const article = document.createElement('article')
      article.dataset.testid = 'tweet'

      const link = document.createElement('a')
      link.setAttribute('role', 'link')
      link.href = 'https://example.com/invalid'
      const time = document.createElement('time')
      time.setAttribute('datetime', '2024-01-01T12:00:00Z')
      link.append(time)
      article.append(link)

      const mockQuerySelectorAll = jest.fn().mockReturnValue([article])
      const mockQuerySelector = jest.fn().mockReturnValue(link)
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      article.querySelector = mockQuerySelector
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.querySelectorAll = mockQuerySelectorAll

      const result = TweetService.getTweets()

      expect(result).toEqual([])
    })

    /**
     * テキストコンテンツなしツイートの処理をテスト
     * - ツイートテキスト要素が存在しない場合の処理
     * - null値での適切なデータ構造維持
     * - 他の要素（URL、エンゲージメント数）の正常な処理継続
     */
    it('should handle tweets without text content', () => {
      const article = document.createElement('article')
      article.dataset.testid = 'tweet'

      const link = document.createElement('a')
      link.setAttribute('role', 'link')
      link.href = 'https://x.com/testuser/status/123'
      const time = document.createElement('time')
      time.setAttribute('datetime', '2024-01-01T12:00:00Z')
      link.append(time)
      article.append(link)

      // No text element

      const mockQuerySelectorAll = jest.fn().mockReturnValue([article])
      const mockQuerySelector = jest
        .fn()
        .mockReturnValueOnce(link) // for tweetElement
        .mockReturnValueOnce(null) // for textElement
        .mockReturnValueOnce(null) // for replyButton
        .mockReturnValueOnce(null) // for retweetButton
        .mockReturnValueOnce(null) // for likeButton
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      article.querySelector = mockQuerySelector
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.querySelectorAll = mockQuerySelectorAll

      const result = TweetService.getTweets()

      expect(result).toHaveLength(1)
      expect(result![0].tweetText).toBeNull()
      expect(result![0].tweetHtml).toBeNull()
    })

    /**
     * インタラクションボタン欠損時のデフォルト値設定をテスト
     * - リプライ、リツイート、いいねボタンが存在しない場合
     * - 各エンゲージメント数が'0'でデフォルト設定されることを確認
     * - ツイート構造の一貫性維持
     */
    it('should handle missing interaction buttons', () => {
      const article = document.createElement('article')
      article.dataset.testid = 'tweet'

      const link = document.createElement('a')
      link.setAttribute('role', 'link')
      link.href = 'https://x.com/testuser/status/123'
      const time = document.createElement('time')
      link.append(time)
      article.append(link)

      const mockQuerySelectorAll = jest.fn().mockReturnValue([article])
      const mockQuerySelector = jest
        .fn()
        .mockReturnValueOnce(link) // for tweetElement
        .mockReturnValueOnce(null) // for textElement
        .mockReturnValueOnce(null) // for replyButton
        .mockReturnValueOnce(null) // for retweetButton
        .mockReturnValueOnce(null) // for likeButton
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      article.querySelector = mockQuerySelector
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.querySelectorAll = mockQuerySelectorAll

      const result = TweetService.getTweets()

      expect(result).toHaveLength(1)
      expect(result![0].replyCount).toBe('0')
      expect(result![0].retweetCount).toBe('0')
      expect(result![0].likeCount).toBe('0')
    })
  })

  /**
   * saveTweetsメソッドのテスト
   * ストレージへのツイート保存と更新機能を検証
   * - 既存ツイートとの重複チェックと統合
   * - 新規ツイートの追加処理
   * - 同一IDツイートの更新処理
   */
  describe('saveTweets', () => {
    /**
     * 新規ツイートのストレージ追加をテスト
     * - 既存ツイートリストへの新規ツイート追加
     * - 重複なし新規ツイートの正常な保存処理
     * - ストレージ更新の適切な呼び出し確認
     */
    it('should add new tweets to storage', () => {
      const existingTweets: Tweet[] = [
        {
          url: 'https://x.com/user1/status/1',
          tweetText: 'Existing tweet',
          tweetHtml: '<span>Existing tweet</span>',
          elementHtml: '<article>Existing</article>',
          screenName: 'user1',
          tweetId: '1',
          replyCount: '1',
          retweetCount: '1',
          likeCount: '1',
        },
      ]

      const newTweets: Tweet[] = [
        {
          url: 'https://x.com/user2/status/2',
          tweetText: 'New tweet',
          tweetHtml: '<span>New tweet</span>',
          elementHtml: '<article>New</article>',
          screenName: 'user2',
          tweetId: '2',
          replyCount: '2',
          retweetCount: '2',
          likeCount: '2',
        },
      ]

      ;(Storage.getSavedTweets as jest.Mock).mockReturnValue([
        ...existingTweets,
      ])

      TweetService.saveTweets(newTweets)

      expect(Storage.setSavedTweets).toHaveBeenCalledWith([
        ...existingTweets,
        ...newTweets,
      ])
    })

    /**
     * 既存ツイートの更新処理をテスト
     * - 同一tweetIdを持つツイートの内容更新
     * - エンゲージメント数増加等の変更反映
     * - 重複除去による正確な更新処理
     */
    it('should update existing tweets', () => {
      const existingTweets: Tweet[] = [
        {
          url: 'https://x.com/user1/status/1',
          tweetText: 'Old content',
          tweetHtml: '<span>Old content</span>',
          elementHtml: '<article>Old</article>',
          screenName: 'user1',
          tweetId: '1',
          replyCount: '1',
          retweetCount: '1',
          likeCount: '1',
        },
      ]

      const updatedTweets: Tweet[] = [
        {
          url: 'https://x.com/user1/status/1',
          tweetText: 'Updated content',
          tweetHtml: '<span>Updated content</span>',
          elementHtml: '<article>Updated</article>',
          screenName: 'user1',
          tweetId: '1',
          replyCount: '5',
          retweetCount: '10',
          likeCount: '20',
        },
      ]

      ;(Storage.getSavedTweets as jest.Mock).mockReturnValue(existingTweets)

      TweetService.saveTweets(updatedTweets)

      expect(Storage.setSavedTweets).toHaveBeenCalledWith(updatedTweets)
    })
  })

  /**
   * isNeedDownloadメソッドのテスト
   * 保存ツイート数が制限を超えた場合のダウンロード要否判定を検証
   * - SAVED_TWEETS_LIMIT閾値との比較判定
   * - ダウンロードトリガー条件の正確な評価
   */
  describe('isNeedDownload', () => {
    /**
     * 制限超過時のダウンロード要否判定をテスト
     * - 保存ツイート数が制限値を超えた場合のtrue返却
     * - 閾値チェックの正確な動作確認
     */
    it('should return true when tweets count exceeds limit', () => {
      const tweets = Array.from({ length: THRESHOLDS.SAVED_TWEETS_LIMIT + 1 })
        .fill({})
        .map((_, index) => ({
          tweetId: index.toString(),
        }))

      ;(Storage.getSavedTweets as jest.Mock).mockReturnValue(tweets)

      const result = TweetService.isNeedDownload()

      expect(result).toBe(true)
    })

    /**
     * 制限未満時のダウンロード不要判定をテスト
     * - 保存ツイート数が制限値未満の場合のfalse返却
     * - ダウンロード不要状態の正確な判定
     */
    it('should return false when tweets count is below limit', () => {
      const tweets = Array.from({ length: THRESHOLDS.SAVED_TWEETS_LIMIT - 1 })
        .fill({})
        .map((_, index) => ({
          tweetId: index.toString(),
        }))

      ;(Storage.getSavedTweets as jest.Mock).mockReturnValue(tweets)

      const result = TweetService.isNeedDownload()

      expect(result).toBe(false)
    })

    /**
     * 制限値ちょうどの場合のダウンロード不要判定をテスト
     * - 保存ツイート数が制限値と同じ場合のfalse返却
     * - 境界値での正確な判定動作確認
     */
    it('should return false when tweets count equals limit', () => {
      const tweets = Array.from({ length: THRESHOLDS.SAVED_TWEETS_LIMIT })
        .fill({})
        .map((_, index) => ({
          tweetId: index.toString(),
        }))

      ;(Storage.getSavedTweets as jest.Mock).mockReturnValue(tweets)

      const result = TweetService.isNeedDownload()

      expect(result).toBe(false)
    })
  })

  /**
   * downloadTweetsメソッドのテスト
   * ツイートのJSONファイルダウンロード機能を検証
   * - Blob作成とダウンロードリンク生成
   * - ファイル名の適切なタイムスタンプ形式
   * - ダウンロード後のストレージクリア
   */
  describe('downloadTweets', () => {
    /**
     * ツイートダウンロードとストレージクリア処理をテスト
     * - JSONフォーマットでのBlob作成
     * - タイムスタンプ付きファイル名生成
     * - ダウンロードリンクの自動クリック
     * - 保存ツイートの自動削除処理
     */
    it('should create download link and clear saved tweets', () => {
      // Set up mocks for this specific test
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.createElement = mockCreateElement
      document.body.append = mockAppend

      const testTweets: Tweet[] = [
        {
          url: 'https://x.com/user1/status/1',
          tweetText: 'Test tweet',
          tweetHtml: '<span>Test tweet</span>',
          elementHtml: '<article>Test</article>',
          screenName: 'user1',
          tweetId: '1',
          replyCount: '1',
          retweetCount: '1',
          likeCount: '1',
        },
      ]

      ;(Storage.getSavedTweets as jest.Mock).mockReturnValue(testTweets)

      const mockAnchor = {
        href: '',
        download: '',
        innerHTML: '',
        click: mockClick,
      }
      mockCreateElement.mockReturnValue(mockAnchor)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      const result = TweetService.downloadTweets()

      expect(consoleSpy).toHaveBeenCalledWith('downloadTweets: download tweets')
      expect(globalThis.Blob).toHaveBeenCalledWith(
        [
          JSON.stringify({
            type: 'tweets',
            data: testTweets,
          }),
        ],
        { type: 'application/json' }
      )
      expect(globalThis.URL.createObjectURL).toHaveBeenCalled()
      expect(mockAnchor.href).toBe('mock-blob-url')
      expect(mockAnchor.download).toMatch(
        /^tweets-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z\.json$/
      )
      expect(mockAnchor.innerHTML).toBe('download')
      expect(mockAppend).toHaveBeenCalledWith(mockAnchor)
      expect(mockClick).toHaveBeenCalled()
      expect(Storage.setSavedTweets).toHaveBeenCalledWith([])
      expect(result).toBe(true)

      consoleSpy.mockRestore()
    })
  })

  /**
   * getTargetTweetsメソッドのテスト
   * エンゲージメント閾値による対象ツイートフィルタリング機能を検証
   * - リツイート数とリプライ数の両方が閾値以上のツイート抽出
   * - 閾値に満たないツイートの除外処理
   * - 境界値での正確なフィルタリング動作
   */
  describe('getTargetTweets', () => {
    /**
     * 両閾値を満たすツイートのフィルタリングをテスト
     * - リツイート数100以上かつリプライ数10以上の条件確認
     * - 条件を満たすツイートのみが抽出されることを検証
     * - 条件不足ツイートの適切な除外確認
     */
    it('should filter tweets that meet both retweet and reply thresholds', () => {
      const tweets: Tweet[] = [
        {
          url: 'https://x.com/user1/status/1',
          tweetText: 'High engagement tweet',
          tweetHtml: '<span>High engagement tweet</span>',
          elementHtml: '<article>High</article>',
          screenName: 'user1',
          tweetId: '1',
          replyCount: '15', // Above threshold (10)
          retweetCount: '150', // Above threshold (100)
          likeCount: '500',
        },
        {
          url: 'https://x.com/user2/status/2',
          tweetText: 'Low retweet tweet',
          tweetHtml: '<span>Low retweet tweet</span>',
          elementHtml: '<article>Low retweet</article>',
          screenName: 'user2',
          tweetId: '2',
          replyCount: '15', // Above threshold
          retweetCount: '50', // Below threshold
          likeCount: '100',
        },
        {
          url: 'https://x.com/user3/status/3',
          tweetText: 'Low reply tweet',
          tweetHtml: '<span>Low reply tweet</span>',
          elementHtml: '<article>Low reply</article>',
          screenName: 'user3',
          tweetId: '3',
          replyCount: '5', // Below threshold
          retweetCount: '150', // Above threshold
          likeCount: '300',
        },
      ]

      const result = TweetService.getTargetTweets(tweets)

      expect(result).toHaveLength(1)
      expect(result[0].tweetId).toBe('1')
    })

    /**
     * 閾値未満ツイートの空配列返却をテスト
     * - 全ツイートが閾値条件を満たさない場合の処理
     * - 空配列が正確に返されることを確認
     */
    it('should return empty array when no tweets meet thresholds', () => {
      const tweets: Tweet[] = [
        {
          url: 'https://x.com/user1/status/1',
          tweetText: 'Low engagement tweet',
          tweetHtml: '<span>Low engagement tweet</span>',
          elementHtml: '<article>Low</article>',
          screenName: 'user1',
          tweetId: '1',
          replyCount: '5', // Below threshold
          retweetCount: '50', // Below threshold
          likeCount: '100',
        },
      ]

      const result = TweetService.getTargetTweets(tweets)

      expect(result).toEqual([])
    })

    /**
     * 閾値境界値での正確な判定をテスト
     * - エンゲージメント数が閾値ちょうどの場合の処理
     * - 境界値条件でのツイート包含確認
     */
    it('should handle edge case values at threshold boundaries', () => {
      const tweets: Tweet[] = [
        {
          url: 'https://x.com/user1/status/1',
          tweetText: 'Boundary tweet',
          tweetHtml: '<span>Boundary tweet</span>',
          elementHtml: '<article>Boundary</article>',
          screenName: 'user1',
          tweetId: '1',
          replyCount: THRESHOLDS.REPLY_COUNT.toString(), // Exactly at threshold
          retweetCount: THRESHOLDS.RETWEET_COUNT.toString(), // Exactly at threshold
          likeCount: '100',
        },
      ]

      const result = TweetService.getTargetTweets(tweets)

      expect(result).toHaveLength(1)
    })
  })
})
