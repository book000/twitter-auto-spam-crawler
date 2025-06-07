import { TIMEOUTS } from '@/core/constants'

/**
 * DOM操作とページ状態検出のためのユーティリティ関数群。
 * 要素の待機、ページエラー検出、返信読み込みボタンのクリック処理を提供。
 */
export const DomUtils = {
  /**
   * 指定されたセレクターの要素がDOMに出現するまで待機。
   * @param selector - 待機する要素のCSSセレクター
   * @param limitSec - 待機のタイムアウト時間（秒）
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
   * 現在のページがエラーページ（リフレッシュアイコン表示）かどうかを判定。
   * @returns エラーページの場合true
   */
  isFailedPage(): boolean {
    return (
      document.querySelector(
        'div.css-175oi2r path[d="M12 4c-4.418 0-8 3.58-8 8s3.582 8 8 8c3.806 0 6.993-2.66 7.802-6.22l1.95.44C20.742 18.67 16.76 22 12 22 6.477 22 2 17.52 2 12S6.477 2 12 2c3.272 0 6.176 1.57 8 4V3.5h2v6h-6v-2h2.616C17.175 5.39 14.749 4 12 4z"]'
      ) !== null
    )
  },

  /**
   * 「さらに返信を読み込む」ボタンをクリック（標準的な検出方法）。
   */
  clickMoreReplies(): void {
    const moreRepliesButton = document.querySelector(
      'div[data-testid="primaryColumn"] div[data-testid="cellInnerDiv"] > div > div > button[role="button"]'
    )
    if (moreRepliesButton) {
      console.log('clickMoreReplies: clicked moreRepliesButton')
      ;(moreRepliesButton as HTMLButtonElement).click()
    }
  },

  /**
   * 「さらに返信を読み込む」ボタンをクリック（積極的な検出方法）。
   * テキストコンテンツベースで対象ボタンを特定。
   */
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
