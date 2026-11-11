import { DISCORD_MENTION_ID } from '@/core/constants'
import { ConfigManager } from '@/core/config'

/**
 * Sends notifications to Discord through a webhook.
 */
export const NotificationService = {
  /**
   * Posts a message to a Discord webhook, followed by the user comment from
   * `ConfigManager`.
   *
   * Never rejects: if the webhook URL is empty a warning is logged, and fetch
   * errors and non-2xx responses are logged and swallowed.
   *
   * @param message - Message body
   * @param callback - Called with the response once the request completes,
   * including non-2xx responses. Not called when the request fails or when no
   * webhook URL is set.
   * @param withReply - Prefix the message with a mention of
   * `DISCORD_MENTION_ID`
   * @param customWebhookUrl - Webhook URL that takes precedence over the
   * default one from `ConfigManager`
   */
  notifyDiscord(
    message: string,
    callback?: (_response: Response) => void,
    withReply = false,
    customWebhookUrl?: string
  ): Promise<void> {
    const mention = withReply ? `<@${DISCORD_MENTION_ID}>` : ''
    const comment = ConfigManager.getComment()
    const data = JSON.stringify({
      content: `${mention} ${message}\n${comment}`,
    })

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const webhookUrl = customWebhookUrl || ConfigManager.getDiscordWebhookUrl()
    if (!webhookUrl) {
      console.warn('notifyDiscord: Discord Webhook URL is not set.')
      return Promise.resolve()
    }

    return fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data,
    })
      .then((response) => {
        if (response.ok) {
          console.log('notifyDiscord: success')
        } else {
          console.error('notifyDiscord: failed', response)
        }
        if (callback) {
          callback(response)
        }
      })
      .catch((error: unknown) => {
        console.error('notifyDiscord: fetch error', error)
      })
  },
}
