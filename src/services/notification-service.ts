import { DISCORD_MENTION_ID } from '@/core/constants'
import { ConfigManager } from '@/core/config'

/**
 * 外部サービスへの通知機能を提供するクラス
 *
 * Discord Webhook を使用したメッセージ送信機能を提供し、
 * スパムツイート検出時やシステム更新時の通知に使用される。
 */
export const NotificationService = {
  /**
   * Discord Webhook を使用してメッセージを送信する
   *
   * 指定されたメッセージをDiscord Webhookを通じて送信する。
   * メンション付きオプション、ユーザー設定コメントの自動追加、
   * エラーハンドリングを含む包括的な通知機能を提供する。
   *
   * @param {string} message - 送信するメッセージ内容
   * @param {(_response: Response) => void} [callback] - レスポンス受信時のコールバック関数
   * @param {boolean} [withReply=false] - true の場合、メッセージにメンションを付加
   * @param {string} [customWebhookUrl] - カスタムWebhook URL。指定時はConfigManagerの設定より優先される
   * @returns {Promise<void>} 送信完了を表すPromise
   *
   * @throws {Error} ネットワークエラーまたはDiscord API エラー
   *
   * @example
   * ```typescript
   * // 基本的な通知
   * await NotificationService.notifyDiscord('新しいスパムツイートを検出しました')
   *
   * // メンション付き通知
   * await NotificationService.notifyDiscord('緊急：大量のスパムを検出', undefined, true)
   *
   * // カスタムWebhook URL使用
   * await NotificationService.notifyDiscord('ログイン必要', undefined, false, 'https://discord.com/api/webhooks/...')
   *
   * // コールバック付き通知
   * NotificationService.notifyDiscord('メッセージ', (response) => {
   *   console.log('送信ステータス:', response.status)
   * })
   * ```
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
