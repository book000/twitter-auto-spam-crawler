import { ErrorHandler } from './error'

// Mock timers
jest.useFakeTimers()

describe('ErrorHandler', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    jest.clearAllTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
  })

  describe('handleErrorDialog', () => {
    it('should call callback when error dialog is found', async () => {
      const mockCallback = jest.fn()

      const promise = ErrorHandler.handleErrorDialog(mockCallback)

      // Advance timer to trigger the interval
      jest.advanceTimersByTime(250)

      // Add error dialog
      const layers = document.createElement('div')
      layers.id = 'layers'
      const dialog = document.createElement('div')
      dialog.setAttribute('role', 'alert')
      layers.appendChild(dialog)
      document.body.appendChild(layers)

      // Advance timer to detect the dialog
      jest.advanceTimersByTime(500)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(dialog)
    })

    it('should handle async callback that resolves', async () => {
      const mockCallback = jest.fn().mockResolvedValue(undefined)

      const promise = ErrorHandler.handleErrorDialog(mockCallback)

      // Add error dialog
      const layers = document.createElement('div')
      layers.id = 'layers'
      const dialog = document.createElement('div')
      dialog.setAttribute('role', 'alert')
      layers.appendChild(dialog)
      document.body.appendChild(layers)

      jest.advanceTimersByTime(500)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(dialog)
    })

    it('should handle async callback that rejects', async () => {
      const mockCallback = jest
        .fn()
        .mockRejectedValue(new Error('Callback error'))

      const promise = ErrorHandler.handleErrorDialog(mockCallback)

      // Add error dialog
      const layers = document.createElement('div')
      layers.id = 'layers'
      const dialog = document.createElement('div')
      dialog.setAttribute('role', 'alert')
      layers.appendChild(dialog)
      document.body.appendChild(layers)

      jest.advanceTimersByTime(500)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(dialog)
    })

    it('should handle non-function callback', async () => {
      // @ts-expect-error Testing invalid input
      const promise = ErrorHandler.handleErrorDialog(null)

      // Add error dialog
      const layers = document.createElement('div')
      layers.id = 'layers'
      const dialog = document.createElement('div')
      dialog.setAttribute('role', 'alert')
      layers.appendChild(dialog)
      document.body.appendChild(layers)

      jest.advanceTimersByTime(500)

      await expect(promise).resolves.toBeUndefined()
    })

    it('should continue polling until dialog is found', async () => {
      const mockCallback = jest.fn()

      const promise = ErrorHandler.handleErrorDialog(mockCallback)

      // Advance timer multiple times without dialog
      jest.advanceTimersByTime(500 * 5)

      // Add error dialog after multiple intervals
      const layers = document.createElement('div')
      layers.id = 'layers'
      const dialog = document.createElement('div')
      dialog.setAttribute('role', 'alert')
      layers.appendChild(dialog)
      document.body.appendChild(layers)

      jest.advanceTimersByTime(500)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(dialog)
    })
  })

  describe('detectCantProcessingPost', () => {
    it('should call callback when violation post is detected', async () => {
      const mockCallback = jest.fn()

      const promise = ErrorHandler.detectCantProcessingPost(mockCallback)

      // Add tweet with violation text
      const primaryColumn = document.createElement('div')
      primaryColumn.setAttribute('data-testid', 'primaryColumn')

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.setAttribute('data-testid', 'cellInnerDiv')

      const container = document.createElement('div')
      const subContainer = document.createElement('div')
      const article = document.createElement('article')
      article.setAttribute('tabindex', '-1')
      article.textContent = 'このポストはXルールに違反しています。'

      subContainer.appendChild(article)
      container.appendChild(subContainer)
      cellInnerDiv.appendChild(container)
      primaryColumn.appendChild(cellInnerDiv)
      document.body.appendChild(primaryColumn)

      jest.advanceTimersByTime(500)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(article)
    })

    it('should call callback when deleted post is detected', async () => {
      const mockCallback = jest.fn()

      const promise = ErrorHandler.detectCantProcessingPost(mockCallback)

      // Add tweet with deletion text
      const primaryColumn = document.createElement('div')
      primaryColumn.setAttribute('data-testid', 'primaryColumn')

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.setAttribute('data-testid', 'cellInnerDiv')

      const container = document.createElement('div')
      const subContainer = document.createElement('div')
      const article = document.createElement('article')
      article.setAttribute('tabindex', '-1')
      article.textContent = 'このポストは、ポストの作成者により削除されました。'

      subContainer.appendChild(article)
      container.appendChild(subContainer)
      cellInnerDiv.appendChild(container)
      primaryColumn.appendChild(cellInnerDiv)
      document.body.appendChild(primaryColumn)

      jest.advanceTimersByTime(500)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(article)
    })

    it('should handle async callback that resolves', async () => {
      const mockCallback = jest.fn().mockResolvedValue(undefined)

      const promise = ErrorHandler.detectCantProcessingPost(mockCallback)

      // Add tweet with violation text
      const primaryColumn = document.createElement('div')
      primaryColumn.setAttribute('data-testid', 'primaryColumn')

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.setAttribute('data-testid', 'cellInnerDiv')

      const container = document.createElement('div')
      const subContainer = document.createElement('div')
      const article = document.createElement('article')
      article.setAttribute('tabindex', '-1')
      article.textContent = 'このポストはXルールに違反しています。'

      subContainer.appendChild(article)
      container.appendChild(subContainer)
      cellInnerDiv.appendChild(container)
      primaryColumn.appendChild(cellInnerDiv)
      document.body.appendChild(primaryColumn)

      jest.advanceTimersByTime(500)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(article)
    })

    it('should handle async callback that rejects', async () => {
      const mockCallback = jest
        .fn()
        .mockRejectedValue(new Error('Callback error'))

      const promise = ErrorHandler.detectCantProcessingPost(mockCallback)

      // Add tweet with violation text
      const primaryColumn = document.createElement('div')
      primaryColumn.setAttribute('data-testid', 'primaryColumn')

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.setAttribute('data-testid', 'cellInnerDiv')

      const container = document.createElement('div')
      const subContainer = document.createElement('div')
      const article = document.createElement('article')
      article.setAttribute('tabindex', '-1')
      article.textContent = 'このポストはXルールに違反しています。'

      subContainer.appendChild(article)
      container.appendChild(subContainer)
      cellInnerDiv.appendChild(container)
      primaryColumn.appendChild(cellInnerDiv)
      document.body.appendChild(primaryColumn)

      jest.advanceTimersByTime(500)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(article)
    })

    it('should not call callback for normal posts', async () => {
      const mockCallback = jest.fn()

      ErrorHandler.detectCantProcessingPost(mockCallback)

      // Add normal tweet
      const primaryColumn = document.createElement('div')
      primaryColumn.setAttribute('data-testid', 'primaryColumn')

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.setAttribute('data-testid', 'cellInnerDiv')

      const container = document.createElement('div')
      const subContainer = document.createElement('div')
      const article = document.createElement('article')
      article.setAttribute('tabindex', '-1')
      article.textContent = 'これは通常のツイートです。'

      subContainer.appendChild(article)
      container.appendChild(subContainer)
      cellInnerDiv.appendChild(container)
      primaryColumn.appendChild(cellInnerDiv)
      document.body.appendChild(primaryColumn)

      jest.advanceTimersByTime(500 * 3)

      expect(mockCallback).not.toHaveBeenCalled()

      // Clear the interval by resolving the promise
      jest.clearAllTimers()
    })

    it('should continue polling when no tweet article is found', async () => {
      const mockCallback = jest.fn()

      ErrorHandler.detectCantProcessingPost(mockCallback)

      jest.advanceTimersByTime(500 * 3)

      expect(mockCallback).not.toHaveBeenCalled()

      // Clear the interval
      jest.clearAllTimers()
    })

    it('should handle tweet article without text content', async () => {
      const mockCallback = jest.fn()

      ErrorHandler.detectCantProcessingPost(mockCallback)

      // Add tweet article without text
      const primaryColumn = document.createElement('div')
      primaryColumn.setAttribute('data-testid', 'primaryColumn')

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.setAttribute('data-testid', 'cellInnerDiv')

      const container = document.createElement('div')
      const subContainer = document.createElement('div')
      const article = document.createElement('article')
      article.setAttribute('tabindex', '-1')
      // No text content

      subContainer.appendChild(article)
      container.appendChild(subContainer)
      cellInnerDiv.appendChild(container)
      primaryColumn.appendChild(cellInnerDiv)
      document.body.appendChild(primaryColumn)

      jest.advanceTimersByTime(500 * 3)

      expect(mockCallback).not.toHaveBeenCalled()

      jest.clearAllTimers()
    })
  })
})
