import { URLS, TIMEOUTS } from '@/core/constants'
import { Storage } from '@/core/storage'
import { TweetService } from '@/services/tweet-service'
import { QueueService } from '@/services/queue-service'
import { NotificationService } from '@/services/notification-service'
import { TweetPage } from './tweet-page'

export const ExamplePages = {
  async runDownloadJson(): Promise<void> {
    const ifNeeded = TweetService.isNeedDownload()

    if (ifNeeded) {
      console.log('runDownloadJson: download needed. Wait 5 seconds.')
      TweetService.downloadTweets()
      await new Promise((resolve) =>
        setTimeout(resolve, TIMEOUTS.DOWNLOAD_WAIT)
      )
    }

    TweetPage.run(true).catch((error: unknown) => {
      console.error('Error in TweetPage.run:', error)
    })
  },

  runLoginNotify(): void {
    NotificationService.notifyDiscord(
      'Need to login.',
      () => {
        window.close()
        Storage.setLoginNotified(true)
      },
      false
    )
  },

  runLoginSuccessNotify(): void {
    NotificationService.notifyDiscord(
      ':white_check_mark: Login is successful!',
      () => {
        window.close()
      },
      false
    )
  },

  runLockedNotify(): void {
    NotificationService.notifyDiscord(
      ':warning: Account is locked!',
      () => {
        window.close()
        Storage.setLockedNotified(true)
      },
      true
    )
  },

  runUnlockedNotify(): void {
    NotificationService.notifyDiscord(
      ':white_check_mark: Account is unlocked.',
      () => {
        window.close()
      },
      true
    )
  },

  runResetWaiting(): void {
    QueueService.resetWaitingQueue()
    alert(
      'Successfully reset waitingTweets. Navigate to the home page in 3 seconds.'
    )

    setTimeout(() => {
      location.href = URLS.HOME
    }, TIMEOUTS.RESET_REDIRECT_WAIT)
  },
}
