import { NotificationService } from '../../services/notification-service'
import { ConfigManager } from '../../core/config'
import { DISCORD_MENTION_ID } from '../../core/constants'
// Import mock before the module under test
import { clearMockStorage } from '../../__mocks__/userscript'

const mockFetch = jest.fn()
globalThis.fetch = mockFetch

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
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

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

      await Promise.resolve()
      expect(consoleSpy).toHaveBeenCalledWith('notifyDiscord: success')

      consoleSpy.mockRestore()
    })

    it('should include mention when withReply is true', () => {
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
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      NotificationService.notifyDiscord('Test message')

      await Promise.resolve()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'notifyDiscord: failed',
        mockResponse
      )

      consoleErrorSpy.mockRestore()
    })

    it('should handle fetch error', async () => {
      const mockError = new Error('Network error')
      mockFetch.mockRejectedValue(mockError)

      jest
        .spyOn(ConfigManager, 'getDiscordWebhookUrl')
        .mockReturnValue('https://discord.com/api/webhooks/test')
      jest.spyOn(ConfigManager, 'getComment').mockReturnValue('')
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      await NotificationService.notifyDiscord('Test message')

      expect(mockFetch).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'notifyDiscord: fetch error',
        mockError
      )

      consoleErrorSpy.mockRestore()
    })

    it('should not send notification when webhook URL is not set', () => {
      jest.spyOn(ConfigManager, 'getDiscordWebhookUrl').mockReturnValue('')
      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

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
      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

      NotificationService.notifyDiscord('Test message', undefined, true)

      expect(mockFetch).not.toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'notifyDiscord: Discord Webhook URL is not set.'
      )

      consoleWarnSpy.mockRestore()
    })

    it('should use custom webhook URL when provided', () => {
      const mockResponse = { ok: true }
      mockFetch.mockResolvedValue(mockResponse)

      const customUrl = 'https://discord.com/api/webhooks/custom'
      const defaultUrl = 'https://discord.com/api/webhooks/default'

      jest
        .spyOn(ConfigManager, 'getDiscordWebhookUrl')
        .mockReturnValue(defaultUrl)
      jest.spyOn(ConfigManager, 'getComment').mockReturnValue('Test comment')

      NotificationService.notifyDiscord(
        'Test message',
        undefined,
        false,
        customUrl
      )

      expect(mockFetch).toHaveBeenCalledWith(
        customUrl,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: ' Test message\nTest comment',
          }),
        })
      )

      expect(ConfigManager.getDiscordWebhookUrl).not.toHaveBeenCalled()
    })

    it('should fallback to config when custom webhook URL is empty', () => {
      const mockResponse = { ok: true }
      mockFetch.mockResolvedValue(mockResponse)

      const defaultUrl = 'https://discord.com/api/webhooks/default'

      jest
        .spyOn(ConfigManager, 'getDiscordWebhookUrl')
        .mockReturnValue(defaultUrl)
      jest.spyOn(ConfigManager, 'getComment').mockReturnValue('')

      NotificationService.notifyDiscord('Test message', undefined, false, '')

      expect(mockFetch).toHaveBeenCalledWith(defaultUrl, expect.any(Object))

      expect(ConfigManager.getDiscordWebhookUrl).toHaveBeenCalled()
    })
  })
})
