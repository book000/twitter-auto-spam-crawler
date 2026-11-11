# Copilot code review instructions

Read `AGENTS.md` at the repository root first; it is the source of truth for structure, commands and conventions.

## Language

Write review comments, and expect all deliverables (code comments, JSDoc, test descriptions, docs, commit messages, PR text), in English. Runtime log and error messages are English too. Japanese strings that match X's Japanese UI text or are shown to the user are intentional (see `AGENTS.md`).

## Review checklist

- Page handlers pass failures to `PageErrorHandler` (`src/utils/page-error-handler.ts`) instead of writing their own logging and reload logic.
- No `setInterval` / `setTimeout` without an exit condition and no element-wait loop without a timeout; use `DomUtils.waitElement` or `ErrorHandler.waitForElementAndCallback`.
- Types: flag casual `any`, `skipLibCheck` used to hide type errors, and overuse of non-null assertions (`!`).
- X.com selectors are fragile; when one changes, check the affected pages and tests.
- Every Tampermonkey `GM_*` API called in `src/` is listed in `package.json` `userscript.grant` and declared in `src/types/userscript.d.ts`. Globals from the `@require`d library (`GM_config`, `GM_config_event`) only need the declaration; the menu-command grants exist for that library.
- New behavior and bug fixes come with tests under `src/__tests__/`. Fake timers are enabled globally, so check for timers left running in tests.
- No circular imports between services and utilities.
- Commit and PR titles follow Conventional Commits; the type drives the released version (see `.github/workflows/release.yml`). `docs` commits do not publish a release.

## Do not flag

- Formatting and import order; Prettier and ESLint (`@book000/eslint-config`) enforce them.
- The unminified build output; it is intentional so the userscript stays reviewable.
- `GM_*` globals that look undefined; `@types/greasemonkey`, `src/types/userscript.d.ts` and the test mocks provide them.
- `https://example.com/*` in `@match`; it is used for notification windows, the JSON download page and a manual queue-reset page.
- Relative imports (`./x` between siblings, relative paths in tests).
- Japanese strings that match X's Japanese UI text or are shown to the user.

Keep comments short, specific and actionable.
