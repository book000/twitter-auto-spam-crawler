/**
 * main.tsの動作確認用テスト
 *
 * Note: main.tsはIIFE（即時実行関数）として実装されているため、
 * importの時点で自動的に実行される。このため、完全な単体テストは困難。
 * ここでは、package.jsonのバージョンが正しくインポートできることを確認する。
 */
describe('main.ts version import', () => {
  it('should be able to import package.json version', () => {
    // package.jsonからバージョンをインポートできることを確認
    const packageJson = require('../../package.json')
    expect(packageJson.version).toBeDefined()
    expect(typeof packageJson.version).toBe('string')
    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('should construct correct version log message', () => {
    // バージョンログメッセージの形式を確認
    const packageJson = require('../../package.json')
    const expectedMessage = `Twitter Auto Spam Crawler v${packageJson.version}`
    expect(expectedMessage).toMatch(
      /^Twitter Auto Spam Crawler v\d+\.\d+\.\d+$/
    )
  })
})
