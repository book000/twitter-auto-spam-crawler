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

    it('should reject and skip the callback when the response is not ok', async () => {
      const mockResponse = { ok: false, status: 500 }
      mockFetch.mockResolvedValue(mockResponse)
      const mockCallback = jest.fn()

      jest
        .spyOn(ConfigManager, 'getDiscordWebhookUrl')
        .mockReturnValue('https://discord.com/api/webhooks/test')
      jest.spyOn(ConfigManager, 'getComment').mockReturnValue('')
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      await expect(
        NotificationService.notifyDiscord('Test message', mockCallback)
      ).rejects.toThrow(
        'notifyDiscord: Discord webhook responded with status 500'
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'notifyDiscord: failed',
        mockResponse
      )
      expect(mockCallback).not.toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should reject with the fetch error and skip the callback', async () => {
      const mockError = new Error('Network error')
      mockFetch.mockRejectedValue(mockError)
      const mockCallback = jest.fn()

      jest
        .spyOn(ConfigManager, 'getDiscordWebhookUrl')
        .mockReturnValue('https://discord.com/api/webhooks/test')
      jest.spyOn(ConfigManager, 'getComment').mockReturnValue('')
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      await expect(
        NotificationService.notifyDiscord('Test message', mockCallback)
      ).rejects.toBe(mockError)

      expect(mockFetch).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'notifyDiscord: fetch error',
        mockError
      )
      expect(mockCallback).not.toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should reject when the callback throws after an ok response', async () => {
      mockFetch.mockResolvedValue({ ok: true })
      const callbackError = new Error('callback failed')

      jest
        .spyOn(ConfigManager, 'getDiscordWebhookUrl')
        .mockReturnValue('https://discord.com/api/webhooks/test')
      jest.spyOn(ConfigManager, 'getComment').mockReturnValue('')
      const consoleLogSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {})

      await expect(
        NotificationService.notifyDiscord('Test message', () => {
          throw callbackError
        })
      ).rejects.toBe(callbackError)

      consoleLogSpy.mockRestore()
    })

    it('should resolve without sending or calling the callback when webhook URL is not set', async () => {
      jest.spyOn(ConfigManager, 'getDiscordWebhookUrl').mockReturnValue('')
      const mockCallback = jest.fn()
      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

      await expect(
        NotificationService.notifyDiscord('Test message', mockCallback)
      ).resolves.toBeUndefined()

      expect(mockFetch).not.toHaveBeenCalled()
      expect(mockCallback).not.toHaveBeenCalled()
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
