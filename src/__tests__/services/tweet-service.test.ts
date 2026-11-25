import { TweetService, TweetElementCache } from '../../services/tweet-service'
import { Storage } from '../../core/storage'
import { THRESHOLDS, TIMEOUTS } from '../../core/constants'
import type { Tweet } from '../../types'
import '../../__mocks__/userscript'

jest.mock('../../core/storage')

// eslint-disable-next-line @typescript-eslint/no-deprecated
const originalQuerySelectorAll = document.querySelectorAll.bind(document)

globalThis.Blob = jest.fn().mockImplementation((data, options) => ({
  data,
  options,
}))

function createTweetLink(): HTMLAnchorElement {
  const link = document.createElement('a')
  link.setAttribute('role', 'link')
  link.href = 'https://x.com/user/status/1'
  const time = document.createElement('time')
  time.setAttribute('datetime', '2024-01-01T12:00:00Z')
  link.append(time)
  return link
}

describe('TweetService', () => {
  beforeEach(() => {
    document.body.replaceChildren()
    jest.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.querySelectorAll = originalQuerySelectorAll
    Storage.clearCache()
  })

  describe('getTweets', () => {
    it('should return tweets from tweet articles', () => {
      const article1 = document.createElement('article')
      article1.dataset.testid = 'tweet'

      const link1 = document.createElement('a')
      link1.setAttribute('role', 'link')
      link1.href = 'https://x.com/testuser1/status/123456789'
      const time1 = document.createElement('time')
      time1.setAttribute('datetime', '2024-01-01T12:00:00Z')
      link1.append(time1)
      article1.append(link1)

      const textDiv1 = document.createElement('div')
      textDiv1.setAttribute('lang', 'ja')
      textDiv1.setAttribute('dir', 'ltr')
      textDiv1.dataset.testid = 'tweetText'
      textDiv1.textContent = 'Test tweet content'
      textDiv1.innerHTML = '<span>Test tweet content</span>'
      article1.append(textDiv1)

      const replyButton1 = document.createElement('button')
      replyButton1.setAttribute('role', 'button')
      replyButton1.dataset.testid = 'reply'
      replyButton1.setAttribute('aria-label', '5 replies')
      article1.append(replyButton1)

      const retweetButton1 = document.createElement('button')
      retweetButton1.setAttribute('role', 'button')
      retweetButton1.dataset.testid = 'retweet'
      retweetButton1.setAttribute('aria-label', '10 retweets')
      article1.append(retweetButton1)

      const likeButton1 = document.createElement('button')
      likeButton1.setAttribute('role', 'button')
      likeButton1.dataset.testid = 'like'
      likeButton1.setAttribute('aria-label', '20 likes')
      article1.append(likeButton1)

      const mockQuerySelectorAll = jest.fn().mockReturnValue([article1])
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.querySelectorAll = mockQuerySelectorAll

      const result = TweetService.getTweets()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        url: 'https://x.com/testuser1/status/123456789',
        tweetText: 'Test tweet content',
        tweetHtml: '<span>Test tweet content</span>',
        elementHtml: article1.innerHTML,
        screenName: 'testuser1',
        tweetId: '123456789',
        replyCount: '5',
        retweetCount: '10',
        likeCount: '20',
      })
    })

    it('reads newly rendered text and replaced engagement buttons on later crawls', () => {
      const article = document.createElement('article')
      article.dataset.testid = 'tweet'
      article.append(createTweetLink())
      for (const name of ['reply', 'retweet', 'like']) {
        const button = document.createElement('button')
        button.setAttribute('role', 'button')
        button.dataset.testid = name
        button.setAttribute('aria-label', '25 replies')
        article.append(button)
      }
      document.body.append(article)

      expect(TweetService.getTweets()[0].tweetText).toBeNull()
      expect(TweetService.getTweets()[0].replyCount).toBe('25')

      const text = document.createElement('div')
      text.setAttribute('lang', 'en')
      text.setAttribute('dir', 'ltr')
      text.dataset.testid = 'tweetText'
      text.innerHTML = '<span>Rendered later</span>'
      article.append(text)
      for (const button of article.querySelectorAll('button')) {
        const replacement = button.cloneNode() as HTMLButtonElement
        replacement.setAttribute('aria-label', '99 replies')
        button.replaceWith(replacement)
      }

      expect(TweetService.getTweets()[0]).toMatchObject({
        tweetText: 'Rendered later',
        tweetHtml: '<span>Rendered later</span>',
        replyCount: '99',
        retweetCount: '99',
        likeCount: '99',
      })
    })

    it('should return the tweet once its link element has been rendered', () => {
      TweetElementCache.clearCache()
      const article = document.createElement('article')
      article.dataset.testid = 'tweet'
      document.body.append(article)

      expect(TweetService.getTweets()).toEqual([])

      article.append(createTweetLink())

      const tweets = TweetService.getTweets()
      expect(tweets).toHaveLength(1)
      expect(tweets[0].tweetId).toBe('1')
      expect(tweets[0].screenName).toBe('user')
    })

    it('should keep valid tweets when another article has no link element yet', () => {
      TweetElementCache.clearCache()
      const rendered = document.createElement('article')
      rendered.dataset.testid = 'tweet'
      rendered.append(createTweetLink())
      const unrendered = document.createElement('article')
      unrendered.dataset.testid = 'tweet'
      document.body.append(rendered, unrendered)

      const tweets = TweetService.getTweets()

      expect(tweets).toHaveLength(1)
      expect(tweets[0].tweetId).toBe('1')
    })

    it('should skip tweets with invalid URLs', () => {
      const article = document.createElement('article')
      article.dataset.testid = 'tweet'

      const link = document.createElement('a')
      link.setAttribute('role', 'link')
      link.href = 'https://example.com/invalid'
      const time = document.createElement('time')
      time.setAttribute('datetime', '2024-01-01T12:00:00Z')
      link.append(time)
      article.append(link)

      const mockQuerySelectorAll = jest.fn().mockReturnValue([article])
      const mockQuerySelector = jest.fn().mockReturnValue(link)
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      article.querySelector = mockQuerySelector
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.querySelectorAll = mockQuerySelectorAll

      const result = TweetService.getTweets()

      expect(result).toEqual([])
    })

    it('should handle tweets without text content', () => {
      const article = document.createElement('article')
      article.dataset.testid = 'tweet'

      const link = document.createElement('a')
      link.setAttribute('role', 'link')
      link.href = 'https://x.com/testuser/status/123'
      const time = document.createElement('time')
      time.setAttribute('datetime', '2024-01-01T12:00:00Z')
      link.append(time)
      article.append(link)

      const mockQuerySelectorAll = jest.fn().mockReturnValue([article])
      const mockQuerySelector = jest
        .fn()
        .mockReturnValueOnce(link) // for tweetElement
        .mockReturnValueOnce(null) // for textElement
        .mockReturnValueOnce(null) // for replyButton
        .mockReturnValueOnce(null) // for retweetButton
        .mockReturnValueOnce(null) // for likeButton
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      article.querySelector = mockQuerySelector
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.querySelectorAll = mockQuerySelectorAll

      const result = TweetService.getTweets()

      expect(result).toHaveLength(1)
      expect(result[0].tweetText).toBeNull()
      expect(result[0].tweetHtml).toBeNull()
    })

    it('should handle missing interaction buttons', () => {
      const article = document.createElement('article')
      article.dataset.testid = 'tweet'

      const link = document.createElement('a')
      link.setAttribute('role', 'link')
      link.href = 'https://x.com/testuser/status/123'
      const time = document.createElement('time')
      link.append(time)
      article.append(link)

      const mockQuerySelectorAll = jest.fn().mockReturnValue([article])
      const mockQuerySelector = jest
        .fn()
        .mockReturnValueOnce(link) // for tweetElement
        .mockReturnValueOnce(null) // for textElement
        .mockReturnValueOnce(null) // for replyButton
        .mockReturnValueOnce(null) // for retweetButton
        .mockReturnValueOnce(null) // for likeButton
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      article.querySelector = mockQuerySelector
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.querySelectorAll = mockQuerySelectorAll

      const result = TweetService.getTweets()

      expect(result).toHaveLength(1)
      expect(result[0].replyCount).toBe('0')
      expect(result[0].retweetCount).toBe('0')
      expect(result[0].likeCount).toBe('0')
    })

    describe('engagement count labels', () => {
      interface Labels {
        reply?: string
        retweet?: string
        like?: string
      }

      function getTweetsWithLabels(labels: Labels): Tweet[] {
        TweetElementCache.clearCache()
        const article = document.createElement('article')
        article.dataset.testid = 'tweet'
        article.append(createTweetLink())

        for (const [testId, label] of Object.entries(labels)) {
          const button = document.createElement('button')
          button.setAttribute('role', 'button')
          button.dataset.testid = testId
          button.setAttribute('aria-label', label)
          article.append(button)
        }

        document.body.append(article)
        return TweetService.getTweets()
      }

      it.each([
        ['retweet', '1,234 retweets. Retweet', '1234'],
        ['retweet', '1.2K reposts', '1200'],
        ['like', '3M likes', '3000000'],
        ['reply', '1.2万 件のリポスト', '12000'],
        ['reply', '12 replies', '12'],
        ['like', '5 Mentions', '5'],
        ['reply', 'Reply', '0'],
      ] as const)(
        'should read the %s count of "%s" as %s',
        (testId, label, expected) => {
          const [tweet] = getTweetsWithLabels({ [testId]: label })

          expect(tweet[`${testId}Count`]).toBe(expected)
        }
      )

      it('should read a missing label as 0', () => {
        const [tweet] = getTweetsWithLabels({})

        expect(tweet.retweetCount).toBe('0')
      })

      it('should keep tweets whose counts use separators and K suffixes as targets', () => {
        const tweets = getTweetsWithLabels({
          reply: '1.2K replies',
          retweet: '1,234 retweets',
        })

        expect(tweets[0].retweetCount).toBe('1234')
        expect(tweets[0].replyCount).toBe('1200')
        expect(TweetService.getTargetTweets(tweets)).toEqual(tweets)
      })
    })
  })

  describe('saveTweets', () => {
    it('should add new tweets to storage', () => {
      const existingTweets: Tweet[] = [
        {
          url: 'https://x.com/user1/status/1',
          tweetText: 'Existing tweet',
          tweetHtml: '<span>Existing tweet</span>',
          elementHtml: '<article>Existing</article>',
          screenName: 'user1',
          tweetId: '1',
          replyCount: '1',
          retweetCount: '1',
          likeCount: '1',
        },
      ]

      const newTweets: Tweet[] = [
        {
          url: 'https://x.com/user2/status/2',
          tweetText: 'New tweet',
          tweetHtml: '<span>New tweet</span>',
          elementHtml: '<article>New</article>',
          screenName: 'user2',
          tweetId: '2',
          replyCount: '2',
          retweetCount: '2',
          likeCount: '2',
        },
      ]

      ;(Storage.getSavedTweets as jest.Mock).mockReturnValue([
        ...existingTweets,
      ])

      TweetService.saveTweets(newTweets)

      expect(Storage.setSavedTweets).toHaveBeenCalledWith([
        ...existingTweets,
        ...newTweets,
      ])
    })

    it('should update existing tweets', () => {
      const existingTweets: Tweet[] = [
        {
          url: 'https://x.com/user1/status/1',
          tweetText: 'Old content',
          tweetHtml: '<span>Old content</span>',
          elementHtml: '<article>Old</article>',
          screenName: 'user1',
          tweetId: '1',
          replyCount: '1',
          retweetCount: '1',
          likeCount: '1',
        },
      ]

      const updatedTweets: Tweet[] = [
        {
          url: 'https://x.com/user1/status/1',
          tweetText: 'Updated content',
          tweetHtml: '<span>Updated content</span>',
          elementHtml: '<article>Updated</article>',
          screenName: 'user1',
          tweetId: '1',
          replyCount: '5',
          retweetCount: '10',
          likeCount: '20',
        },
      ]

      ;(Storage.getSavedTweets as jest.Mock).mockReturnValue(existingTweets)

      TweetService.saveTweets(updatedTweets)

      expect(Storage.setSavedTweets).toHaveBeenCalledWith(updatedTweets)
    })
  })

  describe('isNeedDownload', () => {
    it('should return true when tweets count exceeds limit', () => {
      const tweets = Array.from(
        { length: THRESHOLDS.SAVED_TWEETS_LIMIT + 1 },
        (_, index) => ({
          tweetId: index.toString(),
        })
      )

      ;(Storage.getSavedTweets as jest.Mock).mockReturnValue(tweets)

      const result = TweetService.isNeedDownload()

      expect(result).toBe(true)
    })

    it('should return false when tweets count is below limit', () => {
      const tweets = Array.from(
        { length: THRESHOLDS.SAVED_TWEETS_LIMIT - 1 },
        (_, index) => ({
          tweetId: index.toString(),
        })
      )

      ;(Storage.getSavedTweets as jest.Mock).mockReturnValue(tweets)

      const result = TweetService.isNeedDownload()

      expect(result).toBe(false)
    })

    it('should return false when tweets count equals limit', () => {
      const tweets = Array.from(
        { length: THRESHOLDS.SAVED_TWEETS_LIMIT },
        (_, index) => ({
          tweetId: index.toString(),
        })
      )

      ;(Storage.getSavedTweets as jest.Mock).mockReturnValue(tweets)

      const result = TweetService.isNeedDownload()

      expect(result).toBe(false)
    })
  })

  describe('downloadTweets', () => {
    const makeTweet = (tweetId: string): Tweet => ({
      url: `https://x.com/user1/status/${tweetId}`,
      tweetText: 'Test tweet',
      tweetHtml: '<span>Test tweet</span>',
      elementHtml: '<article>Test</article>',
      screenName: 'user1',
      tweetId,
      replyCount: '1',
      retweetCount: '1',
      likeCount: '1',
    })

    let details: GMDownloadDetails
    let abort: jest.Mock
    let logSpy: jest.SpyInstance
    let errorSpy: jest.SpyInstance

    beforeEach(() => {
      abort = jest.fn()
      ;(GM_download as jest.Mock).mockImplementation((d: GMDownloadDetails) => {
        details = d
        return { abort }
      })
      logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      logSpy.mockRestore()
      errorSpy.mockRestore()
    })

    it('should call GM_download with the saved tweets as a JSON blob', async () => {
      const saved = [makeTweet('1'), makeTweet('2')]
      ;(Storage.getSavedTweets as jest.Mock).mockReturnValue(saved)

      const promise = TweetService.downloadTweets()

      expect(Blob).toHaveBeenCalledWith(
        [JSON.stringify({ type: 'tweets', data: saved })],
        { type: 'application/json' }
      )
      expect(details.url).toEqual({
        data: [JSON.stringify({ type: 'tweets', data: saved })],
        options: { type: 'application/json' },
      })
      expect(details.name).toMatch(
        /^tweets-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z\.json$/
      )
      expect(Storage.setSavedTweets).not.toHaveBeenCalled()

      details.onload?.()
      await promise
    })

    it('should remove the downloaded tweets and resolve true on onload', async () => {
      ;(Storage.getSavedTweets as jest.Mock).mockReturnValue([
        makeTweet('1'),
        makeTweet('2'),
      ])

      const promise = TweetService.downloadTweets()
      details.onload?.()

      await expect(promise).resolves.toBe(true)
      expect(Storage.setSavedTweets).toHaveBeenCalledWith([])
    })

    it('should keep tweets saved while the download was in flight', async () => {
      const downloaded = [makeTweet('1'), makeTweet('2')]
      const added = makeTweet('3')
      ;(Storage.getSavedTweets as jest.Mock).mockReturnValueOnce(downloaded)

      const promise = TweetService.downloadTweets()
      ;(Storage.getSavedTweets as jest.Mock).mockReturnValue([
        ...downloaded,
        added,
      ])
      details.onload?.()

      await expect(promise).resolves.toBe(true)
      expect(Storage.setSavedTweets).toHaveBeenCalledWith([added])
    })

    it('should keep the saved tweets and resolve false on onerror', async () => {
      ;(Storage.getSavedTweets as jest.Mock).mockReturnValue([makeTweet('1')])

      const promise = TweetService.downloadTweets()
      details.onerror?.({ error: 'not_enabled', details: 'disabled' })

      await expect(promise).resolves.toBe(false)
      expect(Storage.setSavedTweets).not.toHaveBeenCalled()
      expect(errorSpy).toHaveBeenCalledWith(
        'downloadTweets: download failed: not_enabled disabled'
      )
    })

    it('should keep the saved tweets and resolve false on ontimeout', async () => {
      ;(Storage.getSavedTweets as jest.Mock).mockReturnValue([makeTweet('1')])

      const promise = TweetService.downloadTweets()
      details.ontimeout?.()

      await expect(promise).resolves.toBe(false)
      expect(Storage.setSavedTweets).not.toHaveBeenCalled()
      expect(errorSpy).toHaveBeenCalledWith(
        'downloadTweets: download failed: timeout'
      )
    })

    it('should keep the saved tweets and resolve false when GM_download throws', async () => {
      ;(Storage.getSavedTweets as jest.Mock).mockReturnValue([makeTweet('1')])
      ;(GM_download as jest.Mock).mockImplementation(() => {
        throw new Error('boom')
      })

      await expect(TweetService.downloadTweets()).resolves.toBe(false)
      expect(Storage.setSavedTweets).not.toHaveBeenCalled()
      expect(errorSpy).toHaveBeenCalledWith(
        'downloadTweets: download failed: boom'
      )
    })

    it('should abort and resolve false when no callback fires within the timeout', async () => {
      ;(Storage.getSavedTweets as jest.Mock).mockReturnValue([makeTweet('1')])

      const promise = TweetService.downloadTweets()
      jest.advanceTimersByTime(TIMEOUTS.DOWNLOAD_TIMEOUT)

      await expect(promise).resolves.toBe(false)
      expect(abort).toHaveBeenCalledTimes(1)
      expect(Storage.setSavedTweets).not.toHaveBeenCalled()

      details.onload?.()
      expect(Storage.setSavedTweets).not.toHaveBeenCalled()
    })
  })

  describe('getTargetTweets', () => {
    it('should filter tweets that meet both retweet and reply thresholds', () => {
      const tweets: Tweet[] = [
        {
          url: 'https://x.com/user1/status/1',
          tweetText: 'High engagement tweet',
          tweetHtml: '<span>High engagement tweet</span>',
          elementHtml: '<article>High</article>',
          screenName: 'user1',
          tweetId: '1',
          replyCount: '15', // Above threshold (10)
          retweetCount: '150', // Above threshold (100)
          likeCount: '500',
        },
        {
          url: 'https://x.com/user2/status/2',
          tweetText: 'Low retweet tweet',
          tweetHtml: '<span>Low retweet tweet</span>',
          elementHtml: '<article>Low retweet</article>',
          screenName: 'user2',
          tweetId: '2',
          replyCount: '15', // Above threshold
          retweetCount: '50', // Below threshold
          likeCount: '100',
        },
        {
          url: 'https://x.com/user3/status/3',
          tweetText: 'Low reply tweet',
          tweetHtml: '<span>Low reply tweet</span>',
          elementHtml: '<article>Low reply</article>',
          screenName: 'user3',
          tweetId: '3',
          replyCount: '5', // Below threshold
          retweetCount: '150', // Above threshold
          likeCount: '300',
        },
      ]

      const result = TweetService.getTargetTweets(tweets)

      expect(result).toHaveLength(1)
      expect(result[0].tweetId).toBe('1')
    })

    it('should return empty array when no tweets meet thresholds', () => {
      const tweets: Tweet[] = [
        {
          url: 'https://x.com/user1/status/1',
          tweetText: 'Low engagement tweet',
          tweetHtml: '<span>Low engagement tweet</span>',
          elementHtml: '<article>Low</article>',
          screenName: 'user1',
          tweetId: '1',
          replyCount: '5', // Below threshold
          retweetCount: '50', // Below threshold
          likeCount: '100',
        },
      ]

      const result = TweetService.getTargetTweets(tweets)

      expect(result).toEqual([])
    })

    it('should handle edge case values at threshold boundaries', () => {
      const tweets: Tweet[] = [
        {
          url: 'https://x.com/user1/status/1',
          tweetText: 'Boundary tweet',
          tweetHtml: '<span>Boundary tweet</span>',
          elementHtml: '<article>Boundary</article>',
          screenName: 'user1',
          tweetId: '1',
          replyCount: THRESHOLDS.REPLY_COUNT.toString(), // Exactly at threshold
          retweetCount: THRESHOLDS.RETWEET_COUNT.toString(), // Exactly at threshold
          likeCount: '100',
        },
      ]

      const result = TweetService.getTargetTweets(tweets)

      expect(result).toHaveLength(1)
    })
  })

  describe('TweetElementCache', () => {
    it('should cache DOM elements correctly', () => {
      const article = document.createElement('article')
      article.dataset.testid = 'tweet'

      const link = document.createElement('a')
      link.setAttribute('role', 'link')
      const time = document.createElement('time')
      time.setAttribute('datetime', '2024-01-01T12:00:00Z')
      link.append(time)

      const textDiv = document.createElement('div')
      textDiv.setAttribute('lang', 'ja')
      textDiv.setAttribute('dir', 'ltr')
      textDiv.dataset.testid = 'tweetText'

      const replyButton = document.createElement('button')
      replyButton.setAttribute('role', 'button')
      replyButton.dataset.testid = 'reply'

      const retweetButton = document.createElement('button')
      retweetButton.setAttribute('role', 'button')
      retweetButton.dataset.testid = 'retweet'

      const likeButton = document.createElement('button')
      likeButton.setAttribute('role', 'button')
      likeButton.dataset.testid = 'like'

      article.append(link, textDiv, replyButton, retweetButton, likeButton)

      const firstResult = TweetElementCache.getElements(article)
      expect(firstResult.tweetElement).toBe(link)
      expect(firstResult.textElement).toBe(textDiv)
      expect(firstResult.replyButton).toBe(replyButton)
      expect(firstResult.retweetButton).toBe(retweetButton)
      expect(firstResult.likeButton).toBe(likeButton)

      const secondResult = TweetElementCache.getElements(article)
      expect(secondResult).toBe(firstResult)
    })

    it('should reuse the tweet link lookup', () => {
      const article = document.createElement('article')
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const originalQuerySelector = article.querySelector.bind(article)
      let queryCount = 0

      // eslint-disable-next-line @typescript-eslint/no-deprecated
      article.querySelector = jest.fn((...args) => {
        queryCount++
        return originalQuerySelector(...args)
      })

      article.dataset.testid = 'tweet'

      const link = document.createElement('a')
      link.setAttribute('role', 'link')
      const time = document.createElement('time')
      time.setAttribute('datetime', '2024-01-01T12:00:00Z')
      link.append(time)
      article.append(link)

      TweetElementCache.clearCache()

      queryCount = 0
      TweetElementCache.getElements(article)
      const firstQueryCount = queryCount

      queryCount = 0
      TweetElementCache.getElements(article)
      const secondQueryCount = queryCount

      expect(firstQueryCount).toBeGreaterThan(0)
      expect(secondQueryCount).toBe(4)
      expect(firstQueryCount).toBe(5)
    })

    it('should clear cache when requested', () => {
      const article = document.createElement('article')
      article.dataset.testid = 'tweet'
      article.append(createTweetLink())

      const firstResult = TweetElementCache.getElements(article)
      expect(TweetElementCache.getElements(article)).toBe(firstResult)

      TweetElementCache.clearCache()

      const secondResult = TweetElementCache.getElements(article)

      expect(secondResult).not.toBe(firstResult)
    })

    it('should not cache an article whose tweet link is not rendered yet', () => {
      const article = document.createElement('article')
      article.dataset.testid = 'tweet'

      expect(TweetElementCache.getElements(article).tweetElement).toBeNull()

      const link = createTweetLink()
      article.append(link)

      expect(TweetElementCache.getElements(article).tweetElement).toBe(link)
    })
  })

  describe('Performance Tests', () => {
    it('should process large number of tweets efficiently', () => {
      const articles: Element[] = []
      for (let i = 0; i < 100; i++) {
        const article = document.createElement('article')
        article.dataset.testid = 'tweet'

        const link = document.createElement('a')
        link.setAttribute('role', 'link')
        link.href = `https://x.com/user${i}/status/${i}`
        const time = document.createElement('time')
        time.setAttribute('datetime', '2024-01-01T12:00:00Z')
        link.append(time)

        const textDiv = document.createElement('div')
        textDiv.setAttribute('lang', 'ja')
        textDiv.setAttribute('dir', 'ltr')
        textDiv.dataset.testid = 'tweetText'
        textDiv.textContent = `Tweet content ${i}`

        const replyButton = document.createElement('button')
        replyButton.setAttribute('role', 'button')
        replyButton.dataset.testid = 'reply'
        replyButton.setAttribute('aria-label', `${i} replies`)

        const retweetButton = document.createElement('button')
        retweetButton.setAttribute('role', 'button')
        retweetButton.dataset.testid = 'retweet'
        retweetButton.setAttribute('aria-label', `${i * 2} retweets`)

        const likeButton = document.createElement('button')
        likeButton.setAttribute('role', 'button')
        likeButton.dataset.testid = 'like'
        likeButton.setAttribute('aria-label', `${i * 3} likes`)

        article.append(link, textDiv, replyButton, retweetButton, likeButton)
        articles.push(article)
      }

      const mockQuerySelectorAll = jest.fn().mockReturnValue(articles)
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.querySelectorAll = mockQuerySelectorAll

      const startTime = performance.now()
      const result = TweetService.getTweets()
      const endTime = performance.now()

      const processingTime = endTime - startTime

      expect(result).toHaveLength(100)
      expect(processingTime).toBeLessThan(1000)
    })

    it('should demonstrate query optimization benefits', () => {
      const article = document.createElement('article')
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const originalQuerySelector = article.querySelector.bind(article)
      let queryCount = 0

      // eslint-disable-next-line @typescript-eslint/no-deprecated
      article.querySelector = jest.fn((...args) => {
        queryCount++
        return originalQuerySelector(...args)
      })

      article.dataset.testid = 'tweet'

      const link = document.createElement('a')
      link.setAttribute('role', 'link')
      link.href = 'https://x.com/testuser/status/123'
      const time = document.createElement('time')
      time.setAttribute('datetime', '2024-01-01T12:00:00Z')
      link.append(time)

      const textDiv = document.createElement('div')
      textDiv.setAttribute('lang', 'ja')
      textDiv.setAttribute('dir', 'ltr')
      textDiv.dataset.testid = 'tweetText'
      textDiv.textContent = 'Test tweet'

      const replyButton = document.createElement('button')
      replyButton.setAttribute('role', 'button')
      replyButton.dataset.testid = 'reply'
      replyButton.setAttribute('aria-label', '5 replies')

      const retweetButton = document.createElement('button')
      retweetButton.setAttribute('role', 'button')
      retweetButton.dataset.testid = 'retweet'
      retweetButton.setAttribute('aria-label', '10 retweets')

      const likeButton = document.createElement('button')
      likeButton.setAttribute('role', 'button')
      likeButton.dataset.testid = 'like'
      likeButton.setAttribute('aria-label', '20 likes')

      article.append(link, textDiv, replyButton, retweetButton, likeButton)

      const mockQuerySelectorAll = jest.fn().mockReturnValue([article])
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.querySelectorAll = mockQuerySelectorAll

      TweetElementCache.clearCache()
      queryCount = 0

      const result = TweetService.getTweets()

      expect(result).toHaveLength(1)
      expect(result[0].tweetId).toBe('123')

      expect(queryCount).toBeLessThanOrEqual(5)
    })
  })
})
