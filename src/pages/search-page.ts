import { DELAYS } from '@/core/constants'
import { StateService } from '@/services/state-service'
import { CrawlerService } from '@/services/crawler-service'
import { DomUtilities } from '@/utils/dom'
import { AsyncUtilities } from '@/utils/async'
import { PageErrorHandler } from '@/utils/page-error-handler'
import { TweetPage } from './tweet-page'

export const SearchPage = {
  async run(): Promise<void> {
    if (DomUtilities.checkAndNavigateToLogin()) {
      return
    }

    StateService.resetState()

    if (!location.search.includes('f=live')) {
      await AsyncUtilities.delay(DELAYS.CRAWL_INTERVAL)
      location.search += '&f=live'
      return
    }

    CrawlerService.startCrawling()

    try {
      await DomUtilities.waitElement('article[data-testid="tweet"]')
    } catch (error) {
      await PageErrorHandler.handlePageError('Search', 'runSearch', error, {
        customMessage: DomUtilities.isFailedPage()
          ? 'runSearch: failed page. Wait 1 minute and reload.'
          : 'Wait 1 minute and reload.',
      })
      return
    }

    for (let scrollCount = 0; scrollCount < 10; scrollCount++) {
      window.scrollBy({
        top: window.innerHeight,
        behavior: 'smooth',
      })
      await AsyncUtilities.delay(DELAYS.CRAWL_INTERVAL)
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
