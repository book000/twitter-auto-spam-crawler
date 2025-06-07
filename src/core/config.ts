// Types from userscript.d.ts are globally available

export const ConfigManager = {
  registerMenuCommand(): void {
    GM_config(
      {
        discordWebhookUrl: {
          name: 'Discord Webhook URL',
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

  getDiscordWebhookUrl(): string {
    return GM_getValue('discordWebhookUrl', '')
  },

  getComment(): string {
    return GM_getValue('comment', '')
  },

  getIsOnlyHome(): boolean {
    const value = GM_getValue('isOnlyHome', 'false')
    // @ts-expect-error string型で比較が行われるため
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return value === 'true'
  },
}
