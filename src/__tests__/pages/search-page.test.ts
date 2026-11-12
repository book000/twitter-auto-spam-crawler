import { SearchPage } from '../../pages/search-page'
import { DELAYS } from '../../core/constants'
import { StateService } from '../../services/state-service'
import { CrawlerService } from '../../services/crawler-service'
import { DomUtils } from '../../utils/dom'
import { AsyncUtils } from '../../utils/async'
import { TweetPage } from '../../pages/tweet-page'
import { PageErrorHandler } from '../../utils/page-error-handler'
import {
  setupSearchPageDOM,
  setupUserscriptMocks,
  setupConsoleMocks,
  restoreConsoleMocks,
} from '../utils/page-test-utils'

jest.mock('../../services/state-service')
jest.mock('../../services/crawler-service')
jest.mock('../../utils/dom')
jest.mock('../../utils/async')
jest.mock('../../pages/tweet-page')
jest.mock('../../utils/page-error-handler')

jest.useFakeTimers()

const setSearch = (search: string): void => {
  history.replaceState({}, '', `/search${search}`)
}

describe('SearchPage', () => {
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
    ;(StateService.resetState as jest.Mock).mockImplementation(() => {})
    ;(CrawlerService.startCrawling as jest.Mock).mockImplementation(() => {})
    ;(TweetPage.run as jest.Mock).mockResolvedValue(undefined)
    ;(PageErrorHandler.logAction as jest.Mock).mockImplementation(() => {})
    ;(PageErrorHandler.logError as jest.Mock).mockImplementation(() => {})
    ;(PageErrorHandler.handlePageError as jest.Mock).mockResolvedValue(
      undefined
    )
  })

  afterEach(() => {
    restoreConsoleMocks(consoleMocks)
    jest.runOnlyPendingTimers()
    history.replaceState({}, '', '/')
  })

  describe('run', () => {
    it('should return early when login is required', async () => {
      ;(DomUtils.checkAndNavigateToLogin as jest.Mock).mockReturnValue(true)

      await SearchPage.run()

      expect(StateService.resetState).not.toHaveBeenCalled()
    })

    it.each(['?q=test', '?q=test&src=typed_query', ''])(
      'should delay and not start crawling when live filter is missing (%j)',
      async (search) => {
        setSearch(search)

        await SearchPage.run()

        expect(StateService.resetState).toHaveBeenCalled()
        expect(AsyncUtils.delay).toHaveBeenCalledWith(DELAYS.CRAWL_INTERVAL)
        expect(CrawlerService.startCrawling).not.toHaveBeenCalled()
        expect(DomUtils.waitElement).not.toHaveBeenCalled()
      }
    )

    it.each([
      '?f=live',
      '?q=test&f=live',
      '?f=live&q=test',
      '?q=spam&f=live&src=search',
    ])(
      'should process the search page when live filter is present (%j)',
      async (search) => {
        setupSearchPageDOM()
        setSearch(search)

        await SearchPage.run()

        expect(StateService.resetState).toHaveBeenCalled()
        expect(CrawlerService.startCrawling).toHaveBeenCalled()
        expect(DomUtils.waitElement).toHaveBeenCalledWith(
          'article[data-testid="tweet"]'
        )
        expect(TweetPage.run).toHaveBeenCalledWith(true)
      }
    )

    it('should delegate to handlePageError when waitElement fails', async () => {
      setSearch('?q=test&f=live')
      const error = new Error('Element not found')
      ;(DomUtils.waitElement as jest.Mock).mockRejectedValue(error)

      await SearchPage.run()

      expect(PageErrorHandler.handlePageError).toHaveBeenCalledWith(
        'Search',
        'runSearch',
        error,
        { customMessage: 'Wait 1 minute and reload.' }
      )
      expect(TweetPage.run).not.toHaveBeenCalled()
    })

    it('should use the failed page message when a failed page is detected', async () => {
      setSearch('?q=test&f=live')
      const error = new Error('Element not found')
      ;(DomUtils.waitElement as jest.Mock).mockRejectedValue(error)
      ;(DomUtils.isFailedPage as jest.Mock).mockReturnValue(true)

      await SearchPage.run()

      expect(PageErrorHandler.handlePageError).toHaveBeenCalledWith(
        'Search',
        'runSearch',
        error,
        {
          customMessage: 'runSearch: failed page. Wait 1 minute and reload.',
        }
      )
    })

    it('should perform scroll actions with correct intervals', async () => {
      setupSearchPageDOM()
      setSearch('?q=test&f=live')

      await SearchPage.run()

      expect(window.scrollBy).toHaveBeenCalledTimes(10)
      expect(window.scrollBy).toHaveBeenCalledWith({
        top: window.innerHeight,
        behavior: 'smooth',
      })
      expect(AsyncUtils.delay).toHaveBeenCalledTimes(10)
      expect(AsyncUtils.delay).toHaveBeenCalledWith(DELAYS.CRAWL_INTERVAL)
    })

    it('should log TweetPage.run errors without failing', async () => {
      setupSearchPageDOM()
      setSearch('?q=test&f=live')
      const mockError = new Error('TweetPage error')
      ;(TweetPage.run as jest.Mock).mockRejectedValue(mockError)

      await SearchPage.run()
      await Promise.resolve()
      await Promise.resolve()

      expect(PageErrorHandler.logError).toHaveBeenCalledWith(
        'Error in TweetPage.run',
        mockError
      )
    })
  })
})
