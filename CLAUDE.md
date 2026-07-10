# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Twitter/X のツイートを自動でクロールし、潜在的なスパムコンテンツを特定する TypeScript ベースのユーザースクリプトです。Blue Blocker 拡張機能と組み合わせて使うことを想定しており、Webpack で Tampermonkey/Greasemonkey 用のユーザースクリプト（`dist/twitter-auto-spam-crawler.user.js`）にコンパイルされます。

## 開発環境要件

- **Node.js**: `24.18.0`（`.node-version` / `engines` フィールドで指定）
- **パッケージマネージャ**: `pnpm@11.10.0`（`packageManager` フィールドで固定。npm/yarn は不可）

## 開発コマンド

- `pnpm install` - 依存関係をインストール
- `pnpm run build` - 本番用ユーザースクリプトをビルド
- `pnpm run build:dev` - ソースマップ付き開発用ビルド
- `pnpm run watch` - ウォッチモードでビルド
- `pnpm test` - 全テストをカバレッジ付きで実行（Jest、`testTimeout` 120 秒）
- `pnpm test -- <ファイル>` - 特定テストのみ実行（例: `pnpm test -- src/__tests__/services/tweet-service.test.ts`）
- `pnpm run lint` - prettier / eslint / tsc を一括実行
- `pnpm run fix` - prettier / eslint の自動修正
- `pnpm run clean` - `dist` をクリーンアップ

**変更後は必ず `pnpm run lint` と `pnpm test` の両方を通すこと。**

## 言語・コミュニケーション規約

- **会話**: 日本語
- **コード内コメント・JSDoc**: 日本語
- **エラーメッセージ（ユーザー/ログ向け文字列）**: 英語
- **日本語と英数字の間**: 半角スペースを挿入
- **絵文字**: 既存のエラーメッセージに絵文字がある場合は、周辺と統一する

## コミット・ブランチ規約

- **Conventional Commits**: `<type>(<scope>): <description>`。`<description>` は日本語。例: `feat: Discord Webhook 連携機能を追加`
- 許可 type: `feat` / `fix` / `docs` / `perf` / `refactor` / `style` / `test` / `chore`
- **ブランチ**: [Conventional Branch](https://conventional-branch.github.io) 短縮形。例: `feat/add-discord-webhook`
- ブランチ作成時は `--no-track` を付けリモート追跡を無効化する（例: `git checkout -b feat/xxx origin/master --no-track`）
- **Renovate が作成した PR には追加コミットや更新を行わない**

## コーディング規約

- **TypeScript**: strict モード必須、ES2020 ターゲット。`skipLibCheck` での型エラー回避は禁止
- **パスエイリアス**: `@/` → `src/`
- **命名**: 変数・関数は camelCase、クラス・インターフェースは PascalCase、定数は UPPER_SNAKE_CASE、ファイルは kebab-case
- **エラーハンドリング**: ページ処理では共通ユーティリティ `PageErrorHandler`（`src/utils/page-error-handler.ts`）を使い、各ページでの重複した try/catch を避ける
- 既存のアーキテクチャ・サービス層・コードパターンを尊重し、最小限の変更にとどめる
- 詳細な実装パターンは `.claude/development-patterns.md` を参照

## アーキテクチャ概要

- **ページベースルーティング**: `src/main.ts` が URL に応じて適切なページハンドラーを実行
- **サービス層**: CrawlerService / TweetService / QueueService / NotificationService
- **ストレージ**: `GM_getValue` / `GM_setValue` でデータを永続化
- **DOM 操作**: X.com 固有のセレクター（`[data-testid="tweet"]` など）を使用

### ディレクトリ構成

```
src/
├── __mocks__/   # ユーザースクリプト API モック
├── __tests__/   # テスト（元のソース構造を反映）
├── core/        # コア機能（設定、ストレージ）
├── pages/       # ページハンドラー
├── services/    # サービス層
├── types/       # TypeScript 型定義
├── utils/       # ユーティリティ
└── main.ts      # エントリーポイント
```

### 詳細ガイド（`.claude/`）

必要な領域の作業時に該当ファイルを参照する:

| ファイル | 内容 |
|---|---|
| `.claude/architecture.md` | コアアーキテクチャ、データフロー、ストレージ、DOM 操作 |
| `.claude/build-system.md` | Webpack 構成、ユーザースクリプトメタデータ生成、TS/ESLint 設定 |
| `.claude/development-patterns.md` | 実装パターン、GM_* API、エラーハンドリング、型定義 |
| `.claude/testing-guide.md` | Jest 設定（jsdom、フェイクタイマー、120 秒）、モック手法 |
| `.claude/github-pr-workflow.md` | PR 作成・Copilot レビュー対応・CI トラブルシューティング |
| `.claude/issue-workflow.md` | GitHub Issue 対応の標準フロー |

## テスト

- Jest（`ts-jest` / jsdom）。`testTimeout` は 120 秒、フェイクタイマーがグローバルに有効
- ユーザースクリプトの GM_* API は `src/__mocks__/userscript.ts` でモック
- テストは `src/__tests__/**/*.test.ts` に配置し、元のソース構造を反映する
- 新機能・バグ修正には対応するテストを追加する

## Pull Request

- 元 Issue を自動クローズする場合、本文に `closes #<番号>`（`fixes` / `resolves` も可）を含める
- PR タイトルもコミット同様 Conventional Commits に従う
- 作成・レビュー対応の詳細フローは `.claude/github-pr-workflow.md` を参照

## セキュリティ / 機密情報

- API キー・認証情報はコミットしない（`.env` で管理）
- ログに個人情報・認証情報を出力しない
- コミット前に機密情報が含まれていないか確認する

## ドキュメント更新ルール

実装を変更したら、対応する `.claude/*.md` を同じ作業内で更新する:

- アーキテクチャ変更（新サービス、データフロー、ストレージ構造）→ `.claude/architecture.md`
- ビルド設定・依存関係の大幅変更 → `.claude/build-system.md`
- 新しい実装パターン・API 使用方法 → `.claude/development-patterns.md`
- テスト手法・設定変更 → `.claude/testing-guide.md`
- コマンド・開発環境要件の変更 → この `CLAUDE.md`

ドキュメントを実態から乖離させないこと。更新は実装確定後に行い、同一コミットまたは追加コミットに含める。

## 作業判断の記録

重要な判断は後からレビュー可能な形で残す: 決定内容の要約、検討した代替案、採用しなかった理由、前提・仮定・不確実性。仮定を事実のように扱わない。
