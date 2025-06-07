export interface Tweet {
  url: string
  tweetText: string | null
  tweetHtml: string | null
  elementHtml: string
  screenName: string
  tweetId: string
  replyCount: string
  retweetCount: string
  likeCount: string
}

export interface PageMethod {
  url: string | RegExp
  urlType: 'startsWith' | 'regex'
  run: () => void | Promise<void>
}

export interface Config {
  discordWebhookUrl: string
  comment: string
  isOnlyHome: string
}

export interface StorageData {
  checkedTweets: string[]
  waitingTweets: string[]
  savedTweets: Tweet[]
  isLoginNotified: boolean
  isLockedNotified: boolean
  retryCount: number
}

export type StorageKey = keyof StorageData
