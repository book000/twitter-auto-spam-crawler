# AGENTS.md

このファイルは、一般的な AI エージェントが twitter-auto-spam-crawler プロジェクトで作業する際の基本方針とガイドラインを提供します。

## 目的

このドキュメントは、AI エージェント共通の作業方針を定義し、プロジェクト固有のルールと制約を明確にします。

## 基本方針

### 言語とコミュニケーション

- **会話言語**: 日本語
- **コード内コメント**: 日本語
- **エラーメッセージ**: 英語
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

## 判断記録のルール

作業中の判断は、必ずレビュー可能な形で記録すること：

1. **判断内容の要約**: 何を決定したかを明確に記載
2. **検討した代替案**: 他にどのような選択肢があったかをリスト化
3. **採用しなかった案とその理由**: なぜその代替案を採用しなかったかを説明
4. **前提条件・仮定・不確実性**: 判断の前提となる条件や仮定を明示
5. **不確実性の明示**: 仮定を事実のように扱わない

## プロジェクト概要

### 目的

Twitter/X のツイートを自動でクロールし、潜在的なスパムコンテンツを特定する TypeScript ベースのユーザースクリプトです。

### 主な機能

- ツイートの自動クロール
- スパム検出
- Blue Blocker 拡張機能との連携
- Discord Webhook 通知

### 技術スタック

- **言語**: TypeScript (strict モード、ES2020)
- **パッケージマネージャー**: pnpm@10.28.1+
- **Node.js**: 24.13.0
- **ビルドシステム**: Webpack
- **テストフレームワーク**: Jest (jsdom、120秒タイムアウト)
- **ユーザースクリプト API**: GM_getValue、GM_setValue、GM_registerMenuCommand、GM_unregisterMenuCommand

## 開発手順（概要）

### 1. プロジェクト理解

プロジェクトの構造、アーキテクチャ、既存のコードパターンを理解する。

### 2. 依存関係インストール

```bash
pnpm install
```

### 3. 変更実装

- **既存パターンに従う**: プロジェクトの既存のコーディングスタイルとパターンを尊重
- **TypeScript strict モード**: 型安全性を確保
- **JSDoc 記載**: 関数・インターフェースに日本語で JSDoc を記載

### 4. テストと Lint/Format 実行

```bash
# テスト実行
pnpm test

# Lint チェック
pnpm run lint

# Lint 自動修正
pnpm run fix
```

### 5. コミットとプッシュ

```bash
# ステージング
git add <変更ファイル>

# コミット（Conventional Commits に従う）
git commit -m "feat: 新機能の説明"

# プッシュ
git push origin <ブランチ名>
```

## セキュリティ / 機密情報

### 必須ルール

1. **認証情報のコミット禁止**: API キーや認証情報は `.env` ファイルで管理し、Git にコミットしない
2. **ログへの機密情報出力禁止**: ログに個人情報や認証情報を出力しない
3. **センシティブな情報の確認**: コミット前に必ず確認する

## リポジトリ固有

### ユーザースクリプト環境

- **動作環境**: Tampermonkey/Greasemonkey 経由でブラウザで動作
- **対象サイト**: https://x.com/*
- **ビルド成果物**: dist/twitter-auto-spam-crawler.user.js

### アーキテクチャ

- **ページベースルーティング**: URL に基づいて適切なページハンドラーを実行
- **サービス層**: CrawlerService、TweetService、QueueService、NotificationService
- **DOM 操作**: X.com 固有のセレクターを使用（`[data-testid="tweet"]` など）
- **ストレージ**: GM_getValue/GM_setValue でデータを永続化

### 開発時の注意点

- **Renovate PR**: 既存の Renovate プルリクエストに対して、追加コミットや更新を行わない
- **TypeScript**: `skipLibCheck` での回避は禁止
- **エラーメッセージ**: 既存のエラーメッセージに絵文字がある場合は、全体で統一すること
- **テストタイムアウト**: Jest のテストタイムアウトは 120 秒
- **フェイクタイマー**: Jest でグローバルに有効化されている

### 主要ディレクトリ

```
src/
├── __mocks__/          # モックファイル
├── __tests__/          # テストファイル
├── core/               # コア機能（設定、ストレージ）
├── pages/              # ページハンドラー
├── services/           # サービス層
├── types/              # TypeScript 型定義
├── utils/              # ユーティリティ
└── main.ts             # エントリーポイント
```

### 詳細ドキュメント

プロジェクトの詳細情報については、以下のドキュメントを参照：

- **CLAUDE.md**: Claude Code 向けの詳細な作業方針
- **.claude/architecture.md**: アーキテクチャの詳細
- **.claude/build-system.md**: ビルドシステムの詳細
- **.claude/development-patterns.md**: 開発パターンの詳細
- **.claude/testing-guide.md**: テスト環境と手法の詳細
- **.claude/github-pr-workflow.md**: PR 作成・レビュー・CI 対応の詳細
- **.claude/issue-workflow.md**: GitHub Issue 対応の完全自動フロー
