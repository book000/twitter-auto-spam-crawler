import { StateService } from '../../services/state-service'
import { Storage } from '../../core/storage'
import { URLS } from '../../core/constants'
// Import mock before the module under test
import '../../__mocks__/userscript'
import { clearMockStorage } from '../../__mocks__/userscript'

// Mock window.open
const mockWindowOpen = jest.fn()
Object.defineProperty(globalThis, 'open', {
  value: mockWindowOpen,
  writable: true,
})

/**
 * StateServiceクラスのテストスイート
 * アプリケーションの状態管理機能を検証する
 * - ログイン状態とアカウントロック状態の通知管理
 * - 状態リセット時の適切なページ遷移処理
 * - 特定状態の組み合わせに対する条件分岐処理
 * - ストレージと連携した状態の永続化管理
 */
describe('StateService', () => {
  beforeEach(() => {
    clearMockStorage()
    jest.clearAllMocks()
    mockWindowOpen.mockClear()
  })

  /**
   * resetStateメソッドのテスト
   * アプリケーション状態のリセットとページ遷移機能を検証
   * - ログイン通知状態とアカウントロック通知状態の管理
   * - 各状態に対応した適切なページへのリダイレクト
   * - 複数状態の同時リセットとページ遷移の適切な処理
   * - 状態なし時の何もしない動作確認
   */
  describe('resetState', () => {
    /**
     * ログイン通知状態のリセットと成功ページ遷移をテスト
     * - ログイン通知状態のみが有効な場合の処理
     * - 適切なログ出力と状態リセット確認
     * - ログイン成功通知ページへの正確なリダイレクト
     * - アカウントロック状態は変更されないことを確認
     */
    it('should reset login notification state and open success page', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      jest.spyOn(Storage, 'isLoginNotified').mockReturnValue(true)
      jest.spyOn(Storage, 'isLockedNotified').mockReturnValue(false)
      const setLoginNotifiedSpy = jest.spyOn(Storage, 'setLoginNotified')
      const setLockedNotifiedSpy = jest.spyOn(Storage, 'setLockedNotified')

      StateService.resetState()

      expect(consoleSpy).toHaveBeenCalledWith(
        'resetState: reset isLoginNotified'
      )
      expect(setLoginNotifiedSpy).toHaveBeenCalledWith(false)
      expect(mockWindowOpen).toHaveBeenCalledWith(
        URLS.EXAMPLE_LOGIN_SUCCESS_NOTIFY,
        '_blank'
      )
      expect(setLockedNotifiedSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    /**
     * アカウントロック通知状態のリセットとロック解除ページ遷移をテスト
     * - アカウントロック通知状態のみが有効な場合の処理
     * - 適切なログ出力と状態リセット確認
     * - アカウントロック解除通知ページへの正確なリダイレクト
     * - ログイン状態は変更されないことを確認
     */
    it('should reset locked notification state and open unlocked page', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      jest.spyOn(Storage, 'isLoginNotified').mockReturnValue(false)
      jest.spyOn(Storage, 'isLockedNotified').mockReturnValue(true)
      const setLoginNotifiedSpy = jest.spyOn(Storage, 'setLoginNotified')
      const setLockedNotifiedSpy = jest.spyOn(Storage, 'setLockedNotified')

      StateService.resetState()

      expect(consoleSpy).toHaveBeenCalledWith(
        'resetState: reset isLockedNotified'
      )
      expect(setLockedNotifiedSpy).toHaveBeenCalledWith(false)
      expect(mockWindowOpen).toHaveBeenCalledWith(
        URLS.EXAMPLE_UNLOCKED_NOTIFY,
        '_blank'
      )
      expect(setLoginNotifiedSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    /**
     * 両状態が有効な場合の同時リセットと複数ページ遷移をテスト
     * - ログインとアカウントロック両状態が有効な場合の処理
     * - 両方の状態が同時にリセットされることを確認
     * - 両方の通知ページが開かれることを確認
     * - 適切なログ出力とwindow.openの複数回呼び出し
     */
    it('should reset both states when both are notified', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      jest.spyOn(Storage, 'isLoginNotified').mockReturnValue(true)
      jest.spyOn(Storage, 'isLockedNotified').mockReturnValue(true)
      const setLoginNotifiedSpy = jest.spyOn(Storage, 'setLoginNotified')
      const setLockedNotifiedSpy = jest.spyOn(Storage, 'setLockedNotified')

      StateService.resetState()

      expect(consoleSpy).toHaveBeenCalledWith(
        'resetState: reset isLoginNotified'
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        'resetState: reset isLockedNotified'
      )
      expect(setLoginNotifiedSpy).toHaveBeenCalledWith(false)
      expect(setLockedNotifiedSpy).toHaveBeenCalledWith(false)
      expect(mockWindowOpen).toHaveBeenCalledWith(
        URLS.EXAMPLE_LOGIN_SUCCESS_NOTIFY,
        '_blank'
      )
      expect(mockWindowOpen).toHaveBeenCalledWith(
        URLS.EXAMPLE_UNLOCKED_NOTIFY,
        '_blank'
      )
      expect(mockWindowOpen).toHaveBeenCalledTimes(2)

      consoleSpy.mockRestore()
    })

    /**
     * 通知状態がない場合の何もしない動作をテスト
     * - どちらの通知状態も有効でない場合の処理
     * - ログ出力、状態変更、ページ遷移が一切実行されないことを確認
     * - 無駄な処理を防ぐ条件分岐の正常動作確認
     */
    it('should do nothing when no states are notified', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      jest.spyOn(Storage, 'isLoginNotified').mockReturnValue(false)
      jest.spyOn(Storage, 'isLockedNotified').mockReturnValue(false)
      const setLoginNotifiedSpy = jest.spyOn(Storage, 'setLoginNotified')
      const setLockedNotifiedSpy = jest.spyOn(Storage, 'setLockedNotified')

      StateService.resetState()

      expect(consoleSpy).not.toHaveBeenCalled()
      expect(setLoginNotifiedSpy).not.toHaveBeenCalled()
      expect(setLockedNotifiedSpy).not.toHaveBeenCalled()
      expect(mockWindowOpen).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })
})
