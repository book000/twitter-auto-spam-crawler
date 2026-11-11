/**
 * Pollers that wait for an element, an error dialog or an unprocessable post
 * to appear, then hand it to a callback.
 * The `waitFor*` pollers reject on timeout or callback rejection. The dialog
 * and post detectors never reject: a timeout or a rejected callback promise is
 * logged and the promise resolves.
 */
export const ErrorHandler = {
  /**
   * Polls for an element matching the selector and runs the callback with the
   * first match.
   *
   * @param selector - CSS selector of the element to wait for
   * @param callback - Called with the element once it is found
   * @param timeout - Give up after this many milliseconds (default: 30 s)
   * @returns A promise that resolves when the callback has completed
   * @throws An Error if the element is not found within `timeout`, or if the
   *   callback rejects (a non-Error reason is wrapped in an Error)
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
        if (!element) {
          return
        }

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
            reject(error instanceof Error ? error : new Error(String(error)))
          })
      }, 100)
    })
  },

  /**
   * Polls until at least one element matches the selector and runs the
   * callback with all matches.
   *
   * @param selector - CSS selector of the elements to wait for
   * @param callback - Called with the matching elements once found
   * @param timeout - Give up after this many milliseconds (default: 30 s)
   * @returns A promise that resolves when the callback has completed
   * @throws An Error if nothing matches within `timeout`, or if the callback
   *   rejects (a non-Error reason is wrapped in an Error)
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
        if (elements.length === 0) {
          return
        }

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
            reject(error instanceof Error ? error : new Error(String(error)))
          })
      }, 100)
    })
  },

  /**
   * Waits for X's error dialog (`role="alert"` in the layers container) and
   * runs the callback with it.
   * Never rejects: a timeout or a rejected callback promise is logged and the
   * promise still resolves. A callback that throws synchronously is not
   * caught, and the promise never settles.
   *
   * @param callback - Called with the dialog element once it is found
   * @param timeout - Give up after this many milliseconds (default: 30 s)
   * @returns A promise that resolves after the callback has completed, or on
   *   timeout without calling it
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
        if (!dialog) {
          return
        }

        clearInterval(interval)
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
      }, 500)
    })
  },

  /**
   * Waits for the first post article in the primary column to show a
   * rule-violation or author-deleted notice and runs the callback with it.
   * Never rejects: a timeout or a rejected callback promise is logged and the
   * promise still resolves. A callback that throws synchronously is not
   * caught, and the promise never settles.
   *
   * @param callback - Called with the post's article element once detected
   * @param timeout - Give up after this many milliseconds (default: 30 s)
   * @returns A promise that resolves after the callback has completed, or on
   *   timeout without calling it
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
        if (!text || keywords.every((keyword) => !text.includes(keyword))) {
          return
        }

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
      }, 500)
    })
  },
}
