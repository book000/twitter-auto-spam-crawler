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
})
