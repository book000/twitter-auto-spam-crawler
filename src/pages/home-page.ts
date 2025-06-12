import { URLS, DELAYS } from '@/core/constants'
import { ConfigManager } from '@/core/config'
import { StateService } from '@/services/state-service'
import { CrawlerService } from '@/services/crawler-service'
import { DomUtils } from '@/utils/dom'
import { AsyncUtils } from '@/utils/async'
import { PageErrorHandler } from '@/utils/page-error-handler'

export const HomePage = {
  async run(): Promise<void> {
    if (DomUtils.checkAndNavigateToLogin()) {
      return
    }

    StateService.resetState()

    CrawlerService.startCrawling()

    try {
      await DomUtils.waitElement(
        'div[data-testid="primaryColumn"] nav[aria-live="polite"][role="navigation"] div[role="tablist"] > div[role="presentation"] a[role="tab"]'
      )
    } catch (error) {
      await PageErrorHandler.handlePageError('Home', 'runHome', error)
      return
    }

    await AsyncUtils.delay(DELAYS.LONG * 3)

    const tabs = document.querySelectorAll(
      'div[data-testid="primaryColumn"] nav[aria-live="polite"][role="navigation"] div[role="tablist"] > div[role="presentation"] a[role="tab"]'
    )
    PageErrorHandler.logAction(`tabs=${tabs.length}`)

    for (const [tabIndex, tab_] of [...tabs].entries()) {
      const tab = tab_ as HTMLAnchorElement
      PageErrorHandler.logAction(`open tab=${tabIndex}`)
      tab.click()

      await AsyncUtils.delay(DELAYS.CRAWL_INTERVAL)
      try {
        await DomUtils.waitElement('article[data-testid="tweet"]')
      } catch (error) {
        if (DomUtils.isFailedPage()) {
          await PageErrorHandler.handlePageError('Home', 'runHome', error, {
            customMessage: 'runHome: failed page. Wait 1 minute and reload.',
          })
          return
        }

        PageErrorHandler.logAction('Next tab')
        continue
      }

      for (let scrollCount = 0; scrollCount < 10; scrollCount++) {
        window.scrollBy({
          top: window.innerHeight,
          behavior: 'smooth',
        })
        await AsyncUtils.delay(DELAYS.CRAWL_INTERVAL)
      }
    }

    const isOnlyHome = ConfigManager.getIsOnlyHome()
    if (isOnlyHome) {
      PageErrorHandler.logAction('isOnlyHome is true. Go to home page.')
      location.href = URLS.HOME
      return
    }

    PageErrorHandler.logAction('all tabs are opened. Go to explore page.')
    location.href = URLS.EXPLORE
  },
}
