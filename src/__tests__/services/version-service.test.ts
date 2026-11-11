import { VersionService } from '../../services/version-service'
import { Storage } from '../../core/storage'
import '../../__mocks__/userscript'

describe('VersionService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('checkVersionAndNotify', () => {
    it('should store version without notification on first run', () => {
      jest.spyOn(Storage, 'getStoredVersion').mockReturnValue('')
      const setStoredVersionSpy = jest
        .spyOn(Storage, 'setStoredVersion')
        .mockImplementation()
      const notifyVersionUpdateSpy = jest
        .spyOn(VersionService, 'notifyVersionUpdate')
        .mockImplementation()

      VersionService.checkVersionAndNotify('1.0.0')

      expect(setStoredVersionSpy).toHaveBeenCalledWith('1.0.0')
      expect(notifyVersionUpdateSpy).not.toHaveBeenCalled()
    })

    it('should do nothing when version is unchanged', () => {
      jest.spyOn(Storage, 'getStoredVersion').mockReturnValue('1.0.0')
      const setStoredVersionSpy = jest
        .spyOn(Storage, 'setStoredVersion')
        .mockImplementation()
      const notifyVersionUpdateSpy = jest
        .spyOn(VersionService, 'notifyVersionUpdate')
        .mockImplementation()

      VersionService.checkVersionAndNotify('1.0.0')

      expect(setStoredVersionSpy).not.toHaveBeenCalled()
      expect(notifyVersionUpdateSpy).not.toHaveBeenCalled()
    })

    it('should notify and update version when version changes', () => {
      jest.spyOn(Storage, 'getStoredVersion').mockReturnValue('1.0.0')
      const setStoredVersionSpy = jest
        .spyOn(Storage, 'setStoredVersion')
        .mockImplementation()
      const notifyVersionUpdateSpy = jest
        .spyOn(VersionService, 'notifyVersionUpdate')
        .mockImplementation()

      VersionService.checkVersionAndNotify('1.1.0')

      expect(notifyVersionUpdateSpy).toHaveBeenCalledWith('1.0.0', '1.1.0')
      expect(setStoredVersionSpy).toHaveBeenCalledWith('1.1.0')
    })

    it('should not update version when notification fails', () => {
      jest.spyOn(Storage, 'getStoredVersion').mockReturnValue('1.0.0')
      const setStoredVersionSpy = jest
        .spyOn(Storage, 'setStoredVersion')
        .mockImplementation()
      const notifyVersionUpdateSpy = jest
        .spyOn(VersionService, 'notifyVersionUpdate')
        .mockImplementation(() => {
          throw new Error('Notification failed')
        })

      VersionService.checkVersionAndNotify('1.1.0')

      expect(notifyVersionUpdateSpy).toHaveBeenCalledWith('1.0.0', '1.1.0')
      expect(setStoredVersionSpy).not.toHaveBeenCalled()
    })
  })

  describe('notifyVersionUpdate', () => {
    it('should open correct URL with window.open', () => {
      const windowOpenSpy = jest
        .spyOn(globalThis, 'open')
        .mockReturnValue({} as Window)

      VersionService.notifyVersionUpdate('1.0.0', '1.1.0')

      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://example.com/?update-notify&old=1.0.0&new=1.1.0',
        '_blank'
      )

      windowOpenSpy.mockRestore()
    })

    it('should properly encode special characters in version strings', () => {
      const windowOpenSpy = jest
        .spyOn(globalThis, 'open')
        .mockReturnValue({} as Window)

      VersionService.notifyVersionUpdate('1.0.0-beta+build.1', '1.1.0-alpha')

      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://example.com/?update-notify&old=1.0.0-beta%2Bbuild.1&new=1.1.0-alpha',
        '_blank'
      )

      windowOpenSpy.mockRestore()
    })

    it('should throw error when window.open fails', () => {
      const windowOpenSpy = jest
        .spyOn(globalThis, 'open')
        .mockImplementation(() => {
          throw new Error('Failed to open window')
        })

      expect(() => {
        VersionService.notifyVersionUpdate('1.0.0', '1.1.0')
      }).toThrow('Failed to open window')

      windowOpenSpy.mockRestore()
    })

    it('should throw error when popup is blocked', () => {
      const windowOpenSpy = jest.spyOn(globalThis, 'open').mockReturnValue(null)

      expect(() => {
        VersionService.notifyVersionUpdate('1.0.0', '1.1.0')
      }).toThrow('Popup blocked')

      windowOpenSpy.mockRestore()
    })
  })
})
