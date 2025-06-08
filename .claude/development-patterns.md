# 開発パターンガイド

## ユーザースクリプト API使用

### ストレージ操作

```typescript
// 基本的な値の取得・設定
const value = GM_getValue('key', defaultValue)
GM_setValue('key', value)

// 型安全なストレージ操作例
interface Config {
  enableNotification: boolean
  crawlingInterval: number
}

const config: Config = GM_getValue('config', {
  enableNotification: true,
  crawlingInterval: 5000
})

GM_setValue('config', config)
```

### メニューコマンド登録

```typescript
// メニューコマンド登録例
GM_registerMenuCommand('設定を開く', () => {
  // 設定画面を表示
  showConfigDialog()
})

// 注意: GM_unregisterMenuCommandは実装によっては利用可能
// 現在のモックでは基本的なGM_registerMenuCommandのみをサポート
```

## DOM操作パターン

### X.com固有のセレクター使用

サイト変更に応じて更新が必要な可能性があるセレクター：

```typescript
// ツイート要素の特定
const tweetElements = document.querySelectorAll('[data-testid="tweet"]')

// エンゲージメント数の抽出
const retweetCount = tweetElement.querySelector('[data-testid="retweet"] span')?.textContent
const replyCount = tweetElement.querySelector('[data-testid="reply"] span')?.textContent
const likeCount = tweetElement.querySelector('[data-testid="like"] span')?.textContent

// 「さらに読み込む」ボタンの検索とクリック
const loadMoreButton = document.querySelector('[data-testid="loadMore"]')
if (loadMoreButton) {
  loadMoreButton.click()
}
```

### 動的コンテンツ待機パターン

```typescript
// 要素が表示されるまで待機
async function waitForElement(selector: string, timeout = 5000): Promise<Element | null> {
  return new Promise((resolve) => {
    const element = document.querySelector(selector)
    if (element) {
      resolve(element)
      return
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector)
      if (element) {
        observer.disconnect()
        resolve(element)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // タイムアウト処理
    setTimeout(() => {
      observer.disconnect()
      resolve(null)
    }, timeout)
  })
}
```

### スクロール自動化

```typescript
// 段階的スクロール
async function autoScroll(scrollCount = 3, scrollDelay = 2000): Promise<void> {
  for (let i = 0; i < scrollCount; i++) {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    })
    
    // スクロール完了を待機
    await new Promise(resolve => setTimeout(resolve, scrollDelay))
    
    // 新しいコンテンツの読み込み待機
    await waitForNewContent()
  }
}

async function waitForNewContent(): Promise<void> {
  const initialHeight = document.body.scrollHeight
  const maxWait = 5000
  const startTime = Date.now()
  
  return new Promise((resolve) => {
    const checkNewContent = () => {
      if (document.body.scrollHeight > initialHeight || Date.now() - startTime > maxWait) {
        resolve()
      } else {
        setTimeout(checkNewContent, 100)
      }
    }
    checkNewContent()
  })
}
```

## エラーハンドリング

### ErrorHandlerによるDOM要素監視とタイムアウト

```typescript
// ErrorHandlerクラスの使用例（メモリリーク防止のタイムアウト機能付き）
import { ErrorHandler } from '@/utils/error'

// エラーダイアログの監視（実際の使用例: 5分タイムアウト）
ErrorHandler.handleErrorDialog(async (dialog) => {
  const dialogMessage = dialog.textContent
  console.error('Error dialog detected:', dialogMessage)
  
  if (dialogMessage?.includes('削除') || dialogMessage?.includes('deleted')) {
    console.error('Tweet deleted. Skip this tweet.')
    await handleDeletedTweet()
  }
}, 300_000).catch((error: unknown) => {
  console.error('Error in handleErrorDialog:', error)
})

// 短いタイムアウトでの使用例（テスト等）
ErrorHandler.handleErrorDialog(async (dialog) => {
  // ダイアログ処理
}, 10000) // 10秒タイムアウト

// 削除・違反投稿の検出（実際の使用例: 5分タイムアウト）
ErrorHandler.detectUnprocessablePost(async (element) => {
  console.error('Problematic post detected:', element)
  await skipProblematicPost()
}, 300_000).catch((error: unknown) => {
  console.error('Error in detectUnprocessablePost:', error)
})

**重要なタイムアウト設定指針**:
- **本番環境**: ページ読み込み待ちは300秒（5分）程度の長いタイムアウトを設定
- **テスト環境**: 10秒程度の短いタイムアウトで迅速テスト
- **デフォルト**: 30秒は一般的なユースケース向け
```

### ErrorHandlerの新しい要素待機メソッド

Issue #21で修正されたメソッドによる要素待機とエラー伝播：

```typescript
// 単一要素待機とコールバック実行（エラー適切伝播）
try {
  await ErrorHandler.waitForElementAndCallback('#target-element', async (element) => {
    // 要素が見つかった時の処理
    console.log('Element found:', element)
    await processElement(element)
    
    // コールバック内でエラーが発生した場合、適切に伝播される
    if (errorCondition) {
      throw new Error('Processing failed')  // このエラーは呼び出し元に伝播
    }
  }, 30000)
  
  console.log('Element processing completed successfully')
} catch (error) {
  // タイムアウトエラーまたはコールバックエラーをキャッチ
  console.error('Element processing failed:', error)
  // 適切なフォールバック処理
}

// 複数要素待機とコールバック実行（エラー適切伝播）
try {
  await ErrorHandler.waitForAllElementsAndCallback('.tweet-elements', async (elements) => {
    console.log(`Found ${elements.length} elements`)
    
    for (const element of elements) {
      await processIndividualElement(element)
    }
  }, 60000)
  
  console.log('All elements processed successfully')
} catch (error) {
  console.error('Elements processing failed:', error)
  // エラー処理とフォールバック
}
```

**修正内容（Issue #21対応）**:
- **以前**: コールバック内エラーが隠蔽され、デバッグが困難
- **現在**: コールバック内エラーが適切に呼び出し元に伝播
- **互換性**: 既存コードは修正不要（メソッド自体を新規追加）

**重要な注意点:**
- ErrorHandlerメソッドは自動的にタイムアウトするため、メモリリークを防ぎます
- タイムアウト時には警告ログが出力されます
- 新しいメソッドはコールバックエラーを適切に伝播します
- エラー情報は詳細なログと共に出力されます
- 既存のコールバック処理は変更不要（後方互換性あり）

### 包括的なエラーキャッチ

```typescript
// main.tsでの基本的なエラーハンドリング
try {
  await initializeUserScript()
} catch (error) {
  console.error('UserScript initialization failed:', error)
  
  // 通知サービスが利用可能な場合はエラー通知
  if (notificationService) {
    await notificationService.sendError('UserScript Error', error.message)
  }
  
  // 必要に応じて再初期化を試行
  setTimeout(() => {
    console.log('Attempting to reinitialize...')
    initializeUserScript()
  }, 10000)
}
```

### 型安全なエラーハンドリング

```typescript
// TypeScript推奨のerror: unknown型を使用
// サービスメソッドでのエラーハンドリング例
async function crawlTweets(): Promise<Tweet[]> {
  try {
    const tweets = await extractTweetsFromDOM()
    return tweets.filter(tweet => isValidTweet(tweet))
  } catch (error: unknown) {
    console.error('Failed to crawl tweets:', error)
    
    // エラー状態をストレージに記録
    GM_setValue('lastCrawlError', {
      timestamp: Date.now(),
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // 空の配列を返して処理継続
    return []
  }
}
```

## 非同期処理パターン

### Promise チェーン

```typescript
// 適切なawaitパターン
async function processQueuedTweets(): Promise<void> {
  const waitingTweets = await queueService.getWaitingTweets()
  
  for (const tweetId of waitingTweets) {
    try {
      const tweet = await tweetService.getTweetDetails(tweetId)
      await queueService.markAsProcessed(tweetId)
      await tweetService.saveTweet(tweet)
    } catch (error) {
      console.error(`Failed to process tweet ${tweetId}:`, error)
      // 個別のエラーは処理継続のため記録のみ
    }
  }
}
```

### タイマー管理とメモリリーク防止

```typescript
// 定期実行の管理（メモリリーク防止のタイムアウト付き）
class CrawlingScheduler {
  private intervalId: number | null = null
  
  start(intervalMs: number): void {
    if (this.intervalId) {
      this.stop()
    }
    
    this.intervalId = setInterval(async () => {
      try {
        await this.executeCrawling()
      } catch (error: unknown) {
        console.error('Scheduled crawling failed:', error)
      }
    }, intervalMs)
  }
  
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
  
  private async executeCrawling(): Promise<void> {
    // クロール処理の実装
  }
}

// メモリリークを防ぐためのタイムアウト付きsetIntervalパターン
function createTimeoutInterval(
  callback: () => void | Promise<void>,
  intervalMs: number,
  timeoutMs: number = 30000
): { clear: () => void } {
  const startTime = Date.now()
  let intervalId: number | null = null
  
  const execute = async () => {
    if (Date.now() - startTime > timeoutMs) {
      console.warn(`Interval timeout after ${timeoutMs}ms`)
      clear()
      return
    }
    
    try {
      await callback()
    } catch (error: unknown) {
      console.error('Interval callback error:', error)
    }
  }
  
  intervalId = setInterval(execute, intervalMs)
  
  const clear = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }
  
  return { clear }
}

// 使用例
const scheduler = createTimeoutInterval(
  async () => {
    // 定期実行処理
    await performCrawling()
  },
  5000,  // 5秒間隔
  60000  // 60秒タイムアウト
)

// クリーンアップ
scheduler.clear()
```

## TypeScript型定義パターン

### インターフェース設計

```typescript
// 基本的なデータ型
interface Tweet {
  id: string
  text: string
  author: string
  timestamp: number
  engagement: {
    retweets: number
    replies: number
    likes: number
  }
  url: string
}

// 設定型
interface UserConfig {
  crawling: {
    enabled: boolean
    interval: number
    maxTweets: number
  }
  filtering: {
    minRetweets: number
    minReplies: number
  }
  notifications: {
    enabled: boolean
    webhookUrl?: string
  }
}

// ストレージキー型
type StorageKey = 
  | 'waitingTweets'
  | 'checkedTweets' 
  | 'savedTweets'
  | 'config'
  | 'lastCrawlTime'
```

### ユーティリティ型の活用

```typescript
// 部分的な設定更新用の型
type PartialConfig = Partial<UserConfig>

// 必須フィールドのみの型
type TweetSummary = Pick<Tweet, 'id' | 'author' | 'timestamp'>

// エンゲージメント情報のみの型
type EngagementInfo = Tweet['engagement']
```

## パフォーマンス最適化

### DOM操作の最適化

```typescript
// 効率的なDOM検索
const tweetCache = new Map<string, Element>()

function getCachedTweet(tweetId: string): Element | null {
  if (tweetCache.has(tweetId)) {
    return tweetCache.get(tweetId)!
  }
  
  const element = document.querySelector(`[data-tweet-id="${tweetId}"]`)
  if (element) {
    tweetCache.set(tweetId, element)
  }
  
  return element
}

// 定期的にキャッシュをクリア
setInterval(() => {
  tweetCache.clear()
}, 60000) // 1分ごと
```

### バッチ処理

```typescript
// 大量のツイートを効率的に処理
async function processTweetsBatch(tweets: Tweet[], batchSize = 10): Promise<void> {
  for (let i = 0; i < tweets.length; i += batchSize) {
    const batch = tweets.slice(i, i + batchSize)
    
    // 並列処理でバッチを処理
    await Promise.all(batch.map(tweet => processSingleTweet(tweet)))
    
    // バッチ間で少し待機（レート制限対策）
    if (i + batchSize < tweets.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
}
```
