# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Twitter/X のツイートを自動でクロールし、潜在的なスパムコンテンツを特定するTypeScriptベースのユーザースクリプトです。Blue Blocker拡張機能と組み合わせて使用することを想定しており、Tampermonkey/Greasemonkey経由でブラウザで動作するユーザースクリプト（.user.js）にコンパイルされます。

## 基本的なコマンド

### 開発

このプロジェクトはパッケージマネージャとして **pnpm** を使用します。

- `pnpm install` - 依存関係をインストール
- `pnpm run build` - 本番用ユーザースクリプトをビルド
- `pnpm run build:dev` - ソースマップ付き開発用ユーザースクリプトをビルド
- `pnpm run watch` - 開発用のウォッチモードでビルド
- `pnpm test` - カバレッジ付きで全テストを実行
- `pnpm test -- <ファイル>` - 特定のテストファイルを実行（例：`pnpm test -- src/services/tweet-service.test.ts`）
- `pnpm run lint` - 全てのリンティング（prettier、eslint、typescript）を実行
- `pnpm run fix` - リンティングエラーを自動修正
- `pnpm run clean` - distディレクトリをクリーンアップ

### 品質チェック

変更後は必ず以下のコマンドを実行してください：
1. `pnpm run lint` - 静的解析とコード品質チェック
2. `pnpm test` - 全テストの実行と検証

### テスト

- テストはjsdom環境とグローバルに有効化されたフェイクタイマーを使用したJestを使用
- 全てのテストファイルは `*.test.ts` という命名規則（`src/__tests__/` 配下）
- タイマーに依存するテストでは `jest.useFakeTimers()` を使用
- ユーザースクリプト環境のため、DOMテストでは慎重なモック設定が必要
- カバレッジレポートは自動生成され、`src/main.ts`、`src/types/`、`src/pages/` は除外

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

- **Webpack**: TypeScriptを単一のユーザースクリプトファイルにコンパイル
- **ユーザースクリプトヘッダー**: package.jsonメタデータから自動生成
- **パスエイリアス**: `@/` は `src/` にマッピング
- **最小化なし**: ブラウザセキュリティのためユーザースクリプトを読み取り可能に保持

## テストに関する考慮事項

- **タイマーテスト**: フェイクタイマーと `jest.advanceTimersByTime()` を使用
- **DOMテスト**: `src/__mocks__/userscript.ts` でユーザースクリプトグローバルをモック
- **非同期テスト**: 適切なawaitパターンでPromiseチェーンを慎重に処理
- **サービステスト**: 依存関係とストレージ呼び出しをモック
