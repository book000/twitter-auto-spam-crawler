import { ExplorePage } from '../../pages/explore-page'
import { DomUtils } from '../../utils/dom'
import { StateService } from '../../services/state-service'
// Import mock before the module under test
import '../../__mocks__/userscript'

// Mock dependencies
jest.mock('../../utils/dom')
jest.mock('../../services/state-service')

// Mock timers
jest.useFakeTimers()

// Mock location
const mockLocation = { href: '', reload: jest.fn() }
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
delete (globalThis as any).location
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
;(globalThis as any).location = mockLocation

const mockDomUtils = DomUtils as jest.Mocked<typeof DomUtils>
const mockStateService = StateService as jest.Mocked<typeof StateService>

/**
 * ExplorePageクラスのテストスイート
 * Exploreページの実行処理とログイン検出機能を検証する
 */
describe('ExplorePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    document.body.innerHTML = ''
    mockLocation.href = ''

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

      await ExplorePage.run()

      expect(mockDomUtils.checkAndNavigateToLogin).toHaveBeenCalledTimes(1)
      expect(mockStateService.resetState).not.toHaveBeenCalled()
      expect(mockDomUtils.waitElement).not.toHaveBeenCalled()
    })

    /** ログイン要素が検出されなかった場合に通常処理が実行されることを検証 */
    it('should continue normal processing when login is not required', async () => {
      mockDomUtils.checkAndNavigateToLogin.mockReturnValue(false)

      await ExplorePage.run()

      expect(mockDomUtils.checkAndNavigateToLogin).toHaveBeenCalledTimes(1)
      expect(mockStateService.resetState).toHaveBeenCalledTimes(1)
      expect(mockDomUtils.waitElement).toHaveBeenCalledWith(
        'div[data-testid="trend"]'
      )
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

      const runPromise = ExplorePage.run()
      jest.advanceTimersByTime(60_000)
      await runPromise

      expect(consoleSpy).toHaveBeenCalledWith(
        'runExplore: failed page. Wait 1 minute and reload.'
      )
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

      const runPromise = ExplorePage.run()
      jest.advanceTimersByTime(60_000)
      await runPromise

      expect(consoleLogSpy).toHaveBeenCalledWith('Wait 1 minute and reload.')
      expect(mockLocation.reload).toHaveBeenCalled()

      consoleLogSpy.mockRestore()
    })
  })
})
