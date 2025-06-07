import { TIMEOUTS, THRESHOLDS } from '@/core/constants'
import { DomUtils } from './dom'

/**
 * ページの自動スクロールと無限スクロール処理を管理するクラス。
 * コンテンツの動的読み込みと返信ボタンのクリックを自動化。
 */
export class ScrollUtils {
  private static scrollPageInterval: ReturnType<typeof setInterval> | null =
    null

  /**
   * ページの自動無限スクロールを実行。
   * コンテンツの高さが変化しなくなるまで継続し、返信ボタンのクリックも実行。
   * @returns スクロール完了時に解決されるPromise
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

  /**
   * 指定された回数だけスクロールを実行。
   * @param count - スクロール回数
   */
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
