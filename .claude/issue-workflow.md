# GitHub Issue対応ワークフロー

このガイドは「issue #nnを対応してください」という指示だけで、完全なissue対応が実行されるための標準フローです。

## 🎯 Issue対応の完全自動フロー

### 1. Issue情報の取得と分析

```bash
# 1. Issue詳細を取得
gh api repos/$REPO_OWNER/$REPO_NAME/issues/$ISSUE_NUMBER

# 2. Issue内容を分析
# - タイトル
# - 説明
# - 要件
# - 関連情報（ラベル、アサイニー等）
```

### 2. 実装計画の作成

1. **TodoWriteツールで実装計画を作成**
   - Issue要件を分解
   - 実装ステップを明確化
   - テスト計画を含める

2. **関連ファイルの調査**
   - 既存コードの確認
   - 影響範囲の特定
   - 設計パターンの理解

### 3. ブランチ作成

```bash
# Issue番号とタイプから適切なブランチ名を生成
# 例: feat/issue-16-update-notification
git checkout -b [type]/issue-$ISSUE_NUMBER-[brief-description] origin/$MAIN_BRANCH --no-track
```

### 4. 実装

1. **コード実装**
   - 既存のコーディング規約に従う
   - 必要なファイルを作成/編集
   - インポート順序や命名規則を遵守

2. **テスト作成**
   - 単体テストを必ず作成
   - 既存のテスト命名規則に従う
   - カバレッジ100%を目指す

3. **品質チェック**
   ```bash
   pnpm test          # テスト実行
   pnpm run lint      # リンティング
   pnpm run fix       # 自動修正
   ```

### 5. コミット

```bash
git add .
git commit -m "$(cat <<'EOF'
[type]: [brief description for issue #nn]

- [実装内容1]
- [実装内容2]
- [テスト追加]

This addresses issue #$ISSUE_NUMBER by [solving description]

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 6. Pull Request作成

```bash
# プッシュ
git push -u origin [branch-name]

# PR作成
gh pr create --title "[type]: [title] (closes #$ISSUE_NUMBER)" --body "$(cat <<'EOF'
## Summary
[Issue #$ISSUE_NUMBER]($ISSUE_URL) の対応

## Changes
- [変更内容1]
- [変更内容2]

## Test plan
- [x] 単体テスト追加
- [x] 既存テスト全て合格
- [x] リンティング通過

🤖 Generated with [Claude Code](https://claude.ai/code)
EOF
)"
```

### 7. Copilotレビュー対応

1. **レビュー依頼**
   ```bash
   gh api repos/$REPO_OWNER/$REPO_NAME/pulls/$PR_NUMBER/requested_reviewers \
     -X POST --field "reviewers[]=copilot-pull-request-reviewer[bot]"
   ```

2. **レビュー結果確認と対応**
   - 60秒待機後、レビューを確認
   - 必要に応じて修正をコミット
   - 全ての指摘事項に対応

### 8. ドキュメント更新

**重要**: 以下の場合は必ずドキュメントを更新：

- 新機能追加 → CLAUDE.md にコマンド追加
- アーキテクチャ変更 → .claude/architecture.md 更新
- ビルド設定変更 → .claude/build-system.md 更新
- 新しいパターン → .claude/development-patterns.md 更新
- テスト手法追加 → .claude/testing-guide.md 更新

## 📋 Issue タイプ別の対応

### feat: 新機能追加
- 新しいサービス/コンポーネントの作成
- 既存機能の拡張
- 新しいページやルートの追加

### fix: バグ修正
- エラーの修正
- 動作不良の改善
- パフォーマンス問題の解決

### refactor: リファクタリング
- コード構造の改善
- 可読性の向上
- 技術的負債の解消

### docs: ドキュメント
- README更新
- コメント追加
- ガイド作成

### test: テスト
- テストカバレッジ向上
- 新しいテストケース追加
- テスト基盤の改善

## 🔄 標準的な実行例

「issue #16を対応してください」と指示された場合：

1. WebFetchでissue #16の内容を取得
2. TodoWriteで実装計画作成
3. `git checkout -b feature/issue-16-update-notification`
4. 必要なファイルを実装
5. テストを作成・実行
6. コミット＆プッシュ
7. PR作成（タイトルに "closes #16" を含める）
8. Copilotレビュー対応
9. 必要に応じてCLAUDE.mdやガイドを更新

## 🚀 効率化のポイント

1. **並列実行**: 複数のツールを同時に使用
2. **自動判断**: issueタイプからブランチ名を自動生成
3. **テンプレート活用**: コミットメッセージやPR本文を標準化
4. **継続的検証**: 各ステップで品質チェック実施

このワークフローに従うことで、「issue #nnを対応してください」という単純な指示から、完全なissue対応が可能になります。