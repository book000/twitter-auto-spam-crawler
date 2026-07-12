import { URLS, TWEET_URL_REGEX, THRESHOLDS } from '@/core/constants'
import { Storage } from '@/core/storage'
import { StateService } from '@/services/state-service'
import { CrawlerService } from '@/services/crawler-service'
import { QueueService } from '@/services/queue-service'
import { TweetService } from '@/services/tweet-service'
import { DomUtilities } from '@/utils/dom'
import { ScrollUtilities } from '@/utils/scroll'
import { ErrorHandler } from '@/utils/error'
import { PageErrorHandler } from '@/utils/page-error-handler'

export const TweetPage = {
  async run(isOnlyOpen = false): Promise<void> {
    if (DomUtilities.checkAndNavigateToLogin()) {
      return
    }

    StateService.resetState()

    if (isOnlyOpen) {
      if (TweetService.isNeedDownload()) {
        location.assign(URLS.EXAMPLE_DOWNLOAD_JSON)
        return
      }

      const nextTweetId = QueueService.getNextWaitingTweet()
      if (nextTweetId === null) {
        location.assign(URLS.BOOKMARK)
        return
      }

      const tweetUrl = `https://x.com/user/status/${nextTweetId}`
      location.assign(tweetUrl)
      return
    }

    CrawlerService.startCrawling()
    ;(async () => {
      try {
        await ErrorHandler.handleErrorDialog(async (dialog) => {
          const dialogMessage = dialog.textContent
          PageErrorHandler.logError('found error dialog', dialogMessage)

          if (!dialogMessage) {
            return
          }

          if (
            dialogMessage.includes('削除') ||
            dialogMessage.includes('deleted')
          ) {
            PageErrorHandler.logError('tweet deleted. Skip this tweet.')

            const tweetUrlMatch = TWEET_URL_REGEX.exec(location.href)
            if (tweetUrlMatch) {
              const tweetId = tweetUrlMatch[2]
              await QueueService.checkedTweet(tweetId)
              CrawlerService.resetCrawledTweetCount()
            }

            ;(async () => {
              try {
                await TweetPage.run(true)
              } catch (error: unknown) {
                PageErrorHandler.logError('Error in TweetPage.run', error)
              }
            })()
          }
        }, 300_000)
      } catch (error: unknown) {
        PageErrorHandler.logError('Error in handleErrorDialog', error)
      }
    })()
    ;(async () => {
      try {
        await ErrorHandler.detectUnprocessablePost(
          async (tweetArticleElement) => {
            PageErrorHandler.logError(
              "found can't processing post",
              tweetArticleElement
            )

            const tweetUrlMatch = TWEET_URL_REGEX.exec(location.href)
            if (tweetUrlMatch) {
              const tweetId = tweetUrlMatch[2]
              await QueueService.checkedTweet(tweetId)
              CrawlerService.resetCrawledTweetCount()
            }

            ;(async () => {
              try {
                await TweetPage.run(true)
              } catch (error: unknown) {
                PageErrorHandler.logError('Error in TweetPage.run', error)
              }
            })()
          },
          300_000
        )
      } catch (error: unknown) {
        PageErrorHandler.logError('Error in detectUnprocessablePost', error)
      }
    })()

    const retryCount = Storage.getRetryCount()
    try {
      await DomUtilities.waitElement('article[data-testid="tweet"]')
    } catch (error) {
      if (retryCount >= THRESHOLDS.MAX_RETRY_COUNT) {
        PageErrorHandler.logError(
          'failed to load tweet after 3 retries. Resetting retry count and moving to next tweet.'
        )
        Storage.setRetryCount(0)

        const tweetUrlMatch = TWEET_URL_REGEX.exec(location.href)
        if (tweetUrlMatch) {
          const tweetId = tweetUrlMatch[2]
          await QueueService.checkedTweet(tweetId)
        }
        ;(async () => {
          try {
            await TweetPage.run(true)
          } catch (error: unknown) {
            PageErrorHandler.logError('Error in TweetPage.run', error)
          }
        })()
        return
      }

      await PageErrorHandler.handlePageError('Tweet', 'runTweet', error, {
        customMessage: `Wait 1 minute and reload. (Retry count: ${retryCount + 1})`,
      })
      Storage.setRetryCount(retryCount + 1)
      return
    }

    Storage.setRetryCount(0)

    await ScrollUtilities.scrollPage()

    if (CrawlerService.getCrawledTweetCount() === 0) {
      location.assign(URLS.BOOKMARK)
      return
    }

    const tweetUrlMatch = TWEET_URL_REGEX.exec(location.href)
    if (tweetUrlMatch) {
      const tweetId = tweetUrlMatch[2]
      await QueueService.checkedTweet(tweetId)
      CrawlerService.resetCrawledTweetCount()
    }

    ;(async () => {
      try {
        await TweetPage.run(true)
      } catch (error: unknown) {
        PageErrorHandler.logError('Error in TweetPage.run', error)
      }
    })()
  },
}
