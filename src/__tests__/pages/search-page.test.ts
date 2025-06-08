import { SearchPage } from '../../pages/search-page'
import { DomUtils } from '../../utils/dom'
import { StateService } from '../../services/state-service'
import { CrawlerService } from '../../services/crawler-service'
// Import mock before the module under test
import '../../__mocks__/userscript'

// Mock dependencies
jest.mock('../../utils/dom')
jest.mock('../../services/state-service')
jest.mock('../../services/crawler-service')
jest.mock('./tweet-page')

// Mock timers
jest.useFakeTimers()

// Mock location
const mockLocation = {
  href: '',
  search: '',
  reload: jest.fn(),
  assign: jest.fn(),
}
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
delete (globalThis as any).location
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
;(globalThis as any).location = mockLocation

const mockDomUtils = DomUtils as jest.Mocked<typeof DomUtils>
const mockStateService = StateService as jest.Mocked<typeof StateService>
const mockCrawlerService = CrawlerService as jest.Mocked<typeof CrawlerService>

/**
 * SearchPageクラスのテストスイート
 * 検索ページの実行処理とログイン検出機能を検証する
 */
describe('SearchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    document.body.innerHTML = ''
    mockLocation.href = ''
    mockLocation.search = ''

    // Default mock implementations
    mockDomUtils.checkAndNavigateToLogin.mockReturnValue(false)
    mockDomUtils.waitElement.mockResolvedValue()
    mockDomUtils.isFailedPage.mockReturnValue(false)
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
  })

  /**
   * checkAndNavigateToLoginメソッドのテスト
   * ログイン検出時の早期リターン処理を検証
   */
  describe('login detection', () => {
    /** ログイン要素が検出された場合に早期リターンすることを検証 */
    it('should return early when login is required', async () => {
      mockDomUtils.checkAndNavigateToLogin.mockReturnValue(true)

      await SearchPage.run()

      expect(mockDomUtils.checkAndNavigateToLogin).toHaveBeenCalledTimes(1)
      expect(mockStateService.resetState).not.toHaveBeenCalled()
      expect(mockCrawlerService.startCrawling).not.toHaveBeenCalled()
      expect(mockDomUtils.waitElement).not.toHaveBeenCalled()
    })

    /** ログイン要素が検出されなかった場合に通常処理が実行されることを検証 */
    it('should continue normal processing when login is not required', async () => {
      mockDomUtils.checkAndNavigateToLogin.mockReturnValue(false)
      mockLocation.search = '?q=test&f=live'

      await SearchPage.run()

      expect(mockDomUtils.checkAndNavigateToLogin).toHaveBeenCalledTimes(1)
      expect(mockStateService.resetState).toHaveBeenCalledTimes(1)
      expect(mockCrawlerService.startCrawling).toHaveBeenCalledTimes(1)
      expect(mockDomUtils.waitElement).toHaveBeenCalledWith(
        'article[data-testid="tweet"]'
      )
    })
  })

  /**
   * 検索クエリパラメータ処理のテスト
   * f=liveパラメータの追加処理を検証
   */
  describe('search query parameter handling', () => {
    /** f=liveパラメータがない場合に追加することを検証 */
    it('should add f=live parameter when not present', async () => {
      mockDomUtils.checkAndNavigateToLogin.mockReturnValue(false)
      mockLocation.search = '?q=test'

      await SearchPage.run()

      expect(mockLocation.search).toBe('?q=test&f=live')
      expect(mockCrawlerService.startCrawling).not.toHaveBeenCalled()
    })

    /** f=liveパラメータが既に存在する場合に処理を継続することを検証 */
    it('should continue processing when f=live parameter is present', async () => {
      mockDomUtils.checkAndNavigateToLogin.mockReturnValue(false)
      mockLocation.search = '?q=test&f=live'

      await SearchPage.run()

      expect(mockStateService.resetState).toHaveBeenCalledTimes(1)
      expect(mockCrawlerService.startCrawling).toHaveBeenCalledTimes(1)
    })
  })

  /**
   * エラーハンドリングのテスト
   * waitElement失敗時の処理を検証
   */
  describe('error handling', () => {
    /** waitElement失敗かつエラーページ検出時の処理を検証 */
    it('should handle failed page error correctly', async () => {
      mockDomUtils.checkAndNavigateToLogin.mockReturnValue(false)
      mockDomUtils.waitElement.mockRejectedValue(new Error('Element not found'))
      mockDomUtils.isFailedPage.mockReturnValue(true)
      mockLocation.search = '?q=test&f=live'

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      SearchPage.run()

      // Wait for microtasks to complete
      await Promise.resolve()

      // Advance timers and flush promises
      jest.advanceTimersByTime(60_000)
      await jest.runAllTimersAsync()

      expect(consoleSpy).toHaveBeenCalledWith(
        'runSearch: failed page. Wait 1 minute and reload.'
      )
      expect(mockLocation.reload).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    /** waitElement失敗だがエラーページでない場合の処理を検証 */
    it('should handle waitElement failure without error page', async () => {
      mockDomUtils.checkAndNavigateToLogin.mockReturnValue(false)
      mockDomUtils.waitElement.mockRejectedValue(new Error('Element not found'))
      mockDomUtils.isFailedPage.mockReturnValue(false)
      mockLocation.search = '?q=test&f=live'

      const consoleLogSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {})

      SearchPage.run()

      // Wait for microtasks to complete
      await Promise.resolve()

      // Advance timers and flush promises
      jest.advanceTimersByTime(60_000)
      await jest.runAllTimersAsync()

      expect(consoleLogSpy).toHaveBeenCalledWith('Wait 1 minute and reload.')
      expect(mockLocation.reload).toHaveBeenCalled()

      consoleLogSpy.mockRestore()
    })
  })
})
