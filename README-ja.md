# Twitter Auto Spam Crawler

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-24.1.0-green.svg)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-9.15.4%2B-yellow.svg)](https://pnpm.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)

Twitter/X のツイートを自動でクロールし、潜在的なスパムコンテンツを特定するTypeScriptベースのユーザースクリプトです。Blue Blocker拡張機能と組み合わせて使用することを想定しています。

[English](README.md)

## 機能

- **自動ツイートクロール**: エンゲージメント閾値に基づいてツイートを継続的に監視・クロール
- **スパム検出**: 高リツイート数（100以上）と高リプライ数（10以上）のツイートをフィルタリング
- **キュー管理**: 永続ストレージで待機中と確認済みツイートキューを管理
- **自動保存**: 500件に達すると収集したツイートを自動ダウンロード
- **マルチページ対応**: ホーム、探索、検索、個別ツイートページで動作
- **Discord通知**: アラート用のWebhook統合（オプション）

## インストール

### 前提条件

- [Tampermonkey](https://www.tampermonkey.net/) または [Greasemonkey](https://www.greasespot.net/) ブラウザ拡張機能
- [Blue Blocker](https://github.com/kheina-com/Blue-Blocker) 拡張機能（推奨）

### ユーザースクリプトのインストール

1. 最新リリースからユーザースクリプトをインストール:
   - [twitter-auto-spam-crawler.user.js をダウンロード](https://github.com/book000/twitter-auto-spam-crawler/releases/latest/download/twitter-auto-spam-crawler.user.js)

2. 新しいバージョンがリリースされると自動的に更新されます

## 使い方

1. Twitter/X (https://x.com) にアクセス
2. スクリプトが自動的にツイートのクロールを開始します
3. コンソールでクロール状況を監視
4. 収集したツイートは500件に達すると自動的に保存されます

### 設定

Tampermonkeyメニューから設定にアクセス:
- 自動クロールの有効/無効
- クロール間隔の調整
- Discord Webhook URLの設定
- 保存されたツイートの管理

## 開発

### 必要環境

- Node.js 24.1.0
- pnpm 9.15.4+

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/book000/twitter-auto-spam-crawler.git
cd twitter-auto-spam-crawler

# 依存関係をインストール
pnpm install

# 開発用ビルド（ウォッチモード）
pnpm run watch
```

### スクリプト

| コマンド | 説明 |
|---------|------|
| `pnpm install` | 依存関係をインストール |
| `pnpm run build` | 本番用ユーザースクリプトをビルド |
| `pnpm run build:dev` | ソースマップ付き開発用ユーザースクリプトをビルド |
| `pnpm run watch` | 開発用のウォッチモード |
| `pnpm test` | カバレッジ付きで全テストを実行 |
| `pnpm run lint` | 全てのリンター（prettier、eslint、typescript）を実行 |
| `pnpm run fix` | リンティングエラーを自動修正 |
| `pnpm run clean` | distディレクトリをクリーンアップ |

### アーキテクチャ

プロジェクトはサービスベースのアーキテクチャに従っています:

- **CrawlerService**: メインのクロールワークフローを統制
- **TweetService**: ツイートの抽出と保存を処理
- **QueueService**: ツイート処理キューを管理
- **NotificationService**: Discord Webhook統合を処理
- **StateService**: アプリケーション状態を管理

詳細なアーキテクチャ情報については、[アーキテクチャドキュメント](.claude/architecture.md)を参照してください。

### テスト

テストはjsdom環境でJestを使用して記述されています:

```bash
# 全てのテストを実行
pnpm test

# 特定のテストファイルを実行
pnpm test -- src/services/tweet-service.test.ts

# ウォッチモードでテストを実行
pnpm test -- --watch
```

## コントリビューション

1. リポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: 素晴らしい機能を追加'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### コードスタイル

- TypeScript strictモードに従う
- ESLintとPrettierでコードフォーマット
- コミット前に `pnpm run lint` を実行
- 新機能にはテストを記述

## ライセンス

このプロジェクトはMITライセンスの下でライセンスされています - 詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 作者

**Tomachi** - [@book000](https://github.com/book000)

## 謝辞

- [Blue Blocker](https://github.com/kheina-com/Blue-Blocker)と連携するよう設計
- [Tampermonkey](https://www.tampermonkey.net/)ユーザースクリプトAPIで構築

## サポート

バグや機能リクエストについては、[issueを作成](https://github.com/book000/twitter-auto-spam-crawler/issues/new)してください。