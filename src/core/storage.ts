import type { StorageData, StorageKey, Tweet } from '@/types'

/**
 * ユーザースクリプトGM_getValue/GM_setValue APIを使用したタイプセーフなストレージ抽象化層。
 * ツイートデータとアプリケーション状態のための強力に型付けされた永続ストレージアクセスを提供。
 *
 * パフォーマンス最適化:
 * - チェック済み/待機中ツイートIDにSetを使用してO(1)ルックアップを実現
 * - 保存済みツイートにMapを使用して効率的な更新を実現
 */
export const Storage = {
  // キャッシュ用のプライベートプロパティ
  _checkedTweetsSet: null as Set<string> | null,
  _waitingTweetsSet: null as Set<string> | null,
  _savedTweetsMap: null as Map<string, Tweet> | null,
  getValue<K extends StorageKey>(
    key: K,
    defaultValue: StorageData[K]
  ): StorageData[K] {
    return GM_getValue(key, defaultValue)
  },

  setValue<K extends StorageKey>(key: K, value: StorageData[K]): void {
    GM_setValue(key, value)
  },

  getCheckedTweets(): string[] {
    return this.getValue('checkedTweets', [])
  },

  /**
   * チェック済みツイートIDのSetを取得（キャッシュ付き）
   * O(1)ルックアップのための最適化
   */
  getCheckedTweetsSet(): Set<string> {
    this._checkedTweetsSet ??= new Set(this.getCheckedTweets())
    return this._checkedTweetsSet
  },

  getWaitingTweets(): string[] {
    return this.getValue('waitingTweets', [])
  },

  /**
   * 待機中ツイートIDのSetを取得（キャッシュ付き）
   * O(1)ルックアップのための最適化
   */
  getWaitingTweetsSet(): Set<string> {
    this._waitingTweetsSet ??= new Set(this.getWaitingTweets())
    return this._waitingTweetsSet
  },

  getSavedTweets() {
    return this.getValue('savedTweets', [])
  },

  /**
   * 保存済みツイートのMapを取得（キャッシュ付き）
   * O(1)ルックアップと更新のための最適化
   */
  getSavedTweetsMap(): Map<string, Tweet> {
    this._savedTweetsMap ??= new Map(
      this.getSavedTweets().map((tweet) => [tweet.tweetId, tweet])
    )
    return this._savedTweetsMap
  },

  isLoginNotified(): boolean {
    return this.getValue('isLoginNotified', false)
  },

  isLockedNotified(): boolean {
    return this.getValue('isLockedNotified', false)
  },

  getRetryCount(): number {
    return this.getValue('retryCount', 0)
  },

  setCheckedTweets(tweets: string[]): void {
    this.setValue('checkedTweets', tweets)
    // キャッシュを更新
    this._checkedTweetsSet = new Set(tweets)
  },

  setWaitingTweets(tweets: string[]): void {
    this.setValue('waitingTweets', tweets)
    // キャッシュを更新
    this._waitingTweetsSet = new Set(tweets)
  },

  setSavedTweets(tweets: StorageData['savedTweets']): void {
    this.setValue('savedTweets', tweets)
    // キャッシュを更新
    this._savedTweetsMap = new Map(
      tweets.map((tweet) => [tweet.tweetId, tweet])
    )
  },

  setLoginNotified(value: boolean): void {
    this.setValue('isLoginNotified', value)
  },

  setLockedNotified(value: boolean): void {
    this.setValue('isLockedNotified', value)
  },

  setRetryCount(count: number): void {
    this.setValue('retryCount', count)
  },

  getStoredVersion(): string {
    return this.getValue('storedVersion', '')
  },

  setStoredVersion(version: string): void {
    this.setValue('storedVersion', version)
  },

  /**
   * キャッシュをクリア（主にテスト用）
   */
  clearCache(): void {
    this._checkedTweetsSet = null
    this._waitingTweetsSet = null
    this._savedTweetsMap = null
  },

  /**
   * バッチ処理: 複数のツイートIDを一度にチェック済みに追加
   * @param tweetIds - 追加するツイートIDの配列
   */
  addCheckedTweetsBatch(tweetIds: string[]): void {
    const checkedTweetsSet = this.getCheckedTweetsSet()
    for (const tweetId of tweetIds) {
      checkedTweetsSet.add(tweetId)
    }
    this.setCheckedTweets([...checkedTweetsSet])
  },

  /**
   * バッチ処理: 複数のツイートIDを一度に待機中に追加
   * @param tweetIds - 追加するツイートIDの配列
   */
  addWaitingTweetsBatch(tweetIds: string[]): void {
    const waitingTweetsSet = this.getWaitingTweetsSet()
    for (const tweetId of tweetIds) {
      waitingTweetsSet.add(tweetId)
    }
    this.setWaitingTweets([...waitingTweetsSet])
  },

  /**
   * バッチ処理: 複数のツイートを一度に保存
   * @param tweets - 保存するツイートの配列
   */
  saveTweetsBatch(tweets: Tweet[]): void {
    const savedTweetsMap = this.getSavedTweetsMap()
    for (const tweet of tweets) {
      savedTweetsMap.set(tweet.tweetId, tweet)
    }
    this.setSavedTweets([...savedTweetsMap.values()])
  },

  /**
   * 特定のツイートIDがチェック済みか待機中かを一度にチェック
   * @param tweetId - チェックするツイートID
   * @returns {チェック済み: boolean, 待機中: boolean}
   */
  getTweetStatus(tweetId: string): { isChecked: boolean; isWaiting: boolean } {
    return {
      isChecked: this.getCheckedTweetsSet().has(tweetId),
      isWaiting: this.getWaitingTweetsSet().has(tweetId),
    }
  },

  /**
   * 保存済みツイートから特定のIDで検索
   * @param tweetId - 検索するツイートID
   * @returns ツイートオブジェクトまたはundefined
   */
  getSavedTweetById(tweetId: string): Tweet | undefined {
    return this.getSavedTweetsMap().get(tweetId)
  },

  /**
   * ストレージの統計情報を取得
   * @returns ストレージの統計情報
   */
  getStorageStats(): {
    checkedTweetsCount: number
    waitingTweetsCount: number
    savedTweetsCount: number
    memoryUsage: {
      checkedTweetsSetSize: number
      waitingTweetsSetSize: number
      savedTweetsMapSize: number
    }
  } {
    return {
      checkedTweetsCount: this.getCheckedTweetsSet().size,
      waitingTweetsCount: this.getWaitingTweetsSet().size,
      savedTweetsCount: this.getSavedTweetsMap().size,
      memoryUsage: {
        checkedTweetsSetSize: this._checkedTweetsSet?.size ?? 0,
        waitingTweetsSetSize: this._waitingTweetsSet?.size ?? 0,
        savedTweetsMapSize: this._savedTweetsMap?.size ?? 0,
      },
    }
  },
}
