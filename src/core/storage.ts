import type { StorageData, StorageKey, Tweet } from '@/types'

interface WaitingTweetOrder {
  queuedAt: number
  sequence: number
}

const CHECKED_TWEET_PREFIX = 'queue:checked:'
const WAITING_TWEET_PREFIX = 'queue:waiting:'

/**
 * Persists queue mutations per tweet so independent contexts never replace a
 * shared collection. Queue reads are fresh snapshots; legacy arrays remain
 * readable without a migration that could race with another context.
 */
export class Storage {
  private static _queueSequence = 0
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

  /** Reads legacy checked IDs together with per-tweet checked records. */
  static getCheckedTweets(): string[] {
    const tweets = new Set(Storage.getValue('checkedTweets', []))
    for (const key of GM_listValues()) {
      if (
        key.startsWith(CHECKED_TWEET_PREFIX) &&
        GM_getValue<boolean>(key, false)
      ) {
        tweets.add(key.slice(CHECKED_TWEET_PREFIX.length))
      }
    }
    return [...tweets]
  }

  /** Returns a fresh snapshot, including changes made by other contexts. */
  static getCheckedTweetsSet(): Set<string> {
    return new Set(Storage.getCheckedTweets())
  }

  /** Reads waiting IDs in enqueue order, excluding checked or reset IDs. */
  static getWaitingTweets(): string[] {
    const tweets = new Map<string, WaitingTweetOrder>(
      Storage.getValue('waitingTweets', []).map((tweetId, sequence) => [
        tweetId,
        { queuedAt: 0, sequence },
      ])
    )
    for (const key of GM_listValues()) {
      if (!key.startsWith(WAITING_TWEET_PREFIX)) continue
      const tweetId = key.slice(WAITING_TWEET_PREFIX.length)
      const order = GM_getValue<WaitingTweetOrder | false>(key, false)
      if (order) {
        tweets.set(tweetId, order)
      } else {
        tweets.delete(tweetId)
      }
    }
    const checked = new Set(Storage.getValue('checkedTweets', []))
    return [...tweets]
      .filter(
        ([tweetId]) =>
          !checked.has(tweetId) &&
          !GM_getValue<boolean>(CHECKED_TWEET_PREFIX + tweetId, false)
      )
      .toSorted(
        ([firstId, first], [secondId, second]) =>
          first.queuedAt - second.queuedAt ||
          first.sequence - second.sequence ||
          firstId.localeCompare(secondId)
      )
      .map(([tweetId]) => tweetId)
  }

  /** Returns a fresh snapshot, including changes made by other contexts. */
  static getWaitingTweetsSet(): Set<string> {
    return new Set(Storage.getWaitingTweets())
  }

  /** Adds only the supplied IDs without replacing another context's records. */
  static addWaitingTweets(tweetIds: string[]): void {
    for (const tweetId of tweetIds) {
      const status = Storage.getTweetStatus(tweetId)
      if (status.isWaiting || status.isChecked) {
        continue
      }
      GM_setValue(WAITING_TWEET_PREFIX + tweetId, {
        queuedAt: Date.now(),
        sequence: Storage._queueSequence++,
      } satisfies WaitingTweetOrder)
    }
  }

  /** Marks one ID as checked; checked records always win over waiting records. */
  static addCheckedTweet(tweetId: string): void {
    GM_setValue(CHECKED_TWEET_PREFIX + tweetId, true)
    GM_setValue(WAITING_TWEET_PREFIX + tweetId, false)
  }

  /** Clears the observed waiting IDs while preserving unrelated concurrent adds. */
  static resetWaitingTweets(): void {
    for (const tweetId of Storage.getWaitingTweets()) {
      // Keep tombstones so legacy queue entries cannot reappear on reload.
      GM_setValue(WAITING_TWEET_PREFIX + tweetId, false)
    }
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

  /** Whether the login-required notification was accepted by Discord. */
  static isLoginNotified(): boolean {
    return Storage.getValue('isLoginNotified', false)
  }

  /**
   * Whether the account-locked notification has been requested. It is set
   * before the notify window opens and is cleared by
   * `ExamplePages.runLockedNotify` if sending fails.
   */
  static isLockedNotified(): boolean {
    return Storage.getValue('isLockedNotified', false)
  }

  static getRetryCount(): number {
    return Storage.getValue('retryCount', 0)
  }

  /** Replaces the saved tweets in storage and refreshes the cache. */
  static setSavedTweets(tweets: StorageData['savedTweets']): void {
    Storage.setValue('savedTweets', tweets)
    Storage._savedTweetsMap = new Map(
      tweets.map((tweet) => [tweet.tweetId, tweet])
    )
  }

  /** Stores whether the login-required notification was accepted by Discord. */
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

  /** Drops the saved-tweet cache so it reloads from storage (for tests). */
  static clearCache(): void {
    Storage._savedTweetsMap = null
  }

  /** Reads one ID directly, with legacy fallback and checked precedence. */
  static getTweetStatus(tweetId: string): {
    isChecked: boolean
    isWaiting: boolean
  } {
    const isChecked =
      GM_getValue<boolean>(CHECKED_TWEET_PREFIX + tweetId, false) ||
      Storage.getValue('checkedTweets', []).includes(tweetId)
    const waiting = GM_getValue<WaitingTweetOrder | false | null>(
      WAITING_TWEET_PREFIX + tweetId,
      null
    )
    return {
      isChecked,
      isWaiting:
        !isChecked &&
        (waiting === null
          ? Storage.getValue('waitingTweets', []).includes(tweetId)
          : waiting !== false),
    }
  }

  /** Finds a saved tweet by ID, or `undefined` if it is not saved. */
  static getSavedTweetById(tweetId: string): Tweet | undefined {
    return Storage.getSavedTweetsMap().get(tweetId)
  }

  /**
   * Gets the number of checked, waiting and saved tweets, plus the sizes of the
   * queue snapshots and saved-tweet cache.
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
    const checked = Storage.getCheckedTweetsSet()
    const waiting = Storage.getWaitingTweetsSet()
    return {
      checkedTweetsCount: checked.size,
      waitingTweetsCount: waiting.size,
      savedTweetsCount: Storage.getSavedTweetsMap().size,
      memoryUsage: {
        checkedTweetsSetSize: checked.size,
        waitingTweetsSetSize: waiting.size,
        savedTweetsMapSize: Storage._savedTweetsMap?.size ?? 0,
      },
    }
  }
}
