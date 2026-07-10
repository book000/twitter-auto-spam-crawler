# Copilot code review instructions

GitHub Copilot のコードレビュー向け指示。twitter-auto-spam-crawler の変更をレビューする際に重点確認すべき点と、誤検知として指摘すべきでないパターンを定義する。

## プロジェクト前提

- Twitter/X をクロールしスパムを検出する TypeScript ユーザースクリプト。Webpack で `dist/twitter-auto-spam-crawler.user.js` にビルドされ、Tampermonkey/Greasemonkey 上で `https://x.com/*` で動作する。
- TypeScript strict モード（ES2020）、テストは Jest（jsdom）。パッケージマネージャは pnpm。

## レビュー時に重点確認する点

- **エラーハンドリング**: ページ処理の try/catch は共通ユーティリティ `PageErrorHandler`（`src/utils/page-error-handler.ts`）に集約されている。各ページで独自の重複した try/catch やログ出力を追加していないか確認する。
- **タイマーリーク**: 終了条件のない `setInterval` / `setTimeout`、タイムアウトなしの要素待機ループを指摘する。要素待機はタイムアウト内蔵の `ErrorHandler.waitForElementAndCallback` / `waitForAllElementsAndCallback`（`src/utils/error.ts`、デフォルト 30 秒）を使うべき。
- **型安全性**: `any` の安易な使用、`skipLibCheck` による型エラー回避、非 null アサーション（`!`）の乱用を指摘する。`strictNullChecks` 前提で null/undefined を確認する。
- **DOM セレクター**: X.com 固有セレクター（`[data-testid="tweet"]` など）は壊れやすい。ハードコードされたセレクターに変更が入った場合は影響範囲を確認する。
- **ユーザースクリプト API**: `GM_getValue` / `GM_setValue` などは `@grant` 宣言（`package.json` の `userscript.grant`）と対応している必要がある。未宣言の GM_* API 使用を指摘する。
- **テスト**: 新機能・バグ修正に対応するテストが `src/__tests__/**/*.test.ts` に追加されているか確認する。Jest はフェイクタイマーがグローバル有効なため、タイマー依存コードのテストで `jest.useRealTimers()` 等の後処理漏れを確認する。
- **循環依存**: サービス層・ユーティリティ間の循環 import を指摘する。

## 規約（レビューで確認する）

- **言語**: コード内コメント・JSDoc は日本語、ユーザー/ログ向けエラーメッセージ文字列は英語。日本語と英数字の間には半角スペース。
- **JSDoc**: 公開関数・インターフェースには日本語の JSDoc（パラメータ・戻り値）が付いていることが望ましい。
- **命名**: 変数・関数 camelCase、クラス・インターフェース PascalCase、定数 UPPER_SNAKE_CASE、ファイル kebab-case。
- **コミット/PR タイトル**: Conventional Commits 形式（`feat` / `fix` / `docs` / `perf` / `refactor` / `style` / `test` / `chore`）、description は日本語。
- **パスエイリアス**: import は `@/` → `src/` を使う。

## 指摘すべきでないパターン（誤検知の回避）

- **フォーマット・スタイル**: インデント、クォート、セミコロン、import 順序などは Prettier + ESLint（`@book000/eslint-config`）で自動強制される。これらのスタイル差分を指摘しない。
- **ビルド出力の非最小化**: ユーザースクリプトは可読性とレビュー可能性のため意図的に最小化していない。「圧縮すべき」という指摘は不要。
- **コメントやメッセージが日本語であること自体**: 上記言語規約に沿った意図的なもの。英語化を促さない。
- **`GM_*` グローバルが未定義に見える点**: `@types/greasemonkey` とモックで供給される。未定義エラーとして指摘しない。
- **`example.com` への `@match`**: `package.json` の `userscript.match` に意図的に含まれている。不要な権限として指摘しない。

指摘は簡潔・具体的に、命令形で記述すること。
