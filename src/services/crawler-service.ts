import { TweetService } from './tweet-service'
import { QueueService } from './queue-service'
import { Storage } from '@/core/storage'
import { DELAYS } from '@/core/constants'

/**
 * Periodically scrapes tweets from the current page, saves them, and queues
 * those that reach the engagement thresholds (see THRESHOLDS).
 */
export class CrawlerService {
  private static crawlTweetInterval: ReturnType<typeof setInterval> | null =
    null

  private static crawledTweetCount = 0

  /**
   * Runs one crawl tick: saves every tweet on the page and adds the target
   * tweets that are neither checked nor waiting to the waiting queue.
   *
   * Returns immediately if extraction fails or finds no tweets; otherwise
   * resolves after the queue's own delay.
   */
  static async crawlTweets(): Promise<void> {
    const tweets = TweetService.getTweets()
    if (!tweets) {
      return
    }

    this.crawledTweetCount += tweets.length
    if (tweets.length === 0) {
      console.warn('crawlTweets: tweets not found')
      return
    }

    TweetService.saveTweets(tweets)

    const targetTweets = TweetService.getTargetTweets(tweets)

    const uncheckedTweets = targetTweets.filter(
      (tweet) =>
        !QueueService.isCheckedTweet(tweet.tweetId) &&
        !QueueService.isWaitingTweet(tweet.tweetId)
    )

    const tweetIds = uncheckedTweets.map((tweet) => tweet.tweetId)
    await QueueService.addWaitingTweets(tweetIds)

    if (tweetIds.length === 0) {
      return
    }

    const waitingTweets = Storage.getWaitingTweets()
    console.log(
      `crawlTweets: ${tweetIds.length} tweets added to waitingTweets. totalWaitingTweets=${waitingTweets.length}`
    )
  }

  /**
   * Starts crawling every `DELAYS.CRAWL_INTERVAL`; a no-op if already running.
   */
  static startCrawling(): void {
    this.crawlTweetInterval ??= setInterval(() => {
      this.crawlTweets().catch((error: unknown) => {
        console.error('crawlTweets failed', error)
      })
    }, DELAYS.CRAWL_INTERVAL)
  }

  /** Stops crawling; a no-op if it is not running. */
  static stopCrawling(): void {
    if (!this.crawlTweetInterval) {
      return
    }

    clearInterval(this.crawlTweetInterval)
    this.crawlTweetInterval = null
  }

  /**
   * Gets the number of tweets scraped since the last reset, counted per crawl
   * tick (a tweet seen on several ticks is counted each time).
   */
  static getCrawledTweetCount(): number {
    return this.crawledTweetCount
  }

  static resetCrawledTweetCount(): void {
    this.crawledTweetCount = 0
  }
}
