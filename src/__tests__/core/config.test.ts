import { ConfigManager } from '../../core/config'
import { clearMockStorage } from '../../__mocks__/userscript'

/**
 * ConfigManagerクラスのテストスイート
 * ユーザー設定の管理機能をテスト
 */
describe('ConfigManager', () => {
  beforeEach(() => {
    clearMockStorage()
    jest.clearAllMocks()
  })

  /**
   * registerMenuCommandメソッドのテスト
   * ユーザースクリプトメニューコマンドの登録機能を検証
   */
  describe('registerMenuCommand', () => {
    /**
     * GM_configが正しい設定で呼び出されることをテスト
     * 期待される設定項目（Discord Webhook URL、Auth Webhook URL、Lock Webhook URL、Comment、Only Home crawling）が適切に設定されているか確認
     */
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

    /**
     * GM_config_eventのイベントリスナーが追加されることをテスト
     * 設定変更時の処理が適切に登録されているか確認
     */
    it('should add event listener for GM_config_event', () => {
      ConfigManager.registerMenuCommand()

      expect(addEventListener).toHaveBeenCalledWith(
        'GM_config_event',
        expect.any(Function)
      )
    })
  })

  /**
   * getDiscordWebhookUrlメソッドのテスト
   * Discord Webhook URLの取得機能を検証
   */
  describe('getDiscordWebhookUrl', () => {
    /**
     * デフォルト値として空文字列が返されることをテスト
     * 初期状態でのWebhook URL取得の動作を確認
     */
    it('should return empty string by default', () => {
      const result = ConfigManager.getDiscordWebhookUrl()
      expect(result).toBe('')
      expect(GM_getValue).toHaveBeenCalledWith('discordWebhookUrl', '')
    })

    /**
     * 保存されたWebhook URLが正しく返されることをテスト
     * ストレージに保存された値の取得機能を確認
     */
    it('should return stored webhook URL', () => {
      const testUrl = 'https://discord.com/api/webhooks/test'
      ;(GM_getValue as jest.Mock).mockReturnValueOnce(testUrl)

      const result = ConfigManager.getDiscordWebhookUrl()
      expect(result).toBe(testUrl)
      expect(GM_getValue).toHaveBeenCalledWith('discordWebhookUrl', '')
    })
  })

  /**
   * getCommentメソッドのテスト
   * ユーザーコメントの取得機能を検証
   */
  describe('getComment', () => {
    /**
     * デフォルト値として空文字列が返されることをテスト
     * 初期状態でのコメント取得の動作を確認
     */
    it('should return empty string by default', () => {
      const result = ConfigManager.getComment()
      expect(result).toBe('')
      expect(GM_getValue).toHaveBeenCalledWith('comment', '')
    })

    /**
     * 保存されたコメントが正しく返されることをテスト
     * ストレージに保存されたコメント値の取得機能を確認
     */
    it('should return stored comment', () => {
      const testComment = 'Test comment'
      ;(GM_getValue as jest.Mock).mockReturnValueOnce(testComment)

      const result = ConfigManager.getComment()
      expect(result).toBe(testComment)
      expect(GM_getValue).toHaveBeenCalledWith('comment', '')
    })
  })

  /**
   * getIsOnlyHomeメソッドのテスト
   * ホームタイムラインのみ処理する設定の取得機能を検証
   */
  describe('getIsOnlyHome', () => {
    /**
     * デフォルト値としてfalseが返されることをテスト
     * 初期状態では全てのページで処理が有効であることを確認
     */
    it('should return false by default', () => {
      const result = ConfigManager.getIsOnlyHome()
      expect(result).toBe(false)
      expect(GM_getValue).toHaveBeenCalledWith('isOnlyHome', 'false')
    })

    /**
     * 保存された値が"true"の場合にtrueが返されることをテスト
     * 文字列"true"からboolean値への適切な変換を確認
     */
    it('should return true when stored value is "true"', () => {
      ;(GM_getValue as jest.Mock).mockReturnValueOnce('true')

      const result = ConfigManager.getIsOnlyHome()
      expect(result).toBe(true)
      expect(GM_getValue).toHaveBeenCalledWith('isOnlyHome', 'false')
    })

    /**
     * 保存された値が"false"の場合にfalseが返されることをテスト
     * 文字列"false"からboolean値への適切な変換を確認
     */
    it('should return false when stored value is "false"', () => {
      ;(GM_getValue as jest.Mock).mockReturnValueOnce('false')

      const result = ConfigManager.getIsOnlyHome()
      expect(result).toBe(false)
    })

    /**
     * "true"以外の文字列値の場合にfalseが返されることをテスト
     * 不正な値に対するフォールバック動作を確認
     */
    it('should return false for other string values', () => {
      ;(GM_getValue as jest.Mock).mockReturnValueOnce('other')

      const result = ConfigManager.getIsOnlyHome()
      expect(result).toBe(false)
    })
  })

  /**
   * getAuthWebhookUrlメソッドのテスト
   * 認証関連通知用Discord Webhook URLの取得機能を検証
   */
  describe('getAuthWebhookUrl', () => {
    /**
     * authWebhookUrlが設定されている場合はその値が返されることをテスト
     * 個別設定の優先度確認
     */
    it('should return authWebhookUrl when set', () => {
      const authUrl = 'https://discord.com/api/webhooks/auth'
      ;(GM_getValue as jest.Mock).mockReturnValueOnce(authUrl) // authWebhookUrl

      const result = ConfigManager.getAuthWebhookUrl()
      expect(result).toBe(authUrl)
      expect(GM_getValue).toHaveBeenCalledWith('authWebhookUrl', '')
    })

    /**
     * authWebhookUrlが未設定の場合はdefaultのdiscordWebhookUrlが返されることをテスト
     * フォールバック機能の確認
     */
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

    /**
     * 両方が未設定の場合は空文字列が返されることをテスト
     * 未設定時の動作確認
     */
    it('should return empty string when both URLs are not set', () => {
      ;(GM_getValue as jest.Mock)
        .mockReturnValueOnce('') // authWebhookUrl
        .mockReturnValueOnce('') // discordWebhookUrl

      const result = ConfigManager.getAuthWebhookUrl()
      expect(result).toBe('')
    })
  })

  /**
   * getLockWebhookUrlメソッドのテスト
   * ロック関連通知用Discord Webhook URLの取得機能を検証
   */
  describe('getLockWebhookUrl', () => {
    /**
     * lockWebhookUrlが設定されている場合はその値が返されることをテスト
     * 個別設定の優先度確認
     */
    it('should return lockWebhookUrl when set', () => {
      const lockUrl = 'https://discord.com/api/webhooks/lock'
      ;(GM_getValue as jest.Mock).mockReturnValueOnce(lockUrl) // lockWebhookUrl

      const result = ConfigManager.getLockWebhookUrl()
      expect(result).toBe(lockUrl)
      expect(GM_getValue).toHaveBeenCalledWith('lockWebhookUrl', '')
    })

    /**
     * lockWebhookUrlが未設定の場合はdefaultのdiscordWebhookUrlが返されることをテスト
     * フォールバック機能の確認
     */
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

    /**
     * 両方が未設定の場合は空文字列が返されることをテスト
     * 未設定時の動作確認
     */
    it('should return empty string when both URLs are not set', () => {
      ;(GM_getValue as jest.Mock)
        .mockReturnValueOnce('') // lockWebhookUrl
        .mockReturnValueOnce('') // discordWebhookUrl

      const result = ConfigManager.getLockWebhookUrl()
      expect(result).toBe('')
    })
  })
})
