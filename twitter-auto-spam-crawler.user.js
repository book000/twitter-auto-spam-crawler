// ==UserScript==
// @name         Twitter Auto Spam Crawler
// @namespace    https://tomacheese.com
// @version      1.25.0
// @description  Twitterのツイートを自動でクロールするスクリプト。Blue Blockerと組み合わせて使うことを想定。
// @author       Tomachi
// @match        https://x.com/*
// @match        https://example.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=x.com
// @updateURL    https://gist.github.com/book000/0d99dca4ea44b4d0af515a6e568db223/raw/twitter-auto-spam-crawler.user.js
// @downloadURL  https://gist.github.com/book000/0d99dca4ea44b4d0af515a6e568db223/raw/twitter-auto-spam-crawler.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @require      https://update.greasyfork.org/scripts/470224/1303666/Tampermonkey%20Config.js
// ==/UserScript==

(async function () {
  ("use strict");

  const searchUrl = "https://x.com/search";
  const exploreUrl = "https://x.com/explore";
  const trendingUrl = "https://x.com/i/trending/";
  const homeUrl = "https://x.com/home";
  const tweetUrlRegex = /https:\/\/(?:x|twitter).com\/([^/]+)\/status\/(\d+)/;
  const composePostUrl = "https://x.com/compose/post";
  const bookmarkUrl = "https://x.com/i/bookmarks";
  const loginUrl = "https://x.com/i/flow/login";
  const lockedUrl = "https://x.com/account/access";
  const exampleUrlForDownloadJson = "https://example.com/?download-json";
  const exampleUrlForLoginNotify = "https://example.com/?login-notify";
  const exampleUrlForLockedNotify = "https://example.com/?locked-notify";
  const exampleUrlForResetWaiting = "https://example.com/?reset-waiting";
  const discordMentionId = "221991565567066112";

  const methods = [
    {
      url: homeUrl,
      urlType: "startsWith",
      run: runHome,
    },
    {
      url: exploreUrl,
      urlType: "startsWith",
      run: runExplore,
    },
    {
      url: searchUrl,
      urlType: "startsWith",
      run: runSearch,
    },
    {
      url: trendingUrl,
      urlType: "startsWith",
      run: runSearch,
    },
    {
      url: tweetUrlRegex,
      urlType: "regex",
      run: runTweet,
    },
    {
      url: composePostUrl,
      urlType: "startsWith",
      run: runComposePost,
    },
    {
      url: bookmarkUrl,
      urlType: "startsWith",
      run: runProcessBlueBlockerQueue,
    },
    {
      url: loginUrl,
      urlType: "startsWith",
      run: runLogin,
    },
    {
      url: lockedUrl,
      urlType: "startsWith",
      run: runLocked,
    },
    {
      url: exampleUrlForDownloadJson,
      urlType: "startsWith",
      run: runDownloadJson,
    },
    {
      url: exampleUrlForLoginNotify,
      urlType: "startsWith",
      run: runLoginNotify,
    },
    {
      url: exampleUrlForLockedNotify,
      urlType: "startsWith",
      run: runLockedNotify,
    },
    {
      url: exampleUrlForResetWaiting,
      urlType: "startsWith",
      run: runResetWaiting,
    },
  ];

  let crawledTweetCount = 0;
  let crawlTweetInterval = null;
  let scrollPageInterval = null;

  // ----- 共通関数 -----
  /**
   * 設定画面の登録
   */
  function registerMenuCommand() {
    GM_config(
      {
        discordWebhookUrl: {
          name: "Discord Webhook URL",
          value: "",
          input: "prompt",
        },
        comment: {
          name: "Comment",
          value: "",
          input: "prompt",
        },
        isOnlyHome: {
          name: "Only Home crawling",
          value: "false",
          input: "prompt",
        },
      },
      false
    );
    addEventListener(GM_config_event, (event) => {
      console.log(event.detail);
    });
  }

  /**
   * ツイートを取得する
   *
   * @returns {Array} ツイートの配列
   */
  function getTweets() {
    const tweetArticleElements = document.querySelectorAll(
      'article[data-testid="tweet"]'
    );

    const numberRegex = /\d+/;
    const tweets = [];
    for (const element of tweetArticleElements) {
      const tweetElement = element.querySelector(
        'a[role="link"]:has(time[datetime])'
      );
      if (!tweetElement) {
        console.warn("getTweets: tweetElement not found");
        return null;
      }
      const tweetUrl = tweetElement.href;
      const tweetUrlMatch = tweetUrlRegex.exec(tweetUrl);
      const screenName = tweetUrlMatch[1];
      const tweetId = tweetUrlMatch[2];

      const textElement = element.querySelector(
        'div[lang][dir][data-testid="tweetText"]'
      );
      const tweetHtml = textElement ? textElement.innerHTML : null;
      const tweetText = textElement ? textElement.textContent : null;
      const elementHtml = element.innerHTML;

      const replyCountRaw = element
        .querySelector('button[role="button"][data-testid="reply"]')
        .getAttribute("aria-label");
      const replyCount = numberRegex.exec(replyCountRaw)[0];

      const retweetCountRaw = element
        .querySelector('button[role="button"][data-testid="retweet"]')
        .getAttribute("aria-label");
      const retweetCount = numberRegex.exec(retweetCountRaw)[0];

      const likeCountRaw = element
        .querySelector('button[role="button"][data-testid="like"]')
        .getAttribute("aria-label");
      const likeCount = numberRegex.exec(likeCountRaw)[0];

      const tweet = {
        url: tweetUrl,
        tweetText,
        tweetHtml,
        elementHtml,
        screenName,
        tweetId,
        replyCount,
        retweetCount,
        likeCount,
      };
      tweets.push(tweet);
    }

    return tweets;
  }

  /**
   * ツイートがチェック済みかどうかを返す
   *
   * @param tweetId ツイートID
   * @returns {boolean} チェック済みの場合はtrue
   */
  function isCheckedTweet(tweetId) {
    const checkedTweets = GM_getValue("checkedTweets", []);
    return checkedTweets.includes(tweetId);
  }

  /**
   * ツイートが待ち行列にあるかどうかを返す
   *
   * @param tweetId ツイートID
   * @returns {boolean} 待ち行列にある場合はtrue
   */
  function isWaitingTweet(tweetId) {
    const waitingTweets = GM_getValue("waitingTweets", []);
    return waitingTweets.includes(tweetId);
  }

  /**
   * ツイートを待ち行列に追加する
   *
   * @param tweetIds ツイートIDの配列
   */
  async function addWaitingTweets(tweetIds) {
    const waitingTweets = GM_getValue("waitingTweets", []);
    waitingTweets.push(...tweetIds);
    GM_setValue("waitingTweets", waitingTweets);

    // 1秒待つ
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  /**
   * 待ち行列の次のツイートを取得する
   *
   * @returns {string} ツイートID
   */
  function getNextWaitingTweet() {
    const waitingTweets = GM_getValue("waitingTweets", []);
    if (waitingTweets.length === 0) {
      return null;
    }

    return waitingTweets[0];
  }

  /**
   * ツイートをチェック済みにする
   *
   * @param tweetId ツイートID
   */
  async function checkedTweet(tweetId) {
    console.log(`checkedTweet: ${tweetId}`);
    const checkedTweets = GM_getValue("checkedTweets", []);
    checkedTweets.push(tweetId);
    GM_setValue("checkedTweets", checkedTweets);

    const waitingTweets = GM_getValue("waitingTweets", []);
    const index = waitingTweets.indexOf(tweetId);
    if (index !== -1) {
      waitingTweets.splice(index, 1);
      GM_setValue("waitingTweets", waitingTweets);
    }

    // 1秒待つ
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  /**
   * ツイート情報を保存する。すでに同じツイートIDが存在する場合は上書きし、存在しない場合は追加する。
   */
  async function saveTweets(tweets) {
    const savedTweets = GM_getValue("savedTweets", []);
    const savedTweetIds = savedTweets.map((tweet) => tweet.tweetId);
    for (const newTweet of tweets) {
      const index = savedTweetIds.indexOf(newTweet.tweetId);
      if (index !== -1) {
        savedTweets[index] = newTweet;
      } else {
        savedTweets.push(newTweet);
      }
    }
    GM_setValue("savedTweets", savedTweets);
  }

  /**
   * ツイート情報をダウンロードすることが必要かどうかを返す
   *
   * @returns ツイート情報をダウンロードすることが必要か
   */
  function isNeedDownload() {
    const limit = 500;
    const tweets = GM_getValue("savedTweets", []);
    return tweets.length >= limit;
  }

  /**
   * ツイート情報をダウンロードしてクリアする。
   */
  function downloadTweets() {
    const tweets = GM_getValue("savedTweets", []);

    console.log("downloadTweets: download tweets");
    const data = JSON.stringify({
      type: "tweets",
      data: tweets,
    });
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      "tweets-" + new Date().toISOString().replace(/:/g, "-") + ".json";
    a.innerHTML = "download";
    document.body.appendChild(a);
    a.click();

    GM_setValue("savedTweets", []);

    return true;
  }

  /**
   * ツイートをクロールする
   *
   * 100件以上のリツイートがあり、かつリプライ数が10件以上のツイートを探す。
   * そのうち、未チェックまたは待ち行列にないツイートを抽出し、待ち行列に追加する。
   */
  async function crawlTweets() {
    const tweets = getTweets();
    if (!tweets) {
      return;
    }
    crawledTweetCount += tweets.length;
    if (tweets.length === 0) {
      console.warn("crawlTweets: tweets not found");
      return;
    }

    // ツイートを保存する
    await saveTweets(tweets);

    // 100件以上のリツイートがあり、かつリプライ数が10件以上のツイートを探す
    const targetTweets = tweets.filter(
      (tweet) => tweet.retweetCount >= 100 && tweet.replyCount >= 10
    );

    // 未チェック、または待ち行列にないツイートを抽出
    const uncheckedTweets = targetTweets.filter(
      (tweet) =>
        !isCheckedTweet(tweet.tweetId) && !isWaitingTweet(tweet.tweetId)
    );

    // 未チェックのツイートを待ち行列に追加
    const tweetIds = uncheckedTweets.map((tweet) => tweet.tweetId);
    await addWaitingTweets(tweetIds);

    if (tweetIds.length === 0) {
      return;
    }

    const waitingTweets = GM_getValue("waitingTweets", []);
    console.log(
      `crawlTweets: ${tweetIds.length} tweets added to waitingTweets. totalWaitingTweets=${waitingTweets.length}`
    );
  }

  /**
   * 「返信をさらに表示」ボタンがある場合はクリックする
   */
  function clickMoreReplies() {
    const moreRepliesButton = document.querySelector(
      'div[data-testid="primaryColumn"] div[data-testid="cellInnerDiv"] > div > div > button[role="button"]'
    );
    if (moreRepliesButton) {
      console.log("clickMoreReplies: clicked moreRepliesButton");
      moreRepliesButton.click();
    }
  }

  /**
   * "さらに返信を表示する（攻撃的な内容を含む可能性のある返信も表示する）" ボタンがある場合はクリックする
   */
  function clickMoreRepliesAggressive() {
    const texts = ["さらに返信を表示する"];
    const tweetArticleElements = document.querySelectorAll(
      'div[data-testid="primaryColumn"] div[data-testid="cellInnerDiv"] > div > div > article[tabindex="-1"]'
    );

    for (const tweetArticleElement of tweetArticleElements) {
      const text = tweetArticleElement.textContent;
      if (!texts.some((t) => text.includes(t))) {
        continue;
      }
      const moreRepliesAggressiveButton = tweetArticleElement.querySelector(
        'button[role="button"]'
      );
      if (moreRepliesAggressiveButton) {
        console.log(
          "clickMoreRepliesAggressive: clicked moreRepliesAggressiveButton"
        );
        moreRepliesAggressiveButton.click();
      }
    }
  }

  /**
   * ページをスクロールする。スクロールができなくなったら終了する。
   *
   * @returns {Promise} スクロールが終了したらresolveするPromise
   */
  function scrollPage() {
    // スクロールを行い、10回スクロールしても下にスクロールされなくなったら終了
    // スクロールができた場合はリセット
    if (scrollPageInterval) {
      return;
    }

    let previousHeight = 0;
    let failScrollCount = 0;
    return new Promise((resolve) => {
      scrollPageInterval = setInterval(() => {
        // スクロール
        window.scrollBy({
          top: window.innerHeight,
          behavior: "smooth",
        });

        // スクロールして、「さらに返信を表示する」関連のボタンがある場合はクリック
        clickMoreReplies();
        clickMoreRepliesAggressive();

        // スクロール後の高さを取得
        const newHeight = document.body.scrollHeight;

        // スクロールができなくなったらカウント
        if (newHeight === previousHeight) {
          failScrollCount++;
          console.warn("scrollPage: failed scroll");
        } else {
          failScrollCount = 0;
          console.log("scrollPage: success");
        }
        previousHeight = newHeight;

        // 10回スクロールしてもスクロールできなかったら終了
        if (failScrollCount >= 10) {
          clearInterval(scrollPageInterval);
          scrollPageInterval = null;
          resolve();
        }
      }, 2000);
    });
  }

  /**
   * 要素が表示されるまで待つ
   *
   * @param selector セレクタ
   * @param limit 最大待ち時間 (秒)
   * @returns {Promise} 要素が表示されたらresolveするPromise
   */
  async function waitElement(selector, limitSec = 30) {
    // 30秒待っても要素が表示されなかったら終了
    const limit = limitSec * 2;
    let count = 0;
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        const element = document.querySelector(selector);
        if (element) {
          clearInterval(interval);
          resolve();
        } else {
          count++;
          if (count >= limit) {
            clearInterval(interval);
            reject();
          }
        }
      }, 500);
    });
  }

  /**
   * 読み込み失敗ページかどうかを返す
   *
   * @returns {boolean} 読み込み失敗ページの場合はtrue
   */
  function isFailedPage() {
    return (
      document.querySelector(
        'div.css-175oi2r path[d="M12 4c-4.418 0-8 3.58-8 8s3.582 8 8 8c3.806 0 6.993-2.66 7.802-6.22l1.95.44C20.742 18.67 16.76 22 12 22 6.477 22 2 17.52 2 12S6.477 2 12 2c3.272 0 6.176 1.57 8 4V3.5h2v6h-6v-2h2.616C17.175 5.39 14.749 4 12 4z"]'
      ) !== null
    );
  }

  /**
   * エラーダイアログが表示された場合に処理する
   */
  function handleErrorDialog(callback) {
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        const dialog = document.querySelector('div#layers div[role="alert"]');
        if (dialog) {
          clearInterval(interval);
          if (callback instanceof Function) {
            callback(dialog);
          } else {
            callback(dialog).then(() => {
              resolve();
            });
          }
          resolve();
        }
      }, 500);
    });
  }

  /**
   * 違反ツイートや削除ツイートによって処理できないポストを検出する
   */
  function detectCantProcessingPost(callback) {
    const keywords = [
      "このポストはXルールに違反しています。",
      "このポストは、ポストの作成者により削除されました。",
    ];
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        const tweetArticleElement = document.querySelector(
          'div[data-testid="primaryColumn"] div[data-testid="cellInnerDiv"] > div > div > article[tabindex="-1"]'
        );
        if (!tweetArticleElement) {
          return;
        }

        const text = tweetArticleElement.textContent;
        if (keywords.some((keyword) => text.includes(keyword))) {
          clearInterval(interval);
          if (callback instanceof Function) {
            callback(tweetArticleElement);
          } else {
            callback(tweetArticleElement).then(() => {
              resolve();
            });
          }
          resolve();
        }
      }, 500);
    });
  }

  /**
   * Discordに通知する
   */
  function notifyDiscord(message, callback, withReply = false) {
    const mention = withReply ? "<@" + discordMentionId + ">" : "";
    const comment = GM_getValue("comment", "");
    const data = JSON.stringify({
      content: `${mention} ${message}\n${comment}`,
    });
    const webhookUrl = GM_getValue("discordWebhookUrl");
    if (!webhookUrl) {
      console.warn("notifyDiscord: Discord Webhook URL is not set.");
      return;
    }
    fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data,
    }).then((response) => {
      if (response.ok) {
        console.log("notifyDiscord: success");
      } else {
        console.error("notifyDiscord: failed", response);
      }
      if (callback) {
        callback(response);
      }
    });
  }

  /**
   * 状態をリセットする
   */
  function resetState() {
    if (GM_getValue("isLoginNotified", false)) {
      console.log("resetState: reset isLoginNotified");
      GM_setValue("isLoginNotified", false);
      notifyDiscord(
        ":white_check_mark: Login is successful!",
        (response) => {
          console.log("resetState: Login notification sent.");
        },
        false
      );
    }
    if (GM_getValue("isLockedNotified", false)) {
      console.log("resetState: reset isLockedNotified");
      GM_setValue("isLockedNotified", false);
      notifyDiscord(
        ":white_check_mark: Account is unlocked!",
        (response) => {
          console.log("resetState: Account is unlocked notification sent.");
        },
        true
      );
    }
  }

  // ----- ページごとの処理 -----

  // home -> explore -> search -> tweet -> bookmark (-> example) -> home

  /**
   * homeページ
   */
  async function runHome() {
    resetState();

    // ツイートを自動クロール
    if (crawlTweetInterval === null) {
      crawlTweetInterval = setInterval(() => {
        crawlTweets().catch((e) => {
          console.error("runHome: crawlTweets failed", e);
        });
      }, 1000);
    }

    // タブを切り替える
    try {
      await waitElement(
        'div[data-testid="primaryColumn"] nav[aria-live="polite"][role="navigation"] div[role="tablist"] > div[role="presentation"] a[role="tab"]'
      );
    } catch (e) {
      if (isFailedPage()) {
        console.error("runHome: failed page.");
      }
      console.log("Wait 1 minute and reload.");
      await new Promise((resolve) => setTimeout(resolve, 60000));
      location.reload();
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const tabs = document.querySelectorAll(
      'div[data-testid="primaryColumn"] nav[aria-live="polite"][role="navigation"] div[role="tablist"] > div[role="presentation"] a[role="tab"]'
    );
    console.log(`runHome: tabs=${tabs.length}`);
    for (let tabIndex = 0; tabIndex < tabs.length; tabIndex++) {
      const tab = tabs[tabIndex];
      console.log(`runHome: open tab=${tabIndex}`);
      tab.click();

      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        await waitElement('article[data-testid="tweet"]');
      } catch (e) {
        if (isFailedPage()) {
          console.error("runHome: failed page. Wait 1 minute and reload.");
          await new Promise((resolve) => setTimeout(resolve, 60000));
          location.reload();
          return;
        }

        console.log("Next tab");
        continue;
      }

      // タブを切り替えたら10回だけスクロール
      for (let scrollCount = 0; scrollCount < 10; scrollCount++) {
        window.scrollBy({
          top: window.innerHeight,
          behavior: "smooth",
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // すべてのタブを切り替えたらexploreページに遷移
    // isOnlyHomeがtrueの場合は、homeページに遷移
    const isOnlyHome = GM_getValue("isOnlyHome", "false") === "true";
    if (isOnlyHome) {
      console.log("runHome: isOnlyHome is true. Go to home page.");
      location.href = homeUrl;
      return;
    }

    console.log("runHome: all tabs are opened. Go to explore page.");
    location.href = exploreUrl;
  }

  /**
   * ダウンロード用のexampleページ
   */
  async function runDownloadJson() {
    const ifNeeded = isNeedDownload();

    if (ifNeeded) {
      // ダウンロードが必要な場合は5秒待つ
      console.log("runDownloadJson: download needed. Wait 5 seconds.");
      downloadTweets();
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    // tweetページに遷移
    runTweet(true);
  }

  /**
   * exploreページ
   */
  async function runExplore() {
    resetState();

    // ランダムなトレンドを選ぶ
    try {
      await waitElement('div[data-testid="trend"]');
    } catch (e) {
      if (isFailedPage()) {
        console.error("runExplore: failed page. Wait 1 minute and reload.");
      }
      console.log("Wait 1 minute and reload.");
      await new Promise((resolve) => setTimeout(resolve, 60000));
      location.reload();
      return;
    }
    const trends = document.querySelectorAll('div[data-testid="trend"]');
    const trend = trends[Math.floor(Math.random() * trends.length)];
    trend.click();
  }

  /**
   * searchページ
   */
  async function runSearch() {
    resetState();

    // f=live がクエリに含まれていなかったら、クエリに f=live を追加してリロード
    if (!location.search.includes("f=live")) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      location.search = location.search + "&f=live";
      return;
    }

    // ツイートを自動クロール
    if (crawlTweetInterval === null) {
      crawlTweetInterval = setInterval(() => {
        crawlTweets().catch((e) => {
          console.error("runSearch: crawlTweets failed", e);
        });
      }, 1000);
    }

    try {
      await waitElement('article[data-testid="tweet"]');
    } catch (e) {
      if (isFailedPage()) {
        console.error("runSearch: failed page. Wait 1 minute and reload.");
      }
      console.log("Wait 1 minute and reload.");
      await new Promise((resolve) => setTimeout(resolve, 60000));
      location.reload();
      return;
    }

    // 50回だけスクロール
    for (let scrollCount = 0; scrollCount < 10; scrollCount++) {
      window.scrollBy({
        top: window.innerHeight,
        behavior: "smooth",
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    runTweet(true);
  }

  /**
   * tweetページ
   *
   * @param onlyOpen 待ち行列のツイートを開くだけの場合はtrue
   */
  async function runTweet(onlyOpen = false) {
    resetState();

    if (onlyOpen) {
      // ダウンロードが必要ならリダイレクト
      if (isNeedDownload()) {
        location.href = exampleUrlForDownloadJson;
        return;
      }

      const nextTweetId = getNextWaitingTweet();
      if (nextTweetId === null) {
        // 待ち行列がない場合はbookmarkページに遷移
        location.href = bookmarkUrl;
        return;
      }

      const tweetUrl = `https://x.com/user/status/${nextTweetId}`;
      location.href = tweetUrl;
      return;
    }

    // ツイートを自動クロール
    if (crawlTweetInterval === null) {
      crawlTweetInterval = setInterval(() => {
        crawlTweets().catch((e) => {
          console.error("runTweet: crawlTweets failed", e);
        });
      }, 1000);
    }

    handleErrorDialog(async (dialog) => {
      const dialogMessage = dialog.textContent;
      console.error("runTweet: found error dialog", dialogMessage);

      if (dialogMessage.includes("削除") || dialogMessage.includes("deleted")) {
        console.error("runTweet: tweet deleted. Skip this tweet.");

        // このツイートをチェック済みにする
        const tweetUrlMatch = tweetUrlRegex.exec(location.href);
        const tweetId = tweetUrlMatch[2];
        await checkedTweet(tweetId);
        crawledTweetCount = 0;

        // ページをスクロールし終わったら次のツイートのページに遷移
        runTweet(true);
        return;
      }
    });

    detectCantProcessingPost(async (tweetArticleElement) => {
      console.error(
        "runTweet: found can't processing post",
        tweetArticleElement
      );

      // このツイートをチェック済みにする
      const tweetUrlMatch = tweetUrlRegex.exec(location.href);
      const tweetId = tweetUrlMatch[2];
      await checkedTweet(tweetId);
      crawledTweetCount = 0;

      // ページをスクロールし終わったら次のツイートのページに遷移
      runTweet(true);
    });

    const retryCount = GM_getValue("retryCount", 0);
    try {
      await waitElement('article[data-testid="tweet"]');
    } catch (e) {
      // 3回連続で失敗した場合は次に進む
      if (retryCount >= 3) {
        console.error(
          "runTweet: failed to load tweet after 3 retries. Resetting retry count and moving to next tweet."
        );
        GM_setValue("retryCount", 0);
        // このツイートをチェック済みにする
        const tweetUrlMatch = tweetUrlRegex.exec(location.href);
        const tweetId = tweetUrlMatch[2];
        await checkedTweet(tweetId);
        // 次のツイートのページに遷移
        runTweet(true);
        return;
      }

      if (isFailedPage()) {
        console.error("runTweet: failed page.");
      }
      console.log(`Wait 1 minute and reload. (Retry count: ${retryCount + 1})`);
      // エラーが発生した場合は、リトライカウントを増やして、1分待ってからリロード
      GM_setValue("retryCount", retryCount + 1);
      await new Promise((resolve) => setTimeout(resolve, 60000));
      location.reload();
      return;
    }

    // ツイートが表示されたら、retryCountをリセット
    GM_setValue("retryCount", 0);

    // ページを無限スクロール
    await scrollPage();

    // 一つもツイートがない場合はbookmarkページに遷移
    if (crawledTweetCount === 0) {
      location.href = bookmarkUrl;
      return;
    }

    // このツイートをチェック済みにする
    const tweetUrlMatch = tweetUrlRegex.exec(location.href);
    const tweetId = tweetUrlMatch[2];
    await checkedTweet(tweetId);
    crawledTweetCount = 0;

    // ページをスクロールし終わったら次のツイートのページに遷移
    runTweet(true);
  }

  /**
   * ツイート画面
   */
  function runComposePost() {
    // xボタンをクリック
    const closeButton = document.querySelector(
      'button[data-testid="app-bar-close"][role="button"]'
    );
    if (closeButton) {
      closeButton.click();
    }
    history.back();
  }

  /**
   * BlueBlockerの待ち行列を処理する
   */
  async function runProcessBlueBlockerQueue() {
    console.log("runProcessBlueBlockerQueue: start");
    // まず30秒待つ。その後、#injected-blue-block-toasts > div.toast が出現している限りは、待つ
    // すべてのトーストが消えたら、homeページに遷移

    console.log(
      "runProcessBlueBlockerQueue: waiting for 60 seconds to process queue."
    );
    await new Promise((resolve) => setTimeout(resolve, 60000));

    console.log(
      "runProcessBlueBlockerQueue: checking for #injected-blue-block-toasts > div.toast"
    );
    const interval = setInterval(() => {
      const toastElements = document.querySelectorAll(
        "#injected-blue-block-toasts > div.toast"
      );
      if (toastElements.length === 0) {
        console.log("runProcessBlueBlockerQueue: all toasts are gone.");
        clearInterval(interval);
        location.href = homeUrl;
      } else {
        console.log(
          "runProcessBlueBlockerQueue: still waiting for toasts",
          toastElements.length
        );
      }
    }, 1000);
  }

  /**
   * ログイン画面
   */
  function runLogin() {
    const isLoginNotified = GM_getValue("isLoginNotified", false);
    if (isLoginNotified) {
      return;
    }
    // ログイン画面になったらDiscordに通知
    // 別タブでrunLoginNotifyを開く
    window.open(exampleUrlForLoginNotify, "_blank");
  }

  /**
   * アカウントロック画面
   */
  function runLocked() {
    // 3分後に bookmarkページに遷移
    setTimeout(() => {
      location.href = bookmarkUrl;
    }, 3 * 60 * 1000); // 3分後

    const isLockedNotified = GM_getValue("isLockedNotified", false);
    if (isLockedNotified) {
      return;
    }
    // アカウントロック画面になったらDiscordに通知
    // 別タブでrunLockedNotifyを開く
    window.open(exampleUrlForLockedNotify, "_blank");
  }

  /**
   * ログイン通知画面
   */
  function runLoginNotify() {
    notifyDiscord("Need to login.", (response) => {
      window.close();
      GM_setValue("isLoginNotified", true);
    }, false);
  }

  /**
   * アカウントロック通知画面
   */
  function runLockedNotify() {
    notifyDiscord(":warning: Account is locked!", (response) => {
      window.close();
      GM_setValue("isLockedNotified", true);
    }, true);
  }

  /**
   * 待ち行列をリセットする
   */
  function runResetWaiting() {
    GM_setValue("waitingTweets", []);
    alert(
      "Successfully reset waitingTweets. Navigate to the home page in 3 seconds."
    );

    setTimeout(() => {
      location.href = homeUrl;
    }, 3000);
  }

  /**
   * 開いているページに対応するメソッドを取得する
   *
   * @returns {Object} メソッド
   */
  function getMethod() {
    const method = methods.find((method) => {
      if (
        method.urlType === "startsWith" &&
        location.href.startsWith(method.url)
      ) {
        return true;
      } else if (method.urlType === "regex" && method.url.test(location.href)) {
        return true;
      }
    });
    if (!method) {
      // console.error("No method found", location.href);
      return null;
    }

    return method;
  }

  /**
   * メイン処理
   */
  async function run() {
    console.log("Waiting:", GM_getValue("waitingTweets", []).length);
    console.log("Checked:", GM_getValue("checkedTweets", []).length);
    console.log("SavedTweets:", GM_getValue("savedTweets", []).length);

    // 設定画面の登録
    registerMenuCommand();

    const method = getMethod();
    if (method) {
      await method.run();
    } else {
      console.error("No method found", location.href);
    }

    // メソッドが変更された場合はページをリロード
    setInterval(() => {
      const currentMethod = getMethod();
      if (currentMethod === null) {
        return;
      }
      if (method === null || currentMethod.url !== method.url) {
        location.reload();
      }
    }, 1000);
  }

  // 通信が安定したあとに処理を開始する
  if (document.readyState === 'complete') {
    // 既にページが読み込み完了している場合は少し待ってから実行
    console.log("Page already loaded, waiting for a moment before running...");
    setTimeout(() => {
      try {
        run().catch(err => console.error("Error in run():", err));
      } catch (err) {
        console.error("Error starting script:", err);
      }
    }, 1000);
  } else {
    // ページの読み込みが完了するのを待つ
    window.addEventListener('load', () => {
      // ページ読み込み完了後、さらに少し待ってから実行（動的コンテンツのロード完了を待つ）
      console.log("Page loaded, waiting for network stability...");
      setTimeout(() => {
        try {
          run().catch(err => console.error("Error in run():", err));
        } catch (err) {
          console.error("Error starting script:", err);
        }
      }, 2000);
    });
  }
})();
