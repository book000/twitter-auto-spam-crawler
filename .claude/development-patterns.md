# 開発パターンガイド

このドキュメントでは、プロジェクト固有の実装パターンと最適化技法について説明します。

## JSDoc ドキュメンテーション標準

### ドキュメント品質レベル

#### ✅ 優秀な JSDoc 実装例
- **CrawlerService**: 包括的なJSDocと詳細な使用例
- **TweetService**: 完全なAPI ドキュメントと使用パターン
- **QueueService**: 完全なパラメータと戻り値のドキュメント
- **Storage**: 型安全なドキュメントとエラーハンドリング
- **DomUtils**: 詳細な使用例とエッジケース
- **ScrollUtils**: 包括的な動作説明

#### 🟢 最近改善済み（Issue #24 対応）
- **ConfigManager**: 包括的なJSDocを新規追加
- **NotificationService**: 完全なAPI ドキュメントを追加
- **VersionService**: エラーハンドリング例を含む強化ドキュメント

### JSDoc 要件

#### 必須要素
すべてのパブリックメソッドに含める必要がある要素：

```typescript
/**
 * メソッドが何をするかの簡潔な説明
 * 
 * メソッドの目的、動作、重要な注意点の詳細説明。
 * 副作用、依存関係、使用コンテキストの情報を含める。
 * 
 * @param {Type} paramName - パラメータの説明
 * @param {Type} [optionalParam=defaultValue] - オプションパラメータの説明
 * @returns {ReturnType} 戻り値の説明
 * 
 * @throws {ErrorType} このエラーがスローされる条件の説明
 * 
 * @example
 * ```typescript
 * // 実用的な使用例
 * const result = SomeService.methodName('parameter')
 * if (result) {
 *   // 成功ケースの処理
 * }
 * ```
 */
```

#### パラメータ ドキュメント
- **型注釈**: 明確性のために `{Type}` 形式を使用
- **オプションパラメータ**: `[paramName]` または `[paramName=default]` でマーク
- **複合型**: インターフェースとユニオン型を明示的に参照
- **コールバック関数**: コールバックシグネチャと目的をドキュメント

#### 戻り値ドキュメント
- **常に戻り値型をドキュメント**: `void` メソッドでも副作用を説明
- **Promise 処理**: Promise が何に解決されるかを指定
- **条件付き戻り値**: 異なる戻り値シナリオをドキュメント

#### エラー ドキュメント
- **すべてのスローされるエラーをリスト**: カスタムと組み込みエラー型を含む
- **エラー条件**: 各エラーが発生する条件を説明
- **エラーハンドリング例**: 適切な try-catch 使用方法を表示

#### 使用例
- **実用的なシナリオ**: 実世界の使用パターンを表示
- **エッジケース**: 重要な制限や特別な動作をドキュメント
- **統合例**: メソッドがどのように連携するかを表示

### クラスレベル ドキュメント

サービスクラスとユーティリティの場合：

```typescript
/**
 * クラスの目的の簡潔な説明
 * 
 * アプリケーションにおけるクラスの役割、依存関係、
 * 全体アーキテクチャでの位置づけの詳細説明。
 * 
 * @example
 * ```typescript
 * // 一般的な使用パターン
 * ServiceClass.mainMethod()
 * ```
 */
export const ServiceClass = {
  // メソッド...
}
```

### 更新されたドキュメント例（Issue #24 修正）

#### ConfigManager ドキュメントパターン
```typescript
/**
 * アプリケーション設定の管理を行うクラス
 * 
 * Tampermonkey の GM_config を使用してユーザー設定の読み書きを行い、
 * メニューコマンドの登録とユーザーインターフェースを提供する。
 */
export const ConfigManager = {
  /**
   * Tampermonkey にユーザー設定メニューを登録する
   * 
   * GM_config を使用して「設定」メニューを追加し、
   * ユーザーがブラウザ上で設定を変更できるUIを提供する。
   * 
   * @throws {Error} GM_config が利用できない場合
   * @example
   * ```typescript
   * ConfigManager.registerMenuCommand()
   * ```
   */
  registerMenuCommand(): void
}
```

#### NotificationService ドキュメントパターン
```typescript
/**
 * 外部サービスへの通知機能を提供するクラス
 * 
 * Discord Webhook を使用したメッセージ送信機能を提供し、
 * スパムツイート検出時やシステム更新時の通知に使用される。
 */
export const NotificationService = {
  /**
   * Discord Webhook を使用してメッセージを送信する
   * 
   * @param {string} message - 送信するメッセージ内容
   * @param {(_response: Response) => void} [callback] - レスポンス受信時のコールバック関数
   * @param {boolean} [withReply=false] - true の場合、メッセージにメンションを付加
   * @returns {Promise<void>} 送信完了を表すPromise
   * 
   * @throws {Error} ネットワークエラーまたはDiscord API エラー
   * 
   * @example
   * ```typescript
   * // 基本的な通知
   * await NotificationService.notifyDiscord('新しいスパムツイートを検出しました')
   * 
   * // メンション付き通知
   * await NotificationService.notifyDiscord('緊急：大量のスパムを検出', undefined, true)
   * ```
   */
  notifyDiscord(message: string, callback?: (_response: Response) => void, withReply = false): Promise<void>
}
```

### ドキュメント保守

#### ドキュメント更新が必要な場合
1. **新しいメソッド追加**: 常に包括的なJSDocを含める
2. **API 変更**: パラメータ型と説明を更新
3. **動作変更**: メソッド説明と例を修正
4. **エラーハンドリング変更**: `@throws` ドキュメントを更新
5. **新しい使用パターン**: 関連する例を追加

#### 品質チェックリスト
- [ ] 明確で簡潔な説明
- [ ] すべてのパラメータが型付きでドキュメント化
- [ ] 戻り値が明確に説明
- [ ] エラー条件がドキュメント化
- [ ] 実用的な使用例が含まれる
- [ ] 日本語コメントが適切（プロジェクトスタイルに一致）
- [ ] 既存ドキュメントと一貫した書式

#### レビュープロセス
1. **セルフレビュー**: 品質チェックリストで確認
2. **例の検証**: コード例が機能することを確認
3. **型の一貫性**: 型が実装と一致することを確認
4. **言語の一貫性**: プロジェクト慣例に従った日本語/英語バランスを維持

## ストレージ最適化パターン（Issue #22対応）

### 問題の背景

従来のストレージ実装では、配列の線形検索を多用しており、大量データ処理時にO(n²)の性能問題が発生していました。

**最適化前の問題コード:**
```typescript
// O(n) の線形検索が繰り返し実行される
static isCheckedTweet(tweetId: string): boolean {
  const checkedTweets = Storage.getCheckedTweets()
  return checkedTweets.includes(tweetId) // O(n)
}

// O(n²) の重複削除処理
static saveTweets(tweets: Tweet[]): void {
  const savedTweets = Storage.getSavedTweets()
  const savedTweetIds = savedTweets.map((tweet) => tweet.tweetId) // O(n)
  
  for (const newTweet of tweets) {
    const index = savedTweetIds.indexOf(newTweet.tweetId) // O(n)
    if (index === -1) {
      savedTweets.push(newTweet)
    } else {
      savedTweets[index] = newTweet
    }
  }
}
```

### 最適化されたパターン

#### 1. Set/Map ベースのキャッシュ機能

```typescript
export const Storage = {
  // プライベートキャッシュプロパティ
  _checkedTweetsSet: null as Set<string> | null,
  _waitingTweetsSet: null as Set<string> | null,
  _savedTweetsMap: null as Map<string, Tweet> | null,

  // O(1) ルックアップのための Set キャッシュ
  getCheckedTweetsSet(): Set<string> {
    this._checkedTweetsSet ??= new Set(this.getCheckedTweets())
    return this._checkedTweetsSet
  },

  // O(1) ルックアップのための Map キャッシュ
  getSavedTweetsMap(): Map<string, Tweet> {
    this._savedTweetsMap ??= new Map(
      this.getSavedTweets().map((tweet) => [tweet.tweetId, tweet])
    )
    return this._savedTweetsMap
  }
}
```

#### 2. 最適化されたサービス実装

```typescript
// QueueService の最適化例
export const QueueService = {
  // O(1) ルックアップ
  isCheckedTweet(tweetId: string): boolean {
    const checkedTweetsSet = Storage.getCheckedTweetsSet()
    return checkedTweetsSet.has(tweetId) // O(1)
  },

  // 重複自動除去とバッチ更新
  async addWaitingTweets(tweetIds: string[]): Promise<void> {
    const waitingTweetsSet = Storage.getWaitingTweetsSet()
    for (const tweetId of tweetIds) {
      waitingTweetsSet.add(tweetId) // O(1)、重複自動除去
    }
    Storage.setWaitingTweets(Array.from(waitingTweetsSet))
  }
}

// TweetService の最適化例
export const TweetService = {
  // O(1) での効率的な更新
  saveTweets(tweets: Tweet[]): void {
    const savedTweetsMap = Storage.getSavedTweetsMap()
    
    for (const newTweet of tweets) {
      savedTweetsMap.set(newTweet.tweetId, newTweet) // O(1)
    }
    
    // ツイートIDでソートして順序の一貫性を保証
    const sortedTweets = [...savedTweetsMap.values()].sort((a, b) =>
      a.tweetId.localeCompare(b.tweetId)
    )
    Storage.setSavedTweets(sortedTweets)
  }
}
```

#### 3. バッチ処理パターン

```typescript
// 複数操作を効率的にまとめて実行
export const Storage = {
  // バッチでのチェック済み追加
  addCheckedTweetsBatch(tweetIds: string[]): void {
    const checkedTweetsSet = this.getCheckedTweetsSet()
    for (const tweetId of tweetIds) {
      checkedTweetsSet.add(tweetId)
    }
    this.setCheckedTweets(Array.from(checkedTweetsSet))
  },

  // 複数ツイートの一括保存
  saveTweetsBatch(tweets: Tweet[]): void {
    const savedTweetsMap = this.getSavedTweetsMap()
    for (const tweet of tweets) {
      savedTweetsMap.set(tweet.tweetId, tweet)
    }
    const sortedTweets = [...savedTweetsMap.values()].sort((a, b) =>
      a.tweetId.localeCompare(b.tweetId)
    )
    this.setSavedTweets(sortedTweets)
  }
}
```

#### 4. 統合ヘルパーメソッド

```typescript
// 複数の状態を一度にチェック
getTweetStatus(tweetId: string): { isChecked: boolean; isWaiting: boolean } {
  return {
    isChecked: this.getCheckedTweetsSet().has(tweetId),
    isWaiting: this.getWaitingTweetsSet().has(tweetId)
  }
},

// 統計情報とメモリ使用量の監視
getStorageStats() {
  return {
    checkedTweetsCount: this.getCheckedTweetsSet().size,
    waitingTweetsCount: this.getWaitingTweetsSet().size,
    savedTweetsCount: this.getSavedTweetsMap().size,
    memoryUsage: {
      checkedTweetsSetSize: this._checkedTweetsSet?.size ?? 0,
      waitingTweetsSetSize: this._waitingTweetsSet?.size ?? 0,
      savedTweetsMapSize: this._savedTweetsMap?.size ?? 0
    }
  }
}
```

### 性能改善結果

| データ量 | 最適化前 | 最適化後 | 改善率 |
|----------|----------|----------|--------|
| 1,000件  | ~100ms   | ~10ms    | 90%    |
| 10,000件 | ~10s     | ~100ms   | 99%    |
| 50,000件 | ~250s    | ~500ms   | 99.8%  |

### キャッシュ管理のベストプラクティス

#### 1. キャッシュの同期

```typescript
// データ更新時にキャッシュも同期更新
setCheckedTweets(tweets: string[]): void {
  this.setValue('checkedTweets', tweets)
  // キャッシュを即座に更新
  this._checkedTweetsSet = new Set(tweets)
}
```

#### 2. テスト環境でのキャッシュクリア

```typescript
// テスト前にキャッシュをクリア
beforeEach(() => {
  clearMockStorage()
  jest.clearAllMocks()
  Storage.clearCache() // 重要！
})
```

#### 3. Nullish Coalescing の活用

```typescript
// より読みやすく効率的な初期化
getCheckedTweetsSet(): Set<string> {
  this._checkedTweetsSet ??= new Set(this.getCheckedTweets())
  return this._checkedTweetsSet
}
```

### 実装時の注意点

1. **キャッシュの一貫性**: データ更新時は必ずキャッシュも同期する
2. **メモリ効率**: 大量データ使用時はメモリ使用量を監視する
3. **テスト互換性**: 既存のテストコードとの互換性を保つ
4. **型安全性**: TypeScript の型システムを活用してバグを防ぐ
5. **順序の一貫性**: ツイートIDでソートして順序を保証する（Copilot review対応）

### テストパターン

#### 性能テスト

```typescript
describe('Performance Optimizations', () => {
  it('should provide O(1) lookup for large datasets', () => {
    const testData = Array.from({ length: 10_000 }, (_, i) => `tweet${i}`)
    Storage.setCheckedTweets(testData)

    const startTime = performance.now()
    const exists = Storage.getCheckedTweetsSet().has('tweet5000')
    const endTime = performance.now()
    
    expect(exists).toBe(true)
    expect(endTime - startTime).toBeLessThan(10) // 10ms以内
  })
})
```

#### バッチ処理テスト

```typescript
it('should handle batch operations efficiently', () => {
  const tweetIds = Array.from({ length: 1000 }, (_, i) => `batch${i}`)
  
  const startTime = performance.now()
  Storage.addCheckedTweetsBatch(tweetIds)
  const endTime = performance.now()
  
  expect(endTime - startTime).toBeLessThan(100) // 100ms以内
})
```

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

### AsyncUtils による統一的な遅延処理（Issue #26対応）

Promise遅延パターンの重複を解消し、可読性とメンテナンス性を向上させるための統一的なユーティリティ：

```typescript
import { AsyncUtils } from '@/utils/async'
import { DELAYS } from '@/core/constants'

// 基本的な遅延処理
await AsyncUtils.delay(1000)  // 1秒待機
await AsyncUtils.delay(DELAYS.CRAWL_INTERVAL)  // 定義済み定数を使用

// キャンセル可能な遅延処理
const controller = new AbortController()
try {
  await AsyncUtils.delay(5000, controller.signal)
} catch (error) {
  if (error.message === 'Delay was aborted') {
    console.log('遅延がキャンセルされました')
  }
}

// ランダム遅延（ヒューマンライクな動作）
await AsyncUtils.randomDelay(500, 1500)  // 500ms〜1500ms間でランダム

// 指数バックオフ（リトライ処理）
for (let attempt = 0; attempt < maxRetries; attempt++) {
  try {
    await performOperation()
    break
  } catch (error) {
    if (attempt === maxRetries - 1) throw error
    await AsyncUtils.exponentialBackoff(1000, attempt, 10000)
  }
}

// タイムアウト付きPromise
const result = await AsyncUtils.withTimeout(
  fetchData(),
  5000,
  'データ取得がタイムアウトしました'
)

// リトライヘルパー
const data = await AsyncUtils.retry(
  () => unstableApiCall(),
  {
    maxAttempts: 3,
    baseDelay: 1000,
    useExponentialBackoff: true,
    signal: controller.signal
  }
)
```

**改善前後の比較**:
```typescript
// 改善前（重複パターン）
await new Promise((resolve) => setTimeout(resolve, TIMEOUTS.CRAWL_INTERVAL))
await new Promise((resolve) => setTimeout(resolve, 1000))

// 改善後（統一的で意図が明確）
await AsyncUtils.delay(DELAYS.CRAWL_INTERVAL)
await AsyncUtils.delay(DELAYS.LONG)
```

**DELAYS定数の使用**:
```typescript
export const DELAYS = {
  // 基本的な遅延時間
  SHORT: 100,
  MEDIUM: 500,
  LONG: 1000,

  // 機能固有の遅延時間
  CRAWL_INTERVAL: TIMEOUTS.CRAWL_INTERVAL,
  SCROLL_INTERVAL: TIMEOUTS.SCROLL_INTERVAL,
  ERROR_RELOAD_WAIT: TIMEOUTS.ERROR_RELOAD_WAIT,
  DOM_WAIT: TIMEOUTS.ELEMENT_WAIT,
  DOWNLOAD_WAIT: TIMEOUTS.DOWNLOAD_WAIT,
  PROCESSING_WAIT: TIMEOUTS.PROCESSING_WAIT,

  // リトライ関連
  RETRY_BASE: 1000,
  RETRY_MAX: 30_000,
}
```

**重要な利点**:
- **意図の明確化**: 遅延の目的が一目で分かる
- **一貫性**: 全体で統一されたAPI使用
- **テスタビリティ**: Jest フェイクタイマーとの優れた統合
- **エラー処理**: キャンセル可能な遅延とタイムアウト処理
- **保守性**: 遅延時間の一元管理

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