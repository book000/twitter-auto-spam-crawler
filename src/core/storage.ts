import type { StorageData, StorageKey } from '@/types'

/**
 * ユーザースクリプトGM_getValue/GM_setValue APIを使用したタイプセーフなストレージ抽象化層。
 * ツイートデータとアプリケーション状態のための強力に型付けされた永続ストレージアクセスを提供。
 */
export const Storage = {
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

  getWaitingTweets(): string[] {
    return this.getValue('waitingTweets', [])
  },

  getSavedTweets() {
    return this.getValue('savedTweets', [])
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
  },

  setWaitingTweets(tweets: string[]): void {
    this.setValue('waitingTweets', tweets)
  },

  setSavedTweets(tweets: StorageData['savedTweets']): void {
    this.setValue('savedTweets', tweets)
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
}
