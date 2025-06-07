import { Storage } from '@/core/storage'
import { URLS } from '@/core/constants'

export const StateService = {
  resetState(): void {
    if (Storage.isLoginNotified()) {
      console.log('resetState: reset isLoginNotified')
      Storage.setLoginNotified(false)
      window.open(URLS.EXAMPLE_LOGIN_SUCCESS_NOTIFY, '_blank')
    }

    if (Storage.isLockedNotified()) {
      console.log('resetState: reset isLockedNotified')
      Storage.setLockedNotified(false)
      window.open(URLS.EXAMPLE_UNLOCKED_NOTIFY, '_blank')
    }
  },
}
