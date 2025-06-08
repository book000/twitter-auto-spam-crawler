/**
 * エラーダイアログと問題のあるコンテンツの検出・処理を行うユーティリティ。
 * アラートダイアログや削除されたポストの検出を定期的にチェック。
 */
export const ErrorHandler = {
  /**
   * 指定されたセレクターの要素が見つかるまで待機し、見つかったらコールバックを実行。
   * @param selector - 待機する要素のCSSセレクター
   * @param callback - 要素が見つかった時に実行するコールバック関数
   * @param timeout - タイムアウト時間（ミリ秒）、デフォルトは30秒
   * @returns コールバック実行完了時に解決されるPromise
   */
  waitForElementAndCallback(
    selector: string,
    callback: (element: Element) => Promise<void>,
    timeout = 30_000
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      const intervalId = setInterval(() => {
        if (Date.now() - startTime > timeout) {
          clearInterval(intervalId)
          const error = new Error(
            `Element not found within ${timeout}ms: ${selector}`
          )
          console.warn('ErrorHandler timeout:', error.message)
          reject(error)
          return
        }

        const element = document.querySelector(selector)
        if (element) {
          clearInterval(intervalId)
          callback(element)
            .then(() => {
              console.log(
                `ErrorHandler: Successfully processed element: ${selector}`
              )
              resolve()
            })
            .catch((error: unknown) => {
              console.error(
                `ErrorHandler: Callback failed for ${selector}:`,
                error
              )
              reject(
                new Error(
                  error instanceof Error ? error.message : String(error)
                )
              )
            })
        }
      }, 100)
    })
  },

  /**
   * 指定されたセレクターの要素群が見つかるまで待機し、見つかったらコールバックを実行。
   * @param selector - 待機する要素のCSSセレクター
   * @param callback - 要素群が見つかった時に実行するコールバック関数
   * @param timeout - タイムアウト時間（ミリ秒）、デフォルトは30秒
   * @returns コールバック実行完了時に解決されるPromise
   */
  waitForAllElementsAndCallback(
    selector: string,
    callback: (elements: NodeListOf<Element>) => Promise<void>,
    timeout = 30_000
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      const intervalId = setInterval(() => {
        if (Date.now() - startTime > timeout) {
          clearInterval(intervalId)
          const error = new Error(
            `Elements not found within ${timeout}ms: ${selector}`
          )
          console.warn('ErrorHandler timeout:', error.message)
          reject(error)
          return
        }

        const elements = document.querySelectorAll(selector)
        if (elements.length > 0) {
          clearInterval(intervalId)
          callback(elements)
            .then(() => {
              console.log(
                `ErrorHandler: Successfully processed ${elements.length} elements: ${selector}`
              )
              resolve()
            })
            .catch((error: unknown) => {
              console.error(
                `ErrorHandler: Callback failed for ${selector}:`,
                error
              )
              reject(
                new Error(
                  error instanceof Error ? error.message : String(error)
                )
              )
            })
        }
      }, 100)
    })
  },
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
  detectUnprocessablePost(
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
