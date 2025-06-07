import { DomUtils } from './dom'
import { TIMEOUTS } from '../core/constants'

// Mock timers
jest.useFakeTimers()

describe('DomUtils', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    jest.clearAllTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
  })

  describe('waitElement', () => {
    it('should resolve when element is found immediately', async () => {
      const testDiv = document.createElement('div')
      testDiv.id = 'test-element'
      document.body.appendChild(testDiv)

      const promise = DomUtils.waitElement('#test-element')

      jest.advanceTimersByTime(TIMEOUTS.ELEMENT_WAIT)
      await expect(promise).resolves.toBeUndefined()
    })

    it('should resolve when element appears after some time', async () => {
      const promise = DomUtils.waitElement('#delayed-element')

      // Advance timer partially
      jest.advanceTimersByTime(TIMEOUTS.ELEMENT_WAIT * 2)

      // Add element after some time
      const testDiv = document.createElement('div')
      testDiv.id = 'delayed-element'
      document.body.appendChild(testDiv)

      // Advance timer again
      jest.advanceTimersByTime(TIMEOUTS.ELEMENT_WAIT)
      await expect(promise).resolves.toBeUndefined()
    })

    it('should reject when element is not found within timeout', async () => {
      const promise = DomUtils.waitElement('#non-existent', 1 as never) // 1 second timeout

      jest.advanceTimersByTime(2000) // 2 seconds

      await expect(promise).rejects.toThrow(
        'Element #non-existent not found after 1 seconds'
      )
    })

    it('should use default timeout when not specified', async () => {
      const promise = DomUtils.waitElement('#non-existent')

      jest.advanceTimersByTime(
        TIMEOUTS.ELEMENT_WAIT_LIMIT * 2 * TIMEOUTS.ELEMENT_WAIT
      )

      await expect(promise).rejects.toThrow(
        `Element #non-existent not found after ${TIMEOUTS.ELEMENT_WAIT_LIMIT} seconds`
      )
    })

    it('should handle complex selectors', async () => {
      const article = document.createElement('article')
      article.setAttribute('data-testid', 'tweet')
      const span = document.createElement('span')
      span.className = 'tweet-text'
      article.appendChild(span)
      document.body.appendChild(article)

      const promise = DomUtils.waitElement(
        'article[data-testid="tweet"] .tweet-text'
      )

      jest.advanceTimersByTime(TIMEOUTS.ELEMENT_WAIT)
      await expect(promise).resolves.toBeUndefined()
    })
  })

  describe('isFailedPage', () => {
    it('should return true when failed page indicator is present', () => {
      const div = document.createElement('div')
      div.className = 'css-175oi2r'

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      )
      path.setAttribute(
        'd',
        'M12 4c-4.418 0-8 3.58-8 8s3.582 8 8 8c3.806 0 6.993-2.66 7.802-6.22l1.95.44C20.742 18.67 16.76 22 12 22 6.477 22 2 17.52 2 12S6.477 2 12 2c3.272 0 6.176 1.57 8 4V3.5h2v6h-6v-2h2.616C17.175 5.39 14.749 4 12 4z'
      )

      svg.appendChild(path)
      div.appendChild(svg)
      document.body.appendChild(div)

      expect(DomUtils.isFailedPage()).toBe(true)
    })

    it('should return false when failed page indicator is not present', () => {
      const div = document.createElement('div')
      div.className = 'css-175oi2r'
      document.body.appendChild(div)

      expect(DomUtils.isFailedPage()).toBe(false)
    })

    it('should return false for empty document', () => {
      expect(DomUtils.isFailedPage()).toBe(false)
    })
  })

  describe('clickMoreReplies', () => {
    it('should click more replies button when found', () => {
      const primaryColumn = document.createElement('div')
      primaryColumn.setAttribute('data-testid', 'primaryColumn')

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.setAttribute('data-testid', 'cellInnerDiv')

      const buttonContainer = document.createElement('div')
      const buttonSubContainer = document.createElement('div')
      const button = document.createElement('button')
      button.setAttribute('role', 'button')

      const clickSpy = jest.fn()
      button.click = clickSpy

      buttonSubContainer.appendChild(button)
      buttonContainer.appendChild(buttonSubContainer)
      cellInnerDiv.appendChild(buttonContainer)
      primaryColumn.appendChild(cellInnerDiv)
      document.body.appendChild(primaryColumn)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      DomUtils.clickMoreReplies()

      expect(clickSpy).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        'clickMoreReplies: clicked moreRepliesButton'
      )

      consoleSpy.mockRestore()
    })

    it('should do nothing when more replies button is not found', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      DomUtils.clickMoreReplies()

      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('clickMoreRepliesAggressive', () => {
    it('should click buttons in articles with specific text', () => {
      const primaryColumn = document.createElement('div')
      primaryColumn.setAttribute('data-testid', 'primaryColumn')

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.setAttribute('data-testid', 'cellInnerDiv')

      const outerDiv = document.createElement('div')
      const innerDiv = document.createElement('div')
      const article = document.createElement('article')
      article.setAttribute('tabindex', '-1')
      article.textContent = 'これはツイートです。さらに返信を表示する'

      const button = document.createElement('button')
      button.setAttribute('role', 'button')

      const clickSpy = jest.fn()
      button.click = clickSpy

      article.appendChild(button)
      innerDiv.appendChild(article)
      outerDiv.appendChild(innerDiv)
      cellInnerDiv.appendChild(outerDiv)
      primaryColumn.appendChild(cellInnerDiv)
      document.body.appendChild(primaryColumn)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      DomUtils.clickMoreRepliesAggressive()

      expect(clickSpy).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        'clickMoreRepliesAggressive: clicked moreRepliesAggressiveButton'
      )

      consoleSpy.mockRestore()
    })

    it('should not click buttons in articles without specific text', () => {
      const primaryColumn = document.createElement('div')
      primaryColumn.setAttribute('data-testid', 'primaryColumn')

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.setAttribute('data-testid', 'cellInnerDiv')

      const articleContainer = document.createElement('div')
      const article = document.createElement('article')
      article.setAttribute('tabindex', '-1')
      article.textContent = 'これは通常のツイートです。'

      const button = document.createElement('button')
      button.setAttribute('role', 'button')

      const clickSpy = jest.fn()
      button.click = clickSpy

      article.appendChild(button)
      articleContainer.appendChild(article)
      cellInnerDiv.appendChild(articleContainer)
      primaryColumn.appendChild(cellInnerDiv)
      document.body.appendChild(primaryColumn)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      DomUtils.clickMoreRepliesAggressive()

      expect(clickSpy).not.toHaveBeenCalled()
      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should handle multiple matching articles', () => {
      const primaryColumn = document.createElement('div')
      primaryColumn.setAttribute('data-testid', 'primaryColumn')

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.setAttribute('data-testid', 'cellInnerDiv')

      // Create two matching articles
      for (let i = 0; i < 2; i++) {
        const outerDiv = document.createElement('div')
        const innerDiv = document.createElement('div')
        const article = document.createElement('article')
        article.setAttribute('tabindex', '-1')
        article.textContent = `ツイート${i + 1}: さらに返信を表示する`

        const button = document.createElement('button')
        button.setAttribute('role', 'button')

        const clickSpy = jest.fn()
        button.click = clickSpy

        article.appendChild(button)
        innerDiv.appendChild(article)
        outerDiv.appendChild(innerDiv)
        cellInnerDiv.appendChild(outerDiv)
      }

      primaryColumn.appendChild(cellInnerDiv)
      document.body.appendChild(primaryColumn)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      DomUtils.clickMoreRepliesAggressive()

      expect(consoleSpy).toHaveBeenCalledTimes(2)

      consoleSpy.mockRestore()
    })

    it('should handle articles without buttons', () => {
      const primaryColumn = document.createElement('div')
      primaryColumn.setAttribute('data-testid', 'primaryColumn')

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.setAttribute('data-testid', 'cellInnerDiv')

      const articleContainer = document.createElement('div')
      const article = document.createElement('article')
      article.setAttribute('tabindex', '-1')
      article.textContent = 'さらに返信を表示する'

      articleContainer.appendChild(article)
      cellInnerDiv.appendChild(articleContainer)
      primaryColumn.appendChild(cellInnerDiv)
      document.body.appendChild(primaryColumn)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      DomUtils.clickMoreRepliesAggressive()

      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })
})
