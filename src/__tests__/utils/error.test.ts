import { ErrorHandler } from '../../utils/error'

// Mock timers
jest.useFakeTimers()

/**
 * ErrorHandlerクラスのテストスイート
 * X.comでのエラー検出とハンドリング機能を検証する
 * - エラーダイアログの検出と対応処理
 * - 削除・違反投稿の検出機能
 * - 非同期コールバック処理の適切な実行
 */
describe('ErrorHandler', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    jest.clearAllTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Clean up DOM elements after each test
    document.body.innerHTML = ''
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
  })

  /**
   * handleErrorDialogメソッドのテスト
   * エラーダイアログの出現を監視し、発見時にコールバックを実行する機能を検証
   */
  describe('handleErrorDialog', () => {
    /** エラーダイアログが発見された時にコールバックが呼び出されることを検証 */
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
      layers.append(dialog)
      document.body.append(layers)

      // Advance timer to detect the dialog
      jest.advanceTimersByTime(500)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(dialog)
    })

    /** 非同期コールバックが正常に解決される場合の処理を検証 */
    it('should handle async callback that resolves', async () => {
      const mockCallback = jest.fn().mockResolvedValue(undefined)

      const promise = ErrorHandler.handleErrorDialog(mockCallback)

      // Add error dialog
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

    /** 非同期コールバックがエラーで拒否される場合の処理を検証 */
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
      layers.append(dialog)
      document.body.append(layers)

      jest.advanceTimersByTime(500)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(dialog)
    })

    /** 関数以外のコールバックが渡された場合のエラーハンドリングを検証 */
    it('should handle non-function callback', async () => {
      // @ts-expect-error Testing invalid input
      const promise = ErrorHandler.handleErrorDialog(null)

      // Add error dialog
      const layers = document.createElement('div')
      layers.id = 'layers'
      const dialog = document.createElement('div')
      dialog.setAttribute('role', 'alert')
      layers.append(dialog)
      document.body.append(layers)

      jest.advanceTimersByTime(500)

      await expect(promise).resolves.toBeUndefined()
    })

    /** ダイアログが見つかるまでポーリングを継続することを検証 */
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
      layers.append(dialog)
      document.body.append(layers)

      jest.advanceTimersByTime(500)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(dialog)
    })

    /** タイムアウト時間内にダイアログが見つからない場合の処理を検証 */
    it('should timeout if dialog is not found within timeout period', async () => {
      const mockCallback = jest.fn()
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const promise = ErrorHandler.handleErrorDialog(mockCallback, 5000)

      // Advance timer to exceed timeout
      jest.advanceTimersByTime(6000)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        'ErrorHandler: Error dialog not found within 5000ms'
      )

      consoleSpy.mockRestore()
    })

    /** カスタムタイムアウト値が正しく適用されることを検証 */
    it('should use custom timeout value', async () => {
      const mockCallback = jest.fn()
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const promise = ErrorHandler.handleErrorDialog(mockCallback, 1000)

      // Advance timer just before timeout
      jest.advanceTimersByTime(999)
      expect(consoleSpy).not.toHaveBeenCalled()

      // Advance timer to exceed timeout
      jest.advanceTimersByTime(2)
      jest.runOnlyPendingTimers()

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  /**
   * detectUnprocessablePostメソッドのテスト
   * 違反・削除された投稿を検出し、コールバックを実行する機能を検証
   */
  describe('detectUnprocessablePost', () => {
    /** ルール違反投稿が検出された時にコールバックが呼び出されることを検証 */
    it('should call callback when violation post is detected', async () => {
      const mockCallback = jest.fn()

      const promise = ErrorHandler.detectUnprocessablePost(mockCallback)

      // Add tweet with violation text
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

    /** 削除された投稿が検出された時にコールバックが呼び出されることを検証 */
    it('should call callback when deleted post is detected', async () => {
      const mockCallback = jest.fn()

      const promise = ErrorHandler.detectUnprocessablePost(mockCallback)

      // Add tweet with deletion text
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

    /** 非同期コールバックが正常に解決される場合の処理を検証（detectUnprocessablePost用） */
    it('should handle async callback that resolves', async () => {
      const mockCallback = jest.fn().mockResolvedValue(undefined)

      const promise = ErrorHandler.detectUnprocessablePost(mockCallback)

      // Add tweet with violation text
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

    /** 非同期コールバックがエラーで拒否される場合の処理を検証（detectUnprocessablePost用） */
    it('should handle async callback that rejects', async () => {
      const mockCallback = jest
        .fn()
        .mockRejectedValue(new Error('Callback error'))

      const promise = ErrorHandler.detectUnprocessablePost(mockCallback)

      // Add tweet with violation text
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

    /** 通常の投稿に対してはコールバックが呼び出されないことを検証 */
    it('should not call callback for normal posts', () => {
      const mockCallback = jest.fn()

      ErrorHandler.detectUnprocessablePost(mockCallback)

      // Add normal tweet
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

      // Clear the interval by resolving the promise
      jest.clearAllTimers()
    })

    /** ツイート記事が見つからない場合にポーリングを継続することを検証 */
    it('should continue polling when no tweet article is found', () => {
      const mockCallback = jest.fn()

      ErrorHandler.detectUnprocessablePost(mockCallback)

      jest.advanceTimersByTime(500 * 3)

      expect(mockCallback).not.toHaveBeenCalled()

      // Clear the interval
      jest.clearAllTimers()
    })

    /** テキストコンテンツがないツイート記事の適切な処理を検証 */
    it('should handle tweet article without text content', () => {
      const mockCallback = jest.fn()

      ErrorHandler.detectUnprocessablePost(mockCallback)

      // Add tweet article without text
      const primaryColumn = document.createElement('div')
      primaryColumn.dataset.testid = 'primaryColumn'

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.dataset.testid = 'cellInnerDiv'

      const container = document.createElement('div')
      const subContainer = document.createElement('div')
      const article = document.createElement('article')
      article.setAttribute('tabindex', '-1')
      // No text content

      subContainer.append(article)
      container.append(subContainer)
      cellInnerDiv.append(container)
      primaryColumn.append(cellInnerDiv)
      document.body.append(primaryColumn)

      jest.advanceTimersByTime(500 * 3)

      expect(mockCallback).not.toHaveBeenCalled()

      jest.clearAllTimers()
    })

    /** タイムアウト時間内に処理不可能ポストが見つからない場合の処理を検証 */
    it('should timeout if problematic post is not found within timeout period', async () => {
      const mockCallback = jest.fn()
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const promise = ErrorHandler.detectUnprocessablePost(mockCallback, 3000)

      // Add normal tweet without problematic content
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

      // Advance timer to exceed timeout
      jest.advanceTimersByTime(4000)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        'ErrorHandler: Problematic post not found within 3000ms'
      )

      // Clean up DOM elements
      primaryColumn.remove()
      consoleSpy.mockRestore()
    })

    /** カスタムタイムアウト値が正しく適用されることを検証（detectUnprocessablePost用） */
    it('should use custom timeout value for post detection', async () => {
      const mockCallback = jest.fn()
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const promise = ErrorHandler.detectUnprocessablePost(mockCallback, 2000)

      // Advance timer just before timeout
      jest.advanceTimersByTime(1999)
      expect(consoleSpy).not.toHaveBeenCalled()

      // Advance timer to exceed timeout
      jest.advanceTimersByTime(2)
      jest.runOnlyPendingTimers()

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  /**
   * waitForElementAndCallbackメソッドのテスト
   * 指定要素の出現を待機し、コールバックを実行する機能を検証
   */
  describe('waitForElementAndCallback', () => {
    /** 要素が見つかった時にコールバックが呼び出されることを検証 */
    it('should call callback when element is found', async () => {
      const mockCallback = jest.fn().mockResolvedValue(undefined)

      // Add element to DOM
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

    /** コールバックエラーが適切に伝播されることを検証 */
    it('should propagate callback errors properly', async () => {
      const callbackError = new Error('Callback failed')
      const mockCallback = jest.fn().mockRejectedValue(callbackError)

      // Add element to DOM
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

    /** タイムアウト時にエラーが発生することを検証 */
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

    /** 要素が遅れて出現した場合の適切な処理を検証 */
    it('should wait for element to appear', async () => {
      const mockCallback = jest.fn().mockResolvedValue(undefined)

      const promise = ErrorHandler.waitForElementAndCallback(
        '#delayed-element',
        mockCallback
      )

      // Advance timer without element
      jest.advanceTimersByTime(500)

      // Add element after delay
      const element = document.createElement('div')
      element.id = 'delayed-element'
      document.body.append(element)

      jest.advanceTimersByTime(100)

      await expect(promise).resolves.toBeUndefined()
      expect(mockCallback).toHaveBeenCalledWith(element)
    })
  })

  /**
   * waitForAllElementsAndCallbackメソッドのテスト
   * 指定要素群の出現を待機し、コールバックを実行する機能を検証
   */
  describe('waitForAllElementsAndCallback', () => {
    /** 要素群が見つかった時にコールバックが呼び出されることを検証 */
    it('should call callback when elements are found', async () => {
      const mockCallback = jest.fn().mockResolvedValue(undefined)

      // Add elements to DOM
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

    /** コールバックエラーが適切に伝播されることを検証 */
    it('should propagate callback errors properly', async () => {
      const callbackError = new Error('Elements callback failed')
      const mockCallback = jest.fn().mockRejectedValue(callbackError)

      // Add elements to DOM
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

    /** タイムアウト時にエラーが発生することを検証 */
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

    /** 要素群が遅れて出現した場合の適切な処理を検証 */
    it('should wait for elements to appear', async () => {
      const mockCallback = jest.fn().mockResolvedValue(undefined)

      const promise = ErrorHandler.waitForAllElementsAndCallback(
        '.delayed-class',
        mockCallback
      )

      // Advance timer without elements
      jest.advanceTimersByTime(500)

      // Add elements after delay
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
