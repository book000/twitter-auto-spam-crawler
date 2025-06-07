/**
 * エラーダイアログと問題のあるコンテンツの検出・処理を行うユーティリティ。
 * アラートダイアログや削除されたポストの検出を定期的にチェック。
 */
export const ErrorHandler = {
  /**
   * エラーダイアログの出現を監視し、検出時にコールバックを実行。
   * @param callback - ダイアログ検出時に実行するコールバック関数
   * @returns コールバック実行完了時に解決されるPromise
   */
  handleErrorDialog(
    callback: (dialog: Element) => void | Promise<void>
  ): Promise<void> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
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
                .catch(() => {
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
   * @returns コールバック実行完了時に解決されるPromise
   */
  detectCantProcessingPost(
    callback: (element: Element) => void | Promise<void>
  ): Promise<void> {
    const keywords = [
      'このポストはXルールに違反しています。',
      'このポストは、ポストの作成者により削除されました。',
    ]

    return new Promise((resolve) => {
      const interval = setInterval(() => {
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
              .catch(() => {
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
