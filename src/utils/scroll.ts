import { DELAYS, THRESHOLDS } from '@/core/constants'
import { DomUtils } from './dom'
import { AsyncUtils } from './async'

/** Auto-scrolling helpers for loading a page's lazily loaded content. */
export class ScrollUtils {
  private static scrollPageInterval: ReturnType<typeof setInterval> | null =
    null

  /**
   * Stops the scroll loop started by `scrollPage` and clears its state.
   * For tests: the promise returned by an interrupted `scrollPage` never
   * settles.
   */
  static resetScrollState(): void {
    if (this.scrollPageInterval) {
      clearInterval(this.scrollPageInterval)
    }
    this.scrollPageInterval = null
  }

  /**
   * Scrolls down one viewport per `DELAYS.SCROLL_INTERVAL` and clicks the
   * "show more replies" buttons each time. Stops once the page height has not
   * changed for `THRESHOLDS.MAX_FAIL_SCROLL_COUNT` consecutive checks.
   * Only one loop runs at a time; further calls while it runs resolve
   * immediately.
   *
   * @returns A promise that resolves when the loop this call started has
   * stopped, or immediately if a loop is already running
   */
  static scrollPage(): Promise<void> {
    if (this.scrollPageInterval) {
      return Promise.resolve()
    }

    let previousHeight = 0
    let failScrollCount = 0
    return new Promise((resolve) => {
      this.scrollPageInterval = setInterval(() => {
        window.scrollBy({
          top: window.innerHeight,
          behavior: 'smooth',
        })

        DomUtils.clickMoreReplies()
        DomUtils.clickMoreRepliesAggressive()

        const newHeight = document.body.scrollHeight

        if (newHeight === previousHeight) {
          failScrollCount++
          console.warn('scrollPage: failed scroll')
        } else {
          failScrollCount = 0
          console.log('scrollPage: success')
        }
        previousHeight = newHeight

        if (!(failScrollCount >= THRESHOLDS.MAX_FAIL_SCROLL_COUNT)) {
          return
        }

        if (this.scrollPageInterval) {
          clearInterval(this.scrollPageInterval)
        }
        this.scrollPageInterval = null
        resolve()
      }, DELAYS.SCROLL_INTERVAL)
    })
  }

  /**
   * Scrolls down one viewport per step, waiting DELAYS.CRAWL_INTERVAL after each.
   *
   * @param count - Number of scroll steps
   */
  static async scrollWithCount(count: number): Promise<void> {
    for (let scrollCount = 0; scrollCount < count; scrollCount++) {
      window.scrollBy({
        top: window.innerHeight,
        behavior: 'smooth',
      })
      await AsyncUtils.delay(DELAYS.CRAWL_INTERVAL)
    }
  }
}
