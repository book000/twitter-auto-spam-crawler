# GitHub PR完全ワークフローガイド

このガイドは GitHub Pull Request の作成からCopilotレビュー対応、CI修正までの完全な手順をまとめています。どのGitHubリポジトリでも使用できる汎用ガイドです。

## 📋 プロジェクト設定テンプレート

使用前に以下の変数を実際のプロジェクト値に置き換えてください：

```bash
# プロジェクト設定
export REPO_OWNER="your-username"
export REPO_NAME="your-repository"
export MAIN_BRANCH="main"  # または master
export PACKAGE_MANAGER="npm"  # npm, yarn, pnpm のいずれか

# 主要コマンド（プロジェクトに応じて調整）
export TEST_CMD="npm test"
export LINT_CMD="npm run lint"
export BUILD_CMD="npm run build"
export FIX_CMD="npm run fix"  # または npm run lint:fix
```

### パッケージマネージャ別コマンド例

| パッケージマネージャ | テスト | リント | ビルド | 修正 |
|---------------------|-------|-------|--------|------|
| npm | `npm test` | `npm run lint` | `npm run build` | `npm run fix` |
| yarn | `yarn test` | `yarn lint` | `yarn build` | `yarn fix` |
| pnpm | `pnpm test` | `pnpm run lint` | `pnpm run build` | `pnpm run fix` |

## 🚀 1. Pull Request 作成フロー

### 1.1 ブランチ作成と初期コミット

```bash
# フィーチャーブランチ作成
git checkout -b feat/your-feature

# 変更をコミット
git add .
git commit -m "feat: initial implementation

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# プッシュ
git push origin feat/your-feature
```

### 1.2 PR作成

```bash
# PRを作成
gh pr create --title "feat: 機能名" --body "$(cat <<'EOF'
## Summary
機能の概要を記載

## Changes
- 変更点1
- 変更点2

## Test plan
- [ ] テスト項目1
- [ ] テスト項目2

🤖 Generated with [Claude Code](https://claude.ai/code)
EOF
)"
```

### 1.3 PR情報取得

```bash
# PR番号取得
PR_NUMBER=$(gh pr view --json number --jq '.number')
echo "PR Number: $PR_NUMBER"

# PR詳細確認
gh pr view $PR_NUMBER
```

## 🤖 2. Copilot Review Cycle Automation

### 2.1 レビュー依頼

```bash
# Copilotをレビュアーとして追加（[bot]を忘れずに）
gh api repos/$REPO_OWNER/$REPO_NAME/pulls/$PR_NUMBER/requested_reviewers \
  -X POST --field "reviewers[]=copilot-pull-request-reviewer[bot]"
```

### 2.2 レビュー結果確認

```bash
# 2分待機
sleep 120

# 新しいレビュー確認
TIMESTAMP=$(date -u -d '5 minutes ago' +"%Y-%m-%dT%H:%M:%SZ")
gh api repos/$REPO_OWNER/$REPO_NAME/pulls/$PR_NUMBER/reviews \
  --jq ".[] | select(.submitted_at > \"$TIMESTAMP\") | {state: .state, body: .body, user: .user.login}"

# 個別コメント確認
gh api repos/$REPO_OWNER/$REPO_NAME/pulls/$PR_NUMBER/comments \
  --jq ".[] | select(.created_at > \"$TIMESTAMP\") | {body: .body, line: .line, path: .path}"
```

### 2.3 コメント分析と対応

レビューコメントの重要度分析：

- **Critical**: 修正必須（セキュリティ、機能的問題）
- **Important**: 修正推奨（パフォーマンス、ベストプラクティス）
- **Nitpick**: 修正任意（スタイル、可読性）

### 2.4 修正またはコメント返信

#### A. 修正が必要な場合

コードを修正してコミット：

```bash
# 修正をコミット
git add [修正ファイル]
git commit -m "$(cat <<'EOF'
refactor: address Copilot review feedback

- [修正内容1]
- [修正内容2]

Addresses Copilot review comments

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# プッシュ
git push
```

#### B. 修正が不要と判断する場合

レビューコメントに返信して理由を説明し、スレッドを解決：

```bash
# 1. コメントIDを取得
COMMENT_ID=$(gh api repos/$REPO_OWNER/$REPO_NAME/pulls/$PR_NUMBER/comments \
  --jq '.[] | select(.body | contains("対象のコメント内容の一部")) | .id')

# 2. コメントに返信
gh api repos/$REPO_OWNER/$REPO_NAME/pulls/$PR_NUMBER/comments \
  -X POST \
  -F body="対応しない理由：

このコメントについて以下の理由で対応を見送ります：

1. **技術的理由**: [具体的な技術的根拠]
2. **設計思想**: [設計上の意図と理由]
3. **優先度**: [他の要件との優先度比較]

詳細な検討結果として、現在の実装を維持することが適切と判断します。" \
  -F in_reply_to=$COMMENT_ID

# 3. コメントスレッドを解決（GraphQL API使用）
THREAD_ID=$(gh api graphql --field query='
query {
  repository(owner: "'$REPO_OWNER'", name: "'$REPO_NAME'") {
    pullRequest(number: '$PR_NUMBER') {
      reviewThreads(first: 50) {
        nodes {
          id
          isResolved
          comments(first: 1) {
            nodes {
              id
            }
          }
        }
      }
    }
  }
}' --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.comments.nodes[0].id == '$COMMENT_ID') | .id')

gh api graphql --field query='
mutation {
  resolveReviewThread(input: {threadId: "'$THREAD_ID'"}) {
    thread {
      id
      isResolved
    }
  }
}'
```

### 2.5 レビューコメント解決

```bash
# 解決済みコメントスレッドを取得
gh api graphql --field query='
query {
  repository(owner: "'$REPO_OWNER'", name: "'$REPO_NAME'") {
    pullRequest(number: '$PR_NUMBER') {
      reviewThreads(first: 20) {
        nodes {
          id
          isResolved
          comments(first: 1) {
            nodes {
              path
              body
            }
          }
        }
      }
    }
  }
}'

# 解決済みスレッドをresolve
THREAD_ID="PRRT_kwDOO3P17M5Rsk3b"  # 実際のID
gh api graphql --field query='
mutation {
  resolveReviewThread(input: {threadId: "'$THREAD_ID'"}) {
    thread {
      id
      isResolved
    }
  }
}'
```

### 2.6 再レビュー依頼

```bash
# 再レビュー依頼
gh api repos/$REPO_OWNER/$REPO_NAME/pulls/$PR_NUMBER/requested_reviewers \
  -X POST --field "reviewers[]=copilot-pull-request-reviewer[bot]"
```

## 🔧 3. CI/CD 対応

### 3.1 CI ステータス確認

```bash
# 最新のワークフロー実行確認
gh run list --limit 3

# 特定の実行詳細確認
gh run view [RUN_ID]

# 失敗ログ確認
gh run view [RUN_ID] --log-failed
```

### 3.2 CI失敗時の基本対応

```bash
# ローカルでテスト実行
$TEST_CMD

# リンティング実行
$LINT_CMD

# 自動修正
$FIX_CMD

# ビルドテスト
$BUILD_CMD
```

## ✅ 4. 完了条件チェックリスト

### Copilot Review

- [ ] `"generated no comments"` または `"APPROVED"` 状態
- [ ] Critical/Important コメントすべて対応済み
- [ ] 解決済みコメントスレッドをresolve済み

### CI/CD

- [ ] すべてのワークフローが成功
- [ ] テストカバレッジが維持されている
- [ ] リンティングエラーなし
- [ ] ビルドが成功

### Documentation

- [ ] 重要な変更にTSDocコメント追加
- [ ] CLAUDE.mdの更新（必要に応じて）
- [ ] README更新（必要に応じて）

## 🎯 5. 典型的なワークフロー例

### 成功例: 大規模リファクタリング

1. **初期実装**: 新機能追加、テスト追加
2. **初回Copilotレビュー**: 複数のコメント受信
3. **修正サイクル1**: Critical/Important問題を修正
4. **修正サイクル2**: CI失敗の修正
5. **最終レビュー**: `"generated no comments"` で完了

### コミット履歴例

```
abc1234 fix: address CI failures and test issues
def5678 refactor: address Copilot review feedback for cross-platform compatibility
ghi9012 refactor: address Copilot review feedback  
jkl3456 feat: add new feature with comprehensive tests
```

## 🛠️ 6. トラブルシューティング

### Copilotレビューが開始されない

```bash
# レビュアー状態確認
gh api repos/$REPO_OWNER/$REPO_NAME/pulls/$PR_NUMBER/requested_reviewers

# 待機時間を延長（最大5分）
sleep 300

# レビュー状況再確認
gh api repos/$REPO_OWNER/$REPO_NAME/pulls/$PR_NUMBER/reviews --jq '.[-1]'
```

### CIが無限ループする

```bash
# 現在実行中のワークフロー確認
gh run list --status in_progress

# 必要に応じてキャンセル
gh run cancel [RUN_ID]
```

### Git操作でエラー

```bash
# リモートの変更を取得
git pull --rebase origin $MAIN_BRANCH

# コンフリクト解決後
git push --force-with-lease
```

## 📚 参考情報

### 必須ツール

- **GitHub CLI**: `gh --help`
- **Git**: `git --help`

### プロジェクト固有の設定ファイル例

- **Jest設定**: `jest.config.js` / `jest.config.ts`
- **ESLint設定**: `.eslintrc.js` / `eslint.config.mjs` / `.eslintrc.json`
- **TypeScript設定**: `tsconfig.json`
- **Prettier設定**: `.prettierrc` / `.prettierrc.yml` / `prettier.config.js`
- **パッケージマネージャ**: `package.json` / `yarn.lock` / `pnpm-lock.yaml`

### 多言語プロジェクト対応

#### Python プロジェクト

```bash
export TEST_CMD="python -m pytest"
export LINT_CMD="python -m flake8"
export FIX_CMD="python -m black ."
```

#### Go プロジェクト

```bash
export TEST_CMD="go test ./..."
export LINT_CMD="golangci-lint run"
export BUILD_CMD="go build"
```

#### Rust プロジェクト

```bash
export TEST_CMD="cargo test"
export LINT_CMD="cargo clippy"
export BUILD_CMD="cargo build"
export FIX_CMD="cargo fmt"
```

#### Java/Gradle プロジェクト

```bash
export TEST_CMD="./gradlew test"
export LINT_CMD="./gradlew check"
export BUILD_CMD="./gradlew build"
```

## 🎯 使用開始チェックリスト

プロジェクトでこのガイドを使用する前に：

- [ ] 環境変数を設定（REPO_OWNER, REPO_NAME, MAIN_BRANCH, etc.）
- [ ] GitHub CLI がインストール済み (`gh --version`)
- [ ] 適切な権限でGitHubにログイン済み (`gh auth status`)
- [ ] プロジェクトのテスト・リント・ビルドコマンドを確認

---

このガイドを次回のPR作業で参照し、どのプロジェクトでも効率的なワークフローを実現してください。