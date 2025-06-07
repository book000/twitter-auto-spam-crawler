import { ConfigManager } from './config'
import { clearMockStorage } from '../__mocks__/userscript'

// Import mock before the module under test
import '../__mocks__/userscript'

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
    })

    it('should add event listener for GM_config_event', () => {
      ConfigManager.registerMenuCommand()

      expect(addEventListener).toHaveBeenCalledWith(
        'GM_config_event',
        expect.any(Function)
      )
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
})
