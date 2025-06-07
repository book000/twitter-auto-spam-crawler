# テストガイド

## テスト環境設定

### Jest設定

- **テスト環境**: jsdom（ブラウザDOM環境をシミュレート）
- **タイムアウト**: 120秒（長時間実行テスト対応）
- **フェイクタイマー**: グローバルに有効化
- **TypeScript**: ts-jest プリセット使用

### 重要な設定項目

```json
{
  "testEnvironment": "jsdom",
  "testTimeout": 120000,
  "fakeTimers": {
    "enableGlobally": true
  },
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/src/$1"
  }
}
```

## テストファイル構造

### 命名規則

- **テストファイル**: `*.test.ts`
- **配置場所**: `src/__tests__/` 配下
- **構造**: 元のソースファイル構造を反映

```text
src/__tests__/
├── core/
│   ├── config.test.ts
│   └── storage.test.ts
├── services/
│   ├── crawler-service.test.ts
│   ├── tweet-service.test.ts
│   └── queue-service.test.ts
└── utils/
    ├── dom.test.ts
    └── error.test.ts
```

## ユーザースクリプトモック

### GM_* API モック

`src/__mocks__/userscript.ts`でユーザースクリプトグローバルをモック：

```typescript
// Map-based storage simulation
const mockStorage = new Map<string, unknown>()

;(globalThis as any).GM_getValue = jest.fn(
  (key: string, defaultValue?: unknown) => {
    return mockStorage.get(key) ?? defaultValue
  }
)
;(globalThis as any).GM_setValue = jest.fn((key: string, value: unknown) => {
  mockStorage.set(key, value)
})
;(globalThis as any).GM_registerMenuCommand = jest.fn((text: string, onClick: () => void) => {
  return Math.random().toString(36).substring(7) // Return mock command ID
})
;(globalThis as any).GM_unregisterMenuCommand = jest.fn((commandId: string) => {
  // Mock implementation for unregistering menu commands
})
```

### モックの使用例

```typescript
// テストでのモック使用
import '../__mocks__/userscript'

describe('StorageService', () => {
  beforeEach(() => {
    // モックをリセット
    jest.clearAllMocks()
    // ストレージをクリア
    ;(globalThis.GM_getValue as jest.Mock).mockClear()
    ;(globalThis.GM_setValue as jest.Mock).mockClear()
  })

  test('should save and retrieve data', () => {
    const service = new StorageService()
    
    service.setValue('test', 'value')
    expect(globalThis.GM_setValue).toHaveBeenCalledWith('test', 'value')
    
    const result = service.getValue('test', 'default')
    expect(globalThis.GM_getValue).toHaveBeenCalledWith('test', 'default')
  })
})
```

## タイマーテスト

### フェイクタイマー使用

グローバルに有効化されているため、基本的な設定は不要：

```typescript
describe('CrawlerService', () => {
  test('should crawl tweets at intervals', async () => {
    const crawler = new CrawlerService()
    const mockCrawl = jest.spyOn(crawler, 'crawlTweets')
    
    // 定期実行開始
    crawler.startPeriodicCrawling(5000)
    
    // 時間を進める
    jest.advanceTimersByTime(5000)
    expect(mockCrawl).toHaveBeenCalledTimes(1)
    
    jest.advanceTimersByTime(5000)
    expect(mockCrawl).toHaveBeenCalledTimes(2)
    
    crawler.stopPeriodicCrawling()
  })
})
```

### 非同期タイマーテスト

```typescript
test('should handle async operations with timers', async () => {
  const service = new NotificationService()
  const promise = service.scheduleNotification(1000)
  
  // Promiseが pending 状態であることを確認
  expect(promise).toBeInstanceOf(Promise)
  
  // 時間を進める
  jest.advanceTimersByTime(1000)
  
  // Promiseの解決を待つ
  await expect(promise).resolves.toBe(true)
})
```

## DOM テスト

### jsdom環境での DOM操作

```typescript
describe('DOMUtils', () => {
  beforeEach(() => {
    // DOM をリセット
    document.body.innerHTML = ''
  })

  test('should find tweet elements', () => {
    // テスト用の DOM を作成
    document.body.innerHTML = `
      <div data-testid="tweet" data-tweet-id="123">
        <span data-testid="retweet">10</span>
        <span data-testid="reply">5</span>
      </div>
    `
    
    const tweetElement = document.querySelector('[data-testid="tweet"]')
    expect(tweetElement).toBeTruthy()
    
    const retweetCount = extractRetweetCount(tweetElement!)
    expect(retweetCount).toBe(10)
  })
})
```

### 動的DOM変更のテスト

```typescript
test('should wait for element to appear', async () => {
  const promise = waitForElement('[data-testid="new-tweet"]', 1000)
  
  // 500ms後に要素を追加
  setTimeout(() => {
    const element = document.createElement('div')
    element.setAttribute('data-testid', 'new-tweet')
    document.body.appendChild(element)
  }, 500)
  
  // 時間を進める
  jest.advanceTimersByTime(500)
  
  const element = await promise
  expect(element).toBeTruthy()
})
```

## サービステスト

### 依存関係のモック

```typescript
describe('CrawlerService', () => {
  let tweetService: jest.Mocked<TweetService>
  let queueService: jest.Mocked<QueueService>
  let crawler: CrawlerService
  
  beforeEach(() => {
    tweetService = {
      extractTweets: jest.fn(),
      saveTweet: jest.fn(),
    } as any
    
    queueService = {
      addToQueue: jest.fn(),
      getWaitingTweets: jest.fn(),
    } as any
    
    crawler = new CrawlerService(tweetService, queueService)
  })

  test('should process extracted tweets', async () => {
    const mockTweets = [
      { id: '1', text: 'test', author: 'user1' },
      { id: '2', text: 'test2', author: 'user2' }
    ]
    
    tweetService.extractTweets.mockResolvedValue(mockTweets)
    
    await crawler.crawlTweets()
    
    expect(tweetService.extractTweets).toHaveBeenCalled()
    expect(queueService.addToQueue).toHaveBeenCalledTimes(2)
  })
})
```

### ストレージ呼び出しのテスト

```typescript
test('should save tweets to storage', () => {
  const tweets = [{ id: '1', text: 'test' }]
  
  queueService.saveTweets(tweets)
  
  expect(globalThis.GM_setValue).toHaveBeenCalledWith(
    'savedTweets',
    expect.arrayContaining(tweets)
  )
})
```

## エラーハンドリングテスト

### 例外処理のテスト

```typescript
test('should handle extraction errors gracefully', async () => {
  tweetService.extractTweets.mockRejectedValue(new Error('DOM error'))
  
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
  
  const result = await crawler.crawlTweets()
  
  expect(result).toEqual([])
  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringContaining('DOM error')
  )
  
  consoleSpy.mockRestore()
})
```

### ネットワークエラーのシミュレート

```typescript
test('should retry on network errors', async () => {
  const mockFetch = jest.fn()
    .mockRejectedValueOnce(new Error('Network error'))
    .mockResolvedValueOnce({ ok: true, json: () => ({}) })
  
  global.fetch = mockFetch
  
  const result = await notificationService.sendNotification('test')
  
  expect(mockFetch).toHaveBeenCalledTimes(2)
  expect(result).toBe(true)
})
```

## カバレッジ設定

### 除外ファイル

```json
{
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/main.ts",           // エントリーポイント除外
    "!src/types/**/*",        // 型定義除外
    "!src/pages/**/*",        // ページ固有ロジック除外
    "!src/**/*.test.ts",      // テストファイル除外
    "!src/__mocks__/**/*",    // モックファイル除外
    "!src/__tests__/**/*"     // テストディレクトリ除外
  ]
}
```

### カバレッジ目標

- **ライン**: 80%以上
- **関数**: 80%以上  
- **ブランチ**: 70%以上
- **ステートメント**: 80%以上

## テスト実行

### 基本コマンド

```bash
# 全テスト実行
pnpm test

# 特定ファイルのテスト
pnpm test -- src/services/tweet-service.test.ts

# ウォッチモード
pnpm test -- --watch

# カバレッジレポート生成
pnpm test -- --coverage
```

### CI/CD での注意点

- **フェイクタイマー**: CI環境でも正常に動作
- **タイムアウト**: 120秒設定で長時間テストに対応
- **並列実行**: `--runInBand` でシーケンシャル実行（安定性重視）
- **プロセス終了**: `--detectOpenHandles --forceExit` で確実終了
