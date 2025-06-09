export const URLS = {
  SEARCH: 'https://x.com/search',
  EXPLORE: 'https://x.com/explore',
  TRENDING: 'https://x.com/i/trending/',
  HOME: 'https://x.com/home',
  COMPOSE_POST: 'https://x.com/compose/post',
  BOOKMARK: 'https://x.com/i/bookmarks',
  LOGIN: 'https://x.com/i/flow/login',
  LOCKED: 'https://x.com/account/access',
  EXAMPLE_DOWNLOAD_JSON: 'https://example.com/?download-json',
  EXAMPLE_LOGIN_NOTIFY: 'https://example.com/?login-notify',
  EXAMPLE_LOGIN_SUCCESS_NOTIFY: 'https://example.com/?login-success-notify',
  EXAMPLE_LOCKED_NOTIFY: 'https://example.com/?locked-notify',
  EXAMPLE_UNLOCKED_NOTIFY: 'https://example.com/?unlocked-notify',
  EXAMPLE_RESET_WAITING: 'https://example.com/?reset-waiting',
  EXAMPLE_UPDATE_NOTIFY: 'https://example.com/?update-notify',
} as const

export const TWEET_URL_REGEX =
  /https:\/\/(?:x|twitter)\.com\/([^/]+)\/status\/(\d+)/

export const DISCORD_MENTION_ID = '221991565567066112'

export const THRESHOLDS = {
  RETWEET_COUNT: 100,
  REPLY_COUNT: 10,
  SAVED_TWEETS_LIMIT: 500,
  MAX_RETRY_COUNT: 3,
  MAX_FAIL_SCROLL_COUNT: 10,
} as const

export const TIMEOUTS = {
  CRAWL_INTERVAL: 1000,
  SCROLL_INTERVAL: 2000,
  ELEMENT_WAIT: 500,
  ELEMENT_WAIT_LIMIT: 30,
  ERROR_RELOAD_WAIT: 60_000,
  LOCKED_REDIRECT_WAIT: 180_000,
  LOCKED_CHECK_INTERVAL: 30_000,
  RESET_REDIRECT_WAIT: 3000,
  DOWNLOAD_WAIT: 5000,
  PROCESSING_WAIT: 60_000,
} as const

export const DELAYS = {
  // 基本的な遅延時間
  SHORT: 100,
  MEDIUM: 500,
  LONG: 1000,

  // 機能固有の遅延時間
  CRAWL_INTERVAL: TIMEOUTS.CRAWL_INTERVAL,
  SCROLL_INTERVAL: TIMEOUTS.SCROLL_INTERVAL,
  ERROR_RELOAD_WAIT: TIMEOUTS.ERROR_RELOAD_WAIT,
  DOM_WAIT: TIMEOUTS.ELEMENT_WAIT,
  PROCESS_WAIT: 1000,
  DOWNLOAD_WAIT: TIMEOUTS.DOWNLOAD_WAIT,
  PROCESSING_WAIT: TIMEOUTS.PROCESSING_WAIT,
  RESET_REDIRECT_WAIT: TIMEOUTS.RESET_REDIRECT_WAIT,
  LOCKED_CHECK_INTERVAL: TIMEOUTS.LOCKED_CHECK_INTERVAL,

  // リトライ関連
  RETRY_BASE: 1000,
  RETRY_MAX: 30_000,
} as const

export const SELECTORS = {
  BOTTOM_BAR_LOGIN: 'div[data-testid="BottomBar"]:has(a[data-testid="login"])',
} as const
