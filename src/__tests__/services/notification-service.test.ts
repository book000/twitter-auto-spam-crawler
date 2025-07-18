import { NotificationService } from '../../services/notification-service'
import { ConfigManager } from '../../core/config'
import { DISCORD_MENTION_ID } from '../../core/constants'
// Import mock before the module under test
import '../../__mocks__/userscript'
import { clearMockStorage } from '../../__mocks__/userscript'

// Mock fetch
const mockFetch = jest.fn()
globalThis.fetch = mockFetch

/**
 * NotificationServiceクラスのテストスイート
 * Discord Webhookを使用した通知機能を検証する
 * - Discord Webhook URLへのメッセージ送信機能
 * - メンション付き通知とコメント追加機能
 * - ネットワークエラーやレスポンス失敗のエラーハンドリング
 * - 設定未完了時の適切な処理と警告出力
 */
describe('NotificationService', () => {
  beforeEach(() => {
    clearMockStorage()
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  /**
   * notifyDiscordメソッドのテスト
   * Discord Webhookを使用したメッセージ送信機能を検証
   * - コンフィグからのWebhook URLとコメント取得
   * - HTTP POSTリクエストの適切なフォーマットとヘッダー設定
   * - メンション、コメント、コールバックのオプション処理
   * - エラーレスポンスやネットワークエラーの適切なハンドリング
   */
  describe('notifyDiscord', () => {
    /**
     * メッセージとコメント付きDiscord通知の正常送信をテスト
     * - コンフィグからのWebhook URLとコメントの取得
     * - Discord APIのフォーマットに合わせたHTTP POSTリクエスト
     * - メッセージとコメントの適切な連結とフォーマット
     * - 成功レスポンス時の適切なログ出力
     */
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

      // Wait for fetch promise to resolve
      await Promise.resolve()
      expect(consoleSpy).toHaveBeenCalledWith('notifyDiscord: success')

      consoleSpy.mockRestore()
    })

    /**
     * withReplyフラグ有効時のメンション付き通知をテスト
     * - メンションIDの適切なフォーマットと連結
     * - メッセージ内容の正確な構成確認
     */
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

    /**
     * コールバック関数指定時の適切な呼び出しをテスト
     * - コールバック関数がレスポンスとともに呼び出されることを確認
     * - 非同期処理終了後のコールバック実行タイミング
     */
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

    /**
     * 失敗レスポンスのエラーハンドリングをテスト
     * - サーバーからのエラーレスポンス（ok: false）の処理
     * - 適切なエラーログの出力確認
     */
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

      // Wait for fetch promise to resolve
      await Promise.resolve()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'notifyDiscord: failed',
        mockResponse
      )

      consoleErrorSpy.mockRestore()
    })

    /**
     * ネットワークエラーのエラーハンドリングをテスト
     * - fetch関数がリジェクトした場合の処理
     * - ネットワークエラーやコネクションタイムアウトの適切な処理
     */
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

    /**
     * Webhook URL未設定時の通知スキップをテスト
     * - 空のWebhook URL時の適切な警告メッセージ出力
     * - 通知送信がスキップされることの確認
     */
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

    /**
     * 空文字列Webhook URLの処理をテスト
     * - 空文字列のWebhook URL時の適切な警告出力
     * - メンションやコメント有無に関わらずスキップされることを確認
     */
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

    /**
     * カスタムWebhook URL指定時の処理をテスト
     * - カスタムWebhook URLが設定値より優先されることを確認
     * - ConfigManagerの設定が呼び出されないことを確認
     */
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

      // ConfigManagerのgetDiscordWebhookUrlが呼び出されないことを確認
      expect(ConfigManager.getDiscordWebhookUrl).not.toHaveBeenCalled()
    })

    /**
     * カスタムWebhook URLが空文字列の場合のフォールバック処理をテスト
     * - 空のカスタムURLが指定された場合にConfigManagerの設定を使用
     */
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
