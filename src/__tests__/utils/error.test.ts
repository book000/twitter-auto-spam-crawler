import { ErrorHandler } from '../../utils/error'

jest.useFakeTimers()

describe('ErrorHandler', () => {
  beforeEach(() => {
    document.body.replaceChildren()
    jest.clearAllTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    document.body.replaceChildren()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
  })

  describe('handleErrorDialog', () => {
    it('should call callback when error dialog is found', async () => {
      const mockCallback = jest.fn()

      const promise = ErrorHandler.handleErrorDialog(mockCallback)

      jest.advanceTimersByTime(250)

      const layers = document.createElement('div')
      layers.id = 'layers'
      const dialog = document.createElement('div')
      dialog.setAttribute('role', 'alert')
      layers.append(dialog)
      document.body.append(layers)

      jest.advanceTimersByTime(500)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(dialog)
    })

    it('should handle async callback that resolves', async () => {
      const mockCallback = jest.fn().mockResolvedValue(undefined)

      const promise = ErrorHandler.handleErrorDialog(mockCallback)

      const layers = document.createElement('div')
      layers.id = 'layers'
      const dialog = document.createElement('div')
      dialog.setAttribute('role', 'alert')
      layers.append(dialog)
      document.body.append(layers)

      jest.advanceTimersByTime(500)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(dialog)
    })

    it('should handle async callback that rejects', async () => {
      const mockCallback = jest
        .fn()
        .mockRejectedValue(new Error('Callback error'))

      const promise = ErrorHandler.handleErrorDialog(mockCallback)

      const layers = document.createElement('div')
      layers.id = 'layers'
      const dialog = document.createElement('div')
      dialog.setAttribute('role', 'alert')
      layers.append(dialog)
      document.body.append(layers)

      jest.advanceTimersByTime(500)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(dialog)
    })

    it('should resolve and stop polling when the callback is not a function', async () => {
      // @ts-expect-error Testing invalid input
      const promise = ErrorHandler.handleErrorDialog(null)

      const layers = document.createElement('div')
      layers.id = 'layers'
      const dialog = document.createElement('div')
      dialog.setAttribute('role', 'alert')
      layers.append(dialog)
      document.body.append(layers)

      jest.advanceTimersByTime(500)

      await expect(promise).resolves.toBeUndefined()
      expect(jest.getTimerCount()).toBe(0)
    })

    it('should continue polling until dialog is found', async () => {
      const mockCallback = jest.fn()

      const promise = ErrorHandler.handleErrorDialog(mockCallback)

      jest.advanceTimersByTime(500 * 5)

      const layers = document.createElement('div')
      layers.id = 'layers'
      const dialog = document.createElement('div')
      dialog.setAttribute('role', 'alert')
      layers.append(dialog)
      document.body.append(layers)

      jest.advanceTimersByTime(500)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(dialog)
    })

    it('should timeout if dialog is not found within timeout period', async () => {
      const mockCallback = jest.fn()
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const promise = ErrorHandler.handleErrorDialog(mockCallback, 5000)

      jest.advanceTimersByTime(6000)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        'ErrorHandler: Error dialog not found within 5000ms'
      )

      consoleSpy.mockRestore()
    })

    it('should use custom timeout value', async () => {
      const mockCallback = jest.fn()
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const promise = ErrorHandler.handleErrorDialog(mockCallback, 1000)

      jest.advanceTimersByTime(999)
      expect(consoleSpy).not.toHaveBeenCalled()

      jest.advanceTimersByTime(2)
      jest.runOnlyPendingTimers()

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('detectUnprocessablePost', () => {
    it('should call callback when violation post is detected', async () => {
      const mockCallback = jest.fn()

      const promise = ErrorHandler.detectUnprocessablePost(mockCallback)

      const primaryColumn = document.createElement('div')
      primaryColumn.dataset.testid = 'primaryColumn'

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.dataset.testid = 'cellInnerDiv'

      const container = document.createElement('div')
      const subContainer = document.createElement('div')
      const article = document.createElement('article')
      article.setAttribute('tabindex', '-1')
      article.textContent = 'このポストはXルールに違反しています。'

      subContainer.append(article)
      container.append(subContainer)
      cellInnerDiv.append(container)
      primaryColumn.append(cellInnerDiv)
      document.body.append(primaryColumn)

      jest.advanceTimersByTime(500)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(article)
    })

    it('should call callback when deleted post is detected', async () => {
      const mockCallback = jest.fn()

      const promise = ErrorHandler.detectUnprocessablePost(mockCallback)

      const primaryColumn = document.createElement('div')
      primaryColumn.dataset.testid = 'primaryColumn'

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.dataset.testid = 'cellInnerDiv'

      const container = document.createElement('div')
      const subContainer = document.createElement('div')
      const article = document.createElement('article')
      article.setAttribute('tabindex', '-1')
      article.textContent = 'このポストは、ポストの作成者により削除されました。'

      subContainer.append(article)
      container.append(subContainer)
      cellInnerDiv.append(container)
      primaryColumn.append(cellInnerDiv)
      document.body.append(primaryColumn)

      jest.advanceTimersByTime(500)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(article)
    })

    it('should handle async callback that resolves', async () => {
      const mockCallback = jest.fn().mockResolvedValue(undefined)

      const promise = ErrorHandler.detectUnprocessablePost(mockCallback)

      const primaryColumn = document.createElement('div')
      primaryColumn.dataset.testid = 'primaryColumn'

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.dataset.testid = 'cellInnerDiv'

      const container = document.createElement('div')
      const subContainer = document.createElement('div')
      const article = document.createElement('article')
      article.setAttribute('tabindex', '-1')
      article.textContent = 'このポストはXルールに違反しています。'

      subContainer.append(article)
      container.append(subContainer)
      cellInnerDiv.append(container)
      primaryColumn.append(cellInnerDiv)
      document.body.append(primaryColumn)

      jest.advanceTimersByTime(500)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(article)
    })

    it('should handle async callback that rejects', async () => {
      const mockCallback = jest
        .fn()
        .mockRejectedValue(new Error('Callback error'))

      const promise = ErrorHandler.detectUnprocessablePost(mockCallback)

      const primaryColumn = document.createElement('div')
      primaryColumn.dataset.testid = 'primaryColumn'

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.dataset.testid = 'cellInnerDiv'

      const container = document.createElement('div')
      const subContainer = document.createElement('div')
      const article = document.createElement('article')
      article.setAttribute('tabindex', '-1')
      article.textContent = 'このポストはXルールに違反しています。'

      subContainer.append(article)
      container.append(subContainer)
      cellInnerDiv.append(container)
      primaryColumn.append(cellInnerDiv)
      document.body.append(primaryColumn)

      jest.advanceTimersByTime(500)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(article)
    })

    it('should not call callback for normal posts', () => {
      const mockCallback = jest.fn()

      ErrorHandler.detectUnprocessablePost(mockCallback)

      const primaryColumn = document.createElement('div')
      primaryColumn.dataset.testid = 'primaryColumn'

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.dataset.testid = 'cellInnerDiv'

      const container = document.createElement('div')
      const subContainer = document.createElement('div')
      const article = document.createElement('article')
      article.setAttribute('tabindex', '-1')
      article.textContent = 'これは通常のツイートです。'

      subContainer.append(article)
      container.append(subContainer)
      cellInnerDiv.append(container)
      primaryColumn.append(cellInnerDiv)
      document.body.append(primaryColumn)

      jest.advanceTimersByTime(500 * 3)

      expect(mockCallback).not.toHaveBeenCalled()

      jest.clearAllTimers()
    })

    it('should continue polling when no tweet article is found', () => {
      const mockCallback = jest.fn()

      ErrorHandler.detectUnprocessablePost(mockCallback)

      jest.advanceTimersByTime(500 * 3)

      expect(mockCallback).not.toHaveBeenCalled()

      jest.clearAllTimers()
    })

    it('should handle tweet article without text content', () => {
      const mockCallback = jest.fn()

      ErrorHandler.detectUnprocessablePost(mockCallback)

      const primaryColumn = document.createElement('div')
      primaryColumn.dataset.testid = 'primaryColumn'

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.dataset.testid = 'cellInnerDiv'

      const container = document.createElement('div')
      const subContainer = document.createElement('div')
      const article = document.createElement('article')
      article.setAttribute('tabindex', '-1')

      subContainer.append(article)
      container.append(subContainer)
      cellInnerDiv.append(container)
      primaryColumn.append(cellInnerDiv)
      document.body.append(primaryColumn)

      jest.advanceTimersByTime(500 * 3)

      expect(mockCallback).not.toHaveBeenCalled()

      jest.clearAllTimers()
    })

    it('should timeout if problematic post is not found within timeout period', async () => {
      const mockCallback = jest.fn()
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const promise = ErrorHandler.detectUnprocessablePost(mockCallback, 3000)

      const primaryColumn = document.createElement('div')
      primaryColumn.dataset.testid = 'primaryColumn'

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.dataset.testid = 'cellInnerDiv'

      const container = document.createElement('div')
      const subContainer = document.createElement('div')
      const article = document.createElement('article')
      article.setAttribute('tabindex', '-1')
      article.textContent = 'これは通常のツイートです。'

      subContainer.append(article)
      container.append(subContainer)
      cellInnerDiv.append(container)
      primaryColumn.append(cellInnerDiv)
      document.body.append(primaryColumn)

      jest.advanceTimersByTime(4000)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        'ErrorHandler: Problematic post not found within 3000ms'
      )

      primaryColumn.remove()
      consoleSpy.mockRestore()
    })

    it('should use custom timeout value for post detection', async () => {
      const mockCallback = jest.fn()
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const promise = ErrorHandler.detectUnprocessablePost(mockCallback, 2000)

      jest.advanceTimersByTime(1999)
      expect(consoleSpy).not.toHaveBeenCalled()

      jest.advanceTimersByTime(2)
      jest.runOnlyPendingTimers()

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('waitForElementAndCallback', () => {
    it('should call callback when element is found', async () => {
      const mockCallback = jest.fn().mockResolvedValue(undefined)

      const element = document.createElement('div')
      element.id = 'test-element'
      document.body.append(element)

      const promise = ErrorHandler.waitForElementAndCallback(
        '#test-element',
        mockCallback
      )

      jest.advanceTimersByTime(100)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(element)
    })

    it('should propagate callback errors properly', async () => {
      const callbackError = new Error('Callback failed')
      const mockCallback = jest.fn().mockRejectedValue(callbackError)

      const element = document.createElement('div')
      element.id = 'test-element'
      document.body.append(element)

      const promise = ErrorHandler.waitForElementAndCallback(
        '#test-element',
        mockCallback
      )

      jest.advanceTimersByTime(100)

      await expect(promise).rejects.toThrow('Callback failed')
      expect(mockCallback).toHaveBeenCalledWith(element)
    })

    it('should timeout and reject when element not found', async () => {
      const mockCallback = jest.fn()
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const promise = ErrorHandler.waitForElementAndCallback(
        '#nonexistent',
        mockCallback,
        1000
      )

      jest.advanceTimersByTime(1100)

      await expect(promise).rejects.toThrow(
        'Element not found within 1000ms: #nonexistent'
      )
      expect(mockCallback).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        'ErrorHandler timeout:',
        'Element not found within 1000ms: #nonexistent'
      )

      consoleSpy.mockRestore()
    })

    it('should wait for element to appear', async () => {
      const mockCallback = jest.fn().mockResolvedValue(undefined)

      const promise = ErrorHandler.waitForElementAndCallback(
        '#delayed-element',
        mockCallback
      )

      jest.advanceTimersByTime(500)

      const element = document.createElement('div')
      element.id = 'delayed-element'
      document.body.append(element)

      jest.advanceTimersByTime(100)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(element)
    })
  })

  describe('waitForAllElementsAndCallback', () => {
    it('should call callback when elements are found', async () => {
      const mockCallback = jest.fn().mockResolvedValue(undefined)

      const element1 = document.createElement('div')
      element1.className = 'test-class'
      const element2 = document.createElement('div')
      element2.className = 'test-class'
      document.body.append(element1, element2)

      const promise = ErrorHandler.waitForAllElementsAndCallback(
        '.test-class',
        mockCallback
      )

      jest.advanceTimersByTime(100)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(expect.any(NodeList))
      expect(
        (mockCallback.mock.calls[0] as unknown[])[0] as NodeList
      ).toHaveLength(2)
    })

    it('should propagate callback errors properly', async () => {
      const callbackError = new Error('Elements callback failed')
      const mockCallback = jest.fn().mockRejectedValue(callbackError)

      const element1 = document.createElement('div')
      element1.className = 'test-class'
      document.body.append(element1)

      const promise = ErrorHandler.waitForAllElementsAndCallback(
        '.test-class',
        mockCallback
      )

      jest.advanceTimersByTime(100)

      await expect(promise).rejects.toThrow('Elements callback failed')
      expect(mockCallback).toHaveBeenCalled()
    })

    it('should timeout and reject when elements not found', async () => {
      const mockCallback = jest.fn()
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const promise = ErrorHandler.waitForAllElementsAndCallback(
        '.nonexistent',
        mockCallback,
        1000
      )

      jest.advanceTimersByTime(1100)

      await expect(promise).rejects.toThrow(
        'Elements not found within 1000ms: .nonexistent'
      )
      expect(mockCallback).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        'ErrorHandler timeout:',
        'Elements not found within 1000ms: .nonexistent'
      )

      consoleSpy.mockRestore()
    })

    it('should wait for elements to appear', async () => {
      const mockCallback = jest.fn().mockResolvedValue(undefined)

      const promise = ErrorHandler.waitForAllElementsAndCallback(
        '.delayed-class',
        mockCallback
      )

      jest.advanceTimersByTime(500)

      const element1 = document.createElement('div')
      element1.className = 'delayed-class'
      const element2 = document.createElement('div')
      element2.className = 'delayed-class'
      document.body.append(element1, element2)

      jest.advanceTimersByTime(100)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(expect.any(NodeList))
      expect(
        (mockCallback.mock.calls[0] as unknown[])[0] as NodeList
      ).toHaveLength(2)
    })
  })
})
