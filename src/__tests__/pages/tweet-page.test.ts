import { TweetPage } from '../../pages/tweet-page'
import { DomUtils } from '../../utils/dom'
import { StateService } from '../../services/state-service'
import { TweetService } from '../../services/tweet-service'
import { QueueService } from '../../services/queue-service'
// Import mock before the module under test
import '../../__mocks__/userscript'

// Mock dependencies
jest.mock('../../utils/dom')
jest.mock('../../services/state-service')
jest.mock('../../services/tweet-service')
jest.mock('../../services/queue-service')
jest.mock('../../utils/scroll')
jest.mock('../../utils/error')

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
const mockTweetService = TweetService as jest.Mocked<typeof TweetService>
const mockQueueService = QueueService as jest.Mocked<typeof QueueService>

/**
 * TweetPageクラスのテストスイート
 * ツイートページの実行処理とログイン検出機能を検証する
 */
describe('TweetPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    document.body.innerHTML = ''
    mockLocation.href = ''

    // Default mock implementations
    mockDomUtils.checkAndNavigateToLogin.mockReturnValue(false)
    mockDomUtils.waitElement.mockResolvedValue()
    mockDomUtils.isFailedPage.mockReturnValue(false)
    mockTweetService.isNeedDownload.mockReturnValue(false)
    mockQueueService.getNextWaitingTweet.mockReturnValue(null)
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

      await TweetPage.run()

      expect(mockDomUtils.checkAndNavigateToLogin).toHaveBeenCalledTimes(1)
      expect(mockStateService.resetState).not.toHaveBeenCalled()
      expect(mockTweetService.isNeedDownload).not.toHaveBeenCalled()
      expect(mockQueueService.getNextWaitingTweet).not.toHaveBeenCalled()
    })

    /** ログイン要素が検出されなかった場合に通常処理が実行されることを検証 */
    it('should continue normal processing when login is not required', async () => {
      mockDomUtils.checkAndNavigateToLogin.mockReturnValue(false)

      await TweetPage.run()

      expect(mockDomUtils.checkAndNavigateToLogin).toHaveBeenCalledTimes(1)
      expect(mockStateService.resetState).toHaveBeenCalledTimes(1)
    })

    /** onlyOpenパラメータがtrueの場合でもログイン検出が優先されることを検証 */
    it('should check login even when onlyOpen is true', async () => {
      mockDomUtils.checkAndNavigateToLogin.mockReturnValue(true)

      await TweetPage.run(true)

      expect(mockDomUtils.checkAndNavigateToLogin).toHaveBeenCalledTimes(1)
      expect(mockStateService.resetState).not.toHaveBeenCalled()
      expect(mockTweetService.isNeedDownload).not.toHaveBeenCalled()
    })
  })

  /**
   * onlyOpenモードのテスト
   * onlyOpenパラメータがtrueの場合の処理を検証
   */
  describe('onlyOpen mode', () => {
    /** ダウンロードが必要な場合にダウンロードページに遷移することを検証 */
    it('should navigate to download page when download is needed', async () => {
      mockDomUtils.checkAndNavigateToLogin.mockReturnValue(false)
      mockTweetService.isNeedDownload.mockReturnValue(true)

      await TweetPage.run(true)

      expect(mockLocation.href).toBe('https://example.com/?download-json')
    })

    /** ダウンロードが不要で次のツイートがある場合の処理を検証 */
    it('should process next tweet when download is not needed and next tweet exists', async () => {
      mockDomUtils.checkAndNavigateToLogin.mockReturnValue(false)
      mockTweetService.isNeedDownload.mockReturnValue(false)
      mockQueueService.getNextWaitingTweet.mockReturnValue('123456789')

      await TweetPage.run(true)

      expect(mockQueueService.getNextWaitingTweet).toHaveBeenCalledTimes(1)
    })
  })

  /**
   * 通常モードのテスト
   * onlyOpenパラメータがfalseまたは未指定の場合の処理を検証
   */
  describe('normal mode', () => {
    /** 通常モードでStateServiceがリセットされることを検証 */
    it('should reset state in normal mode', async () => {
      mockDomUtils.checkAndNavigateToLogin.mockReturnValue(false)

      await TweetPage.run(false)

      expect(mockStateService.resetState).toHaveBeenCalledTimes(1)
    })

    /** パラメータ未指定時も通常モードとして動作することを検証 */
    it('should work as normal mode when parameter is not specified', async () => {
      mockDomUtils.checkAndNavigateToLogin.mockReturnValue(false)

      await TweetPage.run()

      expect(mockStateService.resetState).toHaveBeenCalledTimes(1)
    })
  })
})
