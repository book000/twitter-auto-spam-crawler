import { URLS, DELAYS } from '@/core/constants'
import { Storage } from '@/core/storage'
import { AsyncUtils } from '@/utils/async'
import { PageErrorHandler } from '@/utils/page-error-handler'

/** Handlers for the X pages other than tweet, timeline and search pages. */
export const OtherPages = {
  /** Closes the compose-post page and navigates back. */
  runComposePost(): void {
    const closeButton = document.querySelector(
      'button[data-testid="app-bar-close"][role="button"]'
    )
    if (closeButton) {
      ;(closeButton as HTMLButtonElement).click()
    }
    history.back()
  },

  /**
   * Navigates to the bookmark page every DELAYS.LOCKED_CHECK_INTERVAL to
   * test whether the account is still locked.
   */
  startPeriodicUnlockCheck(): void {
    setInterval(() => {
      PageErrorHandler.logAction(
        'Periodic check - navigating to bookmark page to test unlock status'
      )

      location.href = URLS.BOOKMARK
    }, DELAYS.LOCKED_CHECK_INTERVAL)
  },

  /**
   * Gives Blue Blocker time to process its queue on the bookmark page, then
   * goes to the home page once its toasts are gone.
   *
   * @returns A promise that resolves after the initial wait, before polling
   *   for the toasts begins
   */
  async runProcessBlueBlockerQueue(): Promise<void> {
    PageErrorHandler.logAction('start')

    PageErrorHandler.logAction('waiting for 60 seconds to process queue.')
    await AsyncUtils.delay(DELAYS.PROCESSING_WAIT)

    PageErrorHandler.logAction(
      'checking for #injected-blue-block-toasts > div.toast'
    )
    const interval = setInterval(() => {
      const toastElements = document.querySelectorAll(
        '#injected-blue-block-toasts > div.toast'
      )
      if (toastElements.length === 0) {
        PageErrorHandler.logAction('all toasts are gone.')
        clearInterval(interval)
        location.href = URLS.HOME
      } else {
        PageErrorHandler.logAction(
          `still waiting for toasts: ${toastElements.length}`
        )
      }
    }, DELAYS.CRAWL_INTERVAL)
  },

  /** Opens the login-notify window unless the login notification was sent. */
  runLogin(): void {
    const isLoginNotified = Storage.isLoginNotified()
    if (isLoginNotified) {
      return
    }
    window.open(URLS.EXAMPLE_LOGIN_NOTIFY, '_blank')
  },

  /**
   * Handles a locked account: opens the locked-notify window if it has not
   * been opened yet, and starts the periodic unlock check.
   */
  runLocked(): void {
    PageErrorHandler.logAction(
      'Account is locked, starting continuous unlock detection'
    )

    const isLockedNotified = Storage.isLockedNotified()
    if (isLockedNotified) {
      OtherPages.startPeriodicUnlockCheck()
      return
    }

    // Set the flag before opening the window so the notification is only
    // requested once; ExamplePages.runLockedNotify clears it if sending fails
    Storage.setLockedNotified(true)
    window.open(URLS.EXAMPLE_LOCKED_NOTIFY, '_blank')

    OtherPages.startPeriodicUnlockCheck()
  },
}
