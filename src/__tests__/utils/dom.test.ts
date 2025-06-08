import { DomUtils } from '../../utils/dom'
import { TIMEOUTS, URLS } from '../../core/constants'
// Import mock before the module under test
import '../../__mocks__/userscript'

// Mock timers
jest.useFakeTimers()

// Mock location
const mockLocation = { href: '' }
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
delete (globalThis as any).location
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
;(globalThis as any).location = mockLocation

/**
 * DomUtilsクラスのテストスイート
 * DOM操作に関するユーティリティ機能を検証する
 * - 要素の待機と検出機能
 * - エラーページの判定機能
 * - ツイート返信の展開ボタンクリック機能
 * - X.com固有のDOMセレクターを使用した要素操作
 */
describe('DomUtils', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    jest.clearAllTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
  })

  /**
   * waitElementメソッドのテスト
   * 指定されたセレクターに一致する要素が見つかるまで待機する機能を検証
   */
  describe('waitElement', () => {
    /** 要素が即座に見つかった場合の正常完了を検証 */
    it('should resolve when element is found immediately', async () => {
      const testDiv = document.createElement('div')
      testDiv.id = 'test-element'
      document.body.append(testDiv)

      const promise = DomUtils.waitElement('#test-element')

      jest.advanceTimersByTime(TIMEOUTS.ELEMENT_WAIT)
      await expect(promise).resolves.toBeUndefined()
    })

    /** 要素が遅れて追加された場合でも正常に検出することを検証 */
    it('should resolve when element appears after some time', async () => {
      const promise = DomUtils.waitElement('#delayed-element')

      // Advance timer partially
      jest.advanceTimersByTime(TIMEOUTS.ELEMENT_WAIT * 2)

      // Add element after some time
      const testDiv = document.createElement('div')
      testDiv.id = 'delayed-element'
      document.body.append(testDiv)

      // Advance timer again
      jest.advanceTimersByTime(TIMEOUTS.ELEMENT_WAIT)
      await expect(promise).resolves.toBeUndefined()
    })

    /** タイムアウト時間内に要素が見つからない場合のエラー処理を検証 */
    it('should reject when element is not found within timeout', async () => {
      const promise = DomUtils.waitElement('#non-existent', 1)

      jest.advanceTimersByTime(2000) // 2 seconds

      await expect(promise).rejects.toThrow(
        'Element #non-existent not found after 1 seconds'
      )
    })

    /** タイムアウト時間が指定されていない場合のデフォルト値使用を検証 */
    it('should use default timeout when not specified', async () => {
      const promise = DomUtils.waitElement('#non-existent')

      jest.advanceTimersByTime(
        TIMEOUTS.ELEMENT_WAIT_LIMIT * 2 * TIMEOUTS.ELEMENT_WAIT
      )

      await expect(promise).rejects.toThrow(
        `Element #non-existent not found after ${TIMEOUTS.ELEMENT_WAIT_LIMIT} seconds`
      )
    })

    /** 複雑なCSSセレクターでの要素検索が正常に動作することを検証 */
    it('should handle complex selectors', async () => {
      const article = document.createElement('article')
      article.dataset.testid = 'tweet'
      const span = document.createElement('span')
      span.className = 'tweet-text'
      article.append(span)
      document.body.append(article)

      const promise = DomUtils.waitElement(
        'article[data-testid="tweet"] .tweet-text'
      )

      jest.advanceTimersByTime(TIMEOUTS.ELEMENT_WAIT)
      await expect(promise).resolves.toBeUndefined()
    })
  })

  /**
   * isFailedPageメソッドのテスト
   * X.comのエラーページ（リロードアイコン表示）を検出する機能を検証
   */
  describe('isFailedPage', () => {
    /** エラーページの特定のSVGアイコンが存在する場合にtrueを返すことを検証 */
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

      svg.append(path)
      div.append(svg)
      document.body.append(div)

      expect(DomUtils.isFailedPage()).toBe(true)
    })

    /** エラーページのインジケーターが存在しない場合にfalseを返すことを検証 */
    it('should return false when failed page indicator is not present', () => {
      const div = document.createElement('div')
      div.className = 'css-175oi2r'
      document.body.append(div)

      expect(DomUtils.isFailedPage()).toBe(false)
    })

    /** 空のドキュメントに対してfalseを返すことを検証 */
    it('should return false for empty document', () => {
      expect(DomUtils.isFailedPage()).toBe(false)
    })
  })

  /**
   * clickMoreRepliesメソッドのテスト
   * ツイートの返信をさらに読み込むボタンをクリックする機能を検証
   */
  describe('clickMoreReplies', () => {
    /** 返信展開ボタンが見つかった場合にクリック処理が実行されることを検証 */
    it('should click more replies button when found', () => {
      const primaryColumn = document.createElement('div')
      primaryColumn.dataset.testid = 'primaryColumn'

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.dataset.testid = 'cellInnerDiv'

      const buttonContainer = document.createElement('div')
      const buttonSubContainer = document.createElement('div')
      const button = document.createElement('button')
      button.setAttribute('role', 'button')

      const clickSpy = jest.fn()
      button.click = clickSpy

      buttonSubContainer.append(button)
      buttonContainer.append(buttonSubContainer)
      cellInnerDiv.append(buttonContainer)
      primaryColumn.append(cellInnerDiv)
      document.body.append(primaryColumn)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      DomUtils.clickMoreReplies()

      expect(clickSpy).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        'clickMoreReplies: clicked moreRepliesButton'
      )

      consoleSpy.mockRestore()
    })

    /** 返信展開ボタンが見つからない場合に何も実行されないことを検証 */
    it('should do nothing when more replies button is not found', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      DomUtils.clickMoreReplies()

      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  /**
   * clickMoreRepliesAggressiveメソッドのテスト
   * より積極的な方法でツイート返信を展開するボタンをクリックする機能を検証
   */
  describe('clickMoreRepliesAggressive', () => {
    /** 特定のテキストを含むarticle内のボタンをクリックすることを検証 */
    it('should click buttons in articles with specific text', () => {
      const primaryColumn = document.createElement('div')
      primaryColumn.dataset.testid = 'primaryColumn'

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.dataset.testid = 'cellInnerDiv'

      const outerDiv = document.createElement('div')
      const innerDiv = document.createElement('div')
      const article = document.createElement('article')
      article.setAttribute('tabindex', '-1')
      article.textContent = 'これはツイートです。さらに返信を表示する'

      const button = document.createElement('button')
      button.setAttribute('role', 'button')

      const clickSpy = jest.fn()
      button.click = clickSpy

      article.append(button)
      innerDiv.append(article)
      outerDiv.append(innerDiv)
      cellInnerDiv.append(outerDiv)
      primaryColumn.append(cellInnerDiv)
      document.body.append(primaryColumn)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      DomUtils.clickMoreRepliesAggressive()

      expect(clickSpy).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        'clickMoreRepliesAggressive: clicked moreRepliesAggressiveButton'
      )

      consoleSpy.mockRestore()
    })

    /** 特定のテキストを含まないarticle内のボタンはクリックしないことを検証 */
    it('should not click buttons in articles without specific text', () => {
      const primaryColumn = document.createElement('div')
      primaryColumn.dataset.testid = 'primaryColumn'

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.dataset.testid = 'cellInnerDiv'

      const articleContainer = document.createElement('div')
      const article = document.createElement('article')
      article.setAttribute('tabindex', '-1')
      article.textContent = 'これは通常のツイートです。'

      const button = document.createElement('button')
      button.setAttribute('role', 'button')

      const clickSpy = jest.fn()
      button.click = clickSpy

      article.append(button)
      articleContainer.append(article)
      cellInnerDiv.append(articleContainer)
      primaryColumn.append(cellInnerDiv)
      document.body.append(primaryColumn)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      DomUtils.clickMoreRepliesAggressive()

      expect(clickSpy).not.toHaveBeenCalled()
      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    /** 複数の一致するarticleが存在する場合の適切な処理を検証 */
    it('should handle multiple matching articles', () => {
      const primaryColumn = document.createElement('div')
      primaryColumn.dataset.testid = 'primaryColumn'

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.dataset.testid = 'cellInnerDiv'

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

        article.append(button)
        innerDiv.append(article)
        outerDiv.append(innerDiv)
        cellInnerDiv.append(outerDiv)
      }

      primaryColumn.append(cellInnerDiv)
      document.body.append(primaryColumn)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      DomUtils.clickMoreRepliesAggressive()

      expect(consoleSpy).toHaveBeenCalledTimes(2)

      consoleSpy.mockRestore()
    })

    /** ボタンが存在しないarticleに対する適切な処理を検証 */
    it('should handle articles without buttons', () => {
      const primaryColumn = document.createElement('div')
      primaryColumn.dataset.testid = 'primaryColumn'

      const cellInnerDiv = document.createElement('div')
      cellInnerDiv.dataset.testid = 'cellInnerDiv'

      const articleContainer = document.createElement('div')
      const article = document.createElement('article')
      article.setAttribute('tabindex', '-1')
      article.textContent = 'さらに返信を表示する'

      articleContainer.append(article)
      cellInnerDiv.append(articleContainer)
      primaryColumn.append(cellInnerDiv)
      document.body.append(primaryColumn)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      DomUtils.clickMoreRepliesAggressive()

      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  /**
   * checkAndNavigateToLoginメソッドのテスト
   * BottomBarのログインボタン検出と自動ログイン画面遷移機能を検証
   */
  describe('checkAndNavigateToLogin', () => {
    beforeEach(() => {
      mockLocation.href = ''
    })

    /** BottomBarログイン要素が存在する場合にログイン画面に遷移することを検証 */
    it('should navigate to login page when BottomBar login element is detected', () => {
      const bottomBarDiv = document.createElement('div')
      bottomBarDiv.dataset.testid = 'BottomBar'

      const loginLink = document.createElement('a')
      loginLink.dataset.testid = 'login'

      bottomBarDiv.append(loginLink)
      document.body.append(bottomBarDiv)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      const result = DomUtils.checkAndNavigateToLogin()

      expect(result).toBe(true)
      expect(mockLocation.href).toBe(URLS.LOGIN)
      expect(consoleSpy).toHaveBeenCalledWith(
        'checkAndNavigateToLogin: Login required detected, navigating to login page'
      )

      consoleSpy.mockRestore()
    })

    /** BottomBarログイン要素が存在しない場合にfalseを返すことを検証 */
    it('should return false when BottomBar login element is not detected', () => {
      const normalDiv = document.createElement('div')
      normalDiv.className = 'some-other-element'
      document.body.append(normalDiv)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      const result = DomUtils.checkAndNavigateToLogin()

      expect(result).toBe(false)
      expect(mockLocation.href).toBe('')
      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    /** BottomBarは存在するがログイン要素がない場合にfalseを返すことを検証 */
    it('should return false when BottomBar exists but login element is missing', () => {
      const bottomBarDiv = document.createElement('div')
      bottomBarDiv.dataset.testid = 'BottomBar'

      const otherElement = document.createElement('button')
      otherElement.textContent = 'Some other button'

      bottomBarDiv.append(otherElement)
      document.body.append(bottomBarDiv)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      const result = DomUtils.checkAndNavigateToLogin()

      expect(result).toBe(false)
      expect(mockLocation.href).toBe('')
      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    /** 空のドキュメントに対してfalseを返すことを検証 */
    it('should return false for empty document', () => {
      const result = DomUtils.checkAndNavigateToLogin()

      expect(result).toBe(false)
      expect(mockLocation.href).toBe('')
    })
  })
})
