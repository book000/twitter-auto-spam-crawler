import { URLS, TIMEOUTS } from '@/core/constants'
import { Storage } from '@/core/storage'

export const OtherPages = {
  runComposePost(): void {
    const closeButton = document.querySelector(
      'button[data-testid="app-bar-close"][role="button"]'
    )
    if (closeButton) {
      ;(closeButton as HTMLButtonElement).click()
    }
    history.back()
  },

  async runProcessBlueBlockerQueue(): Promise<void> {
    console.log('runProcessBlueBlockerQueue: start')

    console.log(
      'runProcessBlueBlockerQueue: waiting for 60 seconds to process queue.'
    )
    await new Promise((resolve) =>
      setTimeout(resolve, TIMEOUTS.PROCESSING_WAIT)
    )

    console.log(
      'runProcessBlueBlockerQueue: checking for #injected-blue-block-toasts > div.toast'
    )
    const interval = setInterval(() => {
      const toastElements = document.querySelectorAll(
        '#injected-blue-block-toasts > div.toast'
      )
      if (toastElements.length === 0) {
        console.log('runProcessBlueBlockerQueue: all toasts are gone.')
        clearInterval(interval)
        location.href = URLS.HOME
      } else {
        console.log(
          'runProcessBlueBlockerQueue: still waiting for toasts',
          toastElements.length
        )
      }
    }, TIMEOUTS.CRAWL_INTERVAL)
  },

  runLogin(): void {
    const isLoginNotified = Storage.isLoginNotified()
    if (isLoginNotified) {
      return
    }
    window.open(URLS.EXAMPLE_LOGIN_NOTIFY, '_blank')
  },

  runLocked(): void {
    setTimeout(() => {
      location.href = URLS.BOOKMARK
    }, TIMEOUTS.LOCKED_REDIRECT_WAIT)

    const isLockedNotified = Storage.isLockedNotified()
    if (isLockedNotified) {
      return
    }
    window.open(URLS.EXAMPLE_LOCKED_NOTIFY, '_blank')
  },
}
