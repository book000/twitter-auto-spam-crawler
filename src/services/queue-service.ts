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
    // O(1)ルックアップのためにSetを使用
    const checkedTweetsSet = Storage.getCheckedTweetsSet()
    return checkedTweetsSet.has(tweetId)
  },

  /**
   * ツイートが現在待機キューにあるかどうかをチェック。
   * @param tweetId - チェックするツイートID
   * @returns ツイートが処理待ちの場合true
   */
  isWaitingTweet(tweetId: string): boolean {
    // O(1)ルックアップのためにSetを使用
    const waitingTweetsSet = Storage.getWaitingTweetsSet()
    return waitingTweetsSet.has(tweetId)
  },

  /**
   * 複数のツイートを処理用の待機キューに追加。
   * @param tweetIds - キューに追加するツイートIDの配列
   */
  async addWaitingTweets(tweetIds: string[]): Promise<void> {
    const waitingTweetsSet = Storage.getWaitingTweetsSet()
    // 重複を自動的に除去して追加
    for (const tweetId of tweetIds) {
      waitingTweetsSet.add(tweetId)
    }
    // Setを配列に変換して保存
    Storage.setWaitingTweets([...waitingTweetsSet])

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

    // チェック済みに追加
    const checkedTweetsSet = Storage.getCheckedTweetsSet()
    checkedTweetsSet.add(tweetId)
    Storage.setCheckedTweets([...checkedTweetsSet])

    // 待機中から削除
    const waitingTweetsSet = Storage.getWaitingTweetsSet()
    if (waitingTweetsSet.has(tweetId)) {
      waitingTweetsSet.delete(tweetId)
      Storage.setWaitingTweets([...waitingTweetsSet])
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
