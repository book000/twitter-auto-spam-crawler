# 🕷️ twitter-auto-spam-crawler

Twitter/X のツイートを自動でクロールし、潜在的なスパムコンテンツを特定するユーザースクリプト

[日本語](README-ja.md) | English

## ✨ Features

- 🔄 **Automatic crawling** - Continuously monitors tweets on X.com pages
- 🎯 **Smart filtering** - Detects spam based on engagement thresholds (RT 100+, Reply 10+)
- 📊 **Queue management** - Maintains waiting and checked tweet queues with persistent storage
- 💾 **Auto-save** - Downloads collected tweets when reaching 500 items
- 🔔 **Discord integration** - Optional webhook notifications for alerts
- 🧩 **Blue Blocker compatibility** - Designed to work with Blue Blocker extension

## 🚀 Installation

### For Users

1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Download the userscript: [twitter-auto-spam-crawler.user.js](https://github.com/book000/twitter-auto-spam-crawler/releases/latest/download/twitter-auto-spam-crawler.user.js)
3. Click to install when prompted by Tampermonkey

## 📖 Usage

1. Navigate to [x.com](https://x.com)
2. The script automatically starts monitoring tweets
3. Use Tampermonkey menu to configure settings
4. Collected data is automatically saved and can be exported

## 🛠️ For Developers

Interested in contributing? Check out our [Contributing Guide](.github/CONTRIBUTING.md) for development setup, architecture details, and submission guidelines.

Quick start:
```bash
git clone https://github.com/book000/twitter-auto-spam-crawler.git
cd twitter-auto-spam-crawler
pnpm install
pnpm run build:dev
```

## ⚠️ Disclaimer

This is an **unofficial tool** for Twitter/X. Use at your own risk.

- Not affiliated with Twitter/X or Blue Blocker
- May break due to site changes
- Intended for research and educational purposes

## 📑 License

MIT License - see [LICENSE](LICENSE)