import { StateService } from '@/services/state-service'
import { DomUtilities } from '@/utils/dom'
import { PageErrorHandler } from '@/utils/page-error-handler'

export const ExplorePage = {
  async run(): Promise<void> {
    if (DomUtilities.checkAndNavigateToLogin()) {
      return
    }

    StateService.resetState()

    try {
      await DomUtilities.waitElement('div[data-testid="trend"]')
    } catch (error) {
      await PageErrorHandler.handlePageError('Explore', 'runExplore', error, {
        customMessage: DomUtilities.isFailedPage()
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
