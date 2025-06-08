import { Storage } from '@/core/storage'

/**
 * バージョン管理とアップデート通知を処理するサービス
 */
export const VersionService = {
  /**
   * 現在のスクリプトバージョンをチェックし、変更があればDiscordに通知する
   * @param currentVersion 現在のスクリプトバージョン
   */
  checkVersionAndNotify(currentVersion: string): void {
    const storedVersion = Storage.getStoredVersion()

    if (storedVersion === '') {
      Storage.setStoredVersion(currentVersion)
      console.log(`VersionService: Initial version stored: ${currentVersion}`)
      return
    }

    if (storedVersion !== currentVersion) {
      console.log(
        `VersionService: Version updated from ${storedVersion} to ${currentVersion}`
      )

      try {
        this.notifyVersionUpdate(storedVersion, currentVersion)
        Storage.setStoredVersion(currentVersion)
        console.log(
          'VersionService: Update notification sent and version updated'
        )
      } catch (error) {
        console.error(
          'VersionService: Failed to send update notification:',
          error
        )
      }
    }
  },

  /**
   * バージョン更新をDiscordに通知する（example.com経由）
   *
   * バージョン更新時に新しいウィンドウを開いてexample.comに通知情報を送信する。
   * ポップアップブロッカーにより失敗する可能性があるため、エラーハンドリングを含む。
   *
   * @param {string} oldVersion - 以前のバージョン
   * @param {string} newVersion - 新しいバージョン
   * @throws {Error} ポップアップブロックまたはウィンドウオープンに失敗した場合
   *
   * @example
   * ```typescript
   * try {
   *   VersionService.notifyVersionUpdate('1.0.0', '1.1.0')
   * } catch (error) {
   *   console.error('バージョン更新通知に失敗:', error)
   * }
   * ```
   */
  notifyVersionUpdate(oldVersion: string, newVersion: string): void {
    const notifyUrl = `https://example.com/?update-notify&old=${encodeURIComponent(oldVersion)}&new=${encodeURIComponent(newVersion)}`

    try {
      const popup = window.open(notifyUrl, '_blank')
      if (popup === null) {
        console.error(
          'VersionService: Popup was blocked. Failed to open notification URL:',
          notifyUrl
        )
        throw new Error('Popup blocked')
      }
      console.log(`VersionService: Opened notification URL: ${notifyUrl}`)
    } catch (error) {
      console.error('VersionService: Failed to open notification URL:', error)
      throw error
    }
  },
}
