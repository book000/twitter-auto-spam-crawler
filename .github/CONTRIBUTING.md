# 🛠️ Contributing

Thanks for your interest in contributing to twitter-auto-spam-crawler! 🙏
Any contribution to this project is more than welcome 🚀

Please read this document before you start.

## 📩 Reporting Issues

Report bugs and propose features in this repository's Issues. Check that a similar Issue does not exist yet, and file separate Issues for separate problems.

## 🚀 Pull Requests

Pull requests are welcome, even for typos and small changes.

### Development Setup

**Requirements:** the Node.js version in [`.node-version`](../.node-version) and the pnpm version in the `packageManager` field of [`package.json`](../package.json).

1. [Fork](https://docs.github.com/en/get-started/quickstart/fork-a-repo) the repository and [clone](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository) it.
2. Run `pnpm install`.
3. Start the development build: `pnpm run watch`. The bundle is written to `dist/twitter-auto-spam-crawler.user.js`; install it in your userscript manager to try it.

Do not run the script against real X accounts while developing automated tests; the tests use jsdom and mocks only.

### Development Commands

| Command | Description |
|---------|-------------|
| `pnpm run build` | Build the production userscript |
| `pnpm run build:dev` | Build with inline source maps |
| `pnpm run watch` | Rebuild on change |
| `pnpm test` | Run the tests with coverage |
| `pnpm run lint` | Run Prettier, ESLint and the TypeScript type check |
| `pnpm run fix` | Auto-fix Prettier and ESLint issues |
| `pnpm run clean` | Remove the `dist` directory |

### Git Workflow

1. Create a branch from the default branch: `git checkout -b feat/your-feature origin/master --no-track`
2. Change the code and add or update tests.
3. Run `pnpm run lint && pnpm test`.
4. Commit using the conventions below.
5. Push the branch to your fork and open a pull request on GitHub.

### Commit Conventions

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/), written in English. The allowed types are:

- **feat**: a new feature
- **fix**: a bug fix
- **docs**: documentation changes
- **perf**: performance improvements
- **refactor**: refactoring
- **style**: code style changes
- **test**: test changes
- **chore**: everything else

The type decides the version bump of the automated release (`.github/workflows/release.yml`), so pick it carefully.

Example:

```
feat: add Discord webhook integration

- Add NotificationService for Discord alerts
- Support webhook URL configuration
```

### Code Quality Standards

- **TypeScript**: strict mode
- **ESLint**: [@book000/eslint-config](https://www.npmjs.com/package/@book000/eslint-config)
- **Prettier**: code formatting
- **Jest**: tests with coverage (120 second test timeout, fake timers enabled globally)

Make sure `pnpm run lint` and `pnpm test` pass before you commit.

### Userscript specifics

- The script uses userscript-only APIs (`GM_getValue`, `GM_setValue`, ...). Each Tampermonkey `GM_*` API the code calls must be listed in `package.json` under `userscript.grant`; globals from the `@require`d library (`GM_config`) are not granted.
- It relies on X.com specific selectors, which can break when the site changes.
- Webpack builds `src/main.ts` into a single `.user.js` file; the `==UserScript==` header is generated from `package.json`.

For the architecture, build and test details, see the guides below.

## 📚 Additional Resources

- [AGENTS.md](../AGENTS.md): conventions and project structure
- [Architecture Guide](../.claude/architecture.md)
- [Build System](../.claude/build-system.md)
- [Testing Guide](../.claude/testing-guide.md)

## 📑 License

By contributing to this project, you agree that your contributions are licensed under the MIT License.
