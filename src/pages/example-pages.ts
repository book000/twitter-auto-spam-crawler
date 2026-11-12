import { URLS, DELAYS } from '@/core/constants'
import { Storage } from '@/core/storage'
import { ConfigManager } from '@/core/config'
import { TweetService } from '@/services/tweet-service'
import { QueueService } from '@/services/queue-service'
import { NotificationService } from '@/services/notification-service'
import { AsyncUtils } from '@/utils/async'
import { PageErrorHandler } from '@/utils/page-error-handler'
import { TweetPage } from './tweet-page'

/**
 * Handlers for the example.com helper pages, which this script opens or
 * navigates to in order to download data and send Discord notifications.
 */
export const ExamplePages = {
  /**
   * Downloads the saved tweets as JSON if they exceed the limit and waits a
   * fixed `DELAYS.DOWNLOAD_WAIT`, then starts `TweetPage.run(true)` (not
   * awaited) to open the next waiting tweet, or the bookmark page if none is
   * waiting.
   */
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

  /**
   * Sends the "need to login" notification to the auth webhook, then closes
   * the window and sets the login-notified flag once Discord accepts it.
   */
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

  /**
   * Sends the login-success notification to the auth webhook, then closes
   * the window once Discord accepts it.
   */
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

  /**
   * Sends the account-locked notification, with a mention, to the lock
   * webhook, then closes the window once Discord accepts it. If sending fails,
   * clears the locked-notified flag so the notification is requested again.
   */
  runLockedNotify(): void {
    const lockWebhookUrl = ConfigManager.getLockWebhookUrl()
    NotificationService.notifyDiscord(
      ':lock: Account is locked!',
      () => {
        window.close()
        // The locked-notified flag was already set by OtherPages.runLocked
      },
      true,
      lockWebhookUrl
    )
      .then(() => {
        PageErrorHandler.logAction('Notification sent successfully')
      })
      .catch((error: unknown) => {
        // Clear the flag so the next locked-page visit requests the
        // notification again.
        Storage.setLockedNotified(false)
        PageErrorHandler.logError('Failed to notify account locked', error)
      })
  },

  /**
   * Sends the account-unlocked notification to the lock webhook, then closes
   * the window once Discord accepts it.
   */
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

  /**
   * Empties the waiting queue, then redirects to the home page after
   * DELAYS.RESET_REDIRECT_WAIT.
   */
  runResetWaiting(): void {
    QueueService.resetWaitingQueue()
    alert(
      'Successfully reset waitingTweets. Navigate to the home page in 3 seconds.'
    )

    setTimeout(() => {
      location.href = URLS.HOME
    }, DELAYS.RESET_REDIRECT_WAIT)
  },

  /**
   * Announces a script update, with a mention, using the `old` and `new`
   * version query parameters, then closes the window once Discord accepts it.
   * Closes the window without notifying if either parameter is missing.
   */
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
