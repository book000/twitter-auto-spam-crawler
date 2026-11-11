import { ExplorePage } from '../../pages/explore-page'
import { StateService } from '../../services/state-service'
import { DomUtils } from '../../utils/dom'
import { PageErrorHandler } from '../../utils/page-error-handler'
import {
  setupUserscriptMocks,
  setupConsoleMocks,
  restoreConsoleMocks,
} from '../utils/page-test-utils'

jest.mock('../../services/state-service')
jest.mock('../../utils/dom')
jest.mock('../../utils/page-error-handler')

jest.useFakeTimers()

function setupExplorePageDOM(trendCount = 3): HTMLElement[] {
  const trends: HTMLElement[] = []

  for (let i = 0; i < trendCount; i++) {
    const trend = document.createElement('div')
    trend.dataset.testid = 'trend'
    trend.textContent = `Trend ${i + 1}`

    const clickSpy = jest.fn()
    trend.click = clickSpy

    document.body.append(trend)
    trends.push(trend)
  }

  return trends
}

describe('ExplorePage', () => {
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
    ;(StateService.resetState as jest.Mock).mockImplementation(() => {})
    ;(PageErrorHandler.handlePageError as jest.Mock).mockResolvedValue(
      undefined
    )
    ;(PageErrorHandler.logAction as jest.Mock).mockImplementation(() => {})
    ;(PageErrorHandler.logError as jest.Mock).mockImplementation(() => {})
  })

  afterEach(() => {
    restoreConsoleMocks(consoleMocks)
    jest.runOnlyPendingTimers()
  })

  describe('run', () => {
    it('should return early when login is required', async () => {
      ;(DomUtils.checkAndNavigateToLogin as jest.Mock).mockReturnValue(true)

      await ExplorePage.run()

      expect(StateService.resetState).not.toHaveBeenCalled()
    })

    it('should select and click a random trend', async () => {
      const trends = setupExplorePageDOM(5)

      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.4)

      await ExplorePage.run()

      expect(StateService.resetState).toHaveBeenCalled()
      expect(DomUtils.waitElement).toHaveBeenCalledWith(
        'div[data-testid="trend"]'
      )

      // Should click the trend at index 2 (0.4 * 5 = 2.0, floor = 2)
      expect(trends[2].click).toHaveBeenCalled()

      mockRandom.mockRestore()
    })

    it('should handle waitElement error and reload page', async () => {
      ;(DomUtils.waitElement as jest.Mock).mockRejectedValue(
        new Error('Element not found')
      )

      await ExplorePage.run()

      expect(PageErrorHandler.handlePageError).toHaveBeenCalledWith(
        'Explore',
        'runExplore',
        expect.any(Error),
        {
          customMessage: 'Wait 1 minute and reload.',
        }
      )
    })

    it('should log error when failed page is detected', async () => {
      ;(DomUtils.waitElement as jest.Mock).mockRejectedValue(
        new Error('Element not found')
      )
      ;(DomUtils.isFailedPage as jest.Mock).mockReturnValue(true)

      await ExplorePage.run()

      expect(PageErrorHandler.handlePageError).toHaveBeenCalledWith(
        'Explore',
        'runExplore',
        expect.any(Error),
        {
          customMessage: 'runExplore: failed page. Wait 1 minute and reload.',
        }
      )
    })

    it('should handle single trend selection', async () => {
      const trends = setupExplorePageDOM(1)

      await ExplorePage.run()

      expect(trends[0].click).toHaveBeenCalled()
    })

    it('should select different trends based on random value', async () => {
      const trends = setupExplorePageDOM(10)

      const testCases = [
        { random: 0, expectedIndex: 0 },
        { random: 0.15, expectedIndex: 1 },
        { random: 0.5, expectedIndex: 5 },
        { random: 0.99, expectedIndex: 9 },
      ]

      for (const testCase of testCases) {
        jest.clearAllMocks()
        for (const trend of trends) {
          trend.click = jest.fn()
        }

        const mockRandom = jest
          .spyOn(Math, 'random')
          .mockReturnValue(testCase.random)

        await ExplorePage.run()

        expect(trends[testCase.expectedIndex].click).toHaveBeenCalled()

        mockRandom.mockRestore()
      }
    })

    it('should handle case when no trends are found after wait', async () => {
      document.body.innerHTML = '<div>No trends here</div>'

      const mockMathRandom = jest.spyOn(Math, 'random').mockReturnValue(0)

      // Since ExplorePage doesn't handle empty trends gracefully, this test will
      // demonstrate the current behavior (error on undefined trend.click())
      await expect(ExplorePage.run()).rejects.toThrow()

      expect(StateService.resetState).toHaveBeenCalled()
      expect(DomUtils.waitElement).toHaveBeenCalled()

      mockMathRandom.mockRestore()
    })

    it('should find trends with correct selector', async () => {
      const trendElement = document.createElement('div')
      trendElement.dataset.testid = 'trend'
      trendElement.click = jest.fn()

      const nonTrendElement = document.createElement('div')
      nonTrendElement.dataset.testid = 'other'
      nonTrendElement.click = jest.fn()

      document.body.append(trendElement, nonTrendElement)

      await ExplorePage.run()

      expect(trendElement.click).toHaveBeenCalled()
      expect(nonTrendElement.click).not.toHaveBeenCalled()
    })
  })
})
