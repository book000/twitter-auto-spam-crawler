import { TIMEOUTS, URLS, SELECTORS } from '@/core/constants'

/**
 * DOM helpers for waiting on elements, detecting X's error and login states,
 * and clicking the buttons that load more replies.
 * The selectors depend on X's current markup and may break when it changes.
 */
export const DomUtils = {
  /**
   * Polls until an element matching the selector appears in the DOM.
   * The poll count is derived from `limitSec` assuming two polls per second,
   * so it is only exact while TIMEOUTS.ELEMENT_WAIT is 500 ms.
   *
   * @param selector - CSS selector of the element to wait for
   * @param limitSec - Give up after this many seconds
   * @throws An Error if the element does not appear within `limitSec`
   */
  async waitElement(
    selector: string,
    limitSec: number = TIMEOUTS.ELEMENT_WAIT_LIMIT
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

  /**
   * Checks whether X is showing its error page, identified by the refresh icon.
   *
   * @returns true if the refresh icon is present
   */
  isFailedPage(): boolean {
    return (
      document.querySelector(
        'div.css-175oi2r path[d="M12 4c-4.418 0-8 3.58-8 8s3.582 8 8 8c3.806 0 6.993-2.66 7.802-6.22l1.95.44C20.742 18.67 16.76 22 12 22 6.477 22 2 17.52 2 12S6.477 2 12 2c3.272 0 6.176 1.57 8 4V3.5h2v6h-6v-2h2.616C17.175 5.39 14.749 4 12 4z"]'
      ) !== null
    )
  },

  /**
   * Clicks the "show more replies" button, found by its position in the
   * timeline. Does nothing if there is no such button.
   */
  clickMoreReplies(): void {
    const moreRepliesButton = document.querySelector(
      'div[data-testid="primaryColumn"] div[data-testid="cellInnerDiv"] > div > div > button[role="button"]'
    )
    if (!moreRepliesButton) {
      return
    }

    console.log('clickMoreReplies: clicked moreRepliesButton')
    ;(moreRepliesButton as HTMLButtonElement).click()
  },

  /**
   * Clicks the first button in every timeline post whose text contains the
   * Japanese label "さらに返信を表示する". Unlike `clickMoreReplies`, which
   * targets a button by its position, it only considers posts containing the
   * label. `ScrollUtils.scrollPage` calls both on every tick.
   */
  clickMoreRepliesAggressive(): void {
    const texts = ['さらに返信を表示する']
    const tweetArticleElements = document.querySelectorAll(
      'div[data-testid="primaryColumn"] div[data-testid="cellInnerDiv"] > div > div > article[tabindex="-1"]'
    )

    for (const tweetArticleElement of tweetArticleElements) {
      const text = tweetArticleElement.textContent

      if (!text || texts.every((t) => !text.includes(t))) {
        continue
      }

      const moreRepliesAggressiveButton = tweetArticleElement.querySelector(
        'button[role="button"]'
      )
      if (!moreRepliesAggressiveButton) {
        continue
      }

      console.log(
        'clickMoreRepliesAggressive: clicked moreRepliesAggressiveButton'
      )
      ;(moreRepliesAggressiveButton as HTMLElement).click()
    }
  },

  /**
   * Navigates to the login page if the bottom bar shows a login button,
   * which means the session is logged out.
   *
   * @returns true if the login button was found and navigation was started
   */
  checkAndNavigateToLogin(): boolean {
    const loginElement = document.querySelector(SELECTORS.BOTTOM_BAR_LOGIN)

    if (loginElement) {
      console.log(
        'checkAndNavigateToLogin: Login required detected, navigating to login page'
      )
      location.href = URLS.LOGIN
      return true
    }

    return false
  },
}
