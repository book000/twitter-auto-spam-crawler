import { URLS, TIMEOUTS } from '@/core/constants'
import { ConfigManager } from '@/core/config'
import { StateService } from '@/services/state-service'
import { CrawlerService } from '@/services/crawler-service'
import { DomUtils } from '@/utils/dom'

export const HomePage = {
  async run(): Promise<void> {
    StateService.resetState()

    CrawlerService.startCrawling()

    try {
      await DomUtils.waitElement(
        'div[data-testid="primaryColumn"] nav[aria-live="polite"][role="navigation"] div[role="tablist"] > div[role="presentation"] a[role="tab"]'
      )
    } catch {
      if (DomUtils.isFailedPage()) {
        console.error('runHome: failed page.')
      }
      console.log('Wait 1 minute and reload.')
      await new Promise((resolve) =>
        setTimeout(resolve, TIMEOUTS.ERROR_RELOAD_WAIT)
      )
      location.reload()
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 3000))

    const tabs = document.querySelectorAll(
      'div[data-testid="primaryColumn"] nav[aria-live="polite"][role="navigation"] div[role="tablist"] > div[role="presentation"] a[role="tab"]'
    )
    console.log(`runHome: tabs=${tabs.length}`)

    for (const [tabIndex, tab_] of [...tabs].entries()) {
      const tab = tab_ as HTMLAnchorElement
      console.log(`runHome: open tab=${tabIndex}`)
      tab.click()

      await new Promise((resolve) =>
        setTimeout(resolve, TIMEOUTS.CRAWL_INTERVAL)
      )
      try {
        await DomUtils.waitElement('article[data-testid="tweet"]')
      } catch {
        if (DomUtils.isFailedPage()) {
          console.error('runHome: failed page. Wait 1 minute and reload.')
          await new Promise((resolve) =>
            setTimeout(resolve, TIMEOUTS.ERROR_RELOAD_WAIT)
          )
          location.reload()
          return
        }

        console.log('Next tab')
        continue
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
    }

    const isOnlyHome = ConfigManager.getIsOnlyHome()
    if (isOnlyHome) {
      console.log('runHome: isOnlyHome is true. Go to home page.')
      location.href = URLS.HOME
      return
    }

    console.log('runHome: all tabs are opened. Go to explore page.')
    location.href = URLS.EXPLORE
  },
}
