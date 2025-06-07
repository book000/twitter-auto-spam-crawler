import { TIMEOUTS, THRESHOLDS } from '@/core/constants'
import { DomUtils } from './dom'

export class ScrollUtils {
  private static scrollPageInterval: ReturnType<typeof setInterval> | null =
    null

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

        if (failScrollCount >= THRESHOLDS.MAX_FAIL_SCROLL_COUNT) {
          if (this.scrollPageInterval) {
            clearInterval(this.scrollPageInterval)
          }
          this.scrollPageInterval = null
          resolve()
        }
      }, TIMEOUTS.SCROLL_INTERVAL)
    })
  }

  static async scrollWithCount(count: number): Promise<void> {
    for (let scrollCount = 0; scrollCount < count; scrollCount++) {
      window.scrollBy({
        top: window.innerHeight,
        behavior: 'smooth',
      })
      await new Promise((resolve) =>
        setTimeout(resolve, TIMEOUTS.CRAWL_INTERVAL)
      )
    }
  }
}
