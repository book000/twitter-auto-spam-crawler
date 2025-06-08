# 🛠️ Contributing

Thanks for your interest in contributing to twitter-auto-spam-crawler! 🙏  
Any contribution to this project is more than welcome 🚀

開発に参加する場合は、本文書をお読みください。

## 📩 Reporting Issues

新機能の提案・不具合の報告は、このリポジトリの Issues に記載してください。

重複を避けるため、既に存在している Issue がないか確認をおねがいします。また、複数の問題がある場合は、それぞれ個別に追加してください。

## 🚀 Pull Requests

単純な誤字や小さな変更でも、プルリクエストは大歓迎です！

### Development Setup

開発を開始するには、以下の手順で準備を行ってください。

**Requirements:**
- Node.js 24.1.0
- pnpm 9.15.4+

**Setup:**
1. リポジトリを [Fork](https://docs.github.com/ja/github/getting-started-with-github/fork-a-repo) し、ローカルへ [clone](https://docs.github.com/ja/github/creating-cloning-and-archiving-repositories/cloning-a-repository) します。
2. `pnpm install` を実行し、必要なパッケージをインストールします。
3. 開発用ビルドで開発を開始します: `pnpm run watch`

### Development Commands

| Command | Description |
|---------|-------------|
| `pnpm run build` | Build production userscript |
| `pnpm run build:dev` | Build with source maps |
| `pnpm run watch` | Development watch mode |
| `pnpm test` | Run tests with coverage |
| `pnpm run lint` | Lint code (ESLint + Prettier + TypeScript) |
| `pnpm run fix` | Auto-fix linting issues |
| `pnpm run clean` | Clean dist directory |

### Git Workflow

このプロジェクトでは以下のGitワークフローに従ってください：

1. **ブランチ作成**: `git checkout -b feature/your-feature origin/master --no-track`
2. **開発**: コードを変更し、テストを追加
3. **品質チェック**: `pnpm run lint && pnpm test` を実行
4. **コミット**: 適切なコミットメッセージでコミット
5. **プッシュ**: `git push origin HEAD`
6. **Pull Request**: GitHubでPRを作成

### Commit Conventions

コミットメッセージの規約として [Conventional Commits](https://www.conventionalcommits.org/) を採用しています。以下ルールに従って、コミットメッセージを記述してください。

**許可されている型:**
- **feat**: 新しい機能の追加
- **fix**: 不具合の修正
- **docs**: ドキュメントの更新
- **perf**: パフォーマンスの改善
- **refactor**: リファクタリング
- **style**: コードスタイルの変更
- **test**: テストに関連する変更
- **chore**: その他の変更

**例:**
```
feat: add Discord webhook integration

- Add NotificationService for Discord alerts
- Support webhook URL configuration
- Include embed formatting for spam detection alerts
```

### Code Quality Standards

このプロジェクトでは以下の品質基準を維持しています：

- **TypeScript**: strict mode
- **ESLint**: [@book000/eslint-config](https://www.npmjs.com/package/@book000/eslint-config)
- **Prettier**: コードフォーマット
- **Jest**: テストカバレッジ
- **120秒タイムアウト**: 長時間テスト対応

変更をコミットする前に `pnpm run lint` を実行してエラーとならないことを確認してください。

### Project Architecture

このプロジェクトは以下のアーキテクチャに従っています：

```
src/
├── core/           # Configuration, constants, storage
├── pages/          # Page-specific handlers  
├── services/       # Business logic services
├── types/          # TypeScript definitions
└── utils/          # Utility functions
```

**主要サービス:**
- `CrawlerService` - メインクロール処理の統制
- `TweetService` - ツイート抽出・保存
- `QueueService` - ツイートキュー管理
- `NotificationService` - Discord Webhook連携

### Userscript Specifics

このプロジェクトはユーザースクリプトとして動作するため、以下の特殊事項があります：

- **GM_* APIs**: ユーザースクリプト専用API（GM_getValue/GM_setValue等）を使用
- **DOM操作**: X.com固有のセレクターを使用（サイト変更で影響を受ける可能性）
- **ビルドターゲット**: Webpack でコンパイルし .user.js ファイルを生成
- **実行環境**: Tampermonkey/Greasemonkey での動作を前提

### Testing Guidelines

テストは以下の方針で実装してください：

- **Jest + jsdom**: ブラウザ環境をシミュレート
- **フェイクタイマー**: `jest.useFakeTimers()` でタイマー依存テストを実装
- **モック**: `src/__mocks__/userscript.ts` でGM_*APIをモック
- **カバレッジ**: 新機能には適切なテストを追加

### IDE Setup

[Visual Studio Code](https://code.visualstudio.com/) の使用を推奨しています。

**推奨拡張機能:**
- ESLint
- Prettier
- TypeScript and JavaScript Language Features

## 📚 Additional Resources

詳細なアーキテクチャ情報については、以下のドキュメントを参照してください：

- [Architecture Guide](.claude/architecture.md)
- [Build System](.claude/build-system.md)
- [Development Patterns](.claude/development-patterns.md)
- [Testing Guide](.claude/testing-guide.md)

## 📑 License

このプロジェクトに貢献することで、あなたの貢献が MIT License の下でライセンスされることに同意したものとみなされます。