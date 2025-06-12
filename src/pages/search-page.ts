import { DELAYS } from '@/core/constants'
import { StateService } from '@/services/state-service'
import { CrawlerService } from '@/services/crawler-service'
import { DomUtils } from '@/utils/dom'
import { AsyncUtils } from '@/utils/async'
import { PageErrorHandler } from '@/utils/page-error-handler'
import { TweetPage } from './tweet-page'

export const SearchPage = {
  async run(): Promise<void> {
    if (DomUtils.checkAndNavigateToLogin()) {
      return
    }

    StateService.resetState()

    if (!location.search.includes('f=live')) {
      await AsyncUtils.delay(DELAYS.CRAWL_INTERVAL)
      location.search = location.search + '&f=live'
      return
    }

    CrawlerService.startCrawling()

    try {
      await DomUtils.waitElement('article[data-testid="tweet"]')
    } catch (error) {
      await PageErrorHandler.handlePageError('Search', 'runSearch', error, {
        customMessage: DomUtils.isFailedPage()
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
      await AsyncUtils.delay(DELAYS.CRAWL_INTERVAL)
    }

    TweetPage.run(true).catch((error: unknown) => {
      PageErrorHandler.logError('runSearch', 'Error in TweetPage.run', error)
    })
  },
}
