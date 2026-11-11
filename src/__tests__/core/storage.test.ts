import { Storage } from '../../core/storage'
import type { Tweet } from '../../types'
import { clearMockStorage } from '../../__mocks__/userscript'

describe('Storage', () => {
  beforeEach(() => {
    clearMockStorage()
    jest.clearAllMocks()
    Storage.clearCache()
  })

  describe('getValue and setValue', () => {
    it('should get and set values correctly', () => {
      const testValue = ['test1', 'test2']
      Storage.setValue('checkedTweets', testValue)

      expect(GM_setValue).toHaveBeenCalledWith('checkedTweets', testValue)
      ;(GM_getValue as jest.Mock).mockReturnValueOnce(testValue)
      const result = Storage.getValue('checkedTweets', [])

      expect(result).toEqual(testValue)
      expect(GM_getValue).toHaveBeenCalledWith('checkedTweets', [])
    })

    it('should return default value when no value is stored', () => {
      const defaultValue = ['default']
      const result = Storage.getValue('checkedTweets', defaultValue)

      expect(result).toEqual(defaultValue)
      expect(GM_getValue).toHaveBeenCalledWith('checkedTweets', defaultValue)
    })
  })

  describe('getCheckedTweets and setCheckedTweets', () => {
    it('should return empty array by default', () => {
      const result = Storage.getCheckedTweets()
      expect(result).toEqual([])
      expect(GM_getValue).toHaveBeenCalledWith('checkedTweets', [])
    })

    it('should set and get checked tweets', () => {
      const testTweets = ['tweet1', 'tweet2', 'tweet3']
      Storage.setCheckedTweets(testTweets)

      expect(GM_setValue).toHaveBeenCalledWith('checkedTweets', testTweets)
    })
  })

  describe('getWaitingTweets and setWaitingTweets', () => {
    it('should return empty array by default', () => {
      const result = Storage.getWaitingTweets()
      expect(result).toEqual([])
      expect(GM_getValue).toHaveBeenCalledWith('waitingTweets', [])
    })

    it('should set and get waiting tweets', () => {
      const testTweets = ['waiting1', 'waiting2']
      Storage.setWaitingTweets(testTweets)

      expect(GM_setValue).toHaveBeenCalledWith('waitingTweets', testTweets)
    })
  })

  describe('getSavedTweets and setSavedTweets', () => {
    it('should return empty array by default', () => {
      const result = Storage.getSavedTweets()
      expect(result).toEqual([])
      expect(GM_getValue).toHaveBeenCalledWith('savedTweets', [])
    })

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

  describe('isLoginNotified and setLoginNotified', () => {
    it('should return false by default', () => {
      const result = Storage.isLoginNotified()
      expect(result).toBe(false)
      expect(GM_getValue).toHaveBeenCalledWith('isLoginNotified', false)
    })

    it('should set and get login notification status', () => {
      Storage.setLoginNotified(true)

      expect(GM_setValue).toHaveBeenCalledWith('isLoginNotified', true)
    })
  })

  describe('isLockedNotified and setLockedNotified', () => {
    it('should return false by default', () => {
      const result = Storage.isLockedNotified()
      expect(result).toBe(false)
      expect(GM_getValue).toHaveBeenCalledWith('isLockedNotified', false)
    })

    it('should set and get locked notification status', () => {
      Storage.setLockedNotified(true)

      expect(GM_setValue).toHaveBeenCalledWith('isLockedNotified', true)
    })
  })

  describe('getRetryCount and setRetryCount', () => {
    it('should return 0 by default', () => {
      const result = Storage.getRetryCount()
      expect(result).toBe(0)
      expect(GM_getValue).toHaveBeenCalledWith('retryCount', 0)
    })

    it('should set and get retry count', () => {
      Storage.setRetryCount(5)

      expect(GM_setValue).toHaveBeenCalledWith('retryCount', 5)
    })
  })

  describe('Performance Optimizations', () => {
    it('should provide O(1) lookup for checked tweets', () => {
      const testTweets = Array.from({ length: 10_000 }, (_, i) => `tweet${i}`)
      Storage.setCheckedTweets(testTweets)

      const startTime = performance.now()
      const set = Storage.getCheckedTweetsSet()
      const exists = set.has('tweet5000')
      const endTime = performance.now()

      expect(exists).toBe(true)
      expect(endTime - startTime).toBeLessThan(10)
    })

    it('should provide O(1) lookup for waiting tweets', () => {
      const testTweets = Array.from({ length: 10_000 }, (_, i) => `waiting${i}`)
      Storage.setWaitingTweets(testTweets)

      const startTime = performance.now()
      const set = Storage.getWaitingTweetsSet()
      const exists = set.has('waiting7500')
      const endTime = performance.now()

      expect(exists).toBe(true)
      expect(endTime - startTime).toBeLessThan(10)
    })

    it('should provide O(1) lookup for saved tweets', () => {
      const testTweets: Tweet[] = Array.from({ length: 1000 }, (_, i) => ({
        url: `https://x.com/user/status/${i}`,
        tweetText: `Test tweet ${i}`,
        tweetHtml: `<span>Test tweet ${i}</span>`,
        elementHtml: `<article>Element ${i}</article>`,
        screenName: 'testuser',
        tweetId: String(i),
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
      expect(endTime - startTime).toBeLessThan(10)
    })

    it('should handle batch operations efficiently', () => {
      const tweetIds = Array.from({ length: 1000 }, (_, i) => `batch${i}`)

      const startTime = performance.now()
      Storage.addCheckedTweetsBatch(tweetIds)
      const endTime = performance.now()

      const checkedSet = Storage.getCheckedTweetsSet()
      expect(checkedSet.size).toBe(1000)
      expect(checkedSet.has('batch500')).toBe(true)
      expect(endTime - startTime).toBeLessThan(100)
    })

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
      expect(endTime - startTime).toBeLessThan(5)
    })

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
