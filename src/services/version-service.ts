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
   * @param oldVersion 以前のバージョン
   * @param newVersion 新しいバージョン
   */
  notifyVersionUpdate(oldVersion: string, newVersion: string): void {
    const notifyUrl = `https://example.com/?update-notify&old=${encodeURIComponent(oldVersion)}&new=${encodeURIComponent(newVersion)}`

    try {
      window.open(notifyUrl, '_blank')
      console.log(`VersionService: Opened notification URL: ${notifyUrl}`)
    } catch (error) {
      console.error('VersionService: Failed to open notification URL:', error)
      throw error
    }
  },
}
