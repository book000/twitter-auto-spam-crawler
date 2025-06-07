import { TweetService } from './tweet-service'
import { QueueService } from './queue-service'
import { Storage } from '@/core/storage'

export class CrawlerService {
  private static crawlTweetInterval: ReturnType<typeof setInterval> | null =
    null

  private static crawledTweetCount = 0

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

  static startCrawling(): void {
    this.crawlTweetInterval ??= setInterval(() => {
      this.crawlTweets().catch((error: unknown) => {
        console.error('crawlTweets failed', error)
      })
    }, 1000)
  }

  static stopCrawling(): void {
    if (this.crawlTweetInterval) {
      clearInterval(this.crawlTweetInterval)
      this.crawlTweetInterval = null
    }
  }

  static getCrawledTweetCount(): number {
    return this.crawledTweetCount
  }

  static resetCrawledTweetCount(): void {
    this.crawledTweetCount = 0
  }
}
