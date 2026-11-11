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
   * Resolves once Discord accepted the message, or immediately without sending
   * when no webhook URL is set (a warning is logged). Rejects when the request
   * fails or Discord answers with a non-2xx status, so callers can retry.
   *
   * @param message - Message body
   * @param callback - Called with the response only when Discord answered with
   * an ok status. Not called when the request fails, when the response is
   * non-2xx, or when no webhook URL is set. An error it throws rejects the
   * returned promise.
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
    }).then(
      (response) => {
        if (!response.ok) {
          console.error('notifyDiscord: failed', response)
          throw new Error(
            `notifyDiscord: Discord webhook responded with status ${response.status}`
          )
        }
        console.log('notifyDiscord: success')
        if (callback) {
          callback(response)
        }
      },
      (error: unknown) => {
        console.error('notifyDiscord: fetch error', error)
        throw error
      }
    )
  },
}
