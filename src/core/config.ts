// Types from userscript.d.ts are globally available

/**
 * Reads and registers the user settings, which are stored through the
 * GM_config library and read back with GM_getValue.
 */
export const ConfigManager = {
  /**
   * Registers the settings menu in Tampermonkey and logs the event detail
   * whenever the configuration changes.
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
   * Gets the default Discord webhook URL.
   *
   * @returns The configured URL, or an empty string if it is not set.
   */
  getDiscordWebhookUrl(): string {
    return GM_getValue('discordWebhookUrl', '')
  },

  /**
   * Gets the webhook URL for login notifications (login required and login
   * succeeded).
   *
   * @returns The auth webhook URL, falling back to the default webhook URL
   * when it is not set.
   */
  getAuthWebhookUrl(): string {
    const authUrl = GM_getValue('authWebhookUrl', '')

    return authUrl || ConfigManager.getDiscordWebhookUrl()
  },

  /**
   * Gets the webhook URL for account lock and unlock notifications.
   *
   * @returns The lock webhook URL, falling back to the default webhook URL
   * when it is not set.
   */
  getLockWebhookUrl(): string {
    const lockUrl = GM_getValue('lockWebhookUrl', '')

    return lockUrl || ConfigManager.getDiscordWebhookUrl()
  },

  /**
   * Gets the user comment that is appended to every Discord message.
   *
   * @returns The configured comment, or an empty string if it is not set.
   */
  getComment(): string {
    return GM_getValue('comment', '')
  },

  /**
   * Gets whether crawling is restricted to the home page.
   *
   * The setting is stored as the string `'true'` or `'false'`.
   *
   * @returns `true` only when the stored value is `'true'`.
   */
  getIsOnlyHome(): boolean {
    const value = GM_getValue('isOnlyHome', 'false')

    return value === 'true'
  },
}
