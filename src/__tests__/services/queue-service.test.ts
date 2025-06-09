import { QueueService } from '../../services/queue-service'
import { Storage } from '../../core/storage'
import { clearMockStorage } from '../../__mocks__/userscript'

// Import mock before the module under test
import '../../__mocks__/userscript'

// Mock timers
jest.useFakeTimers()

/**
 * QueueServiceクラスのテストスイート
 * ツイート処理キューの管理機能を検証する
 * - 待機中ツイートとチェック済みツイートの状態管理
 * - キューへの追加、取得、状態変更処理
 * - 重複防止とキューのリセット機能
 * - ストレージとの連携と非同期処理
 */
describe('QueueService', () => {
  beforeEach(() => {
    clearMockStorage()
    jest.clearAllMocks()
    jest.clearAllTimers()
    Storage.clearCache()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
  })

  /**
   * isCheckedTweetメソッドのテスト
   * 指定されたツイートが既にチェック済みかどうかの判定機能を検証
   * - チェック済みリストからのツイートID検索
   * - 存在しないツイートの適切な処理
   */
  describe('isCheckedTweet', () => {
    /**
     * チェック済みツイートのtrue返却をテスト
     * - チェック済みリストに存在するツイートIDの正確な検出
     */
    it('should return true if tweet is in checked tweets', () => {
      jest
        .spyOn(Storage, 'getCheckedTweets')
        .mockReturnValue(['tweet1', 'tweet2'])

      const result = QueueService.isCheckedTweet('tweet1')
      expect(result).toBe(true)
    })

    /**
     * 未チェックツイートのfalse返却をテスト
     * - チェック済みリストに存在しないツイートIDの正確な判定
     */
    it('should return false if tweet is not in checked tweets', () => {
      jest
        .spyOn(Storage, 'getCheckedTweets')
        .mockReturnValue(['tweet1', 'tweet2'])

      const result = QueueService.isCheckedTweet('tweet3')
      expect(result).toBe(false)
    })

    /**
     * 空のチェック済みリストでのfalse返却をテスト
     * - チェック済みツイートが存在しない初期状態の処理
     */
    it('should return false for empty checked tweets list', () => {
      jest.spyOn(Storage, 'getCheckedTweets').mockReturnValue([])

      const result = QueueService.isCheckedTweet('tweet1')
      expect(result).toBe(false)
    })
  })

  /**
   * isWaitingTweetメソッドのテスト
   * 指定されたツイートが待機中かどうかの判定機能を検証
   * - 待機リストからのツイートID検索
   * - 待機中でないツイートの適切な処理
   */
  describe('isWaitingTweet', () => {
    /**
     * 待機中ツイートのtrue返却をテスト
     * - 待機リストに存在するツイートIDの正確な検出
     */
    it('should return true if tweet is in waiting tweets', () => {
      jest
        .spyOn(Storage, 'getWaitingTweets')
        .mockReturnValue(['waiting1', 'waiting2'])

      const result = QueueService.isWaitingTweet('waiting1')
      expect(result).toBe(true)
    })

    /**
     * 非待機ツイートのfalse返却をテスト
     * - 待機リストに存在しないツイートIDの正確な判定
     */
    it('should return false if tweet is not in waiting tweets', () => {
      jest
        .spyOn(Storage, 'getWaitingTweets')
        .mockReturnValue(['waiting1', 'waiting2'])

      const result = QueueService.isWaitingTweet('waiting3')
      expect(result).toBe(false)
    })

    /**
     * 空の待機リストでのfalse返却をテスト
     * - 待機ツイートが存在しない初期状態の処理
     */
    it('should return false for empty waiting tweets list', () => {
      jest.spyOn(Storage, 'getWaitingTweets').mockReturnValue([])

      const result = QueueService.isWaitingTweet('waiting1')
      expect(result).toBe(false)
    })
  })

  /**
   * addWaitingTweetsメソッドのテスト
   * 待機キューへのツイート追加機能を検証
   * - 既存待機リストへの新規ツイート追加
   * - 非同期処理とタイマーを使用したストレージ更新
   */
  describe('addWaitingTweets', () => {
    /**
     * 待機リストへのツイート追加をテスト
     * - 既存待機ツイートと新規ツイートの結合
     * - ストレージ更新の適切な呼び出し確認
     * - 非同期処理の正常な完了
     */
    it('should add tweets to waiting list', async () => {
      const existingTweets = ['existing1', 'existing2']
      const newTweets = ['new1', 'new2']
      const setWaitingTweetsSpy = jest.spyOn(Storage, 'setWaitingTweets')

      jest.spyOn(Storage, 'getWaitingTweets').mockReturnValue(existingTweets)

      const promise = QueueService.addWaitingTweets(newTweets)

      expect(setWaitingTweetsSpy).toHaveBeenCalledWith([
        'existing1',
        'existing2',
        'new1',
        'new2',
      ])

      // Fast-forward timer
      jest.advanceTimersByTime(1000)
      await promise
    })

    /**
     * 空の新規ツイート配列の処理をテスト
     * - 空配列でのストレージ更新の正常動作
     * - 既存データの維持確認
     */
    it('should handle empty new tweets array', async () => {
      const existingTweets = ['existing1']
      const setWaitingTweetsSpy = jest.spyOn(Storage, 'setWaitingTweets')

      jest.spyOn(Storage, 'getWaitingTweets').mockReturnValue(existingTweets)

      const promise = QueueService.addWaitingTweets([])

      expect(setWaitingTweetsSpy).toHaveBeenCalledWith(['existing1'])

      jest.advanceTimersByTime(1000)
      await promise
    })
  })

  /**
   * getNextWaitingTweetメソッドのテスト
   * 待機キューからの次の処理対象ツイート取得機能を検証
   * - FIFO（First In, First Out）キューの適切な実装
   * - 空キューの適切な処理
   */
  describe('getNextWaitingTweet', () => {
    /**
     * 待機リストの先頭ツイート取得をテスト
     * - FIFOキューの正常な動作確認
     * - 最初に追加されたツイートが最初に取得されることを確認
     */
    it('should return first tweet from waiting list', () => {
      jest
        .spyOn(Storage, 'getWaitingTweets')
        .mockReturnValue(['first', 'second', 'third'])

      const result = QueueService.getNextWaitingTweet()
      expect(result).toBe('first')
    })

    /**
     * 空の待機リストでのnull返却をテスト
     * - キューに処理対象がない場合の適切な処理
     */
    it('should return null for empty waiting list', () => {
      jest.spyOn(Storage, 'getWaitingTweets').mockReturnValue([])

      const result = QueueService.getNextWaitingTweet()
      expect(result).toBe(null)
    })
  })

  /**
   * checkedTweetメソッドのテスト
   * ツイートを待機状態からチェック済み状態に移動する機能を検証
   * - 待機リストからの削除とチェック済みリストへの追加
   * - 状態遷移の原子性とログ出力
   * - 例外ケース（待機リストに存在しないツイート）の処理
   */
  describe('checkedTweet', () => {
    /**
     * 待機からチェック済みへの正常な状態遷移をテスト
     * - 待機リストからのツイート削除
     * - チェック済みリストへのツイート追加
     * - 適切なログメッセージ出力
     * - 非同期処理の正常完了
     */
    it('should move tweet from waiting to checked', async () => {
      const tweetId = 'test123'
      const existingChecked = ['checked1']
      const existingWaiting = ['test123', 'waiting2']

      const setCheckedTweetsSpy = jest.spyOn(Storage, 'setCheckedTweets')
      const setWaitingTweetsSpy = jest.spyOn(Storage, 'setWaitingTweets')

      jest.spyOn(Storage, 'getCheckedTweets').mockReturnValue(existingChecked)
      jest.spyOn(Storage, 'getWaitingTweets').mockReturnValue(existingWaiting)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      const promise = QueueService.checkedTweet(tweetId)

      expect(setCheckedTweetsSpy).toHaveBeenCalledWith(['checked1', 'test123'])
      expect(setWaitingTweetsSpy).toHaveBeenCalledWith(['waiting2'])
      expect(consoleSpy).toHaveBeenCalledWith('checkedTweet: test123')

      jest.advanceTimersByTime(1000)
      await promise

      consoleSpy.mockRestore()
    })

    /**
     * 待機リストに存在しないツイートの処理をテスト
     * - チェック済みリストへの追加は実行
     * - 待機リストの更新はスキップ
     * - 例外ケースでの安全な処理確認
     */
    it('should handle tweet not in waiting list', async () => {
      const tweetId = 'notInWaiting'
      const existingChecked = ['checked1']
      const existingWaiting = ['waiting1', 'waiting2']

      const setCheckedTweetsSpy = jest.spyOn(Storage, 'setCheckedTweets')
      const setWaitingTweetsSpy = jest.spyOn(Storage, 'setWaitingTweets')

      jest.spyOn(Storage, 'getCheckedTweets').mockReturnValue(existingChecked)
      jest.spyOn(Storage, 'getWaitingTweets').mockReturnValue(existingWaiting)

      const promise = QueueService.checkedTweet(tweetId)

      expect(setCheckedTweetsSpy).toHaveBeenCalledWith([
        'checked1',
        'notInWaiting',
      ])
      // When tweet is not in waiting list, setWaitingTweets should not be called
      expect(setWaitingTweetsSpy).not.toHaveBeenCalled()

      jest.advanceTimersByTime(1000)
      await promise
    })
  })

  /**
   * resetWaitingQueueメソッドのテスト
   * 待機キューのリセット機能を検証
   * - 待機ツイートリストの完全クリア
   */
  describe('resetWaitingQueue', () => {
    /**
     * 待機ツイートリストのクリアをテスト
     * - 待機リストが空配列でリセットされることを確認
     * - ストレージ更新の適切な呼び出し確認
     */
    it('should clear waiting tweets list', () => {
      const setWaitingTweetsSpy = jest.spyOn(Storage, 'setWaitingTweets')

      QueueService.resetWaitingQueue()

      expect(setWaitingTweetsSpy).toHaveBeenCalledWith([])
    })
  })
})
