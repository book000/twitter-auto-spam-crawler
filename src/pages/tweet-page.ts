import { URLS, TIMEOUTS, TWEET_URL_REGEX, THRESHOLDS } from '@/core/constants'
import { Storage } from '@/core/storage'
import { StateService } from '@/services/state-service'
import { CrawlerService } from '@/services/crawler-service'
import { QueueService } from '@/services/queue-service'
import { TweetService } from '@/services/tweet-service'
import { DomUtils } from '@/utils/dom'
import { ScrollUtils } from '@/utils/scroll'
import { ErrorHandler } from '@/utils/error'

export const TweetPage = {
  async run(onlyOpen = false): Promise<void> {
    StateService.resetState()

    if (onlyOpen) {
      if (TweetService.isNeedDownload()) {
        location.href = URLS.EXAMPLE_DOWNLOAD_JSON
        return
      }

      const nextTweetId = QueueService.getNextWaitingTweet()
      if (nextTweetId === null) {
        location.href = URLS.BOOKMARK
        return
      }

      const tweetUrl = `https://x.com/user/status/${nextTweetId}`
      location.href = tweetUrl
      return
    }

    CrawlerService.startCrawling()

    ErrorHandler.handleErrorDialog(async (dialog) => {
      const dialogMessage = dialog.textContent
      console.error('runTweet: found error dialog', dialogMessage)

      if (
        dialogMessage?.includes('削除') ||
        dialogMessage?.includes('deleted')
      ) {
        console.error('runTweet: tweet deleted. Skip this tweet.')

        const tweetUrlMatch = TWEET_URL_REGEX.exec(location.href)
        if (tweetUrlMatch) {
          const tweetId = tweetUrlMatch[2]
          await QueueService.checkedTweet(tweetId)
          CrawlerService.resetCrawledTweetCount()
        }

        TweetPage.run(true).catch((error: unknown) => {
          console.error('Error in TweetPage.run:', error)
        })
      }
    }).catch((error: unknown) => {
      console.error('Error in handleErrorDialog:', error)
    })

    ErrorHandler.detectCantProcessingPost(async (tweetArticleElement) => {
      console.error(
        "runTweet: found can't processing post",
        tweetArticleElement
      )

      const tweetUrlMatch = TWEET_URL_REGEX.exec(location.href)
      if (tweetUrlMatch) {
        const tweetId = tweetUrlMatch[2]
        await QueueService.checkedTweet(tweetId)
        CrawlerService.resetCrawledTweetCount()
      }

      TweetPage.run(true).catch((error: unknown) => {
        console.error('Error in TweetPage.run:', error)
      })
    }).catch((error: unknown) => {
      console.error('Error in detectCantProcessingPost:', error)
    })

    const retryCount = Storage.getRetryCount()
    try {
      await DomUtils.waitElement('article[data-testid="tweet"]')
    } catch {
      if (retryCount >= THRESHOLDS.MAX_RETRY_COUNT) {
        console.error(
          'runTweet: failed to load tweet after 3 retries. Resetting retry count and moving to next tweet.'
        )
        Storage.setRetryCount(0)

        const tweetUrlMatch = TWEET_URL_REGEX.exec(location.href)
        if (tweetUrlMatch) {
          const tweetId = tweetUrlMatch[2]
          await QueueService.checkedTweet(tweetId)
        }
        TweetPage.run(true).catch((error: unknown) => {
          console.error('Error in TweetPage.run:', error)
        })
        return
      }

      if (DomUtils.isFailedPage()) {
        console.error('runTweet: failed page.')
      }
      console.log(`Wait 1 minute and reload. (Retry count: ${retryCount + 1})`)
      Storage.setRetryCount(retryCount + 1)
      await new Promise((resolve) =>
        setTimeout(resolve, TIMEOUTS.ERROR_RELOAD_WAIT)
      )
      location.reload()
      return
    }

    Storage.setRetryCount(0)

    await ScrollUtils.scrollPage()

    if (CrawlerService.getCrawledTweetCount() === 0) {
      location.href = URLS.BOOKMARK
      return
    }

    const tweetUrlMatch = TWEET_URL_REGEX.exec(location.href)
    if (tweetUrlMatch) {
      const tweetId = tweetUrlMatch[2]
      await QueueService.checkedTweet(tweetId)
      CrawlerService.resetCrawledTweetCount()
    }

    TweetPage.run(true).catch((error: unknown) => {
      console.error('Error in TweetPage.run:', error)
    })
  },
}
