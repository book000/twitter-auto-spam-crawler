import type { StorageData, StorageKey, Tweet } from '@/types'

/**
 * ユーザースクリプトGM_getValue/GM_setValue APIを使用したタイプセーフなストレージ抽象化層。
 * ツイートデータとアプリケーション状態のための強力に型付けされた永続ストレージアクセスを提供。
 *
 * パフォーマンス最適化:
 * - チェック済み/待機中ツイートIDにSetを使用してO(1)ルックアップを実現
 * - 保存済みツイートにMapを使用して効率的な更新を実現
 */
export class Storage {
  /** チェック済みツイートIDのキャッシュ */
  private static _checkedTweetsSet: Set<string> | null = null
  /** 待機中ツイートIDのキャッシュ */
  private static _waitingTweetsSet: Set<string> | null = null
  /** 保存済みツイートのキャッシュ */
  private static _savedTweetsMap: Map<string, Tweet> | null = null

  /**
   * ストレージから値を取得する
   *
   * @param key - 取得するキー
   * @param defaultValue - デフォルト値
   * @returns 取得した値
   */
  static getValue<K extends StorageKey>(
    key: K,
    defaultValue: StorageData[K]
  ): StorageData[K] {
    return GM_getValue(key, defaultValue)
  }

  /**
   * ストレージに値を保存する
   *
   * @param key - 保存するキー
   * @param value - 保存する値
   */
  static setValue<K extends StorageKey>(key: K, value: StorageData[K]): void {
    GM_setValue(key, value)
  }

  /**
   * チェック済みツイートIDの配列を取得する
   *
   * @returns チェック済みツイートIDの配列
   */
  static getCheckedTweets(): string[] {
    return Storage.getValue('checkedTweets', [])
  }

  /**
   * チェック済みツイートIDのSetを取得（キャッシュ付き）
   * O(1)ルックアップのための最適化
   *
   * @returns チェック済みツイートIDのSet
   */
  static getCheckedTweetsSet(): Set<string> {
    Storage._checkedTweetsSet ??= new Set(Storage.getCheckedTweets())
    return Storage._checkedTweetsSet
  }

  /**
   * 待機中ツイートIDの配列を取得する
   *
   * @returns 待機中ツイートIDの配列
   */
  static getWaitingTweets(): string[] {
    return Storage.getValue('waitingTweets', [])
  }

  /**
   * 待機中ツイートIDのSetを取得（キャッシュ付き）
   * O(1)ルックアップのための最適化
   *
   * @returns 待機中ツイートIDのSet
   */
  static getWaitingTweetsSet(): Set<string> {
    Storage._waitingTweetsSet ??= new Set(Storage.getWaitingTweets())
    return Storage._waitingTweetsSet
  }

  /**
   * 保存済みツイートの配列を取得する
   *
   * @returns 保存済みツイートの配列
   */
  static getSavedTweets() {
    return Storage.getValue('savedTweets', [])
  }

  /**
   * 保存済みツイートのMapを取得（キャッシュ付き）
   * O(1)ルックアップと更新のための最適化
   *
   * @returns 保存済みツイートのMap（キー: tweetId）
   */
  static getSavedTweetsMap(): Map<string, Tweet> {
    Storage._savedTweetsMap ??= new Map(
      Storage.getSavedTweets().map((tweet) => [tweet.tweetId, tweet])
    )
    return Storage._savedTweetsMap
  }

  /**
   * ログイン通知済みかどうかを取得する
   *
   * @returns ログイン通知済みの場合 true
   */
  static isLoginNotified(): boolean {
    return Storage.getValue('isLoginNotified', false)
  }

  /**
   * ロック通知済みかどうかを取得する
   *
   * @returns ロック通知済みの場合 true
   */
  static isLockedNotified(): boolean {
    return Storage.getValue('isLockedNotified', false)
  }

  /**
   * リトライ回数を取得する
   *
   * @returns 現在のリトライ回数
   */
  static getRetryCount(): number {
    return Storage.getValue('retryCount', 0)
  }

  /**
   * チェック済みツイートIDの配列を保存する
   *
   * @param tweets - 保存するツイートIDの配列
   */
  static setCheckedTweets(tweets: string[]): void {
    Storage.setValue('checkedTweets', tweets)
    // キャッシュを更新
    Storage._checkedTweetsSet = new Set(tweets)
  }

  /**
   * 待機中ツイートIDの配列を保存する
   *
   * @param tweets - 保存するツイートIDの配列
   */
  static setWaitingTweets(tweets: string[]): void {
    Storage.setValue('waitingTweets', tweets)
    // キャッシュを更新
    Storage._waitingTweetsSet = new Set(tweets)
  }

  /**
   * 保存済みツイートの配列を保存する
   *
   * @param tweets - 保存するツイートの配列
   */
  static setSavedTweets(tweets: StorageData['savedTweets']): void {
    Storage.setValue('savedTweets', tweets)
    // キャッシュを更新
    Storage._savedTweetsMap = new Map(
      tweets.map((tweet) => [tweet.tweetId, tweet])
    )
  }

  /**
   * ログイン通知済みフラグを保存する
   *
   * @param value - 保存する値
   */
  static setLoginNotified(value: boolean): void {
    Storage.setValue('isLoginNotified', value)
  }

  /**
   * ロック通知済みフラグを保存する
   *
   * @param value - 保存する値
   */
  static setLockedNotified(value: boolean): void {
    Storage.setValue('isLockedNotified', value)
  }

  /**
   * リトライ回数を保存する
   *
   * @param count - 保存するリトライ回数
   */
  static setRetryCount(count: number): void {
    Storage.setValue('retryCount', count)
  }

  /**
   * 保存済みバージョンを取得する
   *
   * @returns 保存済みバージョン文字列
   */
  static getStoredVersion(): string {
    return Storage.getValue('storedVersion', '')
  }

  /**
   * バージョンを保存する
   *
   * @param version - 保存するバージョン文字列
   */
  static setStoredVersion(version: string): void {
    Storage.setValue('storedVersion', version)
  }

  /**
   * キャッシュをクリア（主にテスト用）
   */
  static clearCache(): void {
    Storage._checkedTweetsSet = null
    Storage._waitingTweetsSet = null
    Storage._savedTweetsMap = null
  }

  /**
   * バッチ処理: 複数のツイートIDを一度にチェック済みに追加
   *
   * @param tweetIds - 追加するツイートIDの配列
   */
  static addCheckedTweetsBatch(tweetIds: string[]): void {
    const checkedTweetsSet = Storage.getCheckedTweetsSet()
    for (const tweetId of tweetIds) {
      checkedTweetsSet.add(tweetId)
    }
    Storage.setCheckedTweets([...checkedTweetsSet])
  }

  /**
   * バッチ処理: 複数のツイートIDを一度に待機中に追加
   *
   * @param tweetIds - 追加するツイートIDの配列
   */
  static addWaitingTweetsBatch(tweetIds: string[]): void {
    const waitingTweetsSet = Storage.getWaitingTweetsSet()
    for (const tweetId of tweetIds) {
      waitingTweetsSet.add(tweetId)
    }
    Storage.setWaitingTweets([...waitingTweetsSet])
  }

  /**
   * バッチ処理: 複数のツイートを一度に保存
   *
   * @param tweets - 保存するツイートの配列
   */
  static saveTweetsBatch(tweets: Tweet[]): void {
    const savedTweetsMap = Storage.getSavedTweetsMap()
    for (const tweet of tweets) {
      savedTweetsMap.set(tweet.tweetId, tweet)
    }
    const sortedTweets = savedTweetsMap
      .values()
      .toArray()
      .toSorted((a, b) => a.tweetId.localeCompare(b.tweetId))
    Storage.setSavedTweets(sortedTweets)
  }

  /**
   * 特定のツイートIDがチェック済みか待機中かを一度にチェック
   *
   * @param tweetId - チェックするツイートID
   * @returns チェック済みと待機中の状態を含むオブジェクト
   */
  static getTweetStatus(tweetId: string): {
    isChecked: boolean
    isWaiting: boolean
  } {
    return {
      isChecked: Storage.getCheckedTweetsSet().has(tweetId),
      isWaiting: Storage.getWaitingTweetsSet().has(tweetId),
    }
  }

  /**
   * 保存済みツイートから特定のIDで検索
   *
   * @param tweetId - 検索するツイートID
   * @returns ツイートオブジェクトまたはundefined
   */
  static getSavedTweetById(tweetId: string): Tweet | undefined {
    return Storage.getSavedTweetsMap().get(tweetId)
  }

  /**
   * ストレージの統計情報を取得
   *
   * @returns ストレージの統計情報（件数とメモリ使用状況）
   */
  static getStorageStats(): {
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
      checkedTweetsCount: Storage.getCheckedTweetsSet().size,
      waitingTweetsCount: Storage.getWaitingTweetsSet().size,
      savedTweetsCount: Storage.getSavedTweetsMap().size,
      memoryUsage: {
        checkedTweetsSetSize: Storage._checkedTweetsSet?.size ?? 0,
        waitingTweetsSetSize: Storage._waitingTweetsSet?.size ?? 0,
        savedTweetsMapSize: Storage._savedTweetsMap?.size ?? 0,
      },
    }
  }
}
