// Types from userscript.d.ts are globally available

/**
 * アプリケーション設定の管理を行うクラス
 *
 * Tampermonkey の GM_config を使用してユーザー設定の読み書きを行い、
 * メニューコマンドの登録とユーザーインターフェースを提供する。
 *
 * @example
 * ```typescript
 * // 設定メニューの登録
 * ConfigManager.registerMenuCommand()
 *
 * // Discord Webhook URL の取得
 * const webhookUrl = ConfigManager.getDiscordWebhookUrl()
 * ```
 */
export const ConfigManager = {
  /**
   * Tampermonkey にユーザー設定メニューを登録する
   *
   * GM_config を使用して「設定」メニューを追加し、
   * ユーザーがブラウザ上で設定を変更できるUIを提供する。
   * Discord Webhook URL、コメント、ホーム限定モードの設定項目を含む。
   *
   * @throws {Error} GM_config が利用できない場合
   *
   * @example
   * ```typescript
   * // ページ読み込み時に設定メニューを登録
   * ConfigManager.registerMenuCommand()
   * ```
   */
  registerMenuCommand(): void {
    GM_config(
      {
        discordWebhookUrl: {
          name: 'Discord Webhook URL (default)',
          value: '',
          input: 'prompt',
        },
        authWebhookUrl: {
          name: 'Auth Discord Webhook URL (for login notifications)',
          value: '',
          input: 'prompt',
        },
        lockWebhookUrl: {
          name: 'Lock Discord Webhook URL (for lock/unlock notifications)',
          value: '',
          input: 'prompt',
        },
        comment: {
          name: 'Comment',
          value: '',
          input: 'prompt',
        },
        isOnlyHome: {
          name: 'Only Home crawling',
          value: 'false',
          input: 'prompt',
        },
      },
      false
    )

    addEventListener(GM_config_event, (event: Event) => {
      console.log((event as CustomEvent).detail)
    })
  },

  /**
   * Discord Webhook URL を取得する
   *
   * ユーザーが設定したDiscord Webhook URLを GM_getValue から取得する。
   * 未設定の場合は空文字列を返す。
   *
   * @returns {string} ユーザーが設定したDiscord Webhook URL。
   *                   未設定の場合は空文字列を返す。
   *
   * @example
   * ```typescript
   * const webhookUrl = ConfigManager.getDiscordWebhookUrl()
   * if (webhookUrl) {
   *   await NotificationService.notifyDiscord('メッセージ')
   * }
   * ```
   */
  getDiscordWebhookUrl(): string {
    return GM_getValue('discordWebhookUrl', '')
  },

  /**
   * 認証関連通知用のDiscord Webhook URL を取得する
   *
   * ログイン必要/ログイン成功通知用のWebhook URLを取得する。
   * 未設定の場合はデフォルトのDiscord Webhook URLにフォールバックする。
   *
   * @returns {string} 認証関連通知用のWebhook URL。
   *                   未設定の場合はデフォルトWebhook URLを返す。
   *
   * @example
   * ```typescript
   * const authWebhookUrl = ConfigManager.getAuthWebhookUrl()
   * await NotificationService.notifyDiscord('ログイン必要', undefined, false, authWebhookUrl)
   * ```
   */
  getAuthWebhookUrl(): string {
    const authUrl = GM_getValue<string>('authWebhookUrl', '')

    return authUrl || this.getDiscordWebhookUrl()
  },

  /**
   * ロック関連通知用のDiscord Webhook URL を取得する
   *
   * アカウントロック/ロック解除通知用のWebhook URLを取得する。
   * 未設定の場合はデフォルトのDiscord Webhook URLにフォールバックする。
   *
   * @returns {string} ロック関連通知用のWebhook URL。
   *                   未設定の場合はデフォルトWebhook URLを返す。
   *
   * @example
   * ```typescript
   * const lockWebhookUrl = ConfigManager.getLockWebhookUrl()
   * await NotificationService.notifyDiscord('アカウントロック', undefined, true, lockWebhookUrl)
   * ```
   */
  getLockWebhookUrl(): string {
    const lockUrl = GM_getValue<string>('lockWebhookUrl', '')

    return lockUrl || this.getDiscordWebhookUrl()
  },

  /**
   * ツイート保存時のコメント設定を取得する
   *
   * ユーザーが設定したコメント文字列を GM_getValue から取得する。
   * このコメントはDiscord通知時にメッセージと一緒に送信される。
   *
   * @returns {string} ユーザーが設定したコメント文字列。
   *                   未設定の場合は空文字列を返す。
   *
   * @example
   * ```typescript
   * const comment = ConfigManager.getComment()
   * const tweetData = { ...tweet, comment }
   * ```
   */
  getComment(): string {
    return GM_getValue('comment', '')
  },

  /**
   * ホームページ限定モードの設定を取得する
   *
   * ユーザーが設定したホーム限定モードのオン/オフ状態を GM_getValue から取得する。
   * true の場合、クロール処理はホームページでのみ実行される。
   *
   * @returns {boolean} true の場合、ホームページでのみクロール実行
   *                    false の場合、全ページでクロール実行
   *
   * @example
   * ```typescript
   * if (ConfigManager.getIsOnlyHome() && !isHomePage()) {
   *   return // ホーム限定モードでホーム以外なので終了
   * }
   * ```
   */
  getIsOnlyHome(): boolean {
    const value = GM_getValue<string>('isOnlyHome', 'false')

    return value === 'true'
  },
}
