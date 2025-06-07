import { DISCORD_MENTION_ID } from '@/core/constants'
import { ConfigManager } from '@/core/config'

export const NotificationService = {
  notifyDiscord(
    message: string,
    callback?: (_response: Response) => void,
    withReply = false
  ): void {
    const mention = withReply ? `<@${DISCORD_MENTION_ID}>` : ''
    const comment = ConfigManager.getComment()
    const data = JSON.stringify({
      content: `${mention} ${message}\n${comment}`,
    })

    const webhookUrl = ConfigManager.getDiscordWebhookUrl()
    if (!webhookUrl) {
      console.warn('notifyDiscord: Discord Webhook URL is not set.')
      return
    }

    fetch(webhookUrl, {
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
