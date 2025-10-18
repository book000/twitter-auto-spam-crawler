import type { StorageData, StorageKey, Tweet } from '../../types'

/**
 * Storage mock for testing
 * Provides both legacy array-based methods and optimized Set/Map methods
 */
interface MockStorage {
  _checkedTweetsSet: Set<string> | null
  _waitingTweetsSet: Set<string> | null
  _savedTweetsMap: Map<string, Tweet> | null
  getValue: jest.MockedFunction<
    <K extends StorageKey>(
      key: K,
      defaultValue: StorageData[K]
    ) => StorageData[K]
  >
  setValue: jest.MockedFunction<
    <K extends StorageKey>(key: K, value: StorageData[K]) => void
  >
  getCheckedTweets: jest.MockedFunction<() => string[]>
  getWaitingTweets: jest.MockedFunction<() => string[]>
  getSavedTweets: jest.MockedFunction<() => Tweet[]>
  isLoginNotified: jest.MockedFunction<() => boolean>
  isLockedNotified: jest.MockedFunction<() => boolean>
  getRetryCount: jest.MockedFunction<() => number>
  setCheckedTweets: jest.MockedFunction<(tweets: string[]) => void>
  setWaitingTweets: jest.MockedFunction<(tweets: string[]) => void>
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
  addCheckedTweetsBatch: jest.MockedFunction<(tweetIds: string[]) => void>
  addWaitingTweetsBatch: jest.MockedFunction<(tweetIds: string[]) => void>
  saveTweetsBatch: jest.MockedFunction<(tweets: Tweet[]) => void>
  getTweetStatus: jest.MockedFunction<
    (tweetId: string) => { isChecked: boolean; isWaiting: boolean }
  >
  getSavedTweetById: jest.MockedFunction<(tweetId: string) => Tweet | undefined>
  getStorageStats: jest.MockedFunction<() => any>
}

const mockStorage: MockStorage = {
  _checkedTweetsSet: null,
  _waitingTweetsSet: null,
  _savedTweetsMap: null,

  getValue: jest.fn(
    <K extends StorageKey>(key: K, defaultValue: StorageData[K]) => {
      return GM_getValue(key, defaultValue)
    }
  ) as jest.MockedFunction<
    <K extends StorageKey>(
      key: K,
      defaultValue: StorageData[K]
    ) => StorageData[K]
  >,

  setValue: jest.fn(<K extends StorageKey>(key: K, value: StorageData[K]) => {
    GM_setValue(key, value)
  }) as jest.MockedFunction<
    <K extends StorageKey>(key: K, value: StorageData[K]) => void
  >,

  getCheckedTweets: jest.fn((): string[] => {
    return GM_getValue('checkedTweets', [])
  }),

  getWaitingTweets: jest.fn((): string[] => {
    return GM_getValue('waitingTweets', [])
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

  setCheckedTweets: jest.fn((tweets: string[]): void => {
    GM_setValue('checkedTweets', tweets)
    mockStorage._checkedTweetsSet = new Set(tweets)
  }),

  setWaitingTweets: jest.fn((tweets: string[]): void => {
    GM_setValue('waitingTweets', tweets)
    mockStorage._waitingTweetsSet = new Set(tweets)
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

  // New optimized methods
  getCheckedTweetsSet: jest.fn((): Set<string> => {
    mockStorage._checkedTweetsSet ??= new Set(mockStorage.getCheckedTweets())
    return mockStorage._checkedTweetsSet
  }),

  getWaitingTweetsSet: jest.fn((): Set<string> => {
    mockStorage._waitingTweetsSet ??= new Set(mockStorage.getWaitingTweets())
    return mockStorage._waitingTweetsSet
  }),

  getSavedTweetsMap: jest.fn((): Map<string, Tweet> => {
    mockStorage._savedTweetsMap ??= new Map(
      mockStorage.getSavedTweets().map((tweet: Tweet) => [tweet.tweetId, tweet])
    )
    return mockStorage._savedTweetsMap
  }),

  clearCache: jest.fn((): void => {
    mockStorage._checkedTweetsSet = null
    mockStorage._waitingTweetsSet = null
    mockStorage._savedTweetsMap = null
  }),

  addCheckedTweetsBatch: jest.fn((tweetIds: string[]): void => {
    const checkedTweetsSet = mockStorage.getCheckedTweetsSet()
    for (const tweetId of tweetIds) {
      checkedTweetsSet.add(tweetId)
    }
    mockStorage.setCheckedTweets([...checkedTweetsSet])
  }),

  addWaitingTweetsBatch: jest.fn((tweetIds: string[]): void => {
    const waitingTweetsSet = mockStorage.getWaitingTweetsSet()
    for (const tweetId of tweetIds) {
      waitingTweetsSet.add(tweetId)
    }
    mockStorage.setWaitingTweets([...waitingTweetsSet])
  }),

  saveTweetsBatch: jest.fn((tweets: Tweet[]): void => {
    const savedTweetsMap = mockStorage.getSavedTweetsMap()
    for (const tweet of tweets) {
      savedTweetsMap.set(tweet.tweetId, tweet)
    }
    const sortedTweets = [...savedTweetsMap.values()].toSorted((a, b) =>
      a.tweetId.localeCompare(b.tweetId)
    )
    mockStorage.setSavedTweets(sortedTweets)
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
        checkedTweetsSetSize: mockStorage._checkedTweetsSet?.size ?? 0,
        waitingTweetsSetSize: mockStorage._waitingTweetsSet?.size ?? 0,
        savedTweetsMapSize: mockStorage._savedTweetsMap?.size ?? 0,
      },
    }
  }),
}

export const Storage = mockStorage
