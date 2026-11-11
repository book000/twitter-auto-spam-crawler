# AGENTS.md

Guidance for AI coding agents and contributors. `CLAUDE.md` imports this file, and `.github/copilot-instructions.md` adds the review checklist.

## Language

- All deliverables are written in **English**: commit messages, PR/Issue titles and bodies, review comments, code comments and JSDoc, test descriptions, and documentation (`README.md`, `AGENTS.md`, `.github/CONTRIBUTING.md`, `.claude/*.md`, etc.). `README-ja.md` is the maintained Japanese translation of `README.md`; keep it in sync with the English README.
- Exceptions (keep as is): the Japanese strings that match X's Japanese UI text or are shown to the user (`削除`, `さらに返信を表示する`, the two `このポスト…` keywords, the update notification message), quotations, technical identifiers, generated files, and external source text.
- Runtime messages (logs, errors) are English.
- Do not rewrite Git history to change the language of past commits.

## Overview

A TypeScript userscript for Tampermonkey/Greasemonkey. It runs on `https://x.com/*`, crawls tweets that look like spam (retweets >= 100 and replies >= 10), keeps a queue of tweet IDs to visit, and stores the tweets it saw so they can be downloaded as JSON. It is meant to run unattended together with the Blue Blocker extension, which does the actual blocking; this script never blocks accounts itself.

Webpack bundles `src/main.ts` into `dist/twitter-auto-spam-crawler.user.js`. The `==UserScript==` header is generated from `package.json` (see `.claude/build-system.md`).

## Commands

```bash
pnpm install                   # install dependencies
pnpm run build                 # production bundle (not minified, on purpose)
pnpm run build:dev             # bundle with inline source maps
pnpm run watch                 # rebuild on change
pnpm test                      # Jest with coverage
pnpm test -- <path>            # one test file, e.g. src/__tests__/services/tweet-service.test.ts
pnpm run lint                  # prettier --check src + eslint + tsc --noEmit
pnpm run fix                   # prettier --write src + eslint --fix
pnpm run clean                 # remove dist
```

Run `pnpm run lint` and `pnpm test` before committing. Node.js is pinned in `.node-version` (and `engines`) and pnpm in `packageManager`; other package managers are not supported. CI (`.github/workflows/nodejs-ci-pnpm.yml`) uses the reusable workflow from `book000/templates`.

## Structure

- `src/main.ts`: entry point. Picks a page handler by URL (`startsWith` or regex) and re-checks every second; it reloads the page if the matched handler changed.
- `src/pages/`: one handler per page (`HomePage`, `ExplorePage`, `SearchPage`, `TweetPage`, `OtherPages`, `ExamplePages`). The `example.com` handlers are helper pages, which is why `example.com` is in `@match`. The script opens `https://example.com/?<command>` in a new window for the login, login-success, locked, unlocked and update notifications, and navigates the current tab to `?download-json` when more than 500 tweets are saved. `?reset-waiting` is a manual maintenance page that the script never opens.
- `src/services/`: `CrawlerService` (interval crawl), `TweetService` (DOM extraction, saving, download), `QueueService` (waiting/checked queues), `NotificationService` (Discord webhook), `StateService` (resets the login/lock notification flags), `VersionService` (notifies on script updates).
- `src/core/`: `constants.ts` (URLs, thresholds, timeouts, selectors), `storage.ts` (typed `GM_getValue`/`GM_setValue` wrapper with Set/Map caches), `config.ts` (`GM_config` menu and webhook/comment/only-home settings).
- `src/utils/`: `PageErrorHandler`, `DomUtils`, `ScrollUtils`, `ErrorHandler`, `AsyncUtils`.
- `src/types/`: shared types and the `GM_*` declarations.
- `src/__tests__/`, `src/__mocks__/`, `src/core/__mocks__/`: tests and mocks. Details: `.claude/architecture.md`, `.claude/testing-guide.md`.

## Conventions

- TypeScript `strict` mode, ES2020 target. Do not enable `skipLibCheck` to hide type errors. Import across directories with the `@/` alias (`@/` maps to `src/`); siblings use `./x`, and tests, mocks and `package.json` imports use relative paths.
- Naming: camelCase variables and functions, PascalCase classes and interfaces, UPPER_SNAKE_CASE constants, kebab-case file names.
- Page handlers pass failures to `PageErrorHandler` (`src/utils/page-error-handler.ts`): `handlePageError` in the `catch` of the awaited operation, and `logAction` / `logError` for logging, instead of writing their own logging and reload logic.
- Wait for elements with a timeout (`DomUtils.waitElement`, `ErrorHandler.waitForElementAndCallback`); do not add unbounded polling loops.
- Every Tampermonkey `GM_*` API the code calls (for example `GM_getValue`, `GM_setValue`) must be listed in `package.json` `userscript.grant` and declared in `src/types/userscript.d.ts`. `GM_config` and `GM_config_event` come from the `@require`d Tampermonkey Config library, so they only need the declaration; `GM_registerMenuCommand` and `GM_unregisterMenuCommand` stay granted for that library.
- X.com selectors (`[data-testid="tweet"]` and similar) break when the site changes; check the affected pages and tests when you touch one.
- Write JSDoc for exported functions and interfaces that states their purpose. Add `@param`, `@returns` and `@throws` only where they say more than the signature does (units, defaults, side effects, error behavior). Keep JSDoc and comments accurate against the code, and do not comment what the code already says.
- Add or update a test with every behavior change. Tests live in `src/__tests__/` mirroring the source layout; fake timers are enabled globally and `GM_*` is mocked in `src/__mocks__/userscript.ts`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat`, `fix`, `docs`, `perf`, `refactor`, `style`, `test`, `chore`); branches follow [Conventional Branch](https://conventional-branch.github.io) short form (`feat/...`, `fix/...`). Create branches with `--no-track` (for example `git checkout -b feat/xxx origin/master --no-track`).
- `.github/workflows/release.yml` bumps the version from the commit type on every push to the default branch and publishes a release (`feat` minor; `fix`, `chore`, `refactor`, and similar patch; `docs` commits do not publish a release), so choose the type deliberately. The workflow writes the new version into `package.json` at build time.
- Do not commit to Renovate PRs. To close an Issue from a PR, put `closes #<number>` in the PR body.
- When behavior, commands or the directory layout change, update `README.md` / `README-ja.md`, this file and the matching `.claude/*.md` in the same change.

## Security

- Never commit secrets. Discord webhook URLs are entered through the Tampermonkey menu and stored by the userscript manager, not in the repository.
- Do not log personal data or credentials.
- Automated tests use jsdom and mocks only; they must not reach x.com or a real Discord webhook.
