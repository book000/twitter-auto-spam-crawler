import { QueueService } from '../../services/queue-service'
import { Storage } from '../../core/storage'
import { clearMockStorage } from '../../__mocks__/userscript'

// Import mock before the module under test
import '../../__mocks__/userscript'

// Mock timers
jest.useFakeTimers()

describe('QueueService', () => {
  beforeEach(() => {
    clearMockStorage()
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  afterEach(() => {
    // Only run pending timers if fake timers are active
    try {
      jest.runOnlyPendingTimers()
    } catch {
      // Ignore timer errors - fake timers may not be active
    }
    jest.useRealTimers()
  })

  describe('isCheckedTweet', () => {
    it('should return true if tweet is in checked tweets', () => {
      jest
        .spyOn(Storage, 'getCheckedTweets')
        .mockReturnValue(['tweet1', 'tweet2'])

      const result = QueueService.isCheckedTweet('tweet1')
      expect(result).toBe(true)
    })

    it('should return false if tweet is not in checked tweets', () => {
      jest
        .spyOn(Storage, 'getCheckedTweets')
        .mockReturnValue(['tweet1', 'tweet2'])

      const result = QueueService.isCheckedTweet('tweet3')
      expect(result).toBe(false)
    })

    it('should return false for empty checked tweets list', () => {
      jest.spyOn(Storage, 'getCheckedTweets').mockReturnValue([])

      const result = QueueService.isCheckedTweet('tweet1')
      expect(result).toBe(false)
    })
  })

  describe('isWaitingTweet', () => {
    it('should return true if tweet is in waiting tweets', () => {
      jest
        .spyOn(Storage, 'getWaitingTweets')
        .mockReturnValue(['waiting1', 'waiting2'])

      const result = QueueService.isWaitingTweet('waiting1')
      expect(result).toBe(true)
    })

    it('should return false if tweet is not in waiting tweets', () => {
      jest
        .spyOn(Storage, 'getWaitingTweets')
        .mockReturnValue(['waiting1', 'waiting2'])

      const result = QueueService.isWaitingTweet('waiting3')
      expect(result).toBe(false)
    })

    it('should return false for empty waiting tweets list', () => {
      jest.spyOn(Storage, 'getWaitingTweets').mockReturnValue([])

      const result = QueueService.isWaitingTweet('waiting1')
      expect(result).toBe(false)
    })
  })

  describe('addWaitingTweets', () => {
    it('should add tweets to waiting list', async () => {
      const existingTweets = ['existing1', 'existing2']
      const newTweets = ['new1', 'new2']
      const setWaitingTweetsSpy = jest.spyOn(Storage, 'setWaitingTweets')

      jest.spyOn(Storage, 'getWaitingTweets').mockReturnValue(existingTweets)

      const promise = QueueService.addWaitingTweets(newTweets)

      expect(setWaitingTweetsSpy).toHaveBeenCalledWith([
        'existing1',
        'existing2',
        'new1',
        'new2',
      ])

      // Fast-forward timer
      jest.advanceTimersByTime(1000)
      await promise
    })

    it('should handle empty new tweets array', async () => {
      const existingTweets = ['existing1']
      const setWaitingTweetsSpy = jest.spyOn(Storage, 'setWaitingTweets')

      jest.spyOn(Storage, 'getWaitingTweets').mockReturnValue(existingTweets)

      const promise = QueueService.addWaitingTweets([])

      expect(setWaitingTweetsSpy).toHaveBeenCalledWith(['existing1'])

      jest.advanceTimersByTime(1000)
      await promise
    })
  })

  describe('getNextWaitingTweet', () => {
    it('should return first tweet from waiting list', () => {
      jest
        .spyOn(Storage, 'getWaitingTweets')
        .mockReturnValue(['first', 'second', 'third'])

      const result = QueueService.getNextWaitingTweet()
      expect(result).toBe('first')
    })

    it('should return null for empty waiting list', () => {
      jest.spyOn(Storage, 'getWaitingTweets').mockReturnValue([])

      const result = QueueService.getNextWaitingTweet()
      expect(result).toBe(null)
    })
  })

  describe('checkedTweet', () => {
    it('should move tweet from waiting to checked', async () => {
      const tweetId = 'test123'
      const existingChecked = ['checked1']
      const existingWaiting = ['test123', 'waiting2']

      const setCheckedTweetsSpy = jest.spyOn(Storage, 'setCheckedTweets')
      const setWaitingTweetsSpy = jest.spyOn(Storage, 'setWaitingTweets')

      jest.spyOn(Storage, 'getCheckedTweets').mockReturnValue(existingChecked)
      jest.spyOn(Storage, 'getWaitingTweets').mockReturnValue(existingWaiting)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      const promise = QueueService.checkedTweet(tweetId)

      expect(setCheckedTweetsSpy).toHaveBeenCalledWith(['checked1', 'test123'])
      expect(setWaitingTweetsSpy).toHaveBeenCalledWith(['waiting2'])
      expect(consoleSpy).toHaveBeenCalledWith('checkedTweet: test123')

      jest.advanceTimersByTime(1000)
      await promise

      consoleSpy.mockRestore()
    })

    it('should handle tweet not in waiting list', async () => {
      const tweetId = 'notInWaiting'
      const existingChecked = ['checked1']
      const existingWaiting = ['waiting1', 'waiting2']

      const setCheckedTweetsSpy = jest.spyOn(Storage, 'setCheckedTweets')
      const setWaitingTweetsSpy = jest.spyOn(Storage, 'setWaitingTweets')

      jest.spyOn(Storage, 'getCheckedTweets').mockReturnValue(existingChecked)
      jest.spyOn(Storage, 'getWaitingTweets').mockReturnValue(existingWaiting)

      const promise = QueueService.checkedTweet(tweetId)

      expect(setCheckedTweetsSpy).toHaveBeenCalledWith([
        'checked1',
        'notInWaiting',
      ])
      // When tweet is not in waiting list, setWaitingTweets should not be called
      expect(setWaitingTweetsSpy).not.toHaveBeenCalled()

      jest.advanceTimersByTime(1000)
      await promise
    })
  })

  describe('resetWaitingQueue', () => {
    it('should clear waiting tweets list', () => {
      const setWaitingTweetsSpy = jest.spyOn(Storage, 'setWaitingTweets')

      QueueService.resetWaitingQueue()

      expect(setWaitingTweetsSpy).toHaveBeenCalledWith([])
    })
  })
})
