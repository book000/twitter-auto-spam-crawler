import { StateService } from '@/services/state-service'
import { DomUtils } from '@/utils/dom'
import { PageErrorHandler } from '@/utils/page-error-handler'

export const ExplorePage = {
  async run(): Promise<void> {
    if (DomUtils.checkAndNavigateToLogin()) {
      return
    }

    StateService.resetState()

    try {
      await DomUtils.waitElement('div[data-testid="trend"]')
    } catch (error) {
      await PageErrorHandler.handlePageError('Explore', 'runExplore', error, {
        customMessage: DomUtils.isFailedPage()
          ? 'runExplore: failed page. Wait 1 minute and reload.'
          : 'Wait 1 minute and reload.',
      })
      return
    }

    const trends = document.querySelectorAll('div[data-testid="trend"]')
    const trend = trends[
      Math.floor(Math.random() * trends.length)
    ] as HTMLElement
    trend.click()
  },
}
