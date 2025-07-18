import { URLS, DELAYS } from '@/core/constants'
import { Storage } from '@/core/storage'
import { ConfigManager } from '@/core/config'
import { TweetService } from '@/services/tweet-service'
import { QueueService } from '@/services/queue-service'
import { NotificationService } from '@/services/notification-service'
import { AsyncUtils } from '@/utils/async'
import { PageErrorHandler } from '@/utils/page-error-handler'
import { TweetPage } from './tweet-page'

export const ExamplePages = {
  async runDownloadJson(): Promise<void> {
    const ifNeeded = TweetService.isNeedDownload()

    if (ifNeeded) {
      PageErrorHandler.logAction('download needed. Wait 5 seconds.')
      TweetService.downloadTweets()
      await AsyncUtils.delay(DELAYS.DOWNLOAD_WAIT)
    }

    TweetPage.run(true).catch((error: unknown) => {
      PageErrorHandler.logError('Error in TweetPage.run', error)
    })
  },

  runLoginNotify(): void {
    const authWebhookUrl = ConfigManager.getAuthWebhookUrl()
    NotificationService.notifyDiscord(
      ':key: Need to login.',
      () => {
        window.close()
        Storage.setLoginNotified(true)
      },
      false,
      authWebhookUrl
    )
      .then(() => {
        PageErrorHandler.logAction('Notification sent successfully')
      })
      .catch((error: unknown) => {
        PageErrorHandler.logError('Failed to notify login', error)
      })
  },

  runLoginSuccessNotify(): void {
    const authWebhookUrl = ConfigManager.getAuthWebhookUrl()
    NotificationService.notifyDiscord(
      ':white_check_mark: Login is successful!',
      () => {
        window.close()
      },
      false,
      authWebhookUrl
    )
      .then(() => {
        PageErrorHandler.logAction('Notification sent successfully')
      })
      .catch((error: unknown) => {
        PageErrorHandler.logError('Failed to notify login success', error)
      })
  },

  runLockedNotify(): void {
    const lockWebhookUrl = ConfigManager.getLockWebhookUrl()
    NotificationService.notifyDiscord(
      ':lock: Account is locked!',
      () => {
        window.close()
        Storage.setLockedNotified(true)
      },
      true,
      lockWebhookUrl
    )
      .then(() => {
        PageErrorHandler.logAction('Notification sent successfully')
      })
      .catch((error: unknown) => {
        PageErrorHandler.logError('Failed to notify account locked', error)
      })
  },

  runUnlockedNotify(): void {
    const lockWebhookUrl = ConfigManager.getLockWebhookUrl()
    NotificationService.notifyDiscord(
      ':unlock: Account is unlocked.',
      () => {
        window.close()
      },
      false,
      lockWebhookUrl
    )
      .then(() => {
        PageErrorHandler.logAction('Notification sent successfully')
      })
      .catch((error: unknown) => {
        PageErrorHandler.logError('Failed to notify account unlocked', error)
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
      PageErrorHandler.logError('Missing version parameters')
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
        PageErrorHandler.logAction('Update notification sent successfully')
      })
      .catch((error: unknown) => {
        PageErrorHandler.logError('Failed to notify update', error)
      })
  },
}
