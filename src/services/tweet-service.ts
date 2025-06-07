import type { Tweet } from '@/types'
import { TWEET_URL_REGEX, THRESHOLDS } from '@/core/constants'
import { Storage } from '@/core/storage'

export const TweetService = {
  getTweets(): Tweet[] | null {
    const tweetArticleElements = document.querySelectorAll(
      'article[data-testid="tweet"]'
    )

    const numberRegex = /\d+/
    const tweets: Tweet[] = []

    for (const element of tweetArticleElements) {
      const tweetElement = element.querySelector(
        'a[role="link"]:has(time[datetime])'
      )
      if (!tweetElement) {
        console.warn('getTweets: tweetElement not found')
        return null
      }

      const tweetUrl = (tweetElement as HTMLAnchorElement).href
      const tweetUrlMatch = TWEET_URL_REGEX.exec(tweetUrl)
      if (!tweetUrlMatch) continue

      const screenName = tweetUrlMatch[1]
      const tweetId = tweetUrlMatch[2]

      const textElement = element.querySelector(
        'div[lang][dir][data-testid="tweetText"]'
      )
      const tweetHtml = textElement ? textElement.innerHTML : null
      const tweetText = textElement ? textElement.textContent : null
      const elementHtml = (element as HTMLElement).innerHTML

      const replyCountRaw = element

        .querySelector('button[role="button"][data-testid="reply"]')

        ?.getAttribute('aria-label')
      const replyCount = replyCountRaw
        ? (numberRegex.exec(replyCountRaw)?.[0] ?? '0')
        : '0'

      const retweetCountRaw = element

        .querySelector('button[role="button"][data-testid="retweet"]')

        ?.getAttribute('aria-label')
      const retweetCount = retweetCountRaw
        ? (numberRegex.exec(retweetCountRaw)?.[0] ?? '0')
        : '0'

      const likeCountRaw = element

        .querySelector('button[role="button"][data-testid="like"]')

        ?.getAttribute('aria-label')
      const likeCount = likeCountRaw
        ? (numberRegex.exec(likeCountRaw)?.[0] ?? '0')
        : '0'

      const tweet: Tweet = {
        url: tweetUrl,
        tweetText,
        tweetHtml,
        elementHtml,
        screenName,
        tweetId,
        replyCount,
        retweetCount,
        likeCount,
      }
      tweets.push(tweet)
    }

    return tweets
  },

  saveTweets(tweets: Tweet[]): void {
    const savedTweets = Storage.getSavedTweets()
    const savedTweetIds = savedTweets.map((tweet) => tweet.tweetId)

    for (const newTweet of tweets) {
      const index = savedTweetIds.indexOf(newTweet.tweetId)
      if (index === -1) {
        savedTweets.push(newTweet)
      } else {
        savedTweets[index] = newTweet
      }
    }
    Storage.setSavedTweets(savedTweets)
  },

  isNeedDownload(): boolean {
    const tweets = Storage.getSavedTweets()
    return tweets.length > THRESHOLDS.SAVED_TWEETS_LIMIT
  },

  downloadTweets(): boolean {
    const tweets = Storage.getSavedTweets()

    console.log('downloadTweets: download tweets')
    const data = JSON.stringify({
      type: 'tweets',
      data: tweets,
    })
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const timestamp = new Date().toISOString().replaceAll(':', '-')
    a.download = `tweets-${timestamp}.json`
    a.innerHTML = 'download'
    document.body.append(a)
    a.click()

    Storage.setSavedTweets([])

    return true
  },

  getTargetTweets(tweets: Tweet[]): Tweet[] {
    return tweets.filter(
      (tweet) =>
        Number(tweet.retweetCount) >= THRESHOLDS.RETWEET_COUNT &&
        Number(tweet.replyCount) >= THRESHOLDS.REPLY_COUNT
    )
  },
}
