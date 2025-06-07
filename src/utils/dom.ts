import { TIMEOUTS } from '@/core/constants'

export const DomUtils = {
  async waitElement(
    selector: string,
    limitSec = TIMEOUTS.ELEMENT_WAIT_LIMIT
  ): Promise<void> {
    const limit = limitSec * 2
    let count = 0
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        const element = document.querySelector(selector)
        if (element) {
          clearInterval(interval)
          resolve()
        } else {
          count++
          if (count >= limit) {
            clearInterval(interval)
            reject(
              new Error(
                `Element ${selector} not found after ${limitSec} seconds`
              )
            )
          }
        }
      }, TIMEOUTS.ELEMENT_WAIT)
    })
  },

  isFailedPage(): boolean {
    return (
      document.querySelector(
        'div.css-175oi2r path[d="M12 4c-4.418 0-8 3.58-8 8s3.582 8 8 8c3.806 0 6.993-2.66 7.802-6.22l1.95.44C20.742 18.67 16.76 22 12 22 6.477 22 2 17.52 2 12S6.477 2 12 2c3.272 0 6.176 1.57 8 4V3.5h2v6h-6v-2h2.616C17.175 5.39 14.749 4 12 4z"]'
      ) !== null
    )
  },

  clickMoreReplies(): void {
    const moreRepliesButton = document.querySelector(
      'div[data-testid="primaryColumn"] div[data-testid="cellInnerDiv"] > div > div > button[role="button"]'
    )
    if (moreRepliesButton) {
      console.log('clickMoreReplies: clicked moreRepliesButton')
      ;(moreRepliesButton as HTMLButtonElement).click()
    }
  },

  clickMoreRepliesAggressive(): void {
    const texts = ['さらに返信を表示する']
    const tweetArticleElements = document.querySelectorAll(
      'div[data-testid="primaryColumn"] div[data-testid="cellInnerDiv"] > div > div > article[tabindex="-1"]'
    )

    for (const tweetArticleElement of tweetArticleElements) {
      const text = tweetArticleElement.textContent

      if (!text || !texts.some((t) => text.includes(t))) {
        continue
      }

      const moreRepliesAggressiveButton = tweetArticleElement.querySelector(
        'button[role="button"]'
      )
      if (moreRepliesAggressiveButton) {
        console.log(
          'clickMoreRepliesAggressive: clicked moreRepliesAggressiveButton'
        )
        ;(moreRepliesAggressiveButton as HTMLElement).click()
      }
    }
  },
}
