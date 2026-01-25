# GitHub Copilot 開発ガイド

このファイルは、GitHub Copilot が twitter-auto-spam-crawler プロジェクトで効果的に動作するための指示とガイドラインを提供します。

## プロジェクト概要

Twitter/X のツイートを自動でクロールし、潜在的なスパムコンテンツを特定する **TypeScript ベースのユーザースクリプト** です。Blue Blocker 拡張機能と組み合わせて使用することを想定しており、Tampermonkey/Greasemonkey 経由でブラウザで動作する `.user.js` ファイルにコンパイルされます。

### 重要な技術スタック

- **TypeScript**: strict mode、ES2020 ターゲット
- **ユーザースクリプト**: GM_* API（GM_getValue/GM_setValue 等）を使用
- **DOM 操作**: X.com 固有のセレクターを使用
- **Webpack**: ユーザースクリプトファイル（.user.js）の生成
- **Jest**: テスト（120 秒タイムアウト、jsdom 環境）
- **ESLint**: @book000/eslint-config 使用
- **pnpm**: パッケージマネージャ（必須、npm/yarn 不可）

## 言語・コミュニケーション要件

### 必須ルール

1. **すべての会話は日本語で行う**
   - PR 本文、レビューコメント、Issue コメント
   - コード内のコメント、JSDoc
   - コミットメッセージの詳細説明

2. **Conventional Commits 仕様**
   - `<description>` は日本語で記載
   - 例: `feat: Discord Webhook 連携機能を追加`

   ```
   <type>[optional scope]: <description>

   [optional body in Japanese]

   [optional footer]
   ```

   **許可されている型:**
   - `feat`: 新機能追加
   - `fix`: バグ修正
   - `docs`: ドキュメント更新
   - `perf`: パフォーマンス改善
   - `refactor`: リファクタリング
   - `style`: コードスタイル変更
   - `test`: テスト関連
   - `chore`: その他の変更

3. **ブランチ命名**
   - [Conventional Branch](https://conventional-branch.github.io) に従う
   - 形式: `<type>/<description>`
   - `<type>` は短縮形（feat, fix）を使用
   - 例: `feat/add-discord-webhook`

## アーキテクチャパターン

### ページベースルーティング

```typescript
// src/main.ts で URL 基盤のルーティング
if (location.href.startsWith('https://x.com/home')) {
  // ホームページ処理
} else if (/^https:\/\/x\.com\/[^/]+\/status\/\d+/.test(location.href)) {
  // ツイートページ処理
}
```

### サービス層アーキテクチャ

```typescript
// 主要サービス
import { CrawlerService } from '@/services/crawler-service'
import { TweetService } from '@/services/tweet-service'
import { QueueService } from '@/services/queue-service'
import { NotificationService } from '@/services/notification-service'

// 依存関係: CrawlerService → TweetService, QueueService, NotificationService
```

### PageErrorHandler パターン（統一エラーハンドリング）

```typescript
import { PageErrorHandler } from '@/utils/page-error-handler'

// 標準エラーハンドリング
try {
  await DomUtils.waitElement('.timeline')
} catch (error) {
  await PageErrorHandler.handlePageError('Home', 'runHome', error)
  return
}

// 要素待機とエラーハンドリングの統合
const element = await PageErrorHandler.waitForElementWithErrorHandling(
  '[data-testid="tweet"]',
  'Home',
  'runHome'
)
```

PageErrorHandler は全ページコンポーネントで発生していたエラーハンドリングコードの重複を解決するために導入された共通ユーティリティです。従来の 200 行以上の重複コードを削減し、一貫性のあるエラーハンドリングを提供します。

#### 統一ログ出力

```typescript
PageErrorHandler.logPageStart('Home', 'runHome')
PageErrorHandler.logAction('runHome', 'Found 10 tweets')
PageErrorHandler.logError('runHome', 'Error occurred', error)
```

## テスト要件

### Jest 設定

```typescript
// jest.config in package.json
{
  "preset": "ts-jest",
  "testEnvironment": "jsdom",
  "testTimeout": 120000, // 120 秒タイムアウト
  "fakeTimers": { "enableGlobally": true }
}
```

### ユーザースクリプト API モック

```typescript
// src/__mocks__/userscript.ts を使用
import '@/__mocks__/userscript'

// GM_getValue, GM_setValue 等が自動的にモック化される
```

### テストパターン

```typescript
describe('ServiceName', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
  })
  
  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })
})
```

### テストファイル構造

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

### ユーザースクリプト API モック詳細

`src/__mocks__/userscript.ts` でユーザースクリプトグローバルをモック：

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
;(globalThis as any).GM_config = jest.fn()
;(globalThis as any).GM_config_event = 'GM_config_event'
;(globalThis as any).addEventListener = jest.fn()
```

## ユーザースクリプト固有の考慮事項

### GM_* API 使用

```typescript
// ストレージ操作
const value = GM_getValue('key', 'defaultValue')
GM_setValue('key', value)

// メニュー登録
GM_registerMenuCommand('設定', () => {
  // 設定 UI 表示
})
```

### DOM セレクター（X.com 固有）

```typescript
// ツイート要素
const tweets = document.querySelectorAll('[data-testid="tweet"]')

// エンゲージメント指標
const retweets = tweet.querySelector('[data-testid="retweet"]')
const replies = tweet.querySelector('[data-testid="reply"]')
const likes = tweet.querySelector('[data-testid="like"]')
```

### ビルドターゲット

```typescript
// webpack.config.js でユーザースクリプトメタデータ自動生成
// dist/twitter-auto-spam-crawler.user.js が最終出力
```

## 開発ワークフロー

### 必須品質チェック

コード変更後は必ず以下を実行：

```bash
pnpm run lint  # ESLint + Prettier + TypeScript
pnpm test      # Jest テスト（120 秒タイムアウト）
```

## JSDoc 標準

```typescript
/**
 * ツイートを処理して待機キューに追加します
 * @param tweets - 処理対象のツイート要素配列
 * @param options - 処理オプション
 * @param options.filterSpam - スパムフィルターを適用するかどうか
 * @returns 処理されたツイート数
 * @example
 * ```typescript
 * const count = await processTweets(tweets, { filterSpam: true })
 * console.log(`処理されたツイート数: ${count}`)
 * ```
 */
async function processTweets(
  tweets: Element[],
  options: { filterSpam: boolean }
): Promise<number> {
  // 実装
}
```

## パフォーマンス・最適化

### タイマー管理

```typescript
// メモリリーク防止のタイムアウト機能
import { ErrorHandler } from '@/utils/error'

// 安全な要素待機（タイムアウト付き）
const element = await ErrorHandler.waitForElementWithTimeout(
  '.selector',
  30000 // 30 秒タイムアウト
)

// 安全なコールバック実行（タイムアウト付き）
await ErrorHandler.waitForElementAndCallbackWithTimeout(
  '.selector',
  (element) => {
    // 処理
  },
  30000 // 30 秒タイムアウト
)
```

### DOM 操作最適化

```typescript
// バッチ処理で DOM 操作を最適化
const tweets = Array.from(document.querySelectorAll('[data-testid="tweet"]'))
const processedTweets = tweets
  .filter(tweet => /* フィルター条件 */)
  .map(tweet => /* データ抽出 */)
```

## 避けるべきパターン

### 重複エラーハンドリング

```typescript
// ❌ 避ける: 各ページでの重複コード
try {
  await DomUtils.waitElement('.timeline')
} catch {
  if (DomUtils.isFailedPage()) {
    console.error('runHome: failed page.')
  }
  // 重複するエラー処理...
}

// ✅ 推奨: PageErrorHandler 使用
try {
  await DomUtils.waitElement('.timeline')
} catch (error) {
  await PageErrorHandler.handlePageError('Home', 'runHome', error)
  return
}
```

### 不適切な依存関係

```typescript
// ❌ 避ける: 循環依存
import { ServiceA } from './service-a'
// ServiceA が現在のファイルを import している

// ✅ 推奨: 単方向依存
import { Utils } from '@/utils/dom'
```

### タイマーリーク

```typescript
// ❌ 避ける: タイムアウトなしの無限ループ
setInterval(() => {
  // 終了条件なし
}, 1000)

// ✅ 推奨: ErrorHandler でタイムアウト管理
await ErrorHandler.waitForElementWithTimeout('.selector', 30000)
```

## 開発環境とビルドシステム

### 開発環境要件

- **Node.js**: `24.1.0` (engines フィールドで指定)
- **パッケージマネージャ**: `pnpm@9.15.4+` (必須)

### 開発コマンド

- `pnpm install` - 依存関係をインストール
- `pnpm run build` - 本番用ユーザースクリプトをビルド
- `pnpm run build:dev` - ソースマップ付き開発用ユーザースクリプトをビルド
- `pnpm run watch` - 開発用のウォッチモードでビルド
- `pnpm test` - カバレッジ付きで全テストを実行（120 秒タイムアウト）
- `pnpm test -- <ファイル>` - 特定のテストファイルを実行
- `pnpm run lint` - 全てのリンティング（prettier、eslint、typescript）を実行
- `pnpm run fix` - リンティングエラーを自動修正
- `pnpm run clean` - dist ディレクトリをクリーンアップ

### ビルドシステム（Webpack）

- **エントリーポイント**: `src/main.ts`
- **出力**: `dist/twitter-auto-spam-crawler.user.js`
- **TypeScript**: ES2020 ターゲット、ES2015 モジュール、strict モード
- **パスエイリアス**: `@/` → `src/` マッピング
- **最小化なし**: ユーザースクリプトの可読性とセキュリティ検証のため
- **ソースマップ**: 開発モードでのみ有効

package.json の `userscript` フィールドから以下を自動生成：

- `@name`, `@namespace`, `@version`, `@description`
- `@match`: x.com/*, example.com/*
- `@grant`: GM_getValue, GM_setValue, GM_registerMenuCommand, GM_unregisterMenuCommand
- `@require`: Tampermonkey Config 外部スクリプト

## コード生成時の優先事項

1. **最小限の変更**: 既存動作を壊さない
2. **日本語コメント**: コード内説明は日本語
3. **型安全性**: TypeScript strict mode 準拠
4. **テスト追加**: 新機能には適切なテストを追加
5. **PageErrorHandler 使用**: エラーハンドリングは統一パターン
6. **ユーザースクリプト API**: GM_* 関数の適切な使用
7. **パフォーマンス**: DOM 操作とタイマー管理の最適化

これらのガイドラインに従って、効率的で保守可能なコードを生成してください。