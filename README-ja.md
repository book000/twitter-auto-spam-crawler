# 🕷️ twitter-auto-spam-crawler

Twitter/X のツイートを自動でクロールし、スパムの可能性があるツイートを収集する TypeScript 製のユーザースクリプトです。[Blue Blocker](https://github.com/kheina-com/Blue-Blocker) 拡張機能と組み合わせて使うことを想定しています。

日本語 | [English](README.md)

## ✨ 機能

- 🔄 **自動クロール** - x.com のホームタイムライン、トレンド、検索結果を巡回し、表示されたツイートを収集
- 🎯 **エンゲージメントによる絞り込み** - リツイート 100 以上かつリプライ 10 以上のツイートを確認対象のキューに追加
- 📊 **キュー管理** - ユーザースクリプトのストレージ API で、待機中キューと確認済みのツイート ID を保持
- 💾 **自動保存** - 保存済みツイートが 500 件を超えると JSON ファイルとして自動ダウンロード
- 🔔 **Discord 通知** - ログイン要求、アカウントのロック/ロック解除、スクリプト更新を Webhook で通知（任意）
- 🧩 **Blue Blocker 対応** - 実際のブロックは Blue Blocker が行う前提で動作（このスクリプト自身はアカウントをブロックしません）

## 🚀 インストール

### ユーザー向け

1. [Tampermonkey](https://www.tampermonkey.net/) などのユーザースクリプトマネージャーをインストール
2. ユーザースクリプトを開く: [twitter-auto-spam-crawler.user.js](https://github.com/book000/twitter-auto-spam-crawler/releases/latest/download/twitter-auto-spam-crawler.user.js)
3. ユーザースクリプトマネージャーの案内に従ってインストール

このスクリプトは `https://x.com/*` で動作します。補助ページのために `https://example.com/*` でも動作します。通知用のウィンドウを開き、JSON ダウンロード用のページへ移動します。キューのリセット用ページもありますが、自分で開いたときだけ使われます。example.com に送られるのはクエリ文字列のコマンドだけです（更新通知には、更新前後のバージョン番号も含まれます）。

## 📖 使い方

1. [x.com](https://x.com) にログインし、ホームを開く
2. スクリプトが自動でクロールを開始し、ホームタイムライン、探索、検索、キューにあるツイートの間を移動
3. 設定はユーザースクリプトマネージャーのメニューから変更
4. 保存済みツイートが 500 件を超えると、`tweets-<timestamp>.json` として自動でダウンロード

### 設定

設定はユーザースクリプトマネージャーのメニュー（Tampermonkey Config）から編集します。値はすべてプロンプトで入力します。

| 設定 | 内容 |
|---|---|
| `Discord Webhook URL (default)` | 更新通知に使う Webhook。下の 2 つが未設定のときのフォールバックにもなる |
| `Auth Discord Webhook URL (for login notifications)` | ログイン要求/ログイン成功の通知用 Webhook |
| `Lock Discord Webhook URL (for lock/unlock notifications)` | アカウントのロック/ロック解除の通知用 Webhook |
| `Comment` | すべての Discord メッセージの末尾に付けるテキスト |
| `Only Home crawling` | `true` にすると、探索や検索に移動せずホームタイムラインでクロールを続ける |

Webhook URL が未設定の場合、通知は送信されません。

## 🛠️ 開発者向け

開発に参加する場合は、[コントリビューションガイド](.github/CONTRIBUTING.md)で開発環境のセットアップ、アーキテクチャの概要、投稿ガイドラインを確認してください。AI コーディングエージェント向けの指示は [AGENTS.md](AGENTS.md) にあります。

クイックスタート:

```bash
git clone https://github.com/book000/twitter-auto-spam-crawler.git
cd twitter-auto-spam-crawler
pnpm install
pnpm run build:dev
```

ビルド結果は `dist/twitter-auto-spam-crawler.user.js` に出力されます。

## ⚠️ 免責事項

これは Twitter/X の**非公式ツール**です。利用は自己責任でお願いします。

- Twitter/X や Blue Blocker との公式な関係はありません
- サイト変更により動作しなくなる可能性があります
- 研究・教育目的での利用を想定しています

## 📑 ライセンス

MIT License - [LICENSE](LICENSE) を参照
