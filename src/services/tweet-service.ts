import type { Tweet } from '@/types'
import { TWEET_URL_REGEX, THRESHOLDS } from '@/core/constants'
import { Storage } from '@/core/storage'

/** Child elements of a tweet article that are read on every crawl tick. */
interface CachedTweetElements {
  tweetElement?: Element | null
  textElement?: Element | null
  replyButton?: Element | null
  retweetButton?: Element | null
  likeButton?: Element | null
}

/**
 * Memoizes the child element lookups of each tweet article, so repeated crawl
 * ticks do not re-run the selectors. Entries are keyed weakly and are dropped
 * with their DOM nodes.
 *
 * A lookup that found nothing is cached as well and is not retried.
 */
class TweetElementCache {
  private static cache = new WeakMap<Element, CachedTweetElements>()

  static getElements(articleElement: Element): CachedTweetElements {
    let cached = this.cache.get(articleElement)

    if (!cached) {
      cached = {
        tweetElement: articleElement.querySelector(
          'a[role="link"]:has(time[datetime])'
        ),
        textElement: articleElement.querySelector(
          'div[lang][dir][data-testid="tweetText"]'
        ),
        replyButton: articleElement.querySelector(
          'button[role="button"][data-testid="reply"]'
        ),
        retweetButton: articleElement.querySelector(
          'button[role="button"][data-testid="retweet"]'
        ),
        likeButton: articleElement.querySelector(
          'button[role="button"][data-testid="like"]'
        ),
      }

      this.cache.set(articleElement, cached)
    }

    return cached
  }

  static clearCache(): void {
    this.cache = new WeakMap<Element, CachedTweetElements>()
  }
}

/**
 * Scrapes tweets from the DOM, filters them by engagement, and persists them
 * for export.
 */
export const TweetService = {
  /**
   * Extracts the tweets currently rendered on the page.
   *
   * Articles whose link does not match `TWEET_URL_REGEX` are skipped.
   * Engagement counts are the first run of digits in the button's aria-label,
   * or `"0"`.
   *
   * @returns The tweets (empty if no article has a matching link), or `null`
   * as soon as one article has no tweet link element.
   */
  getTweets(): Tweet[] | null {
    const tweetArticleElements = document.querySelectorAll(
      'article[data-testid="tweet"]'
    )

    const numberRegex = /\d+/
    const tweets: Tweet[] = []

    for (const element of tweetArticleElements) {
      const cachedElements = TweetElementCache.getElements(element)

      if (!cachedElements.tweetElement) {
        console.warn('getTweets: tweetElement not found')
        return null
      }

      const tweetUrl = (cachedElements.tweetElement as HTMLAnchorElement).href
      const tweetUrlMatch = TWEET_URL_REGEX.exec(tweetUrl)
      if (!tweetUrlMatch) continue

      const screenName = tweetUrlMatch[1]
      const tweetId = tweetUrlMatch[2]

      const tweetHtml = cachedElements.textElement
        ? cachedElements.textElement.innerHTML
        : null
      const tweetText = cachedElements.textElement
        ? cachedElements.textElement.textContent
        : null
      const elementHtml = (element as HTMLElement).innerHTML

      const replyCountRaw =
        cachedElements.replyButton?.getAttribute('aria-label')
      const replyCount = replyCountRaw
        ? (numberRegex.exec(replyCountRaw)?.[0] ?? '0')
        : '0'

      const retweetCountRaw =
        cachedElements.retweetButton?.getAttribute('aria-label')
      const retweetCount = retweetCountRaw
        ? (numberRegex.exec(retweetCountRaw)?.[0] ?? '0')
        : '0'

      const likeCountRaw = cachedElements.likeButton?.getAttribute('aria-label')
      const likeCount = likeCountRaw
        ? (numberRegex.exec(likeCountRaw)?.[0] ?? '0')
        : '0'

      const tweet: Tweet = {
        url: tweetUrl,
        tweetText,
        tweetHtml,
        elementHtml,
        screenName,
        tweetId,
        replyCount,
        retweetCount,
        likeCount,
      }
      tweets.push(tweet)
    }

    return tweets
  },

  /** Saves tweets to storage, replacing any saved tweet with the same ID. */
  saveTweets(tweets: Tweet[]): void {
    const savedTweetsMap = Storage.getSavedTweetsMap()

    for (const newTweet of tweets) {
      savedTweetsMap.set(newTweet.tweetId, newTweet)
    }

    // Sort by tweet ID so the stored order is stable
    const sortedTweets = savedTweetsMap
      .values()
      .toArray()
      .toSorted((a, b) => a.tweetId.localeCompare(b.tweetId))
    Storage.setSavedTweets(sortedTweets)
  },

  /** Whether the saved tweets exceed `THRESHOLDS.SAVED_TWEETS_LIMIT`. */
  isNeedDownload(): boolean {
    const tweets = Storage.getSavedTweets()
    return tweets.length > THRESHOLDS.SAVED_TWEETS_LIMIT
  },

  /**
   * Downloads the saved tweets as a JSON file by clicking a link appended to
   * `document.body` (neither the link nor the object URL is cleaned up), then
   * clears the saved tweets right away without waiting for the download.
   *
   * @returns Always `true`.
   */
  downloadTweets(): boolean {
    const tweets = Storage.getSavedTweets()

    console.log('downloadTweets: download tweets')
    const data = JSON.stringify({
      type: 'tweets',
      data: tweets,
    })
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const timestamp = new Date().toISOString().replaceAll(':', '-')
    a.download = `tweets-${timestamp}.json`
    a.innerHTML = 'download'
    document.body.append(a)
    a.click()

    Storage.setSavedTweets([])

    return true
  },

  /**
   * Keeps the tweets whose retweet and reply counts both reach
   * `THRESHOLDS.RETWEET_COUNT` and `THRESHOLDS.REPLY_COUNT`.
   */
  getTargetTweets(tweets: Tweet[]): Tweet[] {
    return tweets.filter(
      (tweet) =>
        Number(tweet.retweetCount) >= THRESHOLDS.RETWEET_COUNT &&
        Number(tweet.replyCount) >= THRESHOLDS.REPLY_COUNT
    )
  },
}

export { TweetElementCache }
