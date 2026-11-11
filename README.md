# 🕷️ twitter-auto-spam-crawler

A TypeScript userscript that automatically crawls tweets on Twitter/X to find potential spam. It is meant to be used together with the [Blue Blocker](https://github.com/kheina-com/Blue-Blocker) extension.

[日本語](README-ja.md) | English

## ✨ Features

- 🔄 **Automatic crawling** - Keeps browsing the home timeline, trends and search results on x.com and collects the tweets it sees
- 🎯 **Engagement filtering** - Queues tweets with at least 100 retweets and at least 10 replies for a closer look
- 📊 **Queue management** - Keeps a waiting queue and a checked list of tweet IDs, stored with the userscript storage API
- 💾 **Auto-save** - Downloads the collected tweets as a JSON file once more than 500 are stored
- 🔔 **Discord notifications** - Optional webhook notifications for login required, account locked/unlocked and script updates
- 🧩 **Blue Blocker compatibility** - Designed to run alongside Blue Blocker, which does the actual blocking (this script never blocks accounts itself)

## 🚀 Installation

### For users

1. Install a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/)
2. Open the userscript: [twitter-auto-spam-crawler.user.js](https://github.com/book000/twitter-auto-spam-crawler/releases/latest/download/twitter-auto-spam-crawler.user.js)
3. Click install when the userscript manager prompts you

The script runs on `https://x.com/*`. It also runs on `https://example.com/*`, which it uses for helper pages: it opens notification windows there and navigates to the JSON download page. A queue-reset page is also available, but only if you open it yourself. Only a command in the query string is sent to example.com (the update notification also carries the old and new version numbers).

## 📖 Usage

1. Log in to [x.com](https://x.com) and open the home page
2. The script starts crawling on its own and moves between the home timeline, explore, search and the queued tweets
3. Open the userscript manager menu to change the settings
4. Collected tweets are downloaded automatically as `tweets-<timestamp>.json` once more than 500 are stored

### Settings

Settings are edited from the userscript manager menu (Tampermonkey Config). Every value is entered in a prompt.

| Setting | Meaning |
|---|---|
| `Discord Webhook URL (default)` | Webhook used for update notifications and as the fallback for the two below |
| `Auth Discord Webhook URL (for login notifications)` | Webhook for login required / login succeeded notifications |
| `Lock Discord Webhook URL (for lock/unlock notifications)` | Webhook for account locked / unlocked notifications |
| `Comment` | Text appended to every Discord message |
| `Only Home crawling` | `true` keeps the crawl on the home timeline instead of moving on to explore and search |

If no webhook URL is set, notifications are skipped.

## 🛠️ For developers

Interested in contributing? Check out the [Contributing Guide](.github/CONTRIBUTING.md) for the development setup, architecture overview and submission guidelines. Guidance for AI coding agents is in [AGENTS.md](AGENTS.md).

Quick start:

```bash
git clone https://github.com/book000/twitter-auto-spam-crawler.git
cd twitter-auto-spam-crawler
pnpm install
pnpm run build:dev
```

The bundle is written to `dist/twitter-auto-spam-crawler.user.js`.

## ⚠️ Disclaimer

This is an **unofficial tool** for Twitter/X. Use at your own risk.

- Not affiliated with Twitter/X or Blue Blocker
- May break due to site changes
- Intended for research and educational purposes

## 📑 License

MIT License - see [LICENSE](LICENSE)
