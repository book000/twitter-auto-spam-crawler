import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read package.json for metadata
const packageJson = JSON.parse(
  readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')
)

// Extract metadata from package.json
const { name, version, description, author, repository, userscript: userscriptConfig } = packageJson
const homepage = repository?.url?.replace(/\.git$/, '') || 'https://github.com/book000/twitter-auto-spam-crawler'

// Convert package name to user-friendly script name
const scriptName = name
  .split('-')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ')

export default function webpackConfig(environment, argv) {
  const isProduction = argv.mode === 'production'

  return {
    entry: './src/main.ts',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    output: {
      filename: `${name}.user.js`,
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    optimization: {
      minimize: false, // UserScriptでは可読性を保つため最小化しない
    },
    devtool: isProduction ? false : 'inline-source-map',
    mode: argv.mode,
    target: 'web',
    plugins: [
      {
        apply: (compiler) => {
          compiler.hooks.compilation.tap('UserScriptBanner', (compilation) => {
            compilation.hooks.processAssets.tap(
              {
                name: 'UserScriptBanner',
                stage:
                  compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
              },
              () => {
                // UserScript metadata from package.json
                const metadata = {
                  name: scriptName,
                  namespace: userscriptConfig.namespace,
                  version,
                  description,
                  author,
                  homepage,
                  match: userscriptConfig.match,
                  icon: userscriptConfig.icon,
                  updateURL: userscriptConfig.updateURL,
                  downloadURL: userscriptConfig.downloadURL,
                  grant: userscriptConfig.grant,
                  require: userscriptConfig.require
                }

                // Generate header from metadata object
                const banner = '// ==UserScript==\n' +
                  Object.entries(metadata).map(([key, value]) => {
                    if (Array.isArray(value)) {
                      return value.map(v => `// @${key.padEnd(12)} ${v}`).join('\n')
                    }
                    return `// @${key.padEnd(12)} ${value}`
                  }).join('\n') +
                  '\n// ==/UserScript==\n\n'

                for (const [filename, source] of Object.entries(
                  compilation.assets
                )) {
                  if (filename.endsWith('.js')) {
                    const content = source.source()
                    const modifiedSource = banner + content
                    
                    compilation.updateAsset(
                      filename,
                      new compiler.webpack.sources.RawSource(modifiedSource)
                    )
                  }
                }
              }
            )
          })
        },
      },
    ],
  }
}
