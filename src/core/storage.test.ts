import { Storage } from './storage'
import type { Tweet } from '../types'
import { clearMockStorage } from '../__mocks__/userscript'

// Import mock before the module under test
import '../__mocks__/userscript'

describe('Storage', () => {
  beforeEach(() => {
    clearMockStorage()
    jest.clearAllMocks()
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
})
