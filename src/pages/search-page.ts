import { TIMEOUTS } from '@/core/constants'
import { StateService } from '@/services/state-service'
import { CrawlerService } from '@/services/crawler-service'
import { DomUtils } from '@/utils/dom'
import { TweetPage } from './tweet-page'

export const SearchPage = {
  async run(): Promise<void> {
    if (DomUtils.checkAndNavigateToLogin()) {
      return
    }

    StateService.resetState()

    if (!location.search.includes('f=live')) {
      await new Promise((resolve) =>
        setTimeout(resolve, TIMEOUTS.CRAWL_INTERVAL)
      )
      location.search = location.search + '&f=live'
      return
    }

    CrawlerService.startCrawling()

    try {
      await DomUtils.waitElement('article[data-testid="tweet"]')
    } catch {
      if (DomUtils.isFailedPage()) {
        console.error('runSearch: failed page. Wait 1 minute and reload.')
      }
      console.log('Wait 1 minute and reload.')
      await new Promise((resolve) =>
        setTimeout(resolve, TIMEOUTS.ERROR_RELOAD_WAIT)
      )
      location.reload()
      return
    }

    for (let scrollCount = 0; scrollCount < 10; scrollCount++) {
      window.scrollBy({
        top: window.innerHeight,
        behavior: 'smooth',
      })
      await new Promise((resolve) =>
        setTimeout(resolve, TIMEOUTS.CRAWL_INTERVAL)
      )
    }

    TweetPage.run(true).catch((error: unknown) => {
      console.error('Error in TweetPage.run:', error)
    })
  },
}
