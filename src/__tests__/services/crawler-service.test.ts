import { CrawlerService } from '../../services/crawler-service'
import { TweetService } from '../../services/tweet-service'
import { QueueService } from '../../services/queue-service'
import { Storage } from '../../core/storage'
import type { Tweet } from '../../types'

// Mock the dependencies
jest.mock('../../services/tweet-service')
jest.mock('../../services/queue-service')
jest.mock('../../core/storage')

// Mock timers
jest.useFakeTimers()

describe('CrawlerService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    CrawlerService.stopCrawling()
    CrawlerService.resetCrawledTweetCount()
    // Reset all mock implementations
    ;(TweetService.getTweets as jest.Mock).mockReset()
    ;(TweetService.saveTweets as jest.Mock).mockReset()
    ;(TweetService.getTargetTweets as jest.Mock).mockReset()
    ;(QueueService.isCheckedTweet as jest.Mock).mockReset()
    ;(QueueService.isWaitingTweet as jest.Mock).mockReset()
    ;(QueueService.addWaitingTweets as jest.Mock).mockReset()
    ;(Storage.getWaitingTweets as jest.Mock).mockReset()
  })

  afterEach(() => {
    CrawlerService.stopCrawling()
    jest.runOnlyPendingTimers()
  })

  describe('crawlTweets', () => {
    it('should process tweets and add unchecked ones to waiting queue', async () => {
      const mockTweets: Tweet[] = [
        {
          url: 'https://x.com/user1/status/1',
          tweetText: 'Test tweet 1',
          tweetHtml: '<span>Test tweet 1</span>',
          elementHtml: '<article>Test 1</article>',
          screenName: 'user1',
          tweetId: '1',
          replyCount: '15',
          retweetCount: '150',
          likeCount: '500',
        },
        {
          url: 'https://x.com/user2/status/2',
          tweetText: 'Test tweet 2',
          tweetHtml: '<span>Test tweet 2</span>',
          elementHtml: '<article>Test 2</article>',
          screenName: 'user2',
          tweetId: '2',
          replyCount: '20',
          retweetCount: '200',
          likeCount: '600',
        },
      ]

      const mockTargetTweets = mockTweets
      const mockWaitingTweets = ['3', '4']

      ;(TweetService.getTweets as jest.Mock).mockReturnValue(mockTweets)
      ;(TweetService.getTargetTweets as jest.Mock).mockReturnValue(
        mockTargetTweets
      )
      ;(QueueService.isCheckedTweet as jest.Mock).mockReturnValue(false)
      ;(QueueService.isWaitingTweet as jest.Mock).mockReturnValue(false)
      ;(Storage.getWaitingTweets as jest.Mock).mockReturnValue(
        mockWaitingTweets
      )

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      await CrawlerService.crawlTweets()

      expect(TweetService.getTweets).toHaveBeenCalled()
      expect(TweetService.saveTweets).toHaveBeenCalledWith(mockTweets)
      expect(TweetService.getTargetTweets).toHaveBeenCalledWith(mockTweets)
      expect(QueueService.addWaitingTweets).toHaveBeenCalledWith(['1', '2'])
      expect(consoleSpy).toHaveBeenCalledWith(
        'crawlTweets: 2 tweets added to waitingTweets. totalWaitingTweets=2'
      )
      expect(CrawlerService.getCrawledTweetCount()).toBe(2)

      consoleSpy.mockRestore()
    })

    it('should filter out already checked and waiting tweets', async () => {
      const mockTweets: Tweet[] = [
        {
          url: 'https://x.com/user1/status/1',
          tweetText: 'Test tweet 1',
          tweetHtml: '<span>Test tweet 1</span>',
          elementHtml: '<article>Test 1</article>',
          screenName: 'user1',
          tweetId: '1',
          replyCount: '15',
          retweetCount: '150',
          likeCount: '500',
        },
        {
          url: 'https://x.com/user2/status/2',
          tweetText: 'Test tweet 2',
          tweetHtml: '<span>Test tweet 2</span>',
          elementHtml: '<article>Test 2</article>',
          screenName: 'user2',
          tweetId: '2',
          replyCount: '20',
          retweetCount: '200',
          likeCount: '600',
        },
      ]

      ;(TweetService.getTweets as jest.Mock).mockReturnValue(mockTweets)
      ;(TweetService.getTargetTweets as jest.Mock).mockReturnValue(mockTweets)
      ;(QueueService.isCheckedTweet as jest.Mock).mockImplementation(
        (tweetId) => {
          return tweetId === '1' // Tweet 1 is already checked
        }
      )
      ;(QueueService.isWaitingTweet as jest.Mock).mockImplementation(
        (tweetId) => {
          return tweetId === '2' // Tweet 2 is already waiting
        }
      )

      await CrawlerService.crawlTweets()

      expect(QueueService.addWaitingTweets).toHaveBeenCalledWith([])
    })

    it('should return early when no tweets are found', async () => {
      ;(TweetService.getTweets as jest.Mock).mockReturnValue(null)

      await CrawlerService.crawlTweets()

      expect(TweetService.saveTweets).not.toHaveBeenCalled()
      expect(TweetService.getTargetTweets).not.toHaveBeenCalled()
      expect(QueueService.addWaitingTweets).not.toHaveBeenCalled()
      expect(CrawlerService.getCrawledTweetCount()).toBe(0)
    })

    it('should handle empty tweets array', async () => {
      ;(TweetService.getTweets as jest.Mock).mockReturnValue([])

      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

      await CrawlerService.crawlTweets()

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'crawlTweets: tweets not found'
      )
      expect(TweetService.saveTweets).not.toHaveBeenCalled()
      expect(CrawlerService.getCrawledTweetCount()).toBe(0)

      consoleWarnSpy.mockRestore()
    })

    it('should return early when no new tweets to add', async () => {
      const mockTweets: Tweet[] = [
        {
          url: 'https://x.com/user1/status/1',
          tweetText: 'Test tweet 1',
          tweetHtml: '<span>Test tweet 1</span>',
          elementHtml: '<article>Test 1</article>',
          screenName: 'user1',
          tweetId: '1',
          replyCount: '15',
          retweetCount: '150',
          likeCount: '500',
        },
      ]

      ;(TweetService.getTweets as jest.Mock).mockReturnValue(mockTweets)
      ;(TweetService.getTargetTweets as jest.Mock).mockReturnValue(mockTweets)
      ;(QueueService.isCheckedTweet as jest.Mock).mockReturnValue(true)
      ;(QueueService.isWaitingTweet as jest.Mock).mockReturnValue(false)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      await CrawlerService.crawlTweets()

      expect(QueueService.addWaitingTweets).toHaveBeenCalledWith([])
      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('startCrawling and stopCrawling', () => {
    it('should start crawling interval', () => {
      CrawlerService.startCrawling()

      // Advance timer to trigger interval
      jest.advanceTimersByTime(1000)

      expect(TweetService.getTweets).toHaveBeenCalled()
    })

    it('should not start multiple intervals', () => {
      CrawlerService.startCrawling()
      CrawlerService.startCrawling()

      // Should only create one interval
      jest.advanceTimersByTime(1000)

      expect(TweetService.getTweets).toHaveBeenCalledTimes(1)
    })

    it('should stop crawling interval', () => {
      CrawlerService.startCrawling()
      CrawlerService.stopCrawling()

      jest.advanceTimersByTime(1000)

      expect(TweetService.getTweets).not.toHaveBeenCalled()
    })

    it('should handle crawlTweets errors', async () => {
      ;(TweetService.getTweets as jest.Mock).mockImplementation(() => {
        throw new Error('Test error')
      })

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      // Test the error handling directly
      await expect(CrawlerService.crawlTweets()).rejects.toThrow('Test error')

      consoleErrorSpy.mockRestore()
    })

    it('should handle async crawlTweets rejections', async () => {
      const mockTweets = [
        { tweetId: '1', replyCount: '15', retweetCount: '150' } as Tweet,
      ]

      ;(TweetService.getTweets as jest.Mock).mockReturnValue(mockTweets)
      ;(TweetService.getTargetTweets as jest.Mock).mockReturnValue(mockTweets)
      ;(QueueService.isCheckedTweet as jest.Mock).mockReturnValue(false)
      ;(QueueService.isWaitingTweet as jest.Mock).mockReturnValue(false)
      ;(QueueService.addWaitingTweets as jest.Mock).mockRejectedValue(
        new Error('Async error')
      )

      // Test the error handling directly
      await expect(CrawlerService.crawlTweets()).rejects.toThrow('Async error')
    })
  })

  describe('getCrawledTweetCount and resetCrawledTweetCount', () => {
    it('should track crawled tweet count', async () => {
      const mockTweets: Tweet[] = [
        { tweetId: '1' } as Tweet,
        { tweetId: '2' } as Tweet,
        { tweetId: '3' } as Tweet,
      ]

      ;(TweetService.getTweets as jest.Mock).mockReturnValue(mockTweets)
      ;(TweetService.getTargetTweets as jest.Mock).mockReturnValue([])
      ;(QueueService.addWaitingTweets as jest.Mock).mockResolvedValue(undefined)

      await CrawlerService.crawlTweets()

      expect(CrawlerService.getCrawledTweetCount()).toBe(3)

      await CrawlerService.crawlTweets()

      expect(CrawlerService.getCrawledTweetCount()).toBe(6)
    })

    it('should reset crawled tweet count', async () => {
      const mockTweets: Tweet[] = [{ tweetId: '1' } as Tweet]

      ;(TweetService.getTweets as jest.Mock).mockReturnValue(mockTweets)
      ;(TweetService.getTargetTweets as jest.Mock).mockReturnValue([])
      ;(QueueService.addWaitingTweets as jest.Mock).mockResolvedValue(undefined)

      await CrawlerService.crawlTweets()

      expect(CrawlerService.getCrawledTweetCount()).toBe(1)

      CrawlerService.resetCrawledTweetCount()

      expect(CrawlerService.getCrawledTweetCount()).toBe(0)
    })

    it('should start with zero count', () => {
      expect(CrawlerService.getCrawledTweetCount()).toBe(0)
    })
  })
})
