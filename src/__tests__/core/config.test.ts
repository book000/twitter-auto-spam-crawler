import { ConfigManager } from '../../core/config'
import { clearMockStorage } from '../../__mocks__/userscript'

describe('ConfigManager', () => {
  beforeEach(() => {
    clearMockStorage()
    jest.clearAllMocks()
  })

  describe('registerMenuCommand', () => {
    it('should call GM_config with correct configuration', () => {
      ConfigManager.registerMenuCommand()

      expect(GM_config).toHaveBeenCalledWith(
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
    })

    it('should add event listener for GM_config_event', () => {
      ConfigManager.registerMenuCommand()

      expect(addEventListener).toHaveBeenCalledWith(
        'GM_config_event',
        expect.any(Function)
      )
    })
  })

  describe('GM_config_event logging', () => {
    it('should mask webhook URLs in the logged event detail', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      ConfigManager.registerMenuCommand()
      const calls = (addEventListener as jest.Mock).mock.calls as [
        string,
        (event: unknown) => void,
      ][]
      const listener = calls.at(-1)?.[1]
      if (!listener) throw new Error('GM_config_event listener not registered')

      listener({
        detail: {
          name: 'discordWebhookUrl',
          before: '',
          after: 'https://discord.com/api/webhooks/123/secret-token',
          nested: ['see https://example.com/hook?x=1 now'],
          count: 2,
        },
      })

      expect(logSpy).toHaveBeenCalledWith({
        name: 'discordWebhookUrl',
        before: '',
        after: '[masked URL]',
        nested: ['see [masked URL] now'],
        count: 2,
      })
      logSpy.mockRestore()
    })
  })

  describe('getDiscordWebhookUrl', () => {
    it('should return empty string by default', () => {
      const result = ConfigManager.getDiscordWebhookUrl()
      expect(result).toBe('')
      expect(GM_getValue).toHaveBeenCalledWith('discordWebhookUrl', '')
    })

    it('should return stored webhook URL', () => {
      const testUrl = 'https://discord.com/api/webhooks/test'
      ;(GM_getValue as jest.Mock).mockReturnValueOnce(testUrl)

      const result = ConfigManager.getDiscordWebhookUrl()
      expect(result).toBe(testUrl)
      expect(GM_getValue).toHaveBeenCalledWith('discordWebhookUrl', '')
    })
  })

  describe('getComment', () => {
    it('should return empty string by default', () => {
      const result = ConfigManager.getComment()
      expect(result).toBe('')
      expect(GM_getValue).toHaveBeenCalledWith('comment', '')
    })

    it('should return stored comment', () => {
      const testComment = 'Test comment'
      ;(GM_getValue as jest.Mock).mockReturnValueOnce(testComment)

      const result = ConfigManager.getComment()
      expect(result).toBe(testComment)
      expect(GM_getValue).toHaveBeenCalledWith('comment', '')
    })
  })

  describe('getIsOnlyHome', () => {
    it('should return false by default', () => {
      const result = ConfigManager.getIsOnlyHome()
      expect(result).toBe(false)
      expect(GM_getValue).toHaveBeenCalledWith('isOnlyHome', 'false')
    })

    it('should return true when stored value is "true"', () => {
      ;(GM_getValue as jest.Mock).mockReturnValueOnce('true')

      const result = ConfigManager.getIsOnlyHome()
      expect(result).toBe(true)
      expect(GM_getValue).toHaveBeenCalledWith('isOnlyHome', 'false')
    })

    it('should return false when stored value is "false"', () => {
      ;(GM_getValue as jest.Mock).mockReturnValueOnce('false')

      const result = ConfigManager.getIsOnlyHome()
      expect(result).toBe(false)
    })

    it('should return false for other string values', () => {
      ;(GM_getValue as jest.Mock).mockReturnValueOnce('other')

      const result = ConfigManager.getIsOnlyHome()
      expect(result).toBe(false)
    })
  })

  describe('getAuthWebhookUrl', () => {
    it('should return authWebhookUrl when set', () => {
      const authUrl = 'https://discord.com/api/webhooks/auth'
      ;(GM_getValue as jest.Mock).mockReturnValueOnce(authUrl) // authWebhookUrl

      const result = ConfigManager.getAuthWebhookUrl()
      expect(result).toBe(authUrl)
      expect(GM_getValue).toHaveBeenCalledWith('authWebhookUrl', '')
    })

    it('should fallback to discordWebhookUrl when authWebhookUrl is not set', () => {
      const defaultUrl = 'https://discord.com/api/webhooks/default'
      ;(GM_getValue as jest.Mock)
        .mockReturnValueOnce('') // authWebhookUrl
        .mockReturnValueOnce(defaultUrl) // discordWebhookUrl

      const result = ConfigManager.getAuthWebhookUrl()
      expect(result).toBe(defaultUrl)
      expect(GM_getValue).toHaveBeenCalledWith('authWebhookUrl', '')
      expect(GM_getValue).toHaveBeenCalledWith('discordWebhookUrl', '')
    })

    it('should return empty string when both URLs are not set', () => {
      ;(GM_getValue as jest.Mock)
        .mockReturnValueOnce('') // authWebhookUrl
        .mockReturnValueOnce('') // discordWebhookUrl

      const result = ConfigManager.getAuthWebhookUrl()
      expect(result).toBe('')
    })
  })

  describe('getLockWebhookUrl', () => {
    it('should return lockWebhookUrl when set', () => {
      const lockUrl = 'https://discord.com/api/webhooks/lock'
      ;(GM_getValue as jest.Mock).mockReturnValueOnce(lockUrl) // lockWebhookUrl

      const result = ConfigManager.getLockWebhookUrl()
      expect(result).toBe(lockUrl)
      expect(GM_getValue).toHaveBeenCalledWith('lockWebhookUrl', '')
    })

    it('should fallback to discordWebhookUrl when lockWebhookUrl is not set', () => {
      const defaultUrl = 'https://discord.com/api/webhooks/default'
      ;(GM_getValue as jest.Mock)
        .mockReturnValueOnce('') // lockWebhookUrl
        .mockReturnValueOnce(defaultUrl) // discordWebhookUrl

      const result = ConfigManager.getLockWebhookUrl()
      expect(result).toBe(defaultUrl)
      expect(GM_getValue).toHaveBeenCalledWith('lockWebhookUrl', '')
      expect(GM_getValue).toHaveBeenCalledWith('discordWebhookUrl', '')
    })

    it('should return empty string when both URLs are not set', () => {
      ;(GM_getValue as jest.Mock)
        .mockReturnValueOnce('') // lockWebhookUrl
        .mockReturnValueOnce('') // discordWebhookUrl

      const result = ConfigManager.getLockWebhookUrl()
      expect(result).toBe('')
    })
  })
})
