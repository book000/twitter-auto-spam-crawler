import { Storage } from '@/core/storage'
import { TIMEOUTS } from '@/core/constants'

/**
 * ツイート処理キューと状態遷移を管理するサービス。
 * 待機状態と確認済み状態間のツイートステータス追跡を処理。
 */
export const QueueService = {
  /**
   * ツイートが既に処理済みかどうかをチェック。
   * @param tweetId - チェックするツイートID
   * @returns ツイートが処理済みの場合true
   */
  isCheckedTweet(tweetId: string): boolean {
    const checkedTweets = Storage.getCheckedTweets()
    return checkedTweets.includes(tweetId)
  },

  /**
   * ツイートが現在待機キューにあるかどうかをチェック。
   * @param tweetId - チェックするツイートID
   * @returns ツイートが処理待ちの場合true
   */
  isWaitingTweet(tweetId: string): boolean {
    const waitingTweets = Storage.getWaitingTweets()
    return waitingTweets.includes(tweetId)
  },

  /**
   * 複数のツイートを処理用の待機キューに追加。
   * @param tweetIds - キューに追加するツイートIDの配列
   */
  async addWaitingTweets(tweetIds: string[]): Promise<void> {
    const waitingTweets = Storage.getWaitingTweets()
    waitingTweets.push(...tweetIds)
    Storage.setWaitingTweets(waitingTweets)

    await new Promise((resolve) => setTimeout(resolve, TIMEOUTS.CRAWL_INTERVAL))
  },

  /**
   * 待機キューから次のツイートIDを取得。
   * @returns 処理する次のツイートID、またはキューが空の場合null
   */
  getNextWaitingTweet(): string | null {
    const waitingTweets = Storage.getWaitingTweets()
    if (waitingTweets.length === 0) {
      return null
    }

    return waitingTweets[0]
  },

  /**
   * ツイートを処理済みとしてマークし、待機キューから削除。
   * @param tweetId - 処理済みとしてマークするツイートID
   */
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

  /**
   * 待機キューからすべてのツイートをクリア。
   */
  resetWaitingQueue(): void {
    Storage.setWaitingTweets([])
  },
}
