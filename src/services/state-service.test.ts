import { StateService } from './state-service'
import { Storage } from '../core/storage'
import { URLS } from '../core/constants'
import { clearMockStorage } from '../__mocks__/userscript'

// Import mock before the module under test
import '../__mocks__/userscript'

// Mock window.open
const mockWindowOpen = jest.fn()
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
})

describe('StateService', () => {
  beforeEach(() => {
    clearMockStorage()
    jest.clearAllMocks()
    mockWindowOpen.mockClear()
  })

  describe('resetState', () => {
    it('should reset login notification state and open success page', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
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

    it('should reset locked notification state and open unlocked page', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
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

    it('should reset both states when both are notified', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
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

    it('should do nothing when no states are notified', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
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
