import { Storage } from '../../core/storage'
import type { Tweet } from '../../types'
import { clearMockStorage } from '../../__mocks__/userscript'

/**
 * Storageクラスのテストスイート
 * ユーザースクリプトのストレージ操作機能をテスト
 */
describe('Storage', () => {
  beforeEach(() => {
    clearMockStorage()
    jest.clearAllMocks()
    Storage.clearCache()
  })

  /**
   * getValueとsetValueメソッドのテスト
   * 基本的なストレージ操作機能を検証
   */
  describe('getValue and setValue', () => {
    /**
     * 値の設定と取得が正しく動作することをテスト
     * GM_setValueとGM_getValueの基本的な連携を確認
     */
    it('should get and set values correctly', () => {
      const testValue = ['test1', 'test2']
      Storage.setValue('checkedTweets', testValue)

      expect(GM_setValue).toHaveBeenCalledWith('checkedTweets', testValue)
      ;(GM_getValue as jest.Mock).mockReturnValueOnce(testValue)
      const result = Storage.getValue('checkedTweets', [])

      expect(result).toEqual(testValue)
      expect(GM_getValue).toHaveBeenCalledWith('checkedTweets', [])
    })

    /**
     * 値が保存されていない場合にデフォルト値が返されることをテスト
     * 初期状態でのフォールバック動作を確認
     */
    it('should return default value when no value is stored', () => {
      const defaultValue = ['default']
      const result = Storage.getValue('checkedTweets', defaultValue)

      expect(result).toEqual(defaultValue)
      expect(GM_getValue).toHaveBeenCalledWith('checkedTweets', defaultValue)
    })
  })

  /**
   * getCheckedTweetsとsetCheckedTweetsメソッドのテスト
   * 処理済みツイートID配列の管理機能を検証
   */
  describe('getCheckedTweets and setCheckedTweets', () => {
    /**
     * デフォルト値として空の配列が返されることをテスト
     * 初期状態での処理済みツイートリストの状態を確認
     */
    it('should return empty array by default', () => {
      const result = Storage.getCheckedTweets()
      expect(result).toEqual([])
      expect(GM_getValue).toHaveBeenCalledWith('checkedTweets', [])
    })

    /**
     * 処理済みツイートの設定と取得が正しく動作することをテスト
     * ツイートID配列の永続化機能を確認
     */
    it('should set and get checked tweets', () => {
      const testTweets = ['tweet1', 'tweet2', 'tweet3']
      Storage.setCheckedTweets(testTweets)

      expect(GM_setValue).toHaveBeenCalledWith('checkedTweets', testTweets)
    })
  })

  /**
   * getWaitingTweetsとsetWaitingTweetsメソッドのテスト
   * 待機中ツイートID配列の管理機能を検証
   */
  describe('getWaitingTweets and setWaitingTweets', () => {
    /**
     * デフォルト値として空の配列が返されることをテスト
     * 初期状態での待機ツイートリストの状態を確認
     */
    it('should return empty array by default', () => {
      const result = Storage.getWaitingTweets()
      expect(result).toEqual([])
      expect(GM_getValue).toHaveBeenCalledWith('waitingTweets', [])
    })

    /**
     * 待機中ツイートの設定と取得が正しく動作することをテスト
     * ツイートID配列のキュー管理機能を確認
     */
    it('should set and get waiting tweets', () => {
      const testTweets = ['waiting1', 'waiting2']
      Storage.setWaitingTweets(testTweets)

      expect(GM_setValue).toHaveBeenCalledWith('waitingTweets', testTweets)
    })
  })

  /**
   * getSavedTweetsとsetSavedTweetsメソッドのテスト
   * 保存済みツイートオブジェクト配列の管理機能を検証
   */
  describe('getSavedTweets and setSavedTweets', () => {
    /**
     * デフォルト値として空の配列が返されることをテスト
     * 初期状態での保存済みツイートリストの状態を確認
     */
    it('should return empty array by default', () => {
      const result = Storage.getSavedTweets()
      expect(result).toEqual([])
      expect(GM_getValue).toHaveBeenCalledWith('savedTweets', [])
    })

    /**
     * 保存済みツイートの設定と取得が正しく動作することをテスト
     * 完全なツイートオブジェクトの永続化機能を確認
     */
    it('should set and get saved tweets', () => {
      const testTweets: Tweet[] = [
        {
          url: 'https://x.com/test/status/123',
          tweetText: 'Test tweet',
          tweetHtml: '<div>Test tweet</div>',
          elementHtml: '<article>Full element</article>',
          screenName: 'testuser',
          tweetId: '123',
          replyCount: '5',
          retweetCount: '10',
          likeCount: '20',
        },
      ]
      Storage.setSavedTweets(testTweets)

      expect(GM_setValue).toHaveBeenCalledWith('savedTweets', testTweets)
    })
  })

  /**
   * isLoginNotifiedとsetLoginNotifiedメソッドのテスト
   * ログイン通知状態の管理機能を検証
   */
  describe('isLoginNotified and setLoginNotified', () => {
    /**
     * デフォルト値としてfalseが返されることをテスト
     * 初期状態ではログイン通知が送信されていないことを確認
     */
    it('should return false by default', () => {
      const result = Storage.isLoginNotified()
      expect(result).toBe(false)
      expect(GM_getValue).toHaveBeenCalledWith('isLoginNotified', false)
    })

    /**
     * ログイン通知状態の設定と取得が正しく動作することをテスト
     * ログイン通知の重複送信防止フラグの管理を確認
     */
    it('should set and get login notification status', () => {
      Storage.setLoginNotified(true)

      expect(GM_setValue).toHaveBeenCalledWith('isLoginNotified', true)
    })
  })

  /**
   * isLockedNotifiedとsetLockedNotifiedメソッドのテスト
   * アカウントロック通知状態の管理機能を検証
   */
  describe('isLockedNotified and setLockedNotified', () => {
    /**
     * デフォルト値としてfalseが返されることをテスト
     * 初期状態ではアカウントロック通知が送信されていないことを確認
     */
    it('should return false by default', () => {
      const result = Storage.isLockedNotified()
      expect(result).toBe(false)
      expect(GM_getValue).toHaveBeenCalledWith('isLockedNotified', false)
    })

    /**
     * アカウントロック通知状態の設定と取得が正しく動作することをテスト
     * アカウントロック通知の重複送信防止フラグの管理を確認
     */
    it('should set and get locked notification status', () => {
      Storage.setLockedNotified(true)

      expect(GM_setValue).toHaveBeenCalledWith('isLockedNotified', true)
    })
  })

  /**
   * getRetryCountとsetRetryCountメソッドのテスト
   * リトライ試行回数の管理機能を検証
   */
  describe('getRetryCount and setRetryCount', () => {
    /**
     * デフォルト値として0が返されることをテスト
     * 初期状態ではリトライが実行されていないことを確認
     */
    it('should return 0 by default', () => {
      const result = Storage.getRetryCount()
      expect(result).toBe(0)
      expect(GM_getValue).toHaveBeenCalledWith('retryCount', 0)
    })

    /**
     * リトライ回数の設定と取得が正しく動作することをテスト
     * エラー時のリトライ管理機能を確認
     */
    it('should set and get retry count', () => {
      Storage.setRetryCount(5)

      expect(GM_setValue).toHaveBeenCalledWith('retryCount', 5)
    })
  })

  /**
   * 性能最適化機能のテスト
   * Set/Map ベースの高速化されたデータアクセスを検証
   */
  describe('Performance Optimizations', () => {
    /**
     * Set ベースのチェック済みツイート検索が O(1) で動作することをテスト
     * 大量データでも一定の処理時間を維持
     */
    it('should provide O(1) lookup for checked tweets', () => {
      const testTweets = Array.from({ length: 10_000 }, (_, i) => `tweet${i}`)
      Storage.setCheckedTweets(testTweets)

      const startTime = performance.now()
      const set = Storage.getCheckedTweetsSet()
      const exists = set.has('tweet5000')
      const endTime = performance.now()

      expect(exists).toBe(true)
      expect(endTime - startTime).toBeLessThan(10) // 10ms 以内
    })

    /**
     * Set ベースの待機中ツイート検索が O(1) で動作することをテスト
     * 線形検索からハッシュテーブル検索への改善を確認
     */
    it('should provide O(1) lookup for waiting tweets', () => {
      const testTweets = Array.from({ length: 10_000 }, (_, i) => `waiting${i}`)
      Storage.setWaitingTweets(testTweets)

      const startTime = performance.now()
      const set = Storage.getWaitingTweetsSet()
      const exists = set.has('waiting7500')
      const endTime = performance.now()

      expect(exists).toBe(true)
      expect(endTime - startTime).toBeLessThan(10) // 10ms 以内
    })

    /**
     * Map ベースの保存済みツイート検索が O(1) で動作することをテスト
     * 大量のツイートデータでも高速アクセスを実現
     */
    it('should provide O(1) lookup for saved tweets', () => {
      const testTweets: Tweet[] = Array.from({ length: 1000 }, (_, i) => ({
        url: `https://x.com/user/status/${i}`,
        tweetText: `Test tweet ${i}`,
        tweetHtml: `<span>Test tweet ${i}</span>`,
        elementHtml: `<article>Element ${i}</article>`,
        screenName: 'testuser',
        tweetId: `${i}`,
        replyCount: '1',
        retweetCount: '2',
        likeCount: '3',
      }))
      Storage.setSavedTweets(testTweets)

      const startTime = performance.now()
      const map = Storage.getSavedTweetsMap()
      const tweet = map.get('500')
      const endTime = performance.now()

      expect(tweet).toBeDefined()
      expect(tweet?.tweetId).toBe('500')
      expect(endTime - startTime).toBeLessThan(10) // 10ms 以内
    })

    /**
     * バッチ処理機能のテスト
     * 複数操作の効率的な一括処理を確認
     */
    it('should handle batch operations efficiently', () => {
      const tweetIds = Array.from({ length: 1000 }, (_, i) => `batch${i}`)

      const startTime = performance.now()
      Storage.addCheckedTweetsBatch(tweetIds)
      const endTime = performance.now()

      const checkedSet = Storage.getCheckedTweetsSet()
      expect(checkedSet.size).toBe(1000)
      expect(checkedSet.has('batch500')).toBe(true)
      expect(endTime - startTime).toBeLessThan(100) // 100ms 以内
    })

    /**
     * ツイート状態の一括取得テスト
     * 複数の状態チェックを効率的に実行
     */
    it('should provide efficient tweet status checking', () => {
      Storage.setCheckedTweets(['checked1', 'checked2'])
      Storage.setWaitingTweets(['waiting1', 'waiting2'])

      const startTime = performance.now()
      const status1 = Storage.getTweetStatus('checked1')
      const status2 = Storage.getTweetStatus('waiting1')
      const status3 = Storage.getTweetStatus('nonexistent')
      const endTime = performance.now()

      expect(status1).toEqual({ isChecked: true, isWaiting: false })
      expect(status2).toEqual({ isChecked: false, isWaiting: true })
      expect(status3).toEqual({ isChecked: false, isWaiting: false })
      expect(endTime - startTime).toBeLessThan(5) // 5ms 以内
    })

    /**
     * ストレージ統計情報の取得テスト
     * メモリ使用量とデータ量の監視機能を確認
     */
    it('should provide storage statistics', () => {
      Storage.setCheckedTweets(['stat1', 'stat2'])
      Storage.setWaitingTweets(['wait1'])
      Storage.setSavedTweets([
        {
          url: 'https://x.com/test/status/1',
          tweetText: 'Test',
          tweetHtml: '<span>Test</span>',
          elementHtml: '<article>Test</article>',
          screenName: 'test',
          tweetId: '1',
          replyCount: '0',
          retweetCount: '0',
          likeCount: '0',
        },
      ])

      const stats = Storage.getStorageStats()

      expect(stats.checkedTweetsCount).toBe(2)
      expect(stats.waitingTweetsCount).toBe(1)
      expect(stats.savedTweetsCount).toBe(1)
      expect(stats.memoryUsage.checkedTweetsSetSize).toBe(2)
      expect(stats.memoryUsage.waitingTweetsSetSize).toBe(1)
      expect(stats.memoryUsage.savedTweetsMapSize).toBe(1)
    })
  })
})
