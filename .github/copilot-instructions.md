# CLAUDE.md



## プロジェクトの目的

Twitter/X のツイートを自動でクロールし、潜在的なスパムコンテンツを特定するTypeScriptベースのユーザースクリプトです。Blue Blocker拡張機能と組み合わせて使用することを想定しており、Tampermonkey/Greasemonkey経由でブラウザで動作するユーザースクリプト（.user.js）にコンパイルされます。

## コーディング規約

- コードスタイルは既存コードに従う

## プロジェクト構成

プロジェクト構成については README を確認してください。

## 開発コマンド

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

## 新機能実装時の注意事項

- 既存のコード構造とパターンを維持する
- 適切なテストを追加する
- ドキュメントを更新する
