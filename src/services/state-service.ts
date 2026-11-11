import { Storage } from '@/core/storage'
import { URLS } from '@/core/constants'

export const StateService = {
  /**
   * Clears the login and lock notified flags that are set, and for each one
   * opens the matching example.com notify URL (login success or unlocked).
   */
  resetState(): void {
    if (Storage.isLoginNotified()) {
      console.log('resetState: reset isLoginNotified')
      Storage.setLoginNotified(false)
      window.open(URLS.EXAMPLE_LOGIN_SUCCESS_NOTIFY, '_blank')
    }

    if (!Storage.isLockedNotified()) {
      return
    }

    console.log('resetState: reset isLockedNotified')
    Storage.setLockedNotified(false)
    window.open(URLS.EXAMPLE_UNLOCKED_NOTIFY, '_blank')
  },
}
