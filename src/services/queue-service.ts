import { Storage } from '@/core/storage'
import { TIMEOUTS } from '@/core/constants'

export const QueueService = {
  isCheckedTweet(tweetId: string): boolean {
    const checkedTweets = Storage.getCheckedTweets()
    return checkedTweets.includes(tweetId)
  },

  isWaitingTweet(tweetId: string): boolean {
    const waitingTweets = Storage.getWaitingTweets()
    return waitingTweets.includes(tweetId)
  },

  async addWaitingTweets(tweetIds: string[]): Promise<void> {
    const waitingTweets = Storage.getWaitingTweets()
    waitingTweets.push(...tweetIds)
    Storage.setWaitingTweets(waitingTweets)

    await new Promise((resolve) => setTimeout(resolve, TIMEOUTS.CRAWL_INTERVAL))
  },

  getNextWaitingTweet(): string | null {
    const waitingTweets = Storage.getWaitingTweets()
    if (waitingTweets.length === 0) {
      return null
    }

    return waitingTweets[0]
  },

  async checkedTweet(tweetId: string): Promise<void> {
    console.log(`checkedTweet: ${tweetId}`)
    const checkedTweets = Storage.getCheckedTweets()
    checkedTweets.push(tweetId)
    Storage.setCheckedTweets(checkedTweets)

    const waitingTweets = Storage.getWaitingTweets()
    const index = waitingTweets.indexOf(tweetId)
    if (index !== -1) {
      waitingTweets.splice(index, 1)
      Storage.setWaitingTweets(waitingTweets)
    }

    await new Promise((resolve) => setTimeout(resolve, TIMEOUTS.CRAWL_INTERVAL))
  },

  resetWaitingQueue(): void {
    Storage.setWaitingTweets([])
  },
}
