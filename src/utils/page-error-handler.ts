import { DELAYS } from '@/core/constants'
import { DomUtilities } from '@/utils/dom'
import { AsyncUtilities } from '@/utils/async'

/**
 * ページエラーハンドリングのオプション
 */
export interface PageErrorOptions {
  /** エラー後にページをリロードするか（デフォルト: true） */
  shouldReload?: boolean
  /** リロード前の待機時間（ミリ秒、デフォルト: DELAYS.ERROR_RELOAD_WAIT） */
  waitTime?: number
  /** デフォルトの代わりに表示するカスタムエラーメッセージ */
  customMessage?: string
}

/**
 * ページコンポーネント共通のエラーハンドラー
 *
 * 全ページコンポーネントで標準化されたエラーハンドリングを提供する。
 * 失敗ページの検出、ログ出力、リロード機能を含む。
 */
export const PageErrorHandler = {
  /**
   * 標準的なログ出力とリロード動作でページエラーを処理する
   *
   * @param pageName - ログ用のページ名（例: 'Home', 'Search'）
   * @param methodNameOrError - メソッド名（文字列）またはエラーオブジェクト（自動検出時）
   * @param errorOrOptions - エラーオブジェクトまたはオプション
   * @param optionsArgument - エラーハンドリングオプション
   * @returns エラー処理完了を表すPromise
   *
   * @example
   * ```typescript
   * // 自動検出（推奨）
   * try {
   *   await DomUtilities.waitElement('.timeline')
   * } catch (error) {
   *   await PageErrorHandler.handlePageError('Home', error)
   *   return
   * }
   *
   * // メソッド名を手動指定
   * try {
   *   await DomUtilities.waitElement('.timeline')
   * } catch (error) {
   *   await PageErrorHandler.handlePageError('Home', 'runHome', error)
   *   return
   * }
   * ```
   */
  async handlePageError(
    pageName: string,
    methodNameOrError: unknown,
    errorOrOptions?: any,
    optionsArgument?: PageErrorOptions
  ): Promise<void> {
    // オーバーロードされたパラメータを処理する
    let methodName: string
    let error: unknown
    let options: PageErrorOptions

    if (typeof methodNameOrError === 'string') {
      // 旧シグネチャ: handlePageError(pageName, methodName, error, options)
      methodName = methodNameOrError
      error = errorOrOptions
      options = optionsArgument ?? {}
    } else {
      // 新シグネチャ: handlePageError(pageName, error, options)
      methodName = PageErrorHandler._getCallerName()
      error = methodNameOrError
      options =
        errorOrOptions !== undefined &&
        errorOrOptions !== null &&
        typeof errorOrOptions === 'object'
          ? (errorOrOptions as PageErrorOptions)
          : {}
    }

    const {
      shouldReload = true,
      waitTime = DELAYS.ERROR_RELOAD_WAIT,
      customMessage,
    } = options

    // 失敗ページかどうかチェック
    if (DomUtilities.isFailedPage()) {
      console.error(`${methodName}: failed page.`)
    }

    // ページ名付きでエラーをログ出力
    console.error(`${methodName} (${pageName}):`, error)

    // エラーメッセージをログ出力
    const message = customMessage ?? 'Wait 1 minute and reload.'
    console.log(message)

    // 必要に応じて待機してリロード
    if (shouldReload) {
      await AsyncUtilities.delay(waitTime)
      location.reload()
    }
  },

  /**
   * 標準的なエラーハンドリングで要素を待機する
   *
   * DomUtilities.waitElement を自動エラーハンドリングとリロードロジックでラップする。
   *
   * @param selector - 要素のCSSセレクター
   * @param pageName - ログ用のページ名
   * @param methodNameOrOptions - メソッド名（文字列）またはオプション（自動検出時）
   * @param optionsArgument - タイムアウトとエラーハンドリングを含む追加オプション
   * @returns 要素が見つかった場合に解決するPromise、エラー処理後にリジェクト
   *
   * @example
   * ```typescript
   * // 自動検出（推奨）
   * await PageErrorHandler.waitForElementWithErrorHandling(
   *   '[role="main"]',
   *   'Home'
   * )
   *
   * // メソッド名を手動指定
   * await PageErrorHandler.waitForElementWithErrorHandling(
   *   '[role="main"]',
   *   'Home',
   *   'runHome'
   * )
   * ```
   */
  async waitForElementWithErrorHandling(
    selector: string,
    pageName: string,
    methodNameOrOptions?:
      | string
      | {
          timeout?: number
          errorOptions?: PageErrorOptions
        },
    optionsArgument?: {
      timeout?: number
      errorOptions?: PageErrorOptions
    }
  ): Promise<HTMLElement> {
    // オーバーロードされたパラメータを処理する
    let methodName: string
    let options: {
      timeout?: number
      errorOptions?: PageErrorOptions
    }

    if (typeof methodNameOrOptions === 'string') {
      // 旧シグネチャ: waitForElementWithErrorHandling(selector, pageName, methodName, options)
      methodName = methodNameOrOptions
      options = optionsArgument ?? {}
    } else {
      // 新シグネチャ: waitForElementWithErrorHandling(selector, pageName, options)
      methodName = PageErrorHandler._getCallerName()
      options = methodNameOrOptions ?? {}
    }

    try {
      await DomUtilities.waitElement(selector, options.timeout)
      // DomUtilities.waitElement は要素を返さないため、queryで取得する
      const element = document.querySelector(selector)
      if (!element) {
        throw new Error(`Element ${selector} not found after waiting`)
      }
      return element as HTMLElement
    } catch (error) {
      await PageErrorHandler.handlePageError(
        pageName,
        methodName,
        error,
        options.errorOptions
      )
      throw error // 制御フローを維持するために再スロー
    }
  },

  /**
   * エラーハンドリング付きでページ操作を実行する
   *
   * 任意の非同期操作を標準エラーハンドリングでラップする。
   * 要素待機以外の操作に対して有効。
   *
   * @param operation - 実行する非同期操作
   * @param pageName - ログ用のページ名
   * @param methodNameOrOptions - メソッド名（文字列）またはオプション（自動検出時）
   * @param optionsArgument - エラーハンドリングオプション
   * @returns 操作結果またはエラー処理後にundefinedを返すPromise
   *
   * @example
   * ```typescript
   * // 自動検出（推奨）
   * await PageErrorHandler.executeWithErrorHandling(
   *   async () => {
   *     // 複雑なページ操作
   *     const element = await DomUtilities.waitElement('.timeline')
   *     await processElement(element)
   *   },
   *   'Home'
   * )
   *
   * // メソッド名を手動指定
   * await PageErrorHandler.executeWithErrorHandling(
   *   async () => {
   *     // 複雑なページ操作
   *     const element = await DomUtilities.waitElement('.timeline')
   *     await processElement(element)
   *   },
   *   'Home',
   *   'processTimeline'
   * )
   * ```
   */
  async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    pageName: string,
    methodNameOrOptions?: string | PageErrorOptions,
    optionsArgument?: PageErrorOptions
  ): Promise<T | undefined> {
    // オーバーロードされたパラメータを処理する
    let methodName: string
    let options: PageErrorOptions

    if (typeof methodNameOrOptions === 'string') {
      // 旧シグネチャ: executeWithErrorHandling(operation, pageName, methodName, options)
      methodName = methodNameOrOptions
      options = optionsArgument ?? {}
    } else {
      // 新シグネチャ: executeWithErrorHandling(operation, pageName, options)
      methodName = PageErrorHandler._getCallerName()
      options = methodNameOrOptions ?? {}
    }

    try {
      return await operation()
    } catch (error) {
      await PageErrorHandler.handlePageError(
        pageName,
        methodName,
        error,
        options
      )
      return undefined
    }
  },

  /**
   * ページ処理の開始をログ出力する
   *
   * 全ページで一貫したログフォーマットを提供する。
   *
   * @param pageName - ページ名
   * @param methodNameOrAdditionalInfo - メソッド名（文字列）または追加情報（自動検出時）
   * @param additionalInfoArgument - オプションの追加情報
   *
   * @example
   * ```typescript
   * // 自動検出（推奨）
   * PageErrorHandler.logPageStart('Home', { userId: '12345' })
   * // ログ: "runHome: Starting Home page processing..." （スタックから自動検出）
   * // ログ: "runHome: Additional info: { userId: '12345' }"
   *
   * // メソッド名を手動指定
   * PageErrorHandler.logPageStart('Home', 'runHome', { userId: '12345' })
   * // ログ: "runHome: Starting Home page processing..."
   * // ログ: "runHome: Additional info: { userId: '12345' }"
   * ```
   */
  logPageStart(
    pageName: string,
    methodNameOrAdditionalInfo?: string | Record<string, any>,
    additionalInfoArgument?: Record<string, any>
  ): void {
    // オーバーロードされたパラメータを処理する
    let methodName: string
    let additionalInfo: Record<string, any> | undefined

    if (typeof methodNameOrAdditionalInfo === 'string') {
      // 旧シグネチャ: logPageStart(pageName, methodName, additionalInfo)
      methodName = methodNameOrAdditionalInfo
      additionalInfo = additionalInfoArgument
    } else {
      // 新シグネチャ: logPageStart(pageName, additionalInfo)
      methodName = PageErrorHandler._getCallerName()
      additionalInfo = methodNameOrAdditionalInfo
    }

    console.log(`${methodName}: Starting ${pageName} page processing...`)

    if (additionalInfo) {
      console.log(`${methodName}: Additional info:`, additionalInfo)
    }
  },

  /**
   * 一貫したフォーマットでページアクションをログ出力する
   *
   * スタックトレースから呼び出し元関数名を自動検出する。
   * オプションでカスタムメソッド名を指定して検出を上書きできる。
   *
   * @param action - アクションの説明
   * @param methodName - オプションのカスタムメソッド名（未指定時は自動検出）
   *
   * @example
   * ```typescript
   * // 自動検出（推奨）
   * PageErrorHandler.logAction('Found 10 new tweets')
   * // ログ: "runHome: Found 10 new tweets" （スタックから自動検出）
   *
   * // 手動上書き
   * PageErrorHandler.logAction('Found 10 new tweets', 'customMethod')
   * // ログ: "customMethod: Found 10 new tweets"
   * ```
   */
  logAction(action: string, methodName?: string): void {
    const callerName = methodName ?? PageErrorHandler._getCallerName()
    console.log(`${callerName}: ${action}`)
  },

  /**
   * 一貫したフォーマットでエラーをログ出力する
   *
   * スタックトレースから呼び出し元関数名を自動検出する。
   * オプションでカスタムメソッド名を指定して検出を上書きできる。
   *
   * @param errorMessage - ログ出力するエラーメッセージ
   * @param error - 追加詳細用のオプションのエラーオブジェクト
   * @param methodName - オプションのカスタムメソッド名（未指定時は自動検出）
   *
   * @example
   * ```typescript
   * // 自動検出（推奨）
   * PageErrorHandler.logError('Failed to process timeline', error)
   * // ログ: "runHome: Failed to process timeline" （スタックから自動検出）
   *
   * // 手動上書き
   * PageErrorHandler.logError('Failed to process timeline', error, 'customMethod')
   * // ログ: "customMethod: Failed to process timeline"
   * ```
   */
  logError(errorMessage: string, error?: unknown, methodName?: string): void {
    const callerName = methodName ?? PageErrorHandler._getCallerName()
    console.error(`${callerName}: ${errorMessage}`)

    if (error && process.env.NODE_ENV === 'development') {
      console.error(`${callerName}: Error details:`, error)
    }
  },

  /**
   * スタックトレースから呼び出し元関数名を取得する
   *
   * @returns 呼び出し元関数名。検出できない場合は 'unknown'
   * @private
   */
  _getCallerName(): string {
    try {
      const stack = new Error('Stack trace generation').stack
      if (!stack) return 'unknown'

      // スタックトレースを行に分割
      const stackLines = stack.split('\n')

      // 呼び出し元を探す（Error()、このメソッド、logAction/logError をスキップ）
      for (let index = 3; index < stackLines.length; index++) {
        const line = stackLines[index]

        // 各フォーマットの関数名にマッチ:
        // - "at functionName (...)"
        // - "at Object.functionName (...)"
        // - "at ClassName.functionName (...)"
        const match = /at (?:(?:Object|[A-Z]\w*)\.)?(\w+)\s*\(/.exec(line)
        if (match?.[1] && match[1] !== 'logAction' && match[1] !== 'logError') {
          return match[1]
        }
      }

      return 'unknown'
    } catch {
      return 'unknown'
    }
  },
}
