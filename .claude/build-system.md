# Build system

## Webpack

`webpack.config.js` (ESM) builds `src/main.ts` into `dist/twitter-auto-spam-crawler.user.js` (the file name is `<package name>.user.js`).

- TypeScript is compiled by `ts-loader`; the `@` alias resolves to `src/`.
- `optimization.minimize` is `false` on purpose, so the userscript stays readable and reviewable.
- Source maps (`inline-source-map`) are emitted only with `--mode=development`.
- `pnpm run build` = `webpack --mode=production`, `pnpm run build:dev` = `webpack --mode=development`, `pnpm run watch` = development mode with `--watch`.

## UserScript header

A small inline plugin in `webpack.config.js` prepends a `// ==UserScript==` block to every emitted `.js` asset. The block is built from `package.json`:

| Header field | Source |
|---|---|
| `@name` | the package name, split on `-` and capitalized (`Twitter Auto Spam Crawler`) |
| `@version`, `@description`, `@author` | `version`, `description`, `author` |
| `@homepage` | `repository.url` without the `.git` suffix |
| `@namespace`, `@match`, `@icon`, `@updateURL`, `@downloadURL`, `@grant`, `@require` | the `userscript` object |

Array values (`@match`, `@grant`) produce one header line per entry. To change the header, edit `package.json`; `@description` is the `description` field, so keep it in English.

`@match` contains `https://x.com/*` and `https://example.com/*` (the latter for the helper pages, see `architecture.md`). `@grant` lists `GM_getValue`, `GM_setValue`, `GM_registerMenuCommand` and `GM_unregisterMenuCommand`, and `@require` loads the Tampermonkey Config library that provides `GM_config`. A new Tampermonkey `GM_*` API called from app code needs an entry in `userscript.grant` and a declaration in `src/types/userscript.d.ts`.

## TypeScript

`tsconfig.json` highlights: target `es2020`, module `ES2015`, `moduleResolution: bundler`, `strict` plus `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns` and `noFallthroughCasesInSwitch`, `rootDir: ./src`, `types: ["node", "jest"]`, and `paths` mapping `@/*` to `./src/*`. Only `src/**/*` is included. `pnpm run lint:tsc` runs `tsc --noEmit`.

## Lint and format

- `pnpm run lint` runs `lint:prettier` (`prettier --check src`), `lint:eslint` (`eslint . -c eslint.config.mjs`) and `lint:tsc` in parallel through `run-z`. `pnpm run fix` applies the Prettier and ESLint fixes.
- `eslint.config.mjs` extends `@book000/eslint-config` and relaxes some rules for `src/__tests__/**` (for example non-null assertions, floating promises, empty functions; `camelcase` allows `GM_*`) and for `src/__mocks__/**` (`any` and top-level side effects).
- Prettier settings are in `.prettierrc.yml`.

## Release

`.github/workflows/release.yml` runs on every push to the default branch. It computes the next version from the commit types with `mathieudutour/github-tag-action`, writes it into `package.json` with `pnpm version`, runs `pnpm run build` and attaches `dist/twitter-auto-spam-crawler.user.js` to the GitHub release. The version in `package.json` on the default branch is therefore not the released version; it is kept at the placeholder `0.0.0`.
