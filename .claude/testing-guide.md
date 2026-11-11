# Testing guide

## Setup

Jest runs through `ts-jest` in a `jsdom` environment. The configuration is the `jest` field of `package.json`:

- Tests are `src/__tests__/**/*.test.ts`, mirroring the layout of `src/` (`core/`, `pages/`, `services/`, `utils/`, plus `main.test.ts`).
- Fake timers are enabled globally (`fakeTimers.enableGlobally`), and `testTimeout` is 120 seconds.
- `@/` resolves to `src/` through `moduleNameMapper`.
- Coverage is collected from `src/**/*.ts` except `src/main.ts`, `src/types/**`, test files, `src/__mocks__/**` and `src/__tests__/**`.

`pnpm test` runs `jest --runInBand --passWithNoTests --detectOpenHandles --forceExit --coverage`. To run one file: `pnpm test -- src/__tests__/services/tweet-service.test.ts`.

## Mocks

- `src/__mocks__/userscript.ts`: installs `GM_getValue`, `GM_setValue`, `GM_config`, `GM_config_event` and `addEventListener` as globals, backed by an in-memory `Map`. Import it first in a test that touches `Storage` or `ConfigManager`, and use `clearMockStorage()` / `getMockStorage()` to reset or inspect the state.
- `src/core/__mocks__/storage.ts`: the manual mock used by `jest.mock('../../core/storage')`. It mirrors the `Storage` API on top of the `GM_*` mocks, with `jest.fn` wrappers so calls can be asserted.
- Most page and service tests mock their collaborators with `jest.mock('<path>')` (`DomUtils`, `AsyncUtils`, `PageErrorHandler`, other services) and drive the handler under test directly.
- `src/__tests__/utils/page-test-utils.ts`: helpers that build the X.com DOM structures the pages expect (timeline tabs, tweet articles, the failed-page icon, error dialogs).

## Writing tests

- Every behavior change needs a test; keep test descriptions in English.
- Timers: with fake timers, advance time explicitly (`jest.advanceTimersByTime`, `jest.advanceTimersByTimeAsync`) and stop intervals started by the code under test in `afterEach` (for example `CrawlerService.stopCrawling()` and `ScrollUtils.resetScrollState()`).
- DOM: build the DOM with `document.body.innerHTML = ...` and reset it in `beforeEach`; prefer the selectors the production code uses (`article[data-testid="tweet"]`, `div[data-testid="primaryColumn"]`, and so on).
- Storage: call `Storage.clearCache()` and reset the mock storage between tests so state does not leak.
- Some cases in `src/__tests__/utils/scroll.test.ts`, `pages/search-page.test.ts` and `pages/other-pages.test.ts` are marked `it.skip` (the `ScrollUtils` ones carry a TODO about the fake-timer setup). `pnpm test` reports them as skipped.
