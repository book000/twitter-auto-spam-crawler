import { URLS, DELAYS } from '@/core/constants'
import { Storage } from '@/core/storage'
import { ConfigManager } from '@/core/config'
import { TweetService } from '@/services/tweet-service'
import { QueueService } from '@/services/queue-service'
import { NotificationService } from '@/services/notification-service'
import { AsyncUtilities } from '@/utils/async'
import { PageErrorHandler } from '@/utils/page-error-handler'
import { TweetPage } from './tweet-page'

export const ExamplePages = {
  async runDownloadJson(): Promise<void> {
    const isIfNeeded = TweetService.isNeedDownload()

    if (isIfNeeded) {
      PageErrorHandler.logAction('download needed. Wait 5 seconds.')
      TweetService.downloadTweets()
      await AsyncUtilities.delay(DELAYS.DOWNLOAD_WAIT)
    }

    ;(async () => {
      try {
        await TweetPage.run(true)
      } catch (error: unknown) {
        PageErrorHandler.logError('Error in TweetPage.run', error)
      }
    })()
  },

  async runLoginNotify(): Promise<void> {
    const authWebhookUrl = ConfigManager.getAuthWebhookUrl()
    try {
      await NotificationService.notifyDiscord(
        ':key: Need to login.',
        () => {
          window.close()
          Storage.setLoginNotified(true)
        },
        false,
        authWebhookUrl
      )
      PageErrorHandler.logAction('Notification sent successfully')
    } catch (error: unknown) {
      PageErrorHandler.logError('Failed to notify login', error)
    }
  },

  async runLoginSuccessNotify(): Promise<void> {
    const authWebhookUrl = ConfigManager.getAuthWebhookUrl()
    try {
      await NotificationService.notifyDiscord(
        ':white_check_mark: Login is successful!',
        () => {
          window.close()
        },
        false,
        authWebhookUrl
      )
      PageErrorHandler.logAction('Notification sent successfully')
    } catch (error: unknown) {
      PageErrorHandler.logError('Failed to notify login success', error)
    }
  },

  async runLockedNotify(): Promise<void> {
    const lockWebhookUrl = ConfigManager.getLockWebhookUrl()
    try {
      await NotificationService.notifyDiscord(
        ':lock: Account is locked!',
        () => {
          window.close()
          // 通知送信成功時のコールバックは空にする（フラグは事前に設定済み）
        },
        true,
        lockWebhookUrl
      )
      PageErrorHandler.logAction('Notification sent successfully')
    } catch (error: unknown) {
      // 通知送信失敗時はフラグをリセット
      Storage.setLockedNotified(false)
      PageErrorHandler.logError('Failed to notify account locked', error)
    }
  },

  async runUnlockedNotify(): Promise<void> {
    const lockWebhookUrl = ConfigManager.getLockWebhookUrl()
    try {
      await NotificationService.notifyDiscord(
        ':unlock: Account is unlocked.',
        () => {
          window.close()
        },
        false,
        lockWebhookUrl
      )
      PageErrorHandler.logAction('Notification sent successfully')
    } catch (error: unknown) {
      PageErrorHandler.logError('Failed to notify account unlocked', error)
    }
  },

  runResetWaiting(): void {
    QueueService.resetWaitingQueue()
    alert(
      'Successfully reset waitingTweets. Navigate to the home page in 3 seconds.'
    )

    setTimeout(() => {
      location.assign(URLS.HOME)
    }, DELAYS.RESET_REDIRECT_WAIT)
  },

  async runUpdateNotify(): Promise<void> {
    const parameters = new URLSearchParams(globalThis.location.search)
    const oldVersion = parameters.get('old')
    const newVersion = parameters.get('new')

    if (!oldVersion || !newVersion) {
      PageErrorHandler.logError('Missing version parameters')
      window.close()
      return
    }

    try {
      await NotificationService.notifyDiscord(
        `🚀 Twitter Auto Spam Crawler がアップデートされました!\n` +
          `📦 ${oldVersion} → ${newVersion}\n` +
          `✨ 新しいバージョンが適用されました。`,
        () => {
          window.close()
        },
        true
      )
      PageErrorHandler.logAction('Update notification sent successfully')
    } catch (error: unknown) {
      PageErrorHandler.logError('Failed to notify update', error)
    }
  },
}
