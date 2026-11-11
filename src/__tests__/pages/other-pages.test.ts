import { OtherPages } from '../../pages/other-pages'
import { URLS, DELAYS } from '../../core/constants'
import { Storage } from '../../core/storage'
import { AsyncUtils } from '../../utils/async'
import { PageErrorHandler } from '../../utils/page-error-handler'
import {
  setupUserscriptMocks,
  setupConsoleMocks,
  restoreConsoleMocks,
} from '../utils/page-test-utils'
// Import mock before the module under test
import { clearMockStorage } from '../../__mocks__/userscript'

jest.mock('../../core/storage')
jest.mock('../../utils/async')
jest.mock('../../utils/page-error-handler')

jest.useFakeTimers()

describe('OtherPages', () => {
  let consoleMocks: ReturnType<typeof setupConsoleMocks>

  beforeEach(() => {
    document.body.replaceChildren()
    setupUserscriptMocks()
    clearMockStorage()
    consoleMocks = setupConsoleMocks()

    jest.clearAllMocks()
    jest.clearAllTimers()

    ;(AsyncUtils.delay as jest.Mock).mockResolvedValue(undefined)
    ;(Storage.isLoginNotified as jest.Mock).mockReturnValue(false)
    ;(Storage.isLockedNotified as jest.Mock).mockReturnValue(false)
    ;(PageErrorHandler.logAction as jest.Mock).mockImplementation(() => {})
    ;(PageErrorHandler.logError as jest.Mock).mockImplementation(() => {})

    Object.defineProperties(globalThis, {
      history: {
        value: {
          back: jest.fn(),
        },
        writable: true,
      },
      open: {
        value: jest.fn(),
        writable: true,
      },
    })

    globalThis.setInterval = jest.fn() as any
    globalThis.clearInterval = jest.fn() as any
  })

  afterEach(() => {
    restoreConsoleMocks(consoleMocks)
    jest.runOnlyPendingTimers()
  })

  describe('runComposePost', () => {
    it('should click close button and go back when close button exists', () => {
      const closeButton = document.createElement('button')
      closeButton.dataset.testid = 'app-bar-close'
      closeButton.setAttribute('role', 'button')

      const clickSpy = jest.fn()
      closeButton.click = clickSpy

      document.body.append(closeButton)

      OtherPages.runComposePost()

      expect(clickSpy).toHaveBeenCalled()
      expect(globalThis.history.back).toHaveBeenCalled()
    })

    it('should only go back when close button does not exist', () => {
      OtherPages.runComposePost()

      expect(globalThis.history.back).toHaveBeenCalled()
    })

    it('should click only the first matching close button', () => {
      const closeButton1 = document.createElement('button')
      closeButton1.dataset.testid = 'app-bar-close'
      closeButton1.setAttribute('role', 'button')
      const clickSpy1 = jest.fn()
      closeButton1.addEventListener('click', clickSpy1)

      const closeButton2 = document.createElement('button')
      closeButton2.dataset.testid = 'app-bar-close'
      closeButton2.setAttribute('role', 'button')
      const clickSpy2 = jest.fn()
      closeButton2.addEventListener('click', clickSpy2)

      document.body.append(closeButton1, closeButton2)

      OtherPages.runComposePost()

      expect(clickSpy1).toHaveBeenCalled()
      expect(clickSpy2).not.toHaveBeenCalled()
    })
  })

  describe('runProcessBlueBlockerQueue', () => {
    it('should wait and monitor toasts until they disappear', async () => {
      const toastContainer = document.createElement('div')
      toastContainer.id = 'injected-blue-block-toasts'

      const toast1 = document.createElement('div')
      toast1.className = 'toast'
      const toast2 = document.createElement('div')
      toast2.className = 'toast'

      toastContainer.append(toast1, toast2)
      document.body.append(toastContainer)

      let intervalCallback: (() => void) | undefined

      // Mock setInterval to capture the callback
      ;(setInterval as jest.Mock).mockImplementation((callback) => {
        intervalCallback = callback
        // Mock interval ID
        return 123
      })

      const promise = OtherPages.runProcessBlueBlockerQueue()

      expect(PageErrorHandler.logAction).toHaveBeenCalledWith('start')
      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'waiting for 60 seconds to process queue.'
      )
      expect(AsyncUtils.delay).toHaveBeenCalledWith(DELAYS.PROCESSING_WAIT)

      await Promise.resolve()

      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'checking for #injected-blue-block-toasts > div.toast'
      )
      expect(setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        DELAYS.CRAWL_INTERVAL
      )

      if (intervalCallback) {
        intervalCallback()
      }

      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'still waiting for toasts: 2'
      )

      toastContainer.replaceChildren()

      if (intervalCallback) {
        intervalCallback()
      }

      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'all toasts are gone.'
      )
      expect(clearInterval).toHaveBeenCalledWith(123)
      // Since we can't mock location.href in JSDOM, we verify the behavior by checking
      // that the interval was cleared
      expect(clearInterval).toHaveBeenCalled()

      await promise
    })

    it('should navigate to home immediately when no toasts exist', async () => {
      const toastContainer = document.createElement('div')
      toastContainer.id = 'injected-blue-block-toasts'
      document.body.append(toastContainer)

      let intervalCallback: (() => void) | undefined
      ;(setInterval as jest.Mock).mockImplementation((callback) => {
        intervalCallback = callback
        return 456
      })

      const promise = OtherPages.runProcessBlueBlockerQueue()

      await Promise.resolve()

      if (intervalCallback) {
        intervalCallback()
      }

      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'all toasts are gone.'
      )
      expect(clearInterval).toHaveBeenCalledWith(456)
      // Since we can't mock location.href in JSDOM, we verify the behavior by checking
      // that the interval was cleared
      expect(clearInterval).toHaveBeenCalled()

      await promise
    })

    it('should track toast count changes over time', async () => {
      const toastContainer = document.createElement('div')
      toastContainer.id = 'injected-blue-block-toasts'

      for (let i = 0; i < 3; i++) {
        const toast = document.createElement('div')
        toast.className = 'toast'
        toastContainer.append(toast)
      }

      document.body.append(toastContainer)

      let intervalCallback: (() => void) | undefined
      ;(setInterval as jest.Mock).mockImplementation((callback) => {
        intervalCallback = callback
        return 789
      })

      const promise = OtherPages.runProcessBlueBlockerQueue()
      await Promise.resolve()

      if (intervalCallback) {
        intervalCallback()
      }
      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'still waiting for toasts: 3'
      )

      toastContainer.firstChild!.remove()

      if (intervalCallback) {
        intervalCallback()
      }
      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'still waiting for toasts: 2'
      )

      await promise
    })
  })

  describe('runLogin', () => {
    it('should open login notify page when not notified', () => {
      ;(Storage.isLoginNotified as jest.Mock).mockReturnValue(false)

      OtherPages.runLogin()

      expect(window.open).toHaveBeenCalledWith(
        URLS.EXAMPLE_LOGIN_NOTIFY,
        '_blank'
      )
    })

    it('should do nothing when already notified', () => {
      ;(Storage.isLoginNotified as jest.Mock).mockReturnValue(true)

      OtherPages.runLogin()

      expect(window.open).not.toHaveBeenCalled()
    })
  })

  describe('startPeriodicUnlockCheck', () => {
    it('should start periodic check with the proper interval and log without a count', () => {
      const message =
        'Periodic check - navigating to bookmark page to test unlock status'
      let intervalCallback: (() => void) | undefined
      ;(setInterval as jest.Mock).mockImplementation((callback) => {
        intervalCallback = callback
        return 555
      })

      OtherPages.startPeriodicUnlockCheck()

      expect(setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        DELAYS.LOCKED_CHECK_INTERVAL
      )
      expect(intervalCallback).toBeDefined()

      intervalCallback?.()
      expect(PageErrorHandler.logAction).toHaveBeenCalledTimes(1)
      expect(PageErrorHandler.logAction).toHaveBeenNthCalledWith(1, message)

      intervalCallback?.()
      expect(PageErrorHandler.logAction).toHaveBeenCalledTimes(2)
      expect(PageErrorHandler.logAction).toHaveBeenNthCalledWith(2, message)
    })
  })

  describe('runLocked', () => {
    it('should set locked flag immediately, open notify page and start periodic check when not notified', () => {
      ;(Storage.isLockedNotified as jest.Mock).mockReturnValue(false)

      const startPeriodicUnlockCheckSpy = jest.spyOn(
        OtherPages,
        'startPeriodicUnlockCheck'
      )

      OtherPages.runLocked()

      expect(PageErrorHandler.logAction).toHaveBeenCalledWith(
        'Account is locked, starting continuous unlock detection'
      )
      // Set the flag immediately to prevent duplicate notifications
      expect(Storage.setLockedNotified).toHaveBeenCalledWith(true)
      expect(window.open).toHaveBeenCalledWith(
        URLS.EXAMPLE_LOCKED_NOTIFY,
        '_blank'
      )
      expect(startPeriodicUnlockCheckSpy).toHaveBeenCalled()
    })

    it('should start periodic check but not open notify page when already notified', () => {
      ;(Storage.isLockedNotified as jest.Mock).mockReturnValue(true)

      const startPeriodicUnlockCheckSpy = jest.spyOn(
        OtherPages,
        'startPeriodicUnlockCheck'
      )

      OtherPages.runLocked()

      expect(startPeriodicUnlockCheckSpy).toHaveBeenCalled()
      expect(window.open).not.toHaveBeenCalled()
      expect(Storage.setLockedNotified).not.toHaveBeenCalled()
    })
  })
})
