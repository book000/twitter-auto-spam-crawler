# GEMINI.md

このファイルは、Gemini CLI が twitter-auto-spam-crawler プロジェクトで作業する際のコンテキストと作業方針を提供します。

## 目的

このドキュメントは、Gemini CLI 向けのコンテキストと作業方針を定義し、最新の外部情報が必要な判断をサポートします。

## 出力スタイル

### 言語

- **会話**: 日本語
- **コード内コメント**: 日本語
- **エラーメッセージ**: 英語

### トーン

- 明確で簡潔な説明
- 技術的に正確な情報
- 最新の仕様に基づく回答

### 形式

- Markdown フォーマット
- コードブロックでの例示
- 箇条書きでの明確な説明

## 共通ルール

### コミュニケーション

- **会話言語**: 日本語
- **日本語と英数字の間**: 半角スペースを挿入

### コミット規約

- **Conventional Commits**: [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) に従う
  - 形式: `<type>(<scope>): <description>`
  - `<description>` は日本語で記載
  - 例: `feat: Discord Webhook 連携機能を追加`

- **ブランチ命名**: [Conventional Branch](https://conventional-branch.github.io) に従う
  - 形式: `<type>/<description>`
  - `<type>` は短縮形（feat, fix）を使用
  - 例: `feat/add-discord-webhook`

## プロジェクト概要

### 目的

Twitter/X のツイートを自動でクロールし、潜在的なスパムコンテンツを特定する TypeScript ベースのユーザースクリプトです。

### 主な機能

- **ツイートクロール**: X.com のツイートを自動で収集
- **スパム検出**: 潜在的なスパムコンテンツを特定
- **Blue Blocker 連携**: Blue Blocker 拡張機能と組み合わせて使用
- **Discord 通知**: Discord Webhook でスパム検出を通知
- **バージョン管理**: バージョン更新の自動通知

### 技術スタック

- **言語**: TypeScript (strict モード、ES2020 ターゲット)
- **パッケージマネージャー**: pnpm@10.28.1+
- **Node.js**: 24.13.0
- **ビルドシステム**: Webpack（ユーザースクリプトメタデータ自動生成）
- **テストフレームワーク**: Jest（jsdom、フェイクタイマー、120 秒タイムアウト）
- **ユーザースクリプト API**: GM_getValue、GM_setValue、GM_registerMenuCommand、GM_unregisterMenuCommand
- **Lint/Format**: ESLint（@book000/eslint-config）、Prettier

## コーディング規約

### フォーマット

- **Prettier**: 自動フォーマット適用
- **ESLint**: @book000/eslint-config に準拠

### 命名規則

- **変数・関数**: camelCase
- **クラス・インターフェース**: PascalCase
- **定数**: UPPER_SNAKE_CASE
- **ファイル**: kebab-case

### コメント

- **コード内コメント**: 日本語で記載
- **JSDoc**: 関数・インターフェースに日本語で記載
- **エラーメッセージ**: 英語で記載
- **絵文字**: 既存のエラーメッセージに絵文字がある場合は統一

### TypeScript

- **strict モード**: 必須
- **skipLibCheck**: 使用禁止
- **型定義**: 明示的な型定義を推奨
- **パスエイリアス**: `@/` → `src/` マッピング

## 開発コマンド

```bash
# 依存関係のインストール
pnpm install

# 本番用ビルド
pnpm run build

# 開発用ビルド（ソースマップ付き）
pnpm run build:dev

# ウォッチモード
pnpm run watch

# テスト実行（カバレッジ付き、120 秒タイムアウト）
pnpm test

# 特定のテストファイルを実行
pnpm test -- <ファイル>

# Lint チェック（prettier、eslint、typescript）
pnpm run lint

# Lint 自動修正
pnpm run fix

# dist ディレクトリクリーンアップ
pnpm run clean
```

## 注意事項

### セキュリティ

1. **認証情報のコミット禁止**: API キーや認証情報は `.env` ファイルで管理し、Git にコミットしない
2. **ログへの機密情報出力禁止**: ログに個人情報や認証情報を出力しない
3. **センシティブな情報の確認**: コミット前に必ず確認する

### 既存ルールの優先

- プロジェクトの既存のコーディングスタイルとパターンを尊重
- 既存のアーキテクチャとサービス層を維持
- 既存のエラーハンドリングパターン（PageErrorHandler）を使用

### 既知の制約

- **Renovate PR**: 既存の Renovate プルリクエストに対して、追加コミットや更新を行わない
- **テストタイムアウト**: Jest のテストタイムアウトは 120 秒
- **フェイクタイマー**: Jest でグローバルに有効化されている
- **ユーザースクリプト環境**: Tampermonkey/Greasemonkey 経由でブラウザで動作

## リポジトリ固有

### ユーザースクリプト固有の考慮事項

- **GM_* API**: ユーザースクリプト API（GM_getValue、GM_setValue など）を使用
- **対象サイト**: https://x.com/*
- **DOM セレクター**: X.com 固有のセレクター（`[data-testid="tweet"]` など）を使用
- **ビルド成果物**: dist/twitter-auto-spam-crawler.user.js

### アーキテクチャ

- **ページベースルーティング**: URL に基づいて適切なページハンドラーを実行
- **サービス層**: CrawlerService、TweetService、QueueService、NotificationService
- **ストレージ**: GM_getValue/GM_setValue でデータを永続化
- **エラーハンドリング**: PageErrorHandler で統一的に処理

### Gemini CLI の役割

Gemini CLI は、以下の観点で GitHub Copilot、Claude Code、一般的な AI エージェントをサポートします：

1. **外部仕様の確認**: SaaS 仕様、API の最新仕様、料金・制限・クォータの確認
2. **言語・ランタイムのバージョン差**: TypeScript、Node.js のバージョン間の違いの確認
3. **最新情報の調査**: 外部依存関係の最新情報、ライブラリの更新情報の確認
4. **外部一次情報の検証**: 公式ドキュメント、リリースノート、変更履歴の確認

### 主要ディレクトリ構造

```
src/
├── __mocks__/          # モックファイル（ユーザースクリプト API）
├── __tests__/          # テストファイル
├── core/               # コア機能（設定、ストレージ）
├── pages/              # ページハンドラー
├── services/           # サービス層
├── types/              # TypeScript 型定義
├── utils/              # ユーティリティ
└── main.ts             # エントリーポイント

.claude/                # Claude Code 向けドキュメント
├── architecture.md
├── build-system.md
├── development-patterns.md
├── testing-guide.md
├── github-pr-workflow.md
└── issue-workflow.md
```

### 詳細ドキュメント

プロジェクトの詳細情報については、以下のドキュメントを参照：

- **CLAUDE.md**: Claude Code 向けの詳細な作業方針
- **AGENTS.md**: 一般的な AI エージェント向けの基本方針
- **.github/copilot-instructions.md**: GitHub Copilot 向けの指示
- **.claude/architecture.md**: アーキテクチャの詳細
- **.claude/build-system.md**: ビルドシステムの詳細
- **.claude/development-patterns.md**: 開発パターンの詳細
- **.claude/testing-guide.md**: テスト環境と手法の詳細
- **.claude/github-pr-workflow.md**: PR 作成・レビュー・CI 対応の詳細
- **.claude/issue-workflow.md**: GitHub Issue 対応の完全自動フロー
