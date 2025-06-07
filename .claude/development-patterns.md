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
const commandId = GM_registerMenuCommand('設定を開く', () => {
  // 設定画面を表示
  showConfigDialog()
})

// 必要に応じて登録解除
GM_unregisterMenuCommand(commandId)
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

### サービス層でのエラーハンドリング

```typescript
// サービスメソッドでのエラーハンドリング例
async function crawlTweets(): Promise<Tweet[]> {
  try {
    const tweets = await extractTweetsFromDOM()
    return tweets.filter(tweet => isValidTweet(tweet))
  } catch (error) {
    console.error('Failed to crawl tweets:', error)
    
    // エラー状態をストレージに記録
    GM_setValue('lastCrawlError', {
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack
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

### タイマー管理

```typescript
// 定期実行の管理
class CrawlingScheduler {
  private intervalId: number | null = null
  
  start(intervalMs: number): void {
    if (this.intervalId) {
      this.stop()
    }
    
    this.intervalId = setInterval(async () => {
      try {
        await this.executeCrawling()
      } catch (error) {
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