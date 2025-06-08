import { VersionService } from '../../services/version-service'
import { Storage } from '../../core/storage'
import '../../__mocks__/userscript'

/**
 * VersionServiceクラスのテストスイート
 * スクリプトバージョン管理とアップデート通知機能を検証する
 * - バージョン変更の検出と保存機能
 * - example.com経由のDiscord通知機能
 * - 初回実行時の適切な処理
 * - エラーハンドリング
 */
describe('VersionService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  /**
   * checkVersionAndNotifyメソッドのテスト
   * バージョン変更検出とDiscord通知の統合機能を検証
   */
  describe('checkVersionAndNotify', () => {
    it('should store version without notification on first run', () => {
      // Arrange
      jest.spyOn(Storage, 'getStoredVersion').mockReturnValue('')
      const setStoredVersionSpy = jest
        .spyOn(Storage, 'setStoredVersion')
        .mockImplementation()
      const notifyVersionUpdateSpy = jest
        .spyOn(VersionService, 'notifyVersionUpdate')
        .mockImplementation()

      // Act
      VersionService.checkVersionAndNotify('1.0.0')

      // Assert
      expect(setStoredVersionSpy).toHaveBeenCalledWith('1.0.0')
      expect(notifyVersionUpdateSpy).not.toHaveBeenCalled()
    })

    it('should do nothing when version is unchanged', () => {
      // Arrange
      jest.spyOn(Storage, 'getStoredVersion').mockReturnValue('1.0.0')
      const setStoredVersionSpy = jest
        .spyOn(Storage, 'setStoredVersion')
        .mockImplementation()
      const notifyVersionUpdateSpy = jest
        .spyOn(VersionService, 'notifyVersionUpdate')
        .mockImplementation()

      // Act
      VersionService.checkVersionAndNotify('1.0.0')

      // Assert
      expect(setStoredVersionSpy).not.toHaveBeenCalled()
      expect(notifyVersionUpdateSpy).not.toHaveBeenCalled()
    })

    it('should notify and update version when version changes', () => {
      // Arrange
      jest.spyOn(Storage, 'getStoredVersion').mockReturnValue('1.0.0')
      const setStoredVersionSpy = jest
        .spyOn(Storage, 'setStoredVersion')
        .mockImplementation()
      const notifyVersionUpdateSpy = jest
        .spyOn(VersionService, 'notifyVersionUpdate')
        .mockImplementation()

      // Act
      VersionService.checkVersionAndNotify('1.1.0')

      // Assert
      expect(notifyVersionUpdateSpy).toHaveBeenCalledWith('1.0.0', '1.1.0')
      expect(setStoredVersionSpy).toHaveBeenCalledWith('1.1.0')
    })

    it('should not update version when notification fails', () => {
      // Arrange
      jest.spyOn(Storage, 'getStoredVersion').mockReturnValue('1.0.0')
      const setStoredVersionSpy = jest
        .spyOn(Storage, 'setStoredVersion')
        .mockImplementation()
      const notifyVersionUpdateSpy = jest
        .spyOn(VersionService, 'notifyVersionUpdate')
        .mockImplementation(() => {
          throw new Error('Notification failed')
        })

      // Act
      VersionService.checkVersionAndNotify('1.1.0')

      // Assert
      expect(notifyVersionUpdateSpy).toHaveBeenCalledWith('1.0.0', '1.1.0')
      expect(setStoredVersionSpy).not.toHaveBeenCalled()
    })
  })

  /**
   * notifyVersionUpdateメソッドのテスト
   * example.com経由のDiscord通知機能を検証
   */
  describe('notifyVersionUpdate', () => {
    it('should open correct URL with window.open', () => {
      // Arrange
      const windowOpenSpy = jest.spyOn(globalThis, 'open').mockImplementation()

      // Act
      VersionService.notifyVersionUpdate('1.0.0', '1.1.0')

      // Assert
      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://example.com/?update-notify&old=1.0.0&new=1.1.0',
        '_blank'
      )

      windowOpenSpy.mockRestore()
    })

    it('should properly encode special characters in version strings', () => {
      // Arrange
      const windowOpenSpy = jest.spyOn(globalThis, 'open').mockImplementation()

      // Act
      VersionService.notifyVersionUpdate('1.0.0-beta+build.1', '1.1.0-alpha')

      // Assert
      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://example.com/?update-notify&old=1.0.0-beta%2Bbuild.1&new=1.1.0-alpha',
        '_blank'
      )

      windowOpenSpy.mockRestore()
    })

    it('should throw error when window.open fails', () => {
      // Arrange
      const windowOpenSpy = jest
        .spyOn(globalThis, 'open')
        .mockImplementation(() => {
          throw new Error('Failed to open window')
        })

      // Act & Assert
      expect(() => {
        VersionService.notifyVersionUpdate('1.0.0', '1.1.0')
      }).toThrow('Failed to open window')

      windowOpenSpy.mockRestore()
    })
  })
})
