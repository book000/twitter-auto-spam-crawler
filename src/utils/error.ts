export const ErrorHandler = {
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
