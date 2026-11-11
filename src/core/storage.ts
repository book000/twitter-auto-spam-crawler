import type { StorageData, StorageKey, Tweet } from '@/types'

/**
 * Typed wrapper around GM_getValue / GM_setValue for the persisted crawler
 * state.
 *
 * The checked and waiting tweet IDs are cached as Sets and the saved tweets as
 * a Map, because they are looked up and updated on every crawl tick. Every
 * setter that writes one of these collections refreshes its cache.
 */
export class Storage {
  /** Cache of the checked tweet IDs */
  private static _checkedTweetsSet: Set<string> | null = null
  /** Cache of the waiting tweet IDs */
  private static _waitingTweetsSet: Set<string> | null = null
  /** Cache of the saved tweets, keyed by tweet ID */
  private static _savedTweetsMap: Map<string, Tweet> | null = null

  /**
   * Reads a value from storage.
   *
   * @param key - Storage key to read
   * @param defaultValue - Value returned when the key is not stored
   */
  static getValue<K extends StorageKey>(
    key: K,
    defaultValue: StorageData[K]
  ): StorageData[K] {
    return GM_getValue(key, defaultValue)
  }

  /**
   * Writes a value to storage.
   *
   * @param key - Storage key to write
   * @param value - Value to store
   */
  static setValue<K extends StorageKey>(key: K, value: StorageData[K]): void {
    GM_setValue(key, value)
  }

  /** Reads the checked tweet IDs from storage, bypassing the cache. */
  static getCheckedTweets(): string[] {
    return Storage.getValue('checkedTweets', [])
  }

  /**
   * Gets the cached Set of checked tweet IDs, loading it from storage on first
   * use.
   *
   * The returned Set is the cache itself: mutations are visible to later
   * callers but are persisted only through a setter.
   */
  static getCheckedTweetsSet(): Set<string> {
    Storage._checkedTweetsSet ??= new Set(Storage.getCheckedTweets())
    return Storage._checkedTweetsSet
  }

  /** Reads the waiting tweet IDs from storage, bypassing the cache. */
  static getWaitingTweets(): string[] {
    return Storage.getValue('waitingTweets', [])
  }

  /**
   * Gets the cached Set of waiting tweet IDs, loading it from storage on first
   * use.
   *
   * The returned Set is the cache itself: mutations are visible to later
   * callers but are persisted only through a setter.
   */
  static getWaitingTweetsSet(): Set<string> {
    Storage._waitingTweetsSet ??= new Set(Storage.getWaitingTweets())
    return Storage._waitingTweetsSet
  }

  /** Reads the saved tweets from storage, bypassing the cache. */
  static getSavedTweets() {
    return Storage.getValue('savedTweets', [])
  }

  /**
   * Gets the cached Map of saved tweets keyed by tweet ID, loading it from
   * storage on first use.
   *
   * The returned Map is the cache itself: mutations are visible to later
   * callers but are persisted only through a setter.
   */
  static getSavedTweetsMap(): Map<string, Tweet> {
    Storage._savedTweetsMap ??= new Map(
      Storage.getSavedTweets().map((tweet) => [tweet.tweetId, tweet])
    )
    return Storage._savedTweetsMap
  }

  /** Whether the login-required notification got a response from Discord. */
  static isLoginNotified(): boolean {
    return Storage.getValue('isLoginNotified', false)
  }

  /**
   * Whether the account-locked notification has been requested. It is set
   * before the notify window opens and is not cleared if sending fails.
   */
  static isLockedNotified(): boolean {
    return Storage.getValue('isLockedNotified', false)
  }

  static getRetryCount(): number {
    return Storage.getValue('retryCount', 0)
  }

  /** Replaces the checked tweet IDs in storage and refreshes the cache. */
  static setCheckedTweets(tweets: string[]): void {
    Storage.setValue('checkedTweets', tweets)
    Storage._checkedTweetsSet = new Set(tweets)
  }

  /** Replaces the waiting tweet IDs in storage and refreshes the cache. */
  static setWaitingTweets(tweets: string[]): void {
    Storage.setValue('waitingTweets', tweets)
    Storage._waitingTweetsSet = new Set(tweets)
  }

  /** Replaces the saved tweets in storage and refreshes the cache. */
  static setSavedTweets(tweets: StorageData['savedTweets']): void {
    Storage.setValue('savedTweets', tweets)
    Storage._savedTweetsMap = new Map(
      tweets.map((tweet) => [tweet.tweetId, tweet])
    )
  }

  /** Stores whether the login-required notification got a response. */
  static setLoginNotified(value: boolean): void {
    Storage.setValue('isLoginNotified', value)
  }

  /** Stores whether the account-locked notification has been requested. */
  static setLockedNotified(value: boolean): void {
    Storage.setValue('isLockedNotified', value)
  }

  static setRetryCount(count: number): void {
    Storage.setValue('retryCount', count)
  }

  /**
   * Gets the script version recorded by the last version check.
   *
   * @returns The version, or an empty string if none has been recorded.
   */
  static getStoredVersion(): string {
    return Storage.getValue('storedVersion', '')
  }

  /** Records the script version for the next version check. */
  static setStoredVersion(version: string): void {
    Storage.setValue('storedVersion', version)
  }

  /** Drops all in-memory caches so they reload from storage (for tests). */
  static clearCache(): void {
    Storage._checkedTweetsSet = null
    Storage._waitingTweetsSet = null
    Storage._savedTweetsMap = null
  }

  /** Looks up whether a tweet ID is in the checked and/or waiting set. */
  static getTweetStatus(tweetId: string): {
    isChecked: boolean
    isWaiting: boolean
  } {
    return {
      isChecked: Storage.getCheckedTweetsSet().has(tweetId),
      isWaiting: Storage.getWaitingTweetsSet().has(tweetId),
    }
  }

  /** Finds a saved tweet by ID, or `undefined` if it is not saved. */
  static getSavedTweetById(tweetId: string): Tweet | undefined {
    return Storage.getSavedTweetsMap().get(tweetId)
  }

  /**
   * Gets the number of checked, waiting and saved tweets, plus the sizes of the
   * in-memory caches.
   *
   * Reading the counts loads any cache that is still empty, so the cache sizes
   * always equal the counts.
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
