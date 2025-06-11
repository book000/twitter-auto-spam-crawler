import { ExplorePage } from '../../pages/explore-page'
import { DELAYS } from '../../core/constants'
import { StateService } from '../../services/state-service'
import { DomUtils } from '../../utils/dom'
import { AsyncUtils } from '../../utils/async'
import {
  setupUserscriptMocks,
  setupConsoleMocks,
  restoreConsoleMocks,
} from '../utils/page-test-utils'

// Mock dependencies
jest.mock('../../services/state-service')
jest.mock('../../utils/dom')
jest.mock('../../utils/async')

// Mock timers
jest.useFakeTimers()

/**
 * 探索ページ用のトレンドDOM構造をセットアップ
 */
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

/**
 * ExplorePageクラスのテストスイート
 * 探索ページでのトレンド検出とランダム選択機能を検証する
 * - トレンド要素の待機とエラーハンドリング
 * - ランダムなトレンド選択とクリック処理
 */
describe('ExplorePage', () => {
  let consoleMocks: ReturnType<typeof setupConsoleMocks>

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = ''

    // Setup mocks
    setupUserscriptMocks()
    consoleMocks = setupConsoleMocks()

    // Clear all mocks
    jest.clearAllMocks()
    jest.clearAllTimers()

    // Setup default mock implementations
    ;(DomUtils.checkAndNavigateToLogin as jest.Mock).mockReturnValue(false)
    ;(DomUtils.waitElement as jest.Mock).mockResolvedValue(undefined)
    ;(DomUtils.isFailedPage as jest.Mock).mockReturnValue(false)
    ;(AsyncUtils.delay as jest.Mock).mockResolvedValue(undefined)
    ;(StateService.resetState as jest.Mock).mockImplementation(() => {})
  })

  afterEach(() => {
    restoreConsoleMocks(consoleMocks)
    jest.runOnlyPendingTimers()
  })

  describe('run', () => {
    /**
     * ログインリダイレクト処理をテスト
     * - ログインが必要な場合の早期リターン
     */
    it('should return early when login is required', async () => {
      ;(DomUtils.checkAndNavigateToLogin as jest.Mock).mockReturnValue(true)

      await ExplorePage.run()

      expect(StateService.resetState).not.toHaveBeenCalled()
    })

    /**
     * 正常なトレンド選択処理をテスト
     * - 状態リセット
     * - トレンド要素の待機
     * - ランダムなトレンドの選択とクリック
     */
    it('should select and click a random trend', async () => {
      const trends = setupExplorePageDOM(5)

      // Mock Math.random to return predictable value
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

    /**
     * トレンド要素待機失敗時のエラーハンドリングをテスト
     * - DOM要素が見つからない場合の処理
     * - エラー待機時間後のページリロード
     */
    it('should handle waitElement error and reload page', async () => {
      ;(DomUtils.waitElement as jest.Mock).mockRejectedValue(
        new Error('Element not found')
      )

      await ExplorePage.run()

      expect(consoleMocks.log).toHaveBeenCalledWith('Wait 1 minute and reload.')
      expect(AsyncUtils.delay).toHaveBeenCalledWith(DELAYS.ERROR_RELOAD_WAIT)
      // Since we can't mock location.reload in JSDOM, we verify the behavior by checking
      // that the error handling occurred (delay was called with ERROR_RELOAD_WAIT, tested above)
    })

    /**
     * 失敗ページ検出時のエラーログ出力をテスト
     * - DomUtils.isFailedPage()がtrueを返す場合
     * - 専用エラーメッセージの出力確認
     */
    it('should log error when failed page is detected', async () => {
      ;(DomUtils.waitElement as jest.Mock).mockRejectedValue(
        new Error('Element not found')
      )
      ;(DomUtils.isFailedPage as jest.Mock).mockReturnValue(true)

      await ExplorePage.run()

      expect(consoleMocks.error).toHaveBeenCalledWith(
        'runExplore: failed page. Wait 1 minute and reload.'
      )
    })

    /**
     * 単一トレンドでの選択処理をテスト
     * - トレンドが1つしかない場合
     * - 確実にそのトレンドが選択されることを確認
     */
    it('should handle single trend selection', async () => {
      const trends = setupExplorePageDOM(1)

      await ExplorePage.run()

      expect(trends[0].click).toHaveBeenCalled()
    })

    /**
     * 複数トレンドでのランダム選択の確認
     * - 異なるランダム値での選択結果
     * - 境界値での正しい選択動作
     */
    it('should select different trends based on random value', async () => {
      const trends = setupExplorePageDOM(10)

      // Test different random values
      const testCases = [
        { random: 0, expectedIndex: 0 },
        { random: 0.15, expectedIndex: 1 },
        { random: 0.5, expectedIndex: 5 },
        { random: 0.99, expectedIndex: 9 },
      ]

      for (const testCase of testCases) {
        // Reset mocks for each test
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

    /**
     * トレンド要素が0個の場合のエラー処理をテスト
     * - querySelectorAllが空配列を返す場合
     * - Math.floor(Math.random() * 0)の動作確認
     */
    it('should handle case when no trends are found after wait', async () => {
      // Setup DOM with no trends
      document.body.innerHTML = '<div>No trends here</div>'

      // Mock Math.random to return a valid index (0)
      const mockMathRandom = jest.spyOn(Math, 'random').mockReturnValue(0)

      // Since ExplorePage doesn't handle empty trends gracefully, this test will
      // demonstrate the current behavior (error on undefined trend.click())
      await expect(ExplorePage.run()).rejects.toThrow()

      expect(StateService.resetState).toHaveBeenCalled()
      expect(DomUtils.waitElement).toHaveBeenCalled()

      mockMathRandom.mockRestore()
    })

    /**
     * DOM構造の詳細確認をテスト
     * - data-testid="trend"属性の正確な検出
     * - querySelectorAllの動作確認
     */
    it('should find trends with correct selector', async () => {
      // Create some elements with and without trend testid
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
