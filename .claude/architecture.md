# Architecture

## Page routing

`src/main.ts` holds a table of `{ url, urlType, run }` entries (`startsWith` or `regex`) and runs the first one that matches `location.href`. Once a second it re-evaluates the table and reloads the page if the matched entry changed (for example after an in-app navigation).

| URL | Handler |
|---|---|
| `https://x.com/home` | `HomePage.run`: opens each timeline tab and scrolls 10 times per tab, then moves to Explore (or back to home when "Only Home crawling" is `true`) |
| `https://x.com/explore` | `ExplorePage.run`: waits for the trends and clicks a random one |
| `https://x.com/search`, `https://x.com/i/trending/` | `SearchPage.run`: forces `f=live` (latest), scrolls 10 times, then calls `TweetPage.run(true)` |
| `https://x.com/<user>/status/<id>` (`TWEET_URL_REGEX`) | `TweetPage.run`: scrolls the whole page to load replies, marks the tweet as checked, then calls `TweetPage.run(true)` (it goes to the bookmarks page instead if no tweet was crawled) |
| `https://x.com/compose/post` | `OtherPages.runComposePost`: closes the compose view and goes back |
| `https://x.com/i/bookmarks` | `OtherPages.runProcessBlueBlockerQueue`: waits 60 seconds, then until Blue Blocker's toasts (`#injected-blue-block-toasts > div.toast`) are gone, then goes home |
| `https://x.com/i/flow/login` | `OtherPages.runLogin`: opens the login-notification window unless it was already sent |
| `https://x.com/account/access` | `OtherPages.runLocked`: opens the lock-notification window unless it was already sent, leaves the flag unset if the popup is blocked so a later visit can retry, and starts a 30-second timer that navigates to the bookmarks page to test whether the account is unlocked |
| `https://example.com/?<command>` | `ExamplePages`: helper pages, see below |

`TweetPage.run(true)` (open-only mode) decides where to go next: to the download page when more than 500 tweets are saved, otherwise to the next waiting tweet, or to the bookmarks page when the queue is empty.

A tweet page that shows a "deleted" dialog or a rule-violation/deleted post is marked as checked and skipped. If the tweet cannot be loaded, the page reloads after a minute and the tweet is skipped after 3 failed retries.

## Helper pages on example.com

The script opens `https://example.com/?<command>` in a new window for the notification commands, and navigates the current tab to `?download-json`. `?reset-waiting` is never opened by the script; it only runs if you visit that URL yourself. The commands are defined in `URLS` in `src/core/constants.ts`:

- `download-json`: if more than 500 tweets are stored, downloads them as `tweets-<timestamp>.json` with `GM_download` and removes the downloaded tweets only after `onload`; on failure or timeout the tweets are kept and retried on a later visit. Then continues with `TweetPage.run(true)`, skipping the redirect back to the download page after a failed download so the crawl is not stuck
- `login-notify`, `login-success-notify`, `locked-notify`, `unlocked-notify`: send the matching Discord message and close the window once the request completes (without a configured webhook URL, or if the request throws, the window stays open); `login-notify` also sets the login-notified flag at that point
- `update-notify&old=<version>&new=<version>`: sends the update notification (`VersionService` opens it when the script version changed)
- `reset-waiting` (manual only): clears the waiting queue and goes home after 3 seconds

## Services (`src/services/`)

- `CrawlerService`: `startCrawling()` runs `crawlTweets()` every second. It extracts the tweets on screen, saves them, and puts those that pass the threshold and are neither checked nor waiting into the waiting queue. It also counts the tweets crawled in the current page.
- `TweetService`: extracts tweets from `article[data-testid="tweet"]` elements (with a `WeakMap` link cache and refreshed content and engagement elements), saves them sorted by tweet ID, filters by engagement, and builds the JSON download.
- `QueueService`: waiting queue and checked list on top of `Storage`.
- `NotificationService`: posts to a Discord webhook; the `Comment` setting is appended to each message. The returned promise rejects on a fetch error or a non-2xx response (callers rely on this to retry) and resolves without sending when no webhook URL is set.
- `StateService`: clears the "login notified" and "locked notified" flags (and opens the matching success/unlock window) when a normal page loads after a login or lock notification.
- `VersionService`: compares the stored script version with the current one and opens the update-notification window when it changed.

## Storage

`Storage` (`src/core/storage.ts`) uses `GM_getValue`, `GM_setValue` and `GM_listValues`. The legacy collections and scalar keys are typed by `StorageData` in `src/types/index.ts`:

| Key | Content |
|---|---|
| `waitingTweets` | Legacy waiting IDs, read as a fallback |
| `checkedTweets` | Legacy checked IDs, read as a fallback |
| `savedTweets` | Full tweet objects collected for the JSON download |
| `isLoginNotified` / `isLockedNotified` | Whether the login / lock notification was already sent |
| `retryCount` | Failed tweet-page loads in a row |
| `storedVersion` | Script version seen on the previous run |

Queue mutations write `queue:checked:<tweetId>` (`true`) and `queue:waiting:<tweetId>` (enqueue time and sequence, or `false` after removal). Each write affects one ID, so interleaved writes for unrelated IDs cannot overwrite each other. Checked records are never removed and take precedence over waiting records, including when another context enqueues the same ID concurrently. Waiting records are ordered by enqueue time, then the per-context sequence and tweet ID; concurrent same-ID adds may update that ID's position.

Queue membership checks read per-tweet records directly with a legacy-array fallback. Full queue reads enumerate records and build fresh Set snapshots, so remote updates need no notification or origin-scoped lock. Legacy arrays remain readable and are never rewritten by queue operations. Removal uses a `false` tombstone to prevent legacy entries from reappearing. Reset clears the IDs observed in its snapshot; unrelated IDs enqueued concurrently remain. Old tabs must reload after updating the script to use the per-tweet records. Storage retains one checked record and a waiting record or tombstone per updated ID; full queue reads scan the stored keys.

Saved tweets continue to use the existing array and per-context Map cache, refreshed by the saved-tweet setter. The per-tweet coordination applies to the waiting and checked queues.

The settings edited in the userscript manager menu (`discordWebhookUrl`, `authWebhookUrl`, `lockWebhookUrl`, `comment`, `isOnlyHome`) are stored by `GM_config` and read through `ConfigManager` (`src/core/config.ts`) with `GM_getValue`.

## Constants

`src/core/constants.ts` holds `URLS`, `THRESHOLDS` (retweet and reply thresholds, saved-tweet limit, retry and failed-scroll limits), `TIMEOUTS`, `DELAYS` and `SELECTORS`.

## Error handling and DOM helpers

- `PageErrorHandler` (`src/utils/page-error-handler.ts`): `handlePageError` logs the error, waits (default one minute) and reloads the page; `logAction` and `logError` prefix log lines with the caller's name taken from the stack trace. Page handlers catch the failure of the awaited operation (for example `DomUtils.waitElement`) and pass it to `handlePageError` instead of logging and reloading themselves.
- `DomUtils`: `waitElement` (polls every 500 ms, rejects after a timeout, default 30 seconds), `isFailedPage` (X's error page with the reload icon), `clickMoreReplies*`, `checkAndNavigateToLogin`.
- `ScrollUtils.scrollPage`: scrolls every 2 seconds and clicks "show more replies" buttons until the page height has not changed 10 times in a row.
- `ErrorHandler`: watches for the error dialog and for unprocessable posts, with timeouts.
- `AsyncUtils`: `delay` and related promise helpers.

## Dependencies between layers

Pages call services, utilities, `Storage` and `ConfigManager` (`SearchPage` and `ExamplePages` also call `TweetPage`). Services call `Storage`, `ConfigManager`, the constants and `AsyncUtils`; only `CrawlerService` calls other services. Utilities depend on the constants and on each other. `core` and `types` depend on nothing above them (`core/storage.ts` only imports types).
