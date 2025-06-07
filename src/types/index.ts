/**
 * Twitter/Xのツイートとそのメタデータ、エンゲージメント指標を表す
 */
export interface Tweet {
  /** ツイートの完全なURL */
  url: string
  /** ツイートのプレーンテキストコンテンツ */
  tweetText: string | null
  /** ツイートのHTMLコンテンツ */
  tweetHtml: string | null
  /** ツイート要素の完全なHTML */
  elementHtml: string
  /** ツイート作成者のユーザー名 */
  screenName: string
  /** ツイートの一意識別子 */
  tweetId: string
  /** リプライ数（文字列） */
  replyCount: string
  /** リツイート数（文字列） */
  retweetCount: string
  /** いいね数（文字列） */
  likeCount: string
}

/**
 * 異なるTwitter/Xページのページルーティング設定を定義
 */
export interface PageMethod {
  /** マッチするURLパターン（文字列または正規表現） */
  url: string | RegExp
  /** 実行するURLマッチングのタイプ */
  urlType: 'startsWith' | 'regex'
  /** URLがマッチした時に実行する関数 */
  run: () => void | Promise<void>
}

/**
 * ユーザースクリプトのユーザー設定
 */
export interface Config {
  /** 通知用のDiscord Webhook URL */
  discordWebhookUrl: string
  /** ツイートエクスポート用のユーザーコメント */
  comment: string
  /** ホームタイムラインのみを処理するかどうか */
  isOnlyHome: string
}

/**
 * ユーザースクリプトAPIを使用した永続ストレージのデータ構造
 */
export interface StorageData {
  /** 処理済みのツイートIDの配列 */
  checkedTweets: string[]
  /** 処理待ちのツイートIDの配列 */
  waitingTweets: string[]
  /** エクスポート用の完全なツイートオブジェクトの配列 */
  savedTweets: Tweet[]
  /** ログイン通知が送信されたかどうか */
  isLoginNotified: boolean
  /** アカウントロック通知が送信されたかどうか */
  isLockedNotified: boolean
  /** リトライ試行回数 */
  retryCount: number
}

/**
 * ストレージデータにアクセスするためのタイプセーフなキー
 */
export type StorageKey = keyof StorageData
