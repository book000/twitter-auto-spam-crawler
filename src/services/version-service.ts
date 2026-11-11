import { Storage } from '@/core/storage'

/**
 * Detects script updates and announces them on Discord.
 */
export const VersionService = {
  /**
   * Compares the running version with the stored one and notifies on change.
   *
   * The first run only records the version. The new version is stored only
   * after the notification window opened. A blocked popup is therefore
   * retried on the next run. Errors are logged, not thrown.
   *
   * @param currentVersion - Version of the running script
   */
  checkVersionAndNotify(currentVersion: string): void {
    const storedVersion = Storage.getStoredVersion()

    if (storedVersion === '') {
      Storage.setStoredVersion(currentVersion)
      console.log(`VersionService: Initial version stored: ${currentVersion}`)
      return
    }

    if (storedVersion === currentVersion) {
      return
    }

    console.log(
      `VersionService: Version updated from ${storedVersion} to ${currentVersion}`
    )

    try {
      VersionService.notifyVersionUpdate(storedVersion, currentVersion)
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
  },

  /**
   * Opens the example.com update-notify URL in a new window, which the script
   * handles to send the Discord notification.
   *
   * @param oldVersion - Previously stored version
   * @param newVersion - Current version
   * @throws {Error} If the popup is blocked or `window.open` throws
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
