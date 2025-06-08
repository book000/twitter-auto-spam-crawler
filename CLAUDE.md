# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Twitter/X のツイートを自動でクロールし、潜在的なスパムコンテンツを特定するTypeScriptベースのユーザースクリプトです。Blue Blocker拡張機能と組み合わせて使用することを想定しており、Tampermonkey/Greasemonkey経由でブラウザで動作するユーザースクリプト（.user.js）にコンパイルされます。

## 基本的なコマンド

### 開発環境要件

- **Node.js**: `24.1.0` (engines フィールドで指定)
- **パッケージマネージャ**: `pnpm@9.15.4+` (必須)

### 開発コマンド

- `pnpm install` - 依存関係をインストール
- `pnpm run build` - 本番用ユーザースクリプトをビルド
- `pnpm run build:dev` - ソースマップ付き開発用ユーザースクリプトをビルド
- `pnpm run watch` - 開発用のウォッチモードでビルド
- `pnpm test` - カバレッジ付きで全テストを実行（120秒タイムアウト※）
- `pnpm test -- <ファイル>` - 特定のテストファイルを実行（例：`pnpm test -- src/services/tweet-service.test.ts`）
- `pnpm run lint` - 全てのリンティング（prettier、eslint、typescript）を実行
- `pnpm run fix` - リンティングエラーを自動修正
- `pnpm run clean` - distディレクトリをクリーンアップ

※ タイムアウト設定の詳細は `.claude/testing-guide.md` を参照

### 品質チェック

変更後は必ず以下のコマンドを実行してください：

1. `pnpm run lint` - 静的解析とコード品質チェック
2. `pnpm test` - 全テストの実行と検証

## 詳細ガイド

プロジェクトの詳細情報については、以下の専門ガイドを参照してください：

### アーキテクチャ

**`.claude/architecture.md`** - コアアーキテクチャの詳細

- ページベースルーティングシステム
- サービス層アーキテクチャ（CrawlerService, TweetService, QueueService, NotificationService）
- データフロー、ストレージシステム、DOM操作パターン

### ビルドシステム

**`.claude/build-system.md`** - ビルド・設定の詳細  

- Webpack構成とユーザースクリプトメタデータ自動生成
- TypeScript設定（ES2020, strict モード）
- ESLint構成（テスト・モック特有ルール）

### 開発パターン

**`.claude/development-patterns.md`** - 実装パターンの詳細

- ユーザースクリプトAPI使用例（GM_getValue/GM_setValue）
- DOM操作パターン（X.com固有セレクター）
- エラーハンドリング、非同期処理、TypeScript型定義

### テスト

**`.claude/testing-guide.md`** - テスト環境と手法の詳細

- Jest設定（jsdom、フェイクタイマー、120秒タイムアウト）
- ユーザースクリプトモック（GM_* API）
- DOM・タイマー・サービステストの実装方法

### GitHub PRワークフロー  

**`.claude/github-pr-workflow.md`** - PR作成・レビュー・CI対応の詳細

- Pull Request作成フロー
- Copilot Review対応手順
- CI/CD修正とトラブルシューティング

### Issue対応ワークフロー

**`.claude/issue-workflow.md`** - GitHub Issue対応の完全自動フロー

- 「issue #nnを対応してください」だけで完全対応
- Issue取得から実装、テスト、PR作成まで
- Copilotレビュー対応を含む標準フロー

## このプロジェクト固有の設定

GitHub PRワークフロー使用時の環境変数：

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

## 重要：ドキュメントの継続的更新

### ドキュメント更新の責任

Claude Codeとして作業する際は、以下の場合に**必ず**該当するドキュメントを更新または新規作成してください：

#### 必須更新・新規作成ケース

1. **新しいアーキテクチャパターンを導入・変更した場合**
   - `.claude/architecture.md` を更新または新規ガイド作成
   - 新しいサービス追加、データフロー変更、ストレージ構造変更など

2. **ビルド設定・開発環境を変更した場合**
   - `.claude/build-system.md` を更新または新規ガイド作成
   - Webpack設定変更、新しいツール導入、依存関係の大幅変更など

3. **新しい開発パターン・API使用方法を実装した場合**
   - `.claude/development-patterns.md` を更新または新規ガイド作成
   - 新しいユーザースクリプトAPI使用、DOM操作パターン、エラーハンドリング手法など

4. **テスト手法・設定を変更した場合**
   - `.claude/testing-guide.md` を更新または新規ガイド作成
   - Jest設定変更、新しいモック手法、テストパターンの追加など

5. **基本コマンド・開発フローを変更した場合**
   - `CLAUDE.md` を更新
   - 新しいnpmスクリプト追加、開発環境要件変更など

6. **プロジェクト固有の新しい領域が必要な場合**
   - `.claude/` フォルダに新しい専門ガイドを作成
   - デプロイメント、セキュリティ、パフォーマンス最適化など

#### 更新手順

```bash
# 1. 作業完了後、関連ドキュメントを確認
# 2. 必要に応じてドキュメントを更新
# 3. ドキュメント更新を同じコミットまたは追加コミットに含める

git add CLAUDE.md .claude/
git commit -m "feat: 新機能実装とドキュメント更新

- [実装内容の説明]
- [ドキュメント名]: [更新内容の概要]

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

#### 更新の目的

- **一貫性維持**: 実装とドキュメントの整合性を保つ
- **知識継承**: 将来のClaude Codeセッションでの正確な理解
- **開発効率**: 最新の情報に基づく適切な開発支援

**注意**: ドキュメント更新を怠ると、将来のセッションで古い情報に基づく不適切な提案をする可能性があります。必ず実装と同時にドキュメントも更新してください。

## Git ブランチ作成ガイドライン

### ブランチ作成時の設定

- **デフォルト**: 必ず `--no-track` オプションを使用してリモートブランチの追跡を無効化

```bash
# 正しい例
git checkout -b feature/new-feature origin/master --no-track

# 避けるべき例
git checkout -b feature/new-feature origin/master
```

### コンフリクト対応

コンフリクトが発生した場合の必須対応手順：

1. **fetch & rebase**: `git fetch origin && git rebase origin/master`
2. **コンフリクト解決**: マージコンフリクトマーカーを手動で解決
3. **staged add**: `git add <解決済みファイル>`
4. **rebase continue**: `git rebase --continue`
5. **force push**: `git push --force-with-lease origin HEAD`

## 重要：ファイル変更時の必須事項

**ファイルを変更した場合は必ずコミットすること！**

- ファイル編集後は即座に `git add` → `git commit` → `git push`
- コミットを忘れると変更が失われる可能性がある
- 必ず変更内容を適切なコミットメッセージで記録する
