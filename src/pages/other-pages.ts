import { URLS, DELAYS } from '@/core/constants'
import { Storage } from '@/core/storage'
import { AsyncUtils } from '@/utils/async'
import { PageErrorHandler } from '@/utils/page-error-handler'

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

  runLogin(): void {
    const isLoginNotified = Storage.isLoginNotified()
    if (isLoginNotified) {
      return
    }
    window.open(URLS.EXAMPLE_LOGIN_NOTIFY, '_blank')
  },

  runLocked(): void {
    PageErrorHandler.logAction(
      'Account is locked, starting continuous unlock detection'
    )

    const isLockedNotified = Storage.isLockedNotified()
    if (isLockedNotified) {
      // 既に通知済みの場合は、checkCountを初期化し、setIntervalを設定してロック解除検知を継続
      let checkCount = 0

      setInterval(() => {
        checkCount++
        PageErrorHandler.logAction(
          `Periodic check ${checkCount} - navigating to bookmark page to test unlock status`
        )

        location.href = URLS.BOOKMARK
      }, DELAYS.LOCKED_CHECK_INTERVAL)
      return
    }

    // 重複通知を防ぐため、通知ウィンドウを開く前にフラグを設定
    Storage.setLockedNotified(true)
    window.open(URLS.EXAMPLE_LOCKED_NOTIFY, '_blank')

    // ロック解除検知のためのsetIntervalを設定
    let checkCount = 0

    setInterval(() => {
      checkCount++
      PageErrorHandler.logAction(
        `Periodic check ${checkCount} - navigating to bookmark page to test unlock status`
      )

      location.href = URLS.BOOKMARK
    }, DELAYS.LOCKED_CHECK_INTERVAL)
  },
}
