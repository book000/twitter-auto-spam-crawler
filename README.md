# Twitter Auto Spam Crawler

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-24.1.0-green.svg)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-9.15.4%2B-yellow.svg)](https://pnpm.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)

A TypeScript-based userscript that automatically crawls tweets on Twitter/X to identify potential spam content. Designed to work in conjunction with the Blue Blocker extension.

[日本語版](README-ja.md)

## Features

- **Automatic Tweet Crawling**: Continuously monitors and crawls tweets based on engagement thresholds
- **Spam Detection**: Filters tweets with high retweet counts (100+) and reply counts (10+)
- **Queue Management**: Maintains waiting and checked tweet queues with persistent storage
- **Auto-save**: Automatically downloads collected tweets when reaching 500 items
- **Multi-page Support**: Works on home, explore, search, and individual tweet pages
- **Discord Notifications**: Optional webhook integration for alerts

## Installation

### Prerequisites

- [Tampermonkey](https://www.tampermonkey.net/) or [Greasemonkey](https://www.greasespot.net/) browser extension
- [Blue Blocker](https://github.com/kheina-com/Blue-Blocker) extension (recommended)

### Install the Userscript

1. Install the userscript from the latest release:
   - [Download twitter-auto-spam-crawler.user.js](https://github.com/book000/twitter-auto-spam-crawler/releases/latest/download/twitter-auto-spam-crawler.user.js)

2. The userscript will automatically update when new versions are released

## Usage

1. Navigate to Twitter/X (https://x.com)
2. The script will automatically start crawling tweets
3. Monitor the console for crawling status
4. Collected tweets are automatically saved when reaching 500 items

### Configuration

Access configuration through the Tampermonkey menu:
- Enable/disable auto-crawling
- Adjust crawling intervals
- Configure Discord webhook URL
- Manage saved tweets

## Development

### Requirements

- Node.js 24.1.0
- pnpm 9.15.4+

### Setup

```bash
# Clone the repository
git clone https://github.com/book000/twitter-auto-spam-crawler.git
cd twitter-auto-spam-crawler

# Install dependencies
pnpm install

# Development build with watch mode
pnpm run watch
```

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm install` | Install dependencies |
| `pnpm run build` | Build production userscript |
| `pnpm run build:dev` | Build development userscript with source maps |
| `pnpm run watch` | Watch mode for development |
| `pnpm test` | Run all tests with coverage |
| `pnpm run lint` | Run all linters (prettier, eslint, typescript) |
| `pnpm run fix` | Fix linting errors |
| `pnpm run clean` | Clean dist directory |

### Architecture

The project follows a service-based architecture:

- **CrawlerService**: Orchestrates the main crawling workflow
- **TweetService**: Handles tweet extraction and storage
- **QueueService**: Manages tweet processing queues
- **NotificationService**: Handles Discord webhook integration
- **StateService**: Manages application state

For detailed architecture information, see the [architecture documentation](.claude/architecture.md).

### Testing

Tests are written using Jest with jsdom environment:

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test -- src/services/tweet-service.test.ts

# Run tests in watch mode
pnpm test -- --watch
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow TypeScript strict mode
- Use ESLint and Prettier for code formatting
- Run `pnpm run lint` before committing
- Write tests for new features

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Tomachi** - [@book000](https://github.com/book000)

## Acknowledgments

- Designed to work with [Blue Blocker](https://github.com/kheina-com/Blue-Blocker)
- Built with [Tampermonkey](https://www.tampermonkey.net/) userscript APIs

## Support

For bugs and feature requests, please [create an issue](https://github.com/book000/twitter-auto-spam-crawler/issues/new).