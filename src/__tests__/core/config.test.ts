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
     * 期待される設定項目（Discord Webhook URL、Comment、Only Home crawling）が適切に設定されているか確認
     */
    it('should call GM_config with correct configuration', () => {
      ConfigManager.registerMenuCommand()

      expect(GM_config).toHaveBeenCalledWith(
        {
          discordWebhookUrl: {
            name: 'Discord Webhook URL (Login notifications)',
            value: '',
            input: 'prompt',
          },
          lockWebhookUrl: {
            name: 'Discord Webhook URL (Lock notifications)',
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
   * getLockWebhookUrlメソッドのテスト
   * ロック通知用Discord Webhook URLの取得機能を検証
   */
  describe('getLockWebhookUrl', () => {
    /**
     * デフォルト値として空文字列が返されることをテスト
     * 初期状態でのロック通知用Webhook URL取得の動作を確認
     */
    it('should return empty string by default', () => {
      const result = ConfigManager.getLockWebhookUrl()
      expect(result).toBe('')
      expect(GM_getValue).toHaveBeenCalledWith('lockWebhookUrl', '')
    })

    /**
     * 保存されたロック通知用Webhook URLが正しく返されることをテスト
     * ストレージに保存された値の取得機能を確認
     */
    it('should return stored lock webhook URL', () => {
      const testUrl = 'https://discord.com/api/webhooks/lock-test'
      ;(GM_getValue as jest.Mock).mockReturnValueOnce(testUrl)

      const result = ConfigManager.getLockWebhookUrl()
      expect(result).toBe(testUrl)
      expect(GM_getValue).toHaveBeenCalledWith('lockWebhookUrl', '')
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
})
