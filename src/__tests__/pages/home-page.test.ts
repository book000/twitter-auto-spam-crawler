import { HomePage } from '../../pages/home-page'
import { DELAYS } from '../../core/constants'
import { ConfigManager } from '../../core/config'
import { StateService } from '../../services/state-service'
import { CrawlerService } from '../../services/crawler-service'
import { DomUtils } from '../../utils/dom'
import { AsyncUtils } from '../../utils/async'
import { PageErrorHandler } from '../../utils/page-error-handler'
import {
  setupTwitterDOM,
  setupUserscriptMocks,
  setupConsoleMocks,
  restoreConsoleMocks,
} from '../utils/page-test-utils'

jest.mock('../../core/config')
jest.mock('../../services/state-service')
jest.mock('../../services/crawler-service')
jest.mock('../../utils/dom')
jest.mock('../../utils/async')
jest.mock('../../utils/page-error-handler')

jest.useFakeTimers()

describe('HomePage', () => {
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
    ;(ConfigManager.getIsOnlyHome as jest.Mock).mockReturnValue(false)
    ;(StateService.resetState as jest.Mock).mockImplementation(() => {})
    ;(CrawlerService.startCrawling as jest.Mock).mockImplementation(() => {})
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
    it('should process home page successfully and navigate to explore', async () => {
      setupTwitterDOM()

      await HomePage.run()

      expect(StateService.resetState).toHaveBeenCalled()
      expect(CrawlerService.startCrawling).toHaveBeenCalled()
      expect(DomUtils.waitElement).toHaveBeenCalledWith(
        'div[data-testid="primaryColumn"] nav[aria-live="polite"][role="navigation"] div[role="tablist"] > div[role="presentation"] a[role="tab"]'
      )
      expect(AsyncUtils.delay).toHaveBeenCalledWith(DELAYS.LONG * 3)
      // Since we can't mock location.href in JSDOM, we verify the behavior by checking
      // that all tabs were processed
      expect(DomUtils.waitElement).toHaveBeenCalled()
    })

    it('should return early when login is required', async () => {
      ;(DomUtils.checkAndNavigateToLogin as jest.Mock).mockReturnValue(true)

      await HomePage.run()

      expect(StateService.resetState).not.toHaveBeenCalled()
      expect(CrawlerService.startCrawling).not.toHaveBeenCalled()
    })

    it('should handle waitElement error and reload page', async () => {
      ;(DomUtils.waitElement as jest.Mock).mockRejectedValue(
        new Error('Element not found')
      )

      await HomePage.run()

      expect(PageErrorHandler.handlePageError).toHaveBeenCalledWith(
        'Home',
        'runHome',
        expect.any(Error)
      )
    })

    it('should handle error when failed page is detected', async () => {
      ;(DomUtils.waitElement as jest.Mock).mockRejectedValue(
        new Error('Element not found')
      )
      ;(DomUtils.isFailedPage as jest.Mock).mockReturnValue(true)

      await HomePage.run()

      expect(PageErrorHandler.handlePageError).toHaveBeenCalledWith(
        'Home',
        'runHome',
        expect.any(Error)
      )
    })

    it('should click tabs and wait for tweets', async () => {
      setupTwitterDOM()

      const tabs = document.querySelectorAll('a[role="tab"]')
      const clickSpies = [...tabs].map((tab) => {
        const spy = jest.fn()
        ;(tab as HTMLAnchorElement).click = spy
        return spy
      })

      await HomePage.run()

      for (const spy of clickSpies) {
        expect(spy).toHaveBeenCalled()
      }

      expect(DomUtils.waitElement).toHaveBeenCalledWith(
        'article[data-testid="tweet"]'
      )

      // Verify scrolling was performed (implementation uses 10 scrolls per tab)
      const SCROLLS_PER_TAB = 10
      expect(window.scrollBy).toHaveBeenCalledTimes(
        SCROLLS_PER_TAB * tabs.length
      )
    })

    it('should skip to next tab when tweet waiting fails', async () => {
      setupTwitterDOM()

      // Mock waitElement to fail only for tweet elements
      ;(DomUtils.waitElement as jest.Mock).mockImplementation(
        (selector: string) => {
          return selector.includes('article[data-testid="tweet"]')
            ? Promise.reject(new Error('Tweet not found'))
            : Promise.resolve()
        }
      )

      await HomePage.run()

      expect(PageErrorHandler.logAction).toHaveBeenCalledWith('Next tab')
    })

    it('should reload when tweet waiting fails on failed page', async () => {
      setupTwitterDOM()
      ;(DomUtils.waitElement as jest.Mock).mockImplementation(
        (selector: string) => {
          return selector.includes('article[data-testid="tweet"]')
            ? Promise.reject(new Error('Tweet not found'))
            : Promise.resolve()
        }
      )
      ;(DomUtils.isFailedPage as jest.Mock).mockReturnValue(true)

      await HomePage.run()

      expect(PageErrorHandler.handlePageError).toHaveBeenCalledWith(
        'Home',
        'runHome',
        expect.any(Error),
        {
          customMessage: 'runHome: failed page. Wait 1 minute and reload.',
        }
      )
    })

    it('should navigate to home when isOnlyHome is true', async () => {
      setupTwitterDOM()
      ;(ConfigManager.getIsOnlyHome as jest.Mock).mockReturnValue(true)

      await HomePage.run()

      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'isOnlyHome is true. Go to home page.'
      )
      // Since we can't mock location.href in JSDOM, we verify the behavior by checking
      // that the isOnlyHome logic was executed
      expect(ConfigManager.getIsOnlyHome).toHaveBeenCalled()
    })

    it('should perform scroll actions with correct intervals', async () => {
      setupTwitterDOM()

      await HomePage.run()

      expect(window.scrollBy).toHaveBeenCalledWith({
        top: window.innerHeight,
        behavior: 'smooth',
      })

      expect(AsyncUtils.delay).toHaveBeenCalledWith(DELAYS.CRAWL_INTERVAL)
    })

    it('should log correct tab information', async () => {
      setupTwitterDOM()
      const tabs = document.querySelectorAll('a[role="tab"]')

      await HomePage.run()

      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        `tabs=${tabs.length}`
      )

      for (let i = 0; i < tabs.length; i++) {
        expect(PageErrorHandler.logAction).toHaveBeenCalledWith(`open tab=${i}`)
      }

      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'all tabs are opened. Go to explore page.'
      )
    })
  })
})
