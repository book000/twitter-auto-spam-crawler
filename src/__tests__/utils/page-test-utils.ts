/**
 * Page component testing utilities
 * Shared helpers for testing X.com-specific DOM structures and page components
 */

/**
 * Creates a mock Twitter/X.com DOM structure for testing
 * Includes primary column, tweet articles, navigation tabs, and other common elements
 */
export function setupTwitterDOM(): void {
  document.body.innerHTML = `
    <div data-testid="primaryColumn">
      <nav aria-live="polite" role="navigation">
        <div role="tablist">
          <div role="presentation">
            <a role="tab" href="/home">For you</a>
          </div>
          <div role="presentation">
            <a role="tab" href="/home/following">Following</a>
          </div>
          <div role="presentation">
            <a role="tab" href="/home/lists">Lists</a>
          </div>
        </div>
      </nav>
      <div>
        <article data-testid="tweet">
          <div>Mock Tweet 1</div>
        </article>
        <article data-testid="tweet">
          <div>Mock Tweet 2</div>
        </article>
      </div>
    </div>
  `
}

/**
 * Creates a Twitter failed page structure (with reload icon)
 */
export function setupFailedPageDOM(): void {
  const FAILED_PAGE_CLASS = 'css-175oi2r' // Class for the failed page reload icon
  const div = document.createElement('div')
  div.className = FAILED_PAGE_CLASS

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute(
    'd',
    'M12 4c-4.418 0-8 3.58-8 8s3.582 8 8 8c3.806 0 6.993-2.66 7.802-6.22l1.95.44C20.742 18.67 16.76 22 12 22 6.477 22 2 17.52 2 12S6.477 2 12 2c3.272 0 6.176 1.57 8 4V3.5h2v6h-6v-2h2.616C17.175 5.39 14.749 4 12 4z'
  )

  svg.append(path)
  div.append(svg)
  document.body.append(div)
}

/**
 * Mocks common userscript globals that are expected in page tests
 */
export function setupUserscriptMocks(): void {
  // Create a proper Jest mock for reload function
  const reloadMock = jest.fn()

  // Mock location methods - use simple assignment for JSDOM
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  ;(globalThis as any).location = {
    href: 'https://x.com/home',
    search: '',
    reload: reloadMock,
  }

  // Mock window.scrollBy
  Object.defineProperty(globalThis, 'scrollBy', {
    value: jest.fn(),
    writable: true,
  })

  // Mock window.innerHeight
  Object.defineProperty(globalThis, 'innerHeight', {
    value: 800,
    writable: true,
  })
}

/**
 * Creates a mock search results page with live filter
 */
export function setupSearchPageDOM(): void {
  document.body.innerHTML = `
    <div data-testid="primaryColumn">
      <div>
        <article data-testid="tweet">
          <div>Search result tweet 1</div>
        </article>
        <article data-testid="tweet">
          <div>Search result tweet 2</div>
        </article>
      </div>
    </div>
  `
}

/**
 * Creates a mock tweet page with single tweet article
 */
export function setupTweetPageDOM(): void {
  document.body.innerHTML = `
    <div data-testid="primaryColumn">
      <article data-testid="tweet">
        <div>Main tweet content</div>
      </article>
    </div>
  `
}

/**
 * Creates a mock error dialog for tweet page testing
 */
export function setupErrorDialogDOM(message = '削除されたツイート'): void {
  const dialog = document.createElement('div')
  dialog.setAttribute('role', 'dialog')
  dialog.textContent = message
  document.body.append(dialog)
}

/**
 * Helper to advance timers and wait for promises
 */
export async function advanceTimersAndFlush(ms: number): Promise<void> {
  jest.advanceTimersByTime(ms)
  await Promise.resolve()
}

/**
 * Mock implementation for console methods to avoid test noise
 */
export function setupConsoleMocks(): {
  log: jest.SpyInstance
  error: jest.SpyInstance
  warn: jest.SpyInstance
  info: jest.SpyInstance
} {
  return {
    log: jest.spyOn(console, 'log').mockImplementation(() => {}),
    error: jest.spyOn(console, 'error').mockImplementation(() => {}),
    warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
    info: jest.spyOn(console, 'info').mockImplementation(() => {}),
  }
}

/**
 * Restore all console mocks
 */
export function restoreConsoleMocks(
  mocks:
    | {
        log: jest.SpyInstance
        error: jest.SpyInstance
        warn: jest.SpyInstance
        info: jest.SpyInstance
      }
    | undefined
): void {
  if (!mocks) return

  try {
    mocks.log.mockRestore()
    mocks.error.mockRestore()
    mocks.warn.mockRestore()
    mocks.info.mockRestore()
  } catch {
    // Ignore restore errors in cleanup
  }
}
