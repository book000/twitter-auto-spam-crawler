import { URLS, DELAYS } from '@/core/constants'
import { Storage } from '@/core/storage'
import { TweetService } from '@/services/tweet-service'
import { QueueService } from '@/services/queue-service'
import { NotificationService } from '@/services/notification-service'
import { AsyncUtils } from '@/utils/async'
import { TweetPage } from './tweet-page'

export const ExamplePages = {
  async runDownloadJson(): Promise<void> {
    const ifNeeded = TweetService.isNeedDownload()

    if (ifNeeded) {
      console.log('runDownloadJson: download needed. Wait 5 seconds.')
      TweetService.downloadTweets()
      await AsyncUtils.delay(DELAYS.DOWNLOAD_WAIT)
    }

    TweetPage.run(true).catch((error: unknown) => {
      console.error('Error in TweetPage.run:', error)
    })
  },

  runLoginNotify(): void {
    NotificationService.notifyDiscord(
      ':key: Need to login.',
      () => {
        window.close()
        Storage.setLoginNotified(true)
      },
      false
    )
      .then(() => {
        console.info('Notification sent successfully')
      })
      .catch((error: unknown) => {
        console.error('Failed to notify login:', error)
      })
  },

  runLoginSuccessNotify(): void {
    NotificationService.notifyDiscord(
      ':white_check_mark: Login is successful!',
      () => {
        window.close()
      },
      false
    )
      .then(() => {
        console.info('Notification sent successfully')
      })
      .catch((error: unknown) => {
        console.error('Failed to notify login success:', error)
      })
  },

  runLockedNotify(): void {
    NotificationService.notifyDiscord(
      ':lock: Account is locked!',
      () => {
        window.close()
        Storage.setLockedNotified(true)
      },
      true
    )
      .then(() => {
        console.info('Notification sent successfully')
      })
      .catch((error: unknown) => {
        console.error('Failed to notify account locked:', error)
      })
  },

  runUnlockedNotify(): void {
    NotificationService.notifyDiscord(
      ':unlock: Account is unlocked.',
      () => {
        window.close()
      },
      false
    )
      .then(() => {
        console.info('Notification sent successfully')
      })
      .catch((error: unknown) => {
        console.error('Failed to notify account unlocked:', error)
      })
  },

  runResetWaiting(): void {
    QueueService.resetWaitingQueue()
    alert(
      'Successfully reset waitingTweets. Navigate to the home page in 3 seconds.'
    )

    setTimeout(() => {
      location.href = URLS.HOME
    }, DELAYS.RESET_REDIRECT_WAIT)
  },

  runUpdateNotify(): void {
    const params = new URLSearchParams(globalThis.location.search)
    const oldVersion = params.get('old')
    const newVersion = params.get('new')

    if (!oldVersion || !newVersion) {
      console.error('runUpdateNotify: Missing version parameters')
      window.close()
      return
    }

    NotificationService.notifyDiscord(
      `🚀 Twitter Auto Spam Crawler がアップデートされました!\n` +
        `📦 ${oldVersion} → ${newVersion}\n` +
        `✨ 新しいバージョンが適用されました。`,
      () => {
        window.close()
      },
      true
    )
      .then(() => {
        console.info('Update notification sent successfully')
      })
      .catch((error: unknown) => {
        console.error('Failed to notify update:', error)
      })
  },
}
