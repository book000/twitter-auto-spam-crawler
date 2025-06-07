# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Twitter/X のツイートを自動でクロールし、潜在的なスパムコンテンツを特定するTypeScriptベースのユーザースクリプトです。Blue Blocker拡張機能と組み合わせて使用することを想定しており、Tampermonkey/Greasemonkey経由でブラウザで動作するユーザースクリプト（.user.js）にコンパイルされます。

## 基本的なコマンド

### 開発環境要件

- **Node.js**: 24.1.0 (engines フィールドで指定)
- **パッケージマネージャ**: pnpm@9.15.4+ (必須)

### 開発

- `pnpm install` - 依存関係をインストール
- `pnpm run build` - 本番用ユーザースクリプトをビルド
- `pnpm run build:dev` - ソースマップ付き開発用ユーザースクリプトをビルド
- `pnpm run watch` - 開発用のウォッチモードでビルド
- `pnpm test` - カバレッジ付きで全テストを実行（120秒タイムアウト）
- `pnpm test -- <ファイル>` - 特定のテストファイルを実行（例：`pnpm test -- src/services/tweet-service.test.ts`）
- `pnpm run lint` - 全てのリンティング（prettier、eslint、typescript）を実行
- `pnpm run fix` - リンティングエラーを自動修正
- `pnpm run clean` - distディレクトリをクリーンアップ

### 品質チェック

変更後は必ず以下のコマンドを実行してください：
1. `pnpm run lint` - 静的解析とコード品質チェック
2. `pnpm test` - 全テストの実行と検証

### テスト環境

- **Jest** with jsdom環境とグローバルに有効化されたフェイクタイマー
- **テストファイル命名**: `*.test.ts` （`src/__tests__/` 配下）
- **タイマーテスト**: `jest.useFakeTimers()` がグローバル有効、`jest.advanceTimersByTime()` を使用
- **ユーザースクリプトモック**: `src/__mocks__/userscript.ts` でGM_* APIをモック
- **カバレッジ除外**: `src/main.ts`, `src/types/`, `src/pages/`, テストファイル、モック

## コアアーキテクチャ

### ページベースルーティングシステム

`src/main.ts`でURL基盤のルーティングシステムを使用し、異なるTwitter/Xページを特定の機能にマッピング：

- **ホーム/探索/検索ページ**: ツイートの自動クロールとスクロール
- **ツイートページ**: 個別ツイートのインタラクション処理
- **特別ページ**: ログイン、アカウントロック、サンプルエンドポイントの処理
- **URLマッチング**: 文字列マッチング（`startsWith`）と正規表現パターンの両方を使用

### サービス層アーキテクチャ

**CrawlerService**: メインのツイートクロールワークフローを統制

- 定期的にツイートを自動クロール
- エンゲージメント閾値でツイートをフィルタリング（リツイート100+、リプライ10+）
- クロール状態とカウントを管理

**TweetService**: ツイートの抽出と保存を処理

- 特定のセレクターを使用してDOMからツイートを抽出
- エンゲージメント指標（リツイート、リプライ、いいね）を解析
- ツイートの保存と自動ダウンロードを管理

**QueueService**: ツイート処理キューを管理

- localStorageを使用して「待機中」と「確認済み」のツイートリストを維持
- 処理に応じてツイートを状態間で移動
- 重複処理を防止

**NotificationService**: アラート用のDiscord webhook統合

### データフロー

1. **クロール**: CrawlerServiceがツイートを抽出 → TweetServiceがエンゲージメントでフィルタリング → QueueServiceが待機キューに追加
2. **処理**: ページが待機中のツイートを処理 → QueueServiceが確認済み状態に移動
3. **保存**: TweetServiceが500ツイート制限に達すると自動ダウンロード

### ストレージシステム

永続化にGM_getValue/GM_setValue（ユーザースクリプトAPI）を使用：

- `waitingTweets`: 処理待ちのツイートIDの配列
- `checkedTweets`: 処理済みツイートIDの配列
- `savedTweets`: エクスポート用の完全なツイートオブジェクト
- `config`: ユーザー設定

### DOM操作パターン

- サイトの変更に応じて更新が必要な可能性があるX.com固有のDOMセレクターを使用
- スクロール自動化と「さらに読み込む」ボタンのクリックを実装
- タイムアウトベースの待機で動的コンテンツの読み込みを処理

## ビルドシステム

### Webpack構成

- **エントリーポイント**: `src/main.ts`
- **出力**: `dist/twitter-auto-spam-crawler.user.js`
- **TypeScript**: ES2020ターゲット、ES2015モジュール、strictモード
- **パスエイリアス**: `@/` → `src/` マッピング
- **最小化なし**: ユーザースクリプトの可読性とセキュリティ検証のため
- **ソースマップ**: 開発モードでのみ有効

### ユーザースクリプトメタデータ自動生成

package.jsonの`userscript`フィールドから以下を自動生成：
- `@name`, `@namespace`, `@version`, `@description`
- `@match`: x.com/*, example.com/*
- `@grant`: GM_getValue, GM_setValue, GM_registerMenuCommand, GM_unregisterMenuCommand
- `@require`: Tampermonkey Config外部スクリプト

### TypeScript設定

- **ES2020**: モダンJS機能使用
- **strict**: 全ての厳密チェック有効
- **モジュール解決**: bundler（Webpack用）
- **DOM型**: ブラウザ環境対応

## ESLint構成

- **ベース**: @book000/eslint-config
- **テスト特有**: GM_プレフィックス許可、floating promises無効
- **モック特有**: unsafe member access許可

## 重要な開発パターン

### ユーザースクリプト API使用

```typescript
// Storage操作
const value = GM_getValue('key', defaultValue)
GM_setValue('key', value)

// メニューコマンド登録
GM_registerMenuCommand('Label', () => {})
```

### サービス層の依存関係

- **CrawlerService** → TweetService, QueueService, NotificationService
- **TweetService** → DOM操作, StorageAPI
- **QueueService** → StorageAPI 
- **StateService** → 状態管理ユーティリティ

### DOM操作パターン

X.com固有のセレクターを使用。サイト変更に応じて更新が必要：
- ツイート要素の特定
- エンゲージメント数の抽出
- 動的コンテンツの待機とスクロール処理

### 定数とグローバル値

`src/core/constants.ts`で管理：
- エンゲージメント閾値（リツイート100+、リプライ10+）
- タイムアウト値（クロール、スクロール、要素待機）
- 自動ダウンロード閾値（500ツイート）

## 重要な参考文書

### GitHub PRワークフローガイド
詳細なPR作成・レビュー・CI対応手順については `.claude/github-pr-workflow.md` を参照してください。
このファイルには以下が含まれています：
- Pull Request作成フロー  
- Copilot Review対応手順
- CI/CD修正とトラブルシューティング
- コミット・プッシュ・マージの完全ワークフロー
- 多言語プロジェクト対応

### このプロジェクト固有の設定

このプロジェクトでのワークフロー使用時の設定値：

```bash
export REPO_OWNER="book000"
export REPO_NAME="twitter-auto-spam-crawler" 
export MAIN_BRANCH="master"
export PACKAGE_MANAGER="pnpm"
export TEST_CMD="pnpm test"
export LINT_CMD="pnpm run lint" 
export BUILD_CMD="pnpm run build"
export FIX_CMD="pnpm run fix"
```
