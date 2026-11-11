/**
 * A tweet scraped from the page, with its metadata and engagement counts.
 */
export interface Tweet {
  /** Absolute URL of the tweet */
  url: string
  /** Plain text of the tweet body; `null` if the body element is absent */
  tweetText: string | null
  /** HTML of the tweet body; `null` if the body element is absent */
  tweetHtml: string | null
  /** Inner HTML of the whole tweet article element */
  elementHtml: string
  /** Screen name (handle) of the author, taken from the tweet URL */
  screenName: string
  /** Tweet ID, taken from the tweet URL */
  tweetId: string
  /** Reply count as a digit string; `"0"` if it could not be read */
  replyCount: string
  /** Retweet count as a digit string; `"0"` if it could not be read */
  retweetCount: string
  /** Like count as a digit string; `"0"` if it could not be read */
  likeCount: string
}

/**
 * Maps a URL to the page handler that should run on it.
 */
export interface PageMethod {
  /** URL prefix (`startsWith`) or pattern (`regex`) to match */
  url: string | RegExp
  /** How `url` is matched against `location.href` */
  urlType: 'startsWith' | 'regex'
  /** Handler to run when the URL matches */
  run: () => void | Promise<void>
}

/**
 * User settings stored through GM_config. Does not list `authWebhookUrl` and
 * `lockWebhookUrl`.
 */
export interface Config {
  /** Default Discord webhook URL for notifications */
  discordWebhookUrl: string
  /** Comment appended to every Discord message */
  comment: string
  /** Whether to crawl only the home page, stored as `"true"` or `"false"` */
  isOnlyHome: string
}

/**
 * Values persisted through GM_getValue / GM_setValue, keyed by storage key.
 */
export interface StorageData {
  /** IDs of tweets that have already been processed */
  checkedTweets: string[]
  /** IDs of tweets queued for processing */
  waitingTweets: string[]
  /** Scraped tweets waiting to be exported as JSON */
  savedTweets: Tweet[]
  /** Whether the login-required notification got a response from Discord */
  isLoginNotified: boolean
  /** Whether the account-locked notification has been requested */
  isLockedNotified: boolean
  /** Consecutive failed attempts to load the current tweet page */
  retryCount: number
  /** Script version recorded by the last version check */
  storedVersion: string
}

export type StorageKey = keyof StorageData
