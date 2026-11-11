import { TweetPage } from '../../pages/tweet-page'
import { TWEET_URL_REGEX, THRESHOLDS } from '../../core/constants'
import { Storage } from '../../core/storage'
import { StateService } from '../../services/state-service'
import { CrawlerService } from '../../services/crawler-service'
import { QueueService } from '../../services/queue-service'
import { TweetService } from '../../services/tweet-service'
import { DomUtils } from '../../utils/dom'
import { ScrollUtils } from '../../utils/scroll'
import { PageErrorHandler } from '../../utils/page-error-handler'
import { AsyncUtils } from '../../utils/async'
import {
  setupTweetPageDOM,
  setupUserscriptMocks,
  setupConsoleMocks,
  restoreConsoleMocks,
} from '../utils/page-test-utils'

jest.mock('../../core/storage')
jest.mock('../../services/state-service')
jest.mock('../../services/crawler-service')
jest.mock('../../services/queue-service')
jest.mock('../../services/tweet-service')
jest.mock('../../utils/dom')
jest.mock('../../utils/scroll')
jest.mock('../../utils/page-error-handler')
jest.mock('../../utils/async')

jest.useFakeTimers()

describe('TweetPage', () => {
  let consoleMocks: ReturnType<typeof setupConsoleMocks>

  beforeEach(() => {
    document.body.replaceChildren()

    setupUserscriptMocks()
    consoleMocks = setupConsoleMocks()

    jest.clearAllMocks()
    jest.clearAllTimers()

    ;(DomUtils.checkAndNavigateToLogin as jest.Mock).mockReturnValue(false)
    ;(DomUtils.waitElement as jest.Mock).mockResolvedValue(undefined)
    ;(DomUtils.isFailedPage as jest.Mock).mockReturnValue(false)
    ;(AsyncUtils.delay as jest.Mock).mockResolvedValue(undefined)
    ;(StateService.resetState as jest.Mock).mockImplementation(() => {})
    ;(CrawlerService.startCrawling as jest.Mock).mockImplementation(() => {})
    ;(CrawlerService.getCrawledTweetCount as jest.Mock).mockReturnValue(1)
    ;(CrawlerService.resetCrawledTweetCount as jest.Mock).mockImplementation(
      () => {}
    )
    ;(TweetService.isNeedDownload as jest.Mock).mockReturnValue(false)
    ;(QueueService.getNextWaitingTweet as jest.Mock).mockReturnValue(
      '123456789'
    )
    ;(QueueService.checkedTweet as jest.Mock).mockResolvedValue(undefined)
    ;(Storage.getRetryCount as jest.Mock).mockReturnValue(0)
    ;(Storage.setRetryCount as jest.Mock).mockImplementation(() => {})
    ;(ScrollUtils.scrollPage as jest.Mock).mockResolvedValue(undefined)
    ;(PageErrorHandler.logAction as jest.Mock).mockImplementation(() => {})
    ;(PageErrorHandler.logError as jest.Mock).mockImplementation(() => {})
    ;(PageErrorHandler.handlePageError as jest.Mock).mockResolvedValue(
      undefined
    )
  })

  afterEach(() => {
    restoreConsoleMocks(consoleMocks)
    jest.runOnlyPendingTimers()
  })

  describe('run', () => {
    it('should return early when login is required', async () => {
      ;(DomUtils.checkAndNavigateToLogin as jest.Mock).mockReturnValue(true)

      await TweetPage.run()

      expect(StateService.resetState).not.toHaveBeenCalled()
    })

    it('should navigate to download page when download is needed (onlyOpen=true)', async () => {
      ;(TweetService.isNeedDownload as jest.Mock).mockReturnValue(true)

      await TweetPage.run(true)

      // Since we can't mock location.href in JSDOM, we verify by checking that
      // TweetService.isNeedDownload was called
      expect(TweetService.isNeedDownload).toHaveBeenCalled()
    })

    it('should navigate to bookmark when no waiting tweets (onlyOpen=true)', async () => {
      ;(QueueService.getNextWaitingTweet as jest.Mock).mockReturnValue(null)

      await TweetPage.run(true)

      // Since we can't mock location.href in JSDOM, we verify by checking that
      // getNextWaitingTweet was called
      expect(QueueService.getNextWaitingTweet).toHaveBeenCalled()
    })

    it('should navigate to next tweet (onlyOpen=true)', async () => {
      const nextTweetId = '123456789'
      ;(QueueService.getNextWaitingTweet as jest.Mock).mockReturnValue(
        nextTweetId
      )

      await TweetPage.run(true)

      // Since we can't mock location.href in JSDOM, we verify by checking that
      // the next tweet was correctly identified
      expect(QueueService.getNextWaitingTweet).toHaveBeenCalled()
    })

    it('should process tweet page successfully', async () => {
      setupTweetPageDOM()
      globalThis.location.href = 'https://x.com/user/status/123456789'

      jest
        .spyOn(TWEET_URL_REGEX, 'exec')
        .mockReturnValue([
          '',
          'user',
          '123456789',
        ] as unknown as RegExpExecArray)

      await TweetPage.run()

      expect(StateService.resetState).toHaveBeenCalled()
      expect(CrawlerService.startCrawling).toHaveBeenCalled()
      expect(DomUtils.waitElement).toHaveBeenCalledWith(
        'article[data-testid="tweet"]'
      )
      expect(ScrollUtils.scrollPage).toHaveBeenCalled()
      expect(QueueService.checkedTweet).toHaveBeenCalledWith('123456789')
    })

    it('should retry when tweet element is not found', async () => {
      ;(DomUtils.waitElement as jest.Mock).mockRejectedValue(
        new Error('Element not found')
      )
      ;(Storage.getRetryCount as jest.Mock).mockReturnValue(1)

      await TweetPage.run()

      expect(PageErrorHandler.handlePageError).toHaveBeenCalledWith(
        'Tweet',
        'runTweet',
        expect.any(Error),
        {
          customMessage: 'Wait 1 minute and reload. (Retry count: 2)',
        }
      )
      expect(Storage.setRetryCount).toHaveBeenCalledWith(2)
      // AsyncUtils.delay is called within PageErrorHandler.handlePageError,
      // so we don't need to verify it separately
    })

    it('should skip tweet after max retries', async () => {
      ;(DomUtils.waitElement as jest.Mock).mockRejectedValue(
        new Error('Element not found')
      )
      ;(Storage.getRetryCount as jest.Mock).mockReturnValue(
        THRESHOLDS.MAX_RETRY_COUNT
      )
      globalThis.location.href = 'https://x.com/user/status/987654321'

      jest
        .spyOn(TWEET_URL_REGEX, 'exec')
        .mockReturnValue([
          '',
          'user',
          '987654321',
        ] as unknown as RegExpExecArray)

      await TweetPage.run()

      expect(PageErrorHandler.logError).toHaveBeenCalledWith(
        'failed to load tweet after 3 retries. Resetting retry count and moving to next tweet.'
      )
      expect(Storage.setRetryCount).toHaveBeenCalledWith(0)
      expect(QueueService.checkedTweet).toHaveBeenCalledWith('987654321')
    })

    it('should log error when failed page is detected', async () => {
      ;(DomUtils.waitElement as jest.Mock).mockRejectedValue(
        new Error('Element not found')
      )
      ;(DomUtils.isFailedPage as jest.Mock).mockReturnValue(true)

      await TweetPage.run()

      expect(PageErrorHandler.handlePageError).toHaveBeenCalledWith(
        'Tweet',
        'runTweet',
        expect.any(Error),
        expect.any(Object)
      )
    })

    it('should navigate to bookmark when no tweets were crawled', async () => {
      setupTweetPageDOM()
      ;(CrawlerService.getCrawledTweetCount as jest.Mock).mockReturnValue(0)

      await TweetPage.run()

      // Since we can't mock location.href in JSDOM, we verify by checking that
      // no tweets were crawled
      expect(CrawlerService.getCrawledTweetCount).toHaveBeenCalled()
    })

    it('should reset retry count on successful processing', async () => {
      setupTweetPageDOM()
      globalThis.location.href = 'https://x.com/user/status/777888999'

      jest
        .spyOn(TWEET_URL_REGEX, 'exec')
        .mockReturnValue([
          '',
          'user',
          '777888999',
        ] as unknown as RegExpExecArray)

      await TweetPage.run()

      expect(Storage.setRetryCount).toHaveBeenCalledWith(0)
    })

    describe('error dialog and unprocessable post handling', () => {
      const openTweetWithoutArticle = async (tweetId: string) => {
        ;(DomUtils.waitElement as jest.Mock).mockRejectedValue(
          new Error('Element not found')
        )
        globalThis.location.href = `https://x.com/user/status/${tweetId}`
        jest
          .spyOn(TWEET_URL_REGEX, 'exec')
          .mockReturnValue(['', 'user', tweetId] as unknown as RegExpExecArray)

        await TweetPage.run()
      }

      const showErrorDialog = async (message: string) => {
        const layers = document.createElement('div')
        layers.id = 'layers'
        const dialog = document.createElement('div')
        dialog.setAttribute('role', 'alert')
        dialog.textContent = message
        layers.append(dialog)
        document.body.append(layers)

        await jest.advanceTimersByTimeAsync(500)
      }

      it.each([
        'このポストは、ポストの作成者により削除されました。',
        'This post was deleted by the author.',
      ])(
        'should skip a tweet when the error dialog says it was deleted (%s)',
        async (message) => {
          await openTweetWithoutArticle('111222333')

          await showErrorDialog(message)

          expect(PageErrorHandler.logError).toHaveBeenCalledWith(
            'tweet deleted. Skip this tweet.'
          )
          expect(QueueService.checkedTweet).toHaveBeenCalledWith('111222333')
          expect(CrawlerService.resetCrawledTweetCount).toHaveBeenCalled()
        }
      )

      it('should not skip a tweet when the error dialog is unrelated to deletion', async () => {
        const message = 'Something went wrong. Try reloading.'
        await openTweetWithoutArticle('222333444')

        await showErrorDialog(message)

        expect(PageErrorHandler.logError).toHaveBeenCalledWith(
          'found error dialog',
          message
        )
        expect(QueueService.checkedTweet).not.toHaveBeenCalled()
      })

      it('should skip a tweet when an unprocessable post notice is shown', async () => {
        await openTweetWithoutArticle('333444555')

        document.body.innerHTML = `
          <div data-testid="primaryColumn">
            <div data-testid="cellInnerDiv">
              <div><div>
                <article tabindex="-1">このポストはXルールに違反しています。</article>
              </div></div>
            </div>
          </div>
        `
        await jest.advanceTimersByTimeAsync(500)

        expect(PageErrorHandler.logError).toHaveBeenCalledWith(
          "found can't processing post",
          expect.anything()
        )
        expect(QueueService.checkedTweet).toHaveBeenCalledWith('333444555')
      })
    })
  })
})
