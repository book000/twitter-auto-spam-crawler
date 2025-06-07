import type { PageMethod } from '@/types'
import { URLS, TWEET_URL_REGEX } from '@/core/constants'
import { ConfigManager } from '@/core/config'
import { Storage } from '@/core/storage'
import {
  HomePage,
  ExplorePage,
  SearchPage,
  TweetPage,
  ExamplePages,
  OtherPages,
} from '@/pages'
import packageJson from '../package.json'
;(function () {
  const methods: PageMethod[] = [
    {
      url: URLS.HOME,
      urlType: 'startsWith',
      run: () => HomePage.run(),
    },
    {
      url: URLS.EXPLORE,
      urlType: 'startsWith',
      run: () => ExplorePage.run(),
    },
    {
      url: URLS.SEARCH,
      urlType: 'startsWith',
      run: () => SearchPage.run(),
    },
    {
      url: URLS.TRENDING,
      urlType: 'startsWith',
      run: () => SearchPage.run(),
    },
    {
      url: TWEET_URL_REGEX,
      urlType: 'regex',
      run: () => TweetPage.run(),
    },
    {
      url: URLS.COMPOSE_POST,
      urlType: 'startsWith',
      run: () => {
        OtherPages.runComposePost()
      },
    },
    {
      url: URLS.BOOKMARK,
      urlType: 'startsWith',
      run: async () => {
        await OtherPages.runProcessBlueBlockerQueue()
      },
    },
    {
      url: URLS.LOGIN,
      urlType: 'startsWith',
      run: () => {
        OtherPages.runLogin()
      },
    },
    {
      url: URLS.LOCKED,
      urlType: 'startsWith',
      run: () => {
        OtherPages.runLocked()
      },
    },
    {
      url: URLS.EXAMPLE_DOWNLOAD_JSON,
      urlType: 'startsWith',
      run: async () => {
        await ExamplePages.runDownloadJson()
      },
    },
    {
      url: URLS.EXAMPLE_LOGIN_NOTIFY,
      urlType: 'startsWith',
      run: () => {
        ExamplePages.runLoginNotify()
      },
    },
    {
      url: URLS.EXAMPLE_LOGIN_SUCCESS_NOTIFY,
      urlType: 'startsWith',
      run: () => {
        ExamplePages.runLoginSuccessNotify()
      },
    },
    {
      url: URLS.EXAMPLE_LOCKED_NOTIFY,
      urlType: 'startsWith',
      run: () => {
        ExamplePages.runLockedNotify()
      },
    },
    {
      url: URLS.EXAMPLE_UNLOCKED_NOTIFY,
      urlType: 'startsWith',
      run: () => {
        ExamplePages.runUnlockedNotify()
      },
    },
    {
      url: URLS.EXAMPLE_RESET_WAITING,
      urlType: 'startsWith',
      run: () => {
        ExamplePages.runResetWaiting()
      },
    },
  ]

  function getMethod(): PageMethod | null {
    const method = methods.find((method) => {
      if (
        method.urlType === 'startsWith' &&
        location.href.startsWith(method.url as string)
      ) {
        return true
      } else if (
        method.urlType === 'regex' &&
        (method.url as RegExp).test(location.href)
      ) {
        return true
      }
      return false
    })

    return method ?? null
  }

  async function run(): Promise<void> {
    console.log(`Twitter Auto Spam Crawler v${packageJson.version}`)
    console.log('Waiting:', Storage.getWaitingTweets().length)
    console.log('Checked:', Storage.getCheckedTweets().length)
    console.log('SavedTweets:', Storage.getSavedTweets().length)

    ConfigManager.registerMenuCommand()

    const method = getMethod()
    if (method) {
      await method.run()
    } else {
      console.error('No method found', location.href)
    }

    setInterval(() => {
      const currentMethod = getMethod()
      if (currentMethod === null) {
        return
      }
      if (
        method === null ||
        (currentMethod.url as string) !== (method.url as string)
      ) {
        location.reload()
      }
    }, 1000)
  }

  if (document.readyState === 'complete') {
    console.log('Page already loaded, waiting for a moment before running...')
    setTimeout(() => {
      try {
        run().catch((error: unknown) => {
          console.error('Error in run():', error)
        })
      } catch (error: unknown) {
        console.error('Error starting script:', error)
      }
    }, 1000)
  } else {
    window.addEventListener('load', () => {
      console.log('Page loaded, waiting for network stability...')
      setTimeout(() => {
        try {
          run().catch((error: unknown) => {
            console.error('Error in run():', error)
          })
        } catch (error: unknown) {
          console.error('Error starting script:', error)
        }
      }, 2000)
    })
  }
})()
