import packageJson from '../../package.json'

// main.ts is an IIFE that runs on import, so it cannot be unit-tested directly.
// These tests only check the package.json version format and the log message template.
describe('main.ts version import', () => {
  it('should be able to import package.json version', () => {
    expect(packageJson.version).toBeDefined()
    expect(typeof packageJson.version).toBe('string')
    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('should construct correct version log message', () => {
    const expectedMessage = `${packageJson.name} v${packageJson.version}`
    expect(expectedMessage).toBe('twitter-auto-spam-crawler v1.25.1')
    expect(expectedMessage).toMatch(
      /^twitter-auto-spam-crawler v\d+\.\d+\.\d+$/
    )
  })
})
