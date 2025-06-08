# 🕷️ twitter-auto-spam-crawler

Twitter/X のツイートを自動でクロールし、潜在的なスパムコンテンツを特定するユーザースクリプト

[日本語](README-ja.md) | [English](README.md)

## ✨ 機能

- 🔄 **自動クロール** - X.com のページでツイートを継続的に監視
- 🎯 **スマートフィルタリング** - エンゲージメント閾値（RT 100以上、リプライ 10以上）でスパムを検出
- 📊 **キュー管理** - 永続ストレージで待機中・確認済みツイートキューを管理
- 💾 **自動保存** - 500件に達するとツイートを自動ダウンロード
- 🔔 **Discord連携** - アラート用のWebhook通知（オプション）
- 🧩 **Blue Blocker対応** - Blue Blocker拡張機能との連携を想定

## 🚀 インストール

### ユーザー向け

1. [Tampermonkey](https://www.tampermonkey.net/) ブラウザ拡張機能をインストール
2. ユーザースクリプトをダウンロード: [twitter-auto-spam-crawler.user.js](https://github.com/book000/twitter-auto-spam-crawler/releases/latest/download/twitter-auto-spam-crawler.user.js)
3. Tampermonkey のプロンプトが表示されたらクリックしてインストール

## 📖 使い方

1. [x.com](https://x.com) にアクセス
2. スクリプトが自動的にツイートの監視を開始
3. Tampermonkey メニューから設定を調整
4. 収集されたデータは自動保存され、エクスポート可能

## 🛠️ 開発者向け

開発に参加する場合は、[コントリビューションガイド](.github/CONTRIBUTING.md)で開発環境のセットアップ、アーキテクチャの詳細、投稿ガイドラインを確認してください。

クイックスタート:
```bash
git clone https://github.com/book000/twitter-auto-spam-crawler.git
cd twitter-auto-spam-crawler
pnpm install
pnpm run build:dev
```

## ⚠️ 免責事項

これは Twitter/X の**非公式ツール**です。利用は自己責任でお願いします。

- Twitter/X や Blue Blocker との公式な関係はありません
- サイト変更により動作しなくなる可能性があります
- 研究・教育目的での利用を想定しています

## 📑 ライセンス

MIT License - [LICENSE](LICENSE) を参照