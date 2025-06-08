import { HomePage } from '../../pages/home-page'
import { DomUtils } from '../../utils/dom'
import { StateService } from '../../services/state-service'
import { CrawlerService } from '../../services/crawler-service'
import { ConfigManager } from '../../core/config'
// Import mock before the module under test
import '../../__mocks__/userscript'

// Mock dependencies
jest.mock('../../utils/dom')
jest.mock('../../services/state-service')
jest.mock('../../services/crawler-service')
jest.mock('../../core/config')

// Mock timers
jest.useFakeTimers()

// Mock location
const mockLocation = {
  href: '',
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
const mockConfigManager = ConfigManager as jest.Mocked<typeof ConfigManager>

/**
 * HomePageクラスのテストスイート
 * ホームページの実行処理とログイン検出機能を検証する
 */
describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    document.body.innerHTML = ''
    mockLocation.href = ''

    // Default mock implementations
    mockDomUtils.checkAndNavigateToLogin.mockReturnValue(false)
    mockDomUtils.waitElement.mockResolvedValue()
    mockDomUtils.isFailedPage.mockReturnValue(false)
    mockConfigManager.getIsOnlyHome.mockReturnValue(false)
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

      await HomePage.run()

      expect(mockDomUtils.checkAndNavigateToLogin).toHaveBeenCalledTimes(1)
      expect(mockStateService.resetState).not.toHaveBeenCalled()
      expect(mockCrawlerService.startCrawling).not.toHaveBeenCalled()
      expect(mockDomUtils.waitElement).not.toHaveBeenCalled()
    })

    /** ログイン要素が検出されなかった場合に通常処理が実行されることを検証 */
    it('should continue normal processing when login is not required', async () => {
      mockDomUtils.checkAndNavigateToLogin.mockReturnValue(false)

      // Create mock tabs for DOM query
      const mockTab = document.createElement('a')
      mockTab.setAttribute('role', 'tab')
      mockTab.click = jest.fn()

      jest.spyOn(document, 'querySelectorAll').mockReturnValue([mockTab] as any)

      await HomePage.run()

      expect(mockDomUtils.checkAndNavigateToLogin).toHaveBeenCalledTimes(1)
      expect(mockStateService.resetState).toHaveBeenCalledTimes(1)
      expect(mockCrawlerService.startCrawling).toHaveBeenCalledTimes(1)
      expect(mockDomUtils.waitElement).toHaveBeenCalled()
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

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const consoleLogSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {})

      HomePage.run()

      // Wait for microtasks to complete
      await Promise.resolve()

      // Advance timers and flush promises
      jest.advanceTimersByTime(60_000)
      await jest.runAllTimersAsync()

      expect(consoleSpy).toHaveBeenCalledWith('runHome: failed page.')
      expect(consoleLogSpy).toHaveBeenCalledWith('Wait 1 minute and reload.')
      expect(mockLocation.reload).toHaveBeenCalled()

      consoleSpy.mockRestore()
      consoleLogSpy.mockRestore()
    })

    /** waitElement失敗だがエラーページでない場合の処理を検証 */
    it('should handle waitElement failure without error page', async () => {
      mockDomUtils.checkAndNavigateToLogin.mockReturnValue(false)
      mockDomUtils.waitElement.mockRejectedValue(new Error('Element not found'))
      mockDomUtils.isFailedPage.mockReturnValue(false)

      const consoleLogSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {})

      HomePage.run()

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

  /**
   * ページ遷移のテスト
   * ConfigManagerの設定に基づく遷移先の制御を検証
   */
  describe('navigation', () => {
    /** isOnlyHomeがtrueの場合にホームページに遷移することを検証 */
    it('should navigate to home page when isOnlyHome is true', async () => {
      mockDomUtils.checkAndNavigateToLogin.mockReturnValue(false)
      mockConfigManager.getIsOnlyHome.mockReturnValue(true)

      jest.spyOn(document, 'querySelectorAll').mockReturnValue([] as any)

      await HomePage.run()

      expect(mockLocation.href).toBe('https://x.com/home')
    })

    /** isOnlyHomeがfalseの場合にExploreページに遷移することを検証 */
    it('should navigate to explore page when isOnlyHome is false', async () => {
      mockDomUtils.checkAndNavigateToLogin.mockReturnValue(false)
      mockConfigManager.getIsOnlyHome.mockReturnValue(false)

      jest.spyOn(document, 'querySelectorAll').mockReturnValue([] as any)

      await HomePage.run()

      expect(mockLocation.href).toBe('https://x.com/explore')
    })
  })
})
