import { Storage } from '@/core/storage'
import { DELAYS } from '@/core/constants'
import { AsyncUtils } from '@/utils/async'

/**
 * Tracks which tweets are waiting to be processed and which are done.
 *
 * Membership checks read the current per-tweet state from `Storage`.
 */
export const QueueService = {
  /** Whether the tweet has already been processed. */
  isCheckedTweet(tweetId: string): boolean {
    return Storage.getTweetStatus(tweetId).isChecked
  },

  /** Whether the tweet is in the waiting queue. */
  isWaitingTweet(tweetId: string): boolean {
    return Storage.getTweetStatus(tweetId).isWaiting
  },

  /**
   * Adds tweet IDs to the waiting queue (IDs already queued are ignored), then
   * waits one crawl interval.
   */
  async addWaitingTweets(tweetIds: string[]): Promise<void> {
    Storage.addWaitingTweets(tweetIds)

    await AsyncUtils.delay(DELAYS.CRAWL_INTERVAL)
  },

  /**
   * Gets the oldest waiting tweet ID without removing it.
   *
   * @returns The tweet ID, or `null` if the queue is empty.
   */
  getNextWaitingTweet(): string | null {
    const waitingTweets = Storage.getWaitingTweets()
    return waitingTweets.length === 0 ? null : waitingTweets[0]
  },

  /**
   * Marks the tweet as checked and removes it from the waiting queue, then
   * waits one crawl interval.
   */
  async checkedTweet(tweetId: string): Promise<void> {
    console.log(`checkedTweet: ${tweetId}`)

    Storage.addCheckedTweet(tweetId)

    await AsyncUtils.delay(DELAYS.CRAWL_INTERVAL)
  },

  resetWaitingQueue(): void {
    Storage.resetWaitingTweets()
  },
}
