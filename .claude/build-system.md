# ビルドシステムガイド

## Webpack構成

- **エントリーポイント**: `src/main.ts`
- **出力**: `dist/twitter-auto-spam-crawler.user.js`
- **TypeScript**: ES2020ターゲット、ES2015モジュール、strictモード
- **パスエイリアス**: `@/` → `src/` マッピング
- **最小化なし**: ユーザースクリプトの可読性とセキュリティ検証のため
- **ソースマップ**: 開発モードでのみ有効

## ユーザースクリプトメタデータ自動生成

package.jsonの`userscript`フィールドから以下を自動生成：
- `@name`, `@namespace`, `@version`, `@description`
- `@match`: x.com/*, example.com/*
- `@grant`: GM_getValue, GM_setValue, GM_registerMenuCommand, GM_unregisterMenuCommand
- `@require`: Tampermonkey Config外部スクリプト

### メタデータ生成ロジック

webpack.config.jsのカスタムプラグインで実装：

```javascript
// Convert package name to user-friendly script name
const scriptName = name
  .split('-')
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ')

// Generate header from metadata object
const banner =
  '// ==UserScript==\n' +
  Object.entries(metadata)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value
          .map((v) => `// @${key.padEnd(12)} ${v}`)
          .join('\n')
      }
      return `// @${key.padEnd(12)} ${value}`
    })
    .join('\n') +
  '\n// ==/UserScript==\n\n'
```

## TypeScript設定

### tsconfig.json設定

- **ターゲット**: ES2020（モダンJS機能使用）
- **モジュール**: ES2015（Webpack用）
- **モジュール解決**: bundler（Webpack専用）
- **ライブラリ**: ESNext, DOM, DOM.Iterable（ブラウザ環境対応）
- **strict**: 全ての厳密チェック有効
- **パスマッピング**: `@/*` → `src/*`

### 重要な設定項目

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "ES2015", 
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## ESLint構成

### 基本設定

- **ベース**: @book000/eslint-config
- **パーサー**: @typescript-eslint/parser

### テストファイル固有ルール

```javascript
{
  files: ['src/__tests__/**/*.ts'],
  rules: {
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/unbound-method': 'off', 
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'import/no-duplicates': 'off',
    camelcase: ['error', { allow: ['^GM_'] }], // ユーザースクリプトAPI許可
    'unicorn/no-useless-undefined': 'off',
  },
}
```

### モックファイル固有ルール

```javascript
{
  files: ['src/__mocks__/**/*.ts'],
  rules: {
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
}
```

## ビルドプロセス

### 本番ビルド

```bash
pnpm run build
# webpack --mode=production
```

- 最小化なし（可読性維持）
- ソースマップなし
- ユーザースクリプトヘッダー自動追加

### 開発ビルド

```bash
pnpm run build:dev
# webpack --mode=development
```

- ソースマップ付き（inline-source-map）
- 開発用の詳細エラー情報

### ウォッチモード

```bash
pnpm run watch
# webpack --mode=development --watch
```

- ファイル変更の自動検知とリビルド
- 開発効率向上

## 出力ファイル構造

```
dist/
└── twitter-auto-spam-crawler.user.js  # 単一の結合ファイル
```

### ユーザースクリプトヘッダー例

```javascript
// ==UserScript==
// @name         Twitter Auto Spam Crawler
// @namespace    https://tomacheese.com
// @version      1.25.1
// @description  Twitterのツイートを自動でクロールするスクリプト。Blue Blockerと組み合わせて使うことを想定。
// @author       Tomachi
// @homepage     https://github.com/book000/twitter-auto-spam-crawler
// @match        https://x.com/*
// @match        https://example.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=x.com
// @updateURL    https://github.com/book000/twitter-auto-spam-crawler/releases/latest/download/twitter-auto-spam-crawler.user.js
// @downloadURL  https://github.com/book000/twitter-auto-spam-crawler/releases/latest/download/twitter-auto-spam-crawler.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @require      https://update.greasyfork.org/scripts/470224/1303666/Tampermonkey%20Config.js
// ==/UserScript==
```

## パフォーマンス最適化

### バンドルサイズ最適化

- 不要なライブラリの除外
- Tree shakingによる未使用コードの削除
- TypeScriptの最適化設定

### ユーザースクリプト特有の考慮事項

- **最小化を無効**: セキュリティ検証とデバッグの容易さ
- **外部依存関係の最小化**: ユーザースクリプト環境での安定性
- **DOM準備完了の確実な待機**: ページ読み込みタイミング対応