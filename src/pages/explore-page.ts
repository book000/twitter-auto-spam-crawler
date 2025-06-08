import { TIMEOUTS } from '@/core/constants'
import { StateService } from '@/services/state-service'
import { DomUtils } from '@/utils/dom'

export const ExplorePage = {
  async run(): Promise<void> {
    if (DomUtils.checkAndNavigateToLogin()) {
      return
    }

    StateService.resetState()

    try {
      await DomUtils.waitElement('div[data-testid="trend"]')
    } catch {
      if (DomUtils.isFailedPage()) {
        console.error('runExplore: failed page. Wait 1 minute and reload.')
      }
      console.log('Wait 1 minute and reload.')
      await new Promise((resolve) =>
        setTimeout(resolve, TIMEOUTS.ERROR_RELOAD_WAIT)
      )
      location.reload()
      return
    }

    const trends = document.querySelectorAll('div[data-testid="trend"]')
    const trend = trends[
      Math.floor(Math.random() * trends.length)
    ] as HTMLElement
    trend.click()
  },
}
