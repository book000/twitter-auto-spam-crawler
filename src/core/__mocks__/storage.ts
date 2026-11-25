import type { StorageData, StorageKey, Tweet } from '../../types'

/**
 * Jest mock of `Storage` that delegates to the GM_getValue / GM_setValue
 * globals and mirrors the queue snapshots and saved-tweet cache.
 */
interface MockStorage {
  _savedTweetsMap: Map<string, Tweet> | null
  /** Generic so that the value type follows the key, as in `Storage`. */
  getValue<K extends StorageKey>(
    key: K,
    defaultValue: StorageData[K]
  ): StorageData[K]
  /** Generic so that the value type follows the key, as in `Storage`. */
  setValue<K extends StorageKey>(key: K, value: StorageData[K]): void
  getCheckedTweets: jest.MockedFunction<() => string[]>
  getWaitingTweets: jest.MockedFunction<() => string[]>
  getSavedTweets: jest.MockedFunction<() => Tweet[]>
  isLoginNotified: jest.MockedFunction<() => boolean>
  isLockedNotified: jest.MockedFunction<() => boolean>
  getRetryCount: jest.MockedFunction<() => number>
  addCheckedTweet: jest.MockedFunction<(tweetId: string) => void>
  addWaitingTweets: jest.MockedFunction<(tweetIds: string[]) => void>
  resetWaitingTweets: jest.MockedFunction<() => void>
  setSavedTweets: jest.MockedFunction<
    (tweets: StorageData['savedTweets']) => void
  >
  setLoginNotified: jest.MockedFunction<(value: boolean) => void>
  setLockedNotified: jest.MockedFunction<(value: boolean) => void>
  setRetryCount: jest.MockedFunction<(count: number) => void>
  getStoredVersion: jest.MockedFunction<() => string>
  setStoredVersion: jest.MockedFunction<(version: string) => void>
  getCheckedTweetsSet: jest.MockedFunction<() => Set<string>>
  getWaitingTweetsSet: jest.MockedFunction<() => Set<string>>
  getSavedTweetsMap: jest.MockedFunction<() => Map<string, Tweet>>
  clearCache: jest.MockedFunction<() => void>
  getTweetStatus: jest.MockedFunction<
    (tweetId: string) => { isChecked: boolean; isWaiting: boolean }
  >
  getSavedTweetById: jest.MockedFunction<(tweetId: string) => Tweet | undefined>
  getStorageStats: jest.MockedFunction<() => any>
}

const actualStorage =
  jest.requireActual<typeof import('../storage')>('../storage').Storage

const mockStorage: MockStorage = {
  _savedTweetsMap: null,

  getValue: jest.fn(
    <K extends StorageKey>(
      key: K,
      defaultValue: StorageData[K]
    ): StorageData[K] => {
      return GM_getValue(key, defaultValue)
    }
  ) as MockStorage['getValue'],

  setValue: jest.fn(
    <K extends StorageKey>(key: K, value: StorageData[K]): void => {
      GM_setValue(key, value)
    }
  ) as MockStorage['setValue'],

  getCheckedTweets: jest.fn((): string[] => {
    return actualStorage.getCheckedTweets()
  }),

  getWaitingTweets: jest.fn((): string[] => {
    return actualStorage.getWaitingTweets()
  }),

  getSavedTweets: jest.fn(() => {
    return GM_getValue('savedTweets', [])
  }),

  isLoginNotified: jest.fn((): boolean => {
    return GM_getValue('isLoginNotified', false)
  }),

  isLockedNotified: jest.fn((): boolean => {
    return GM_getValue('isLockedNotified', false)
  }),

  getRetryCount: jest.fn((): number => {
    return GM_getValue('retryCount', 0)
  }),

  addCheckedTweet: jest.fn((tweetId: string): void => {
    actualStorage.addCheckedTweet(tweetId)
  }),

  addWaitingTweets: jest.fn((tweetIds: string[]): void => {
    actualStorage.addWaitingTweets(tweetIds)
  }),

  resetWaitingTweets: jest.fn((): void => {
    actualStorage.resetWaitingTweets()
  }),

  setSavedTweets: jest.fn((tweets: StorageData['savedTweets']): void => {
    GM_setValue('savedTweets', tweets)
    mockStorage._savedTweetsMap = new Map(
      tweets.map((tweet: Tweet) => [tweet.tweetId, tweet])
    )
  }),

  setLoginNotified: jest.fn((value: boolean): void => {
    GM_setValue('isLoginNotified', value)
  }),

  setLockedNotified: jest.fn((value: boolean): void => {
    GM_setValue('isLockedNotified', value)
  }),

  setRetryCount: jest.fn((count: number): void => {
    GM_setValue('retryCount', count)
  }),

  getStoredVersion: jest.fn((): string => {
    return GM_getValue('storedVersion', '')
  }),

  setStoredVersion: jest.fn((version: string): void => {
    GM_setValue('storedVersion', version)
  }),

  getCheckedTweetsSet: jest.fn((): Set<string> => {
    return new Set(mockStorage.getCheckedTweets())
  }),

  getWaitingTweetsSet: jest.fn((): Set<string> => {
    return new Set(mockStorage.getWaitingTweets())
  }),

  getSavedTweetsMap: jest.fn((): Map<string, Tweet> => {
    mockStorage._savedTweetsMap ??= new Map(
      mockStorage.getSavedTweets().map((tweet: Tweet) => [tweet.tweetId, tweet])
    )
    return mockStorage._savedTweetsMap
  }),

  clearCache: jest.fn((): void => {
    mockStorage._savedTweetsMap = null
  }),

  getTweetStatus: jest.fn(
    (tweetId: string): { isChecked: boolean; isWaiting: boolean } => {
      return {
        isChecked: mockStorage.getCheckedTweetsSet().has(tweetId),
        isWaiting: mockStorage.getWaitingTweetsSet().has(tweetId),
      }
    }
  ),

  getSavedTweetById: jest.fn((tweetId: string): Tweet | undefined => {
    return mockStorage.getSavedTweetsMap().get(tweetId)
  }),

  getStorageStats: jest.fn(() => {
    return {
      checkedTweetsCount: mockStorage.getCheckedTweetsSet().size,
      waitingTweetsCount: mockStorage.getWaitingTweetsSet().size,
      savedTweetsCount: mockStorage.getSavedTweetsMap().size,
      memoryUsage: {
        checkedTweetsSetSize: mockStorage.getCheckedTweetsSet().size,
        waitingTweetsSetSize: mockStorage.getWaitingTweetsSet().size,
        savedTweetsMapSize: mockStorage._savedTweetsMap?.size ?? 0,
      },
    }
  }),
}

export const Storage = mockStorage
