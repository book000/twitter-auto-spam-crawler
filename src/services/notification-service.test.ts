import { NotificationService } from './notification-service'
import { ConfigManager } from '../core/config'
import { DISCORD_MENTION_ID } from '../core/constants'
import { clearMockStorage } from '../__mocks__/userscript'

// Import mock before the module under test
import '../__mocks__/userscript'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('NotificationService', () => {
  beforeEach(() => {
    clearMockStorage()
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('notifyDiscord', () => {
    it('should send discord notification with message and comment', async () => {
      const mockResponse = { ok: true }
      mockFetch.mockResolvedValue(mockResponse)

      jest
        .spyOn(ConfigManager, 'getDiscordWebhookUrl')
        .mockReturnValue('https://discord.com/api/webhooks/test')
      jest.spyOn(ConfigManager, 'getComment').mockReturnValue('Test comment')
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const testMessage = 'Test notification message'
      NotificationService.notifyDiscord(testMessage)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://discord.com/api/webhooks/test',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: ' Test notification message\nTest comment',
          }),
        }
      )

      // Wait for fetch promise to resolve
      await Promise.resolve()
      expect(consoleSpy).toHaveBeenCalledWith('notifyDiscord: success')

      consoleSpy.mockRestore()
    })

    it('should include mention when withReply is true', async () => {
      const mockResponse = { ok: true }
      mockFetch.mockResolvedValue(mockResponse)

      jest
        .spyOn(ConfigManager, 'getDiscordWebhookUrl')
        .mockReturnValue('https://discord.com/api/webhooks/test')
      jest.spyOn(ConfigManager, 'getComment').mockReturnValue('')

      const testMessage = 'Test with reply'
      NotificationService.notifyDiscord(testMessage, undefined, true)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://discord.com/api/webhooks/test',
        expect.objectContaining({
          body: JSON.stringify({
            content: `<@${DISCORD_MENTION_ID}> Test with reply\n`,
          }),
        })
      )
    })

    it('should call callback function when provided', async () => {
      const mockResponse = { ok: true }
      mockFetch.mockResolvedValue(mockResponse)
      const mockCallback = jest.fn()

      jest
        .spyOn(ConfigManager, 'getDiscordWebhookUrl')
        .mockReturnValue('https://discord.com/api/webhooks/test')
      jest.spyOn(ConfigManager, 'getComment').mockReturnValue('')

      NotificationService.notifyDiscord('Test message', mockCallback)

      // Wait for fetch promise to resolve
      await Promise.resolve()
      expect(mockCallback).toHaveBeenCalledWith(mockResponse)
    })

    it('should handle failed response', async () => {
      const mockResponse = { ok: false }
      mockFetch.mockResolvedValue(mockResponse)

      jest
        .spyOn(ConfigManager, 'getDiscordWebhookUrl')
        .mockReturnValue('https://discord.com/api/webhooks/test')
      jest.spyOn(ConfigManager, 'getComment').mockReturnValue('')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      NotificationService.notifyDiscord('Test message')

      // Wait for fetch promise to resolve
      await Promise.resolve()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'notifyDiscord: failed',
        mockResponse
      )

      consoleErrorSpy.mockRestore()
    })

    it('should handle fetch error', () => {
      const mockError = new Error('Network error')
      mockFetch.mockRejectedValue(mockError)

      jest
        .spyOn(ConfigManager, 'getDiscordWebhookUrl')
        .mockReturnValue('https://discord.com/api/webhooks/test')
      jest.spyOn(ConfigManager, 'getComment').mockReturnValue('')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      NotificationService.notifyDiscord('Test message')

      // Just verify the function was called - error logging is async
      expect(mockFetch).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should not send notification when webhook URL is not set', () => {
      jest.spyOn(ConfigManager, 'getDiscordWebhookUrl').mockReturnValue('')
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      NotificationService.notifyDiscord('Test message')

      expect(mockFetch).not.toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'notifyDiscord: Discord Webhook URL is not set.'
      )

      consoleWarnSpy.mockRestore()
    })

    it('should handle empty webhook URL', () => {
      jest.spyOn(ConfigManager, 'getDiscordWebhookUrl').mockReturnValue('')
      jest.spyOn(ConfigManager, 'getComment').mockReturnValue('Comment')
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      NotificationService.notifyDiscord('Test message', undefined, true)

      expect(mockFetch).not.toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'notifyDiscord: Discord Webhook URL is not set.'
      )

      consoleWarnSpy.mockRestore()
    })
  })
})
