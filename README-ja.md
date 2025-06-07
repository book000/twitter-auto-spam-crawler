# 🕷️ twitter-auto-spam-crawler

Twitter/X のツイートを自動でクロールし、潜在的なスパムコンテンツを特定するユーザースクリプト

日本語 | [English](README.md)

## ✨ 機能

- 🔄 **自動クロール** - X.com のページでツイートを継続的に監視
- 🎯 **スマートフィルタリング** - エンゲージメント閾値（RT 100以上、リプライ 10以上）でスパムを検出
- 📊 **キュー管理** - 永続ストレージで待機中・確認済みツイートキューを管理
- 💾 **自動保存** - 500件に達するとツイートを自動ダウンロード
- 🔔 **Discord連携** - アラート用のWebhook通知（オプション）
- 🧩 **Blue Blocker対応** - Blue Blocker拡張機能との連携を想定

## 📦 インストール

### ユーザー向け

1. [Tampermonkey](https://www.tampermonkey.net/) ブラウザ拡張機能をインストール
2. ユーザースクリプトをダウンロード: [twitter-auto-spam-crawler.user.js](https://github.com/book000/twitter-auto-spam-crawler/releases/latest/download/twitter-auto-spam-crawler.user.js)
3. Tampermonkey のプロンプトが表示されたらクリックしてインストール

### 開発者向け

**必要環境:**
- Node.js 24.1.0
- pnpm 9.15.4+

```bash
git clone https://github.com/book000/twitter-auto-spam-crawler.git
cd twitter-auto-spam-crawler
pnpm install
```

## 🚀 使い方

1. [x.com](https://x.com) にアクセス
2. スクリプトが自動的にツイートの監視を開始
3. Tampermonkey メニューから設定を調整
4. 収集されたデータは自動保存され、エクスポート可能

## 🛠️ 開発

### コマンド

| コマンド | 説明 |
|---------|------|
| `pnpm run build` | 本番用ユーザースクリプトをビルド |
| `pnpm run build:dev` | ソースマップ付きでビルド |
| `pnpm run watch` | 開発用ウォッチモード |
| `pnpm test` | カバレッジ付きでテスト実行 |
| `pnpm run lint` | コードリント（ESLint + Prettier + TypeScript） |
| `pnpm run fix` | リンティング問題を自動修正 |

### アーキテクチャ

```
src/
├── core/           # 設定、定数、ストレージ
├── pages/          # ページ固有のハンドラー
├── services/       # ビジネスロジックサービス
├── types/          # TypeScript型定義
└── utils/          # ユーティリティ関数
```

**サービス:**
- `CrawlerService` - メインクロール処理の統制
- `TweetService` - ツイート抽出・保存
- `QueueService` - ツイートキュー管理
- `NotificationService` - Discord Webhook連携

### テスト

```bash
pnpm test                                    # 全テスト実行
pnpm test -- src/services/tweet-service.test.ts  # 特定テスト実行
```

## 🏗️ 技術詳細

- **ビルドシステム**: Webpack + TypeScript
- **実行環境**: ユーザースクリプト（GM_getValue/GM_setValue API）
- **対象ページ**: x.com のホーム、探索、検索、個別ツイートページ
- **ストレージ**: 永続キュー管理でLocalStorage使用
- **テスト**: jsdom環境のJest

## ⚠️ 免責事項

これは Twitter/X の**非公式ツール**です。利用は自己責任でお願いします。

- Twitter/X や Blue Blocker との公式な関係はありません
- サイト変更により動作しなくなる可能性があります
- 研究・教育目的での利用を想定しています

## 📄 ライセンス

MIT License - [LICENSE](LICENSE) を参照

## 👤 作者

**Tomachi** ([@book000](https://github.com/book000))