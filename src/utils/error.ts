/**
 * エラーダイアログと問題のあるコンテンツの検出・処理を行うユーティリティ。
 * アラートダイアログや削除されたポストの検出を定期的にチェック。
 */
export const ErrorHandler = {
  /**
   * エラーダイアログの出現を監視し、検出時にコールバックを実行。
   * @param callback - ダイアログ検出時に実行するコールバック関数
   * @param timeout - タイムアウト時間（ミリ秒）、デフォルトは30秒
   * @returns コールバック実行完了時に解決されるPromise
   */
  handleErrorDialog(
    callback: (dialog: Element) => void | Promise<void>,
    timeout = 30_000
  ): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now()
      const interval = setInterval(() => {
        if (Date.now() - startTime > timeout) {
          clearInterval(interval)
          console.warn(
            `ErrorHandler: Error dialog not found within ${timeout}ms`
          )
          resolve()
          return
        }

        const dialog = document.querySelector('div#layers div[role="alert"]')
        if (dialog) {
          clearInterval(interval)
          if (typeof callback === 'function') {
            const result = callback(dialog)
            if (result instanceof Promise) {
              result
                .then(() => {
                  resolve()
                })
                .catch((error: unknown) => {
                  console.error('ErrorHandler callback error:', error)
                  resolve()
                })
            } else {
              resolve()
            }
          } else {
            resolve()
          }
        }
      }, 500)
    })
  },

  /**
   * 処理不可能なポスト（ルール違反や削除済み）の検出。
   * 特定のキーワードを含むコンテンツを定期的にチェック。
   * @param callback - 問題のあるポスト検出時に実行するコールバック関数
   * @param timeout - タイムアウト時間（ミリ秒）、デフォルトは30秒
   * @returns コールバック実行完了時に解決されるPromise
   */
  detectCantProcessingPost(
    callback: (element: Element) => void | Promise<void>,
    timeout = 30_000
  ): Promise<void> {
    const keywords = [
      'このポストはXルールに違反しています。',
      'このポストは、ポストの作成者により削除されました。',
    ]

    return new Promise((resolve) => {
      const startTime = Date.now()
      const interval = setInterval(() => {
        if (Date.now() - startTime > timeout) {
          clearInterval(interval)
          console.warn(
            `ErrorHandler: Problematic post not found within ${timeout}ms`
          )
          resolve()
          return
        }

        const tweetArticleElement = document.querySelector(
          'div[data-testid="primaryColumn"] div[data-testid="cellInnerDiv"] > div > div > article[tabindex="-1"]'
        )
        if (!tweetArticleElement) {
          return
        }

        const text = tweetArticleElement.textContent
        if (text && keywords.some((keyword) => text.includes(keyword))) {
          clearInterval(interval)
          const result = callback(tweetArticleElement)
          if (result instanceof Promise) {
            result
              .then(() => {
                resolve()
              })
              .catch((error: unknown) => {
                console.error('ErrorHandler callback error:', error)
                resolve()
              })
          } else {
            resolve()
          }
        }
      }, 500)
    })
  },
}
